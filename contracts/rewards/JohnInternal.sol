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
    mapping(address => JohnTypes.GlobalRewardsIndicators) internal _globalIndicators;
    //  account address => ipToken address => account params
    mapping(address => mapping(address => JohnTypes.AccountRewardsIndicators))
        internal _accountIndicators;

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

            _globalIndicators[ipTokens[i]] = JohnTypes.GlobalRewardsIndicators(
                0,
                0,
                0,
                0,
                uint32(Constants.D8),
                0
            );
        }
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    function isIpTokenSupported(address ipToken) external view override returns (bool) {
        return _ipTokens[ipToken];
    }

    function getGlobalIndicators(address ipToken)
        external
        view
        override
        returns (JohnTypes.GlobalRewardsIndicators memory)
    {
        return _globalIndicators[ipToken];
    }

    function getAccountIndicators(address ipToken)
        external
        view
        override
        returns (JohnTypes.AccountRewardsIndicators memory)
    {
        return _accountIndicators[_msgSender()][ipToken];
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

            JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[
                account
            ][ipTokens[i]];
            JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[
                ipTokens[i]
            ];

            //stake
            if (ipTokenAmounts[i] != 0) {
                IERC20Upgradeable(ipTokens[i]).safeTransferFrom(
                    account,
                    address(this),
                    ipTokenAmounts[i]
                );
            }
            // delegate
            if (accountIndicators.ipTokenBalance == 0 && ipTokenAmounts[i] == 0) {
                uint256 newBalance = accountIndicators.delegatedPwIporBalance + pwIporAmounts[i];
                _accountIndicators[account][ipTokens[i]].delegatedPwIporBalance = newBalance
                    .toUint96();
                emit DelegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
                continue;
            }

            // assumption we start counting from first person who can get rewards
            //            TODO: to remove
            if (globalIndicators.blockNumber == 0) {
                globalIndicators.blockNumber = block.number.toUint32();
            }

            _claimWhenRewardsExists(account, globalIndicators, accountIndicators);

            _rebalanceParams(
                account,
                ipTokens[i],
                globalIndicators,
                accountIndicators,
                accountIndicators.ipTokenBalance + ipTokenAmounts[i],
                accountIndicators.delegatedPwIporBalance + pwIporAmounts[i]
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
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts
    ) external onlyPowerIpor whenNotPaused {
        for (uint256 i; i != ipTokens.length; i++) {
            _undelegatePwIpor(account, ipTokens[i], pwIporAmounts[i]);
        }
    }

    function setRewardsPerBlock(address ipToken, uint32 iporTokenAmount)
        external
        override
        onlyOwner
    {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];
        uint256 blockNumber = block.number;

        uint256 compositeMultiplierCumulativePrevBlock = globalIndicators
            .compositeMultiplierCumulativePrevBlock +
            (blockNumber - globalIndicators.blockNumber) *
            globalIndicators.compositeMultiplierInTheBlock;

        uint256 accruedRewards;
        if (globalIndicators.aggregatedPowerUp != 0) {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                blockNumber.toUint32(),
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
        } else {
            accruedRewards = globalIndicators.accruedRewards;
        }

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            iporTokenAmount,
            globalIndicators.aggregatedPowerUp
        );

        _globalIndicators[ipToken] = JohnTypes.GlobalRewardsIndicators(
            globalIndicators.aggregatedPowerUp,
            compositeMultiplier.toUint128(),
            compositeMultiplierCumulativePrevBlock.toUint128(),
            blockNumber.toUint32(),
            iporTokenAmount,
            accruedRewards.toUint88()
        );

        emit RewardsPerBlockChanged(
            _msgSender(),
            globalIndicators.rewardsPerBlock,
            iporTokenAmount
        );
    }

    function addIpTokenAsset(address ipToken) external onlyOwner {
        require(ipToken != address(0), IporErrors.WRONG_ADDRESS);
        _ipTokens[ipToken] = true;
        _globalIndicators[ipToken] = JohnTypes.GlobalRewardsIndicators(
            0,
            0,
            0,
            0,
            uint32(Constants.D8),
            0
        );

        emit IpTokenAdded(_msgSender(), ipToken);
    }

    function removeIpTokenAsset(address ipToken) external override onlyOwner {
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

    function _undelegatePwIpor(
        address account,
        address ipToken,
        uint256 pwIporAmount
    ) internal {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[account][
            ipToken
        ];
        require(
            accountIndicators.delegatedPwIporBalance >= pwIporAmount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];

        _claimWhenRewardsExists(account, globalIndicators, accountIndicators);
		
        _rebalanceParams(
            account,
            ipToken,
            globalIndicators,
            accountIndicators,
            accountIndicators.ipTokenBalance,
            accountIndicators.delegatedPwIporBalance - pwIporAmount
        );

        emit UndelegatePwIpor(account, ipToken, pwIporAmount);
    }

    function _rebalanceParams(
        address account,
        address ipToken,
        JohnTypes.GlobalRewardsIndicators memory globalIndicators,
        JohnTypes.AccountRewardsIndicators memory accountIndicators,
        uint256 ipTokenBalance,
        uint256 delegatedPwIporBalance
    ) internal {
        uint256 accountPowerUp = MiningCalculation.calculateAccountPowerUp(
            delegatedPwIporBalance,
            ipTokenBalance,
            _verticalShift(),
            _horizontalShift()
        );

        uint256 compositeMultiplierCumulativePrevBlock = globalIndicators
            .compositeMultiplierCumulativePrevBlock +
            (block.number - globalIndicators.blockNumber) *
            globalIndicators.compositeMultiplierInTheBlock;

        _accountIndicators[account][ipToken] = JohnTypes.AccountRewardsIndicators(
            compositeMultiplierCumulativePrevBlock.toUint128(),
            ipTokenBalance.toUint128(),
            accountPowerUp.toUint72(),
            delegatedPwIporBalance.toUint96()
        );

        uint256 aggregatedPowerUp = MiningCalculation.calculateAggregatePowerUp(
            accountPowerUp,
            ipTokenBalance,
            accountIndicators.powerUp,
            accountIndicators.ipTokenBalance,
            globalIndicators.aggregatedPowerUp
        );

        uint256 accruedRewards;

        /// @dev check if we should update rewards, it should happened when at least one account stake ipTokens
        if (globalIndicators.aggregatedPowerUp == 0) {
            accruedRewards = globalIndicators.accruedRewards;
        } else {
            accruedRewards = MiningCalculation.calculateAccruedRewards(
                block.number,
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
        }

        uint256 compositeMultiplier = MiningCalculation.compositeMultiplier(
            globalIndicators.rewardsPerBlock,
            aggregatedPowerUp
        );

        _globalIndicators[ipToken] = JohnTypes.GlobalRewardsIndicators(
            aggregatedPowerUp,
            compositeMultiplier.toUint128(),
            compositeMultiplierCumulativePrevBlock.toUint128(),
            block.number.toUint32(),
            globalIndicators.rewardsPerBlock,
            accruedRewards.toUint88()
        );
    }

    function _delegatePwIpor(
        address account,
        address ipToken,
        uint256 pwIporAmount
    ) internal {
        JohnTypes.AccountRewardsIndicators memory accountIndicators = _accountIndicators[account][
            ipToken
        ];
        JohnTypes.GlobalRewardsIndicators memory globalIndicators = _globalIndicators[ipToken];

        if (accountIndicators.ipTokenBalance == 0) {
            uint256 newBalance = accountIndicators.delegatedPwIporBalance + pwIporAmount;
            _accountIndicators[account][ipToken].delegatedPwIporBalance = newBalance.toUint96();
            emit DelegatePwIpor(account, ipToken, pwIporAmount);
            return;
        }

        _claimWhenRewardsExists(account, globalIndicators, accountIndicators);

        _rebalanceParams(
            account,
            ipToken,
            globalIndicators,
            accountIndicators,
            accountIndicators.ipTokenBalance,
            accountIndicators.delegatedPwIporBalance + pwIporAmount
        );
        emit DelegatePwIpor(account, ipToken, pwIporAmount);
    }

    function _claimWhenRewardsExists(
        address account,
        JohnTypes.GlobalRewardsIndicators memory globalIndicators,
        JohnTypes.AccountRewardsIndicators memory accountIndicators
    ) internal {
        uint256 rewards = _calculateAccountRewards(accountIndicators, globalIndicators);

        if (rewards > 0) {
            _claim(account, rewards);
        }
    }

    function _calculateAccountRewards(
        JohnTypes.AccountRewardsIndicators memory accountIndicators,
        JohnTypes.GlobalRewardsIndicators memory globalIndicators
    ) internal view returns (uint256) {
        uint256 compositeMultiplierCumulativePrevBlock = globalIndicators
            .compositeMultiplierCumulativePrevBlock +
            (block.number - globalIndicators.blockNumber) *
            globalIndicators.compositeMultiplierInTheBlock;

        return
            MiningCalculation.calculateAccountRewards(
                accountIndicators.ipTokenBalance,
                accountIndicators.powerUp,
                accountIndicators.compositeMultiplierCumulative,
                compositeMultiplierCumulativePrevBlock
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

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
