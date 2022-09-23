// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/Constants.sol";
import "../interfaces/types/JohnTypes.sol";
import "../interfaces/IJohn.sol";
import "../interfaces/IJohnInternal.sol";
import "../interfaces/IPowerIpor.sol";
import "../interfaces/IPowerIporInternal.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../libraries/math/MiningCalculation.sol";
import "../tokens/IporToken.sol";
//TODO: remove at the end
import "hardhat/console.sol";

abstract contract JohnInternal is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IporOwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IJohnInternal
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeCast for uint256;
    using SafeCast for int256;

    address internal _powerIpor;
    mapping(address => bool) internal _ipTokens;

    //  ipToken (ipUSDT, ipUSDC, ipDAI, etc) address -> global parameters for ipToken
    mapping(address => JohnTypes.GlobalRewardsParams) internal _globalParams;
    //  account address => ipToken address => account params
    mapping(address => mapping(address => JohnTypes.AccountRewardsParams)) internal _accountParams;

    modifier onlyPowerIpor() {
        require(_msgSender() == _getPowerIpor(), MiningErrors.CALLER_NOT_PW_IPOR);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] memory ipTokens,
        address powerIpor,
        address iporToken
    ) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        require(powerIpor != address(0), IporErrors.WRONG_ADDRESS);
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);

        uint256 ipTokensLength = ipTokens.length;
        _powerIpor = powerIpor;

        IporToken(iporToken).approve(powerIpor, Constants.MAX_VALUE);

        for (uint256 i = 0; i != ipTokensLength; i++) {
            require(ipTokens[i] != address(0), IporErrors.WRONG_ADDRESS);

            _ipTokens[ipTokens[i]] = true;

            _saveGlobalParams(
                ipTokens[i],
                JohnTypes.GlobalRewardsParams(0, 0, 0, 0, uint32(Constants.D8), 0)
            );
        }
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    function isIpTokenSupported(address ipToken) external view override returns (bool) {
        return _ipTokens[ipToken];
    }

    function getGlobalParams(address ipToken)
        external
        view
        override
        returns (JohnTypes.GlobalRewardsParams memory)
    {
        return _globalParams[ipToken];
    }

    function getAccountParams(address ipToken)
        external
        view
        override
        returns (JohnTypes.AccountRewardsParams memory)
    {
        return _accountParams[_msgSender()][ipToken];
    }

    function delegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts
    ) external override onlyPowerIpor whenNotPaused {
        for (uint256 i = 0; i != ipTokens.length; i++) {
            require(_ipTokens[ipTokens[i]], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
            _delegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
        }
    }

    function delegatePwIporAndStakeIpToken(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts,
        uint256[] memory ipTokenAmounts
    ) external override onlyPowerIpor whenNotPaused {
        for (uint256 i = 0; i != ipTokens.length; i++) {
            require(_ipTokens[ipTokens[i]], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

            JohnTypes.AccountRewardsParams memory accountParams = _accountParams[account][
                ipTokens[i]
            ];
            JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipTokens[i]];

            //stake
            if (ipTokenAmounts[i] != 0) {
                IERC20Upgradeable(ipTokens[i]).safeTransferFrom(
                    account,
                    address(this),
                    ipTokenAmounts[i]
                );
            }
            // delegate
            if (accountParams.ipTokenBalance == 0 && ipTokenAmounts[i] == 0) {
                uint256 newBalance = accountParams.delegatedPwIporBalance + pwIporAmounts[i];
                _accountParams[account][ipTokens[i]].delegatedPwIporBalance = newBalance.toUint96();
                emit DelegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
                continue;
            }

            // assumption we start counting from first person who can get rewards
            //            TODO: to remove
            if (globalParams.blockNumber == 0) {
                globalParams.blockNumber = block.number.toUint32();
            }

            _claimWhenRewardsExists(account, globalParams, accountParams);

            _rebalanceParams(
                account,
                ipTokens[i],
                globalParams,
                accountParams,
                accountParams.ipTokenBalance + ipTokenAmounts[i],
                accountParams.delegatedPwIporBalance + pwIporAmounts[i]
            );
            emit DelegatePwIporAndStakeIpToken(
                account,
                ipTokens[i],
                pwIporAmounts[i],
                ipTokenAmounts[i]
            );
        }
    }

    function undelegatePwIpor(
        address account,
        address ipToken,
        uint256 pwIporAmount
    ) external onlyPowerIpor whenNotPaused {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[account][ipToken];
        require(
            accountParams.delegatedPwIporBalance >= pwIporAmount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];

        _claimWhenRewardsExists(account, globalParams, accountParams);
        _rebalanceParams(
            account,
            ipToken,
            globalParams,
            accountParams,
            accountParams.ipTokenBalance,
            accountParams.delegatedPwIporBalance - pwIporAmount
        );

        emit UndelegatePwIpor(account, ipToken, pwIporAmount);
    }

    function setRewardsPerBlock(address ipToken, uint32 rewardsValue) external override onlyOwner {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];
        uint256 blockNumber = block.number;

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (blockNumber - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        uint256 accruedRewards;
        if (globalParams.aggregatePowerUp != 0) {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                blockNumber.toUint32(),
                globalParams.blockNumber,
                globalParams.blockRewards,
                globalParams.accruedRewards
            );
        } else {
            accruedRewards = globalParams.accruedRewards;
        }

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            rewardsValue,
            globalParams.aggregatePowerUp
        );

        _saveGlobalParams(
            ipToken,
            JohnTypes.GlobalRewardsParams(
                globalParams.aggregatePowerUp,
                compositeMultiplier.toUint128(),
                compositeMultiplierCumulativeBeforeBlock.toUint128(),
                blockNumber.toUint32(),
                rewardsValue,
                accruedRewards.toUint88()
            )
        );
        emit RewardsPerBlockChanged(_msgSender(), rewardsValue);
    }

    function addIpToken(address ipToken) external onlyOwner whenNotPaused {
        require(ipToken != address(0), IporErrors.WRONG_ADDRESS);
        _ipTokens[ipToken] = true;
        _saveGlobalParams(
            ipToken,
            JohnTypes.GlobalRewardsParams(0, 0, 0, 0, uint32(Constants.D8), 0)
        );
        emit IpTokenAdded(_msgSender(), ipToken);
    }

    function removeIpToken(address ipToken) external override onlyOwner {
        require(ipToken != address(0), IporErrors.WRONG_ADDRESS);
        _ipTokens[ipToken] = false;
        emit IpTokenRemoved(_msgSender(), ipToken);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _rebalanceParams(
        address account,
        address ipToken,
        JohnTypes.GlobalRewardsParams memory globalParams,
        JohnTypes.AccountRewardsParams memory accountParams,
        uint256 ipTokenBalance,
        uint256 delegatedPwIporBalance
    ) internal {
        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            delegatedPwIporBalance,
            ipTokenBalance,
            _verticalShift(),
            _horizontalShift()
        );

        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;
        _saveAccountParams(
            account,
            ipToken,
            JohnTypes.AccountRewardsParams(
                compositeMultiplierCumulativeBeforeBlock.toUint128(),
                ipTokenBalance.toUint128(),
                accountPowerUp.toUint72(),
                delegatedPwIporBalance.toUint96()
            )
        );

        uint256 aggregatePowerUp = MiningCalculation.calculateAggregatePowerUp(
            accountPowerUp,
            ipTokenBalance,
            accountParams.powerUp,
            accountParams.ipTokenBalance,
            globalParams.aggregatePowerUp
        );

        uint256 accruedRewards;
        //        check if we should update rewards, it should happened when at least one accounts stake ipTokens
        if (globalParams.aggregatePowerUp == 0) {
            accruedRewards = globalParams.accruedRewards;
        } else {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                block.number,
                globalParams.blockNumber,
                globalParams.blockRewards,
                globalParams.accruedRewards
            );
        }
        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            globalParams.blockRewards,
            aggregatePowerUp
        );

        _saveGlobalParams(
            ipToken,
            JohnTypes.GlobalRewardsParams(
                aggregatePowerUp,
                compositeMultiplier.toUint128(),
                compositeMultiplierCumulativeBeforeBlock.toUint128(),
                block.number.toUint32(),
                globalParams.blockRewards,
                accruedRewards.toUint88()
            )
        );
    }

    function _delegatePwIpor(
        address account,
        address ipToken,
        uint256 pwIporAmount
    ) internal {
        JohnTypes.AccountRewardsParams memory accountParams = _accountParams[account][ipToken];
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParams[ipToken];

        if (accountParams.ipTokenBalance == 0) {
            uint256 newBalance = accountParams.delegatedPwIporBalance + pwIporAmount;
            _accountParams[account][ipToken].delegatedPwIporBalance = newBalance.toUint96();
            emit DelegatePwIpor(account, ipToken, pwIporAmount);
            return;
        }

        _claimWhenRewardsExists(account, globalParams, accountParams);

        _rebalanceParams(
            account,
            ipToken,
            globalParams,
            accountParams,
            accountParams.ipTokenBalance,
            accountParams.delegatedPwIporBalance + pwIporAmount
        );
        emit DelegatePwIpor(account, ipToken, pwIporAmount);
    }

    function _claimWhenRewardsExists(
        address account,
        JohnTypes.GlobalRewardsParams memory globalParams,
        JohnTypes.AccountRewardsParams memory accountParams
    ) internal {
        uint256 rewards = _calculateAccountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(account, rewards);
        }
    }

    function _calculateAccountRewards(
        JohnTypes.AccountRewardsParams memory accountParams,
        JohnTypes.GlobalRewardsParams memory globalParams
    ) internal view returns (uint256) {
        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        return
            MiningCalculation.calculateAccountRewards(
                accountParams.ipTokenBalance,
                accountParams.powerUp,
                compositeMultiplierCumulativeBeforeBlock,
                accountParams.compositeMultiplierCumulative
            );
    }

    function _claim(address account, uint256 rewards) internal {
        IPowerIporInternal(_getPowerIpor()).receiveRewards(account, rewards);
    }

    function _horizontalShift() internal pure returns (uint256) {
        return 1000000000000000000;
    }

    function _verticalShift() internal pure returns (uint256) {
        return 400000000000000000;
    }

    function _getPowerIpor() internal view returns (address) {
        return _powerIpor;
    }

    function _saveAccountParams(
        address account,
        address ipToken,
        JohnTypes.AccountRewardsParams memory params
    ) internal virtual {
        _accountParams[account][ipToken] = params;
    }

    function _saveGlobalParams(address ipToken, JohnTypes.GlobalRewardsParams memory params)
        internal
        virtual
    {
        _globalParams[ipToken] = params;
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
