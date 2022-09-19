// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/math/MiningCalculation.sol";
import "../libraries/Constants.sol";
import "../interfaces/IJohn.sol";
import "../interfaces/types/JohnTypes.sol";
import "../interfaces/IPwIporToken.sol";
import "../interfaces/IPwIporTokenInternal.sol";
import "../tokens/IporToken.sol";
import "./JohnInternal.sol";
//TODO: remove at the end
import "hardhat/console.sol";

contract John is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IporOwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    JohnInternal,
    IJohn
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeCast for uint256;
    using SafeCast for int256;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address[] memory ipTokens,
        address pwIporToken,
        address iporToken
    ) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        require(pwIporToken != address(0), IporErrors.WRONG_ADDRESS);
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);

        uint256 ipTokensLength = ipTokens.length;
        _pwIporToken = pwIporToken;

        IporToken(iporToken).approve(pwIporToken, Constants.MAX_VALUE);

        for (uint256 i = 0; i != ipTokensLength; i++) {
            require(ipTokens[i] != address(0), IporErrors.WRONG_ADDRESS);

            _ipTokens[ipTokens[i]] = true;

            _saveGlobalParams(
                ipTokens[i],
                JohnTypes.GlobalRewardsParams(0, 0, 0, 0, 0, uint32(Constants.D8))
            );
        }
    }

    function accountRewards(address ipToken) external view override returns (uint256) {
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        JohnTypes.AccountRewardsParams memory accountParams = _accountsParams[_msgSender()][
            ipToken
        ];
        return _accountRewards(accountParams, globalParams);
    }

    function accruedRewards(address ipToken) external view override returns (uint256) {
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        if (globalParams.aggregatePowerUp == 0) {
            return globalParams.accruedRewards;
        }
        return
            MiningCalculation.calculateAccruedRewards(
                block.number,
                globalParams.blockNumber,
                globalParams.blockRewards,
                globalParams.accruedRewards
            );
    }

    function rewardsPerBlock(address ipToken) external view override returns (uint32) {
        return _globalParameters[ipToken].blockRewards;
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        override
        returns (JohnTypes.BalanceOfDelegatedPwIpor memory)
    {
        JohnTypes.DelegatedPwIpor[] memory balances = new JohnTypes.DelegatedPwIpor[](
            requestIpTokens.length
        );
        for (uint256 i = 0; i != requestIpTokens.length; i++) {
            address ipToken = requestIpTokens[i];
            require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
            balances[i] = JohnTypes.DelegatedPwIpor(
                ipToken,
                _accountsParams[account][ipToken].delegatedPwTokenBalance
            );
        }
        return JohnTypes.BalanceOfDelegatedPwIpor(balances);
    }

    function isIpTokenSupported(address ipToken) external view override returns (bool) {
        return _ipTokens[ipToken];
    }

    function balanceOf(address ipToken) external view override returns (uint256) {
        return _accountsParams[_msgSender()][ipToken].ipTokensBalance;
    }

    function stake(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(ipTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);

        IERC20Upgradeable(ipToken).safeTransferFrom(_msgSender(), address(this), ipTokenAmount);

        JohnTypes.AccountRewardsParams memory accountParams = _accountsParams[_msgSender()][
            ipToken
        ];
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        // assumption we start counting from first person who can get rewards
        if (globalParams.blockNumber == 0) {
            globalParams.blockNumber = block.number.toUint32();
        }

        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), ipToken, rewards, accountParams, globalParams);
        }

        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance + ipTokenAmount,
            accountParams.delegatedPwTokenBalance,
            ipToken,
            _msgSender()
        );
        emit StakeIpTokens(block.timestamp, _msgSender(), ipToken, ipTokenAmount);
    }

    function unstake(address ipToken, uint256 ipTokenAmount)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        JohnTypes.AccountRewardsParams memory accountParams = _accountsParams[_msgSender()][
            ipToken
        ];

        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(_msgSender(), ipToken, rewards, accountParams, globalParams);
        }

        require(
            ipTokenAmount <= accountParams.ipTokensBalance,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance - ipTokenAmount,
            accountParams.delegatedPwTokenBalance,
            ipToken,
            _msgSender()
        );

        IERC20Upgradeable(ipToken).transfer(_msgSender(), ipTokenAmount);

        emit UnstakeIpTokens(block.timestamp, _msgSender(), ipToken, ipTokenAmount);
    }

    function delegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwTokenAmounts
    ) external override onlyPwIporToken whenNotPaused {
        for (uint256 i = 0; i != ipTokens.length; i++) {
            require(_ipTokens[ipTokens[i]], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
            _addPwIporToBalance(account, ipTokens[i], pwTokenAmounts[i]);
        }
    }

    function withdrawFromDelegation(
        address account,
        address ipToken,
        uint256 pwTokenAmount
    ) external onlyPwIporToken whenNotPaused {
        require(_ipTokens[ipToken], MiningErrors.IP_TOKEN_NOT_SUPPORTED);
        JohnTypes.AccountRewardsParams memory accountParams = _accountsParams[account][ipToken];
        require(
            accountParams.delegatedPwTokenBalance >= pwTokenAmount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];
        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            IPwIporTokenInternal(_getPwIporToken()).receiveRewards(account, rewards);
        }
        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance,
            accountParams.delegatedPwTokenBalance - pwTokenAmount,
            ipToken,
            account
        );

        emit WithdrawFromDelegation(block.timestamp, account, ipToken, pwTokenAmount);
    }

    function claim(address ipToken) external override whenNotPaused nonReentrant {
        JohnTypes.AccountRewardsParams memory accountParams = _accountsParams[_msgSender()][
            ipToken
        ];
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        uint256 rewards = _accountRewards(accountParams, globalParams);
        require(rewards > 0, MiningErrors.NO_REWARDS_TO_CLAIM);

        _claim(_msgSender(), ipToken, rewards, accountParams, globalParams);
        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance,
            accountParams.delegatedPwTokenBalance,
            ipToken,
            _msgSender()
        );

        emit Claim(block.timestamp, _msgSender(), ipToken, rewards);
    }

    function _claim(
        address account,
        address ipToken,
        uint256 rewards,
        JohnTypes.AccountRewardsParams memory accountParams,
        JohnTypes.GlobalRewardsParams memory globalParams
    ) internal {
        IPwIporTokenInternal(_getPwIporToken()).receiveRewards(account, rewards);
    }

    function _addPwIporToBalance(
        address account,
        address ipToken,
        uint256 pwTokenAmount
    ) internal {
        JohnTypes.AccountRewardsParams memory accountParams = _accountsParams[account][ipToken];
        JohnTypes.GlobalRewardsParams memory globalParams = _globalParameters[ipToken];

        if (accountParams.ipTokensBalance == 0) {
            _accountsParams[account][ipToken].delegatedPwTokenBalance =
                accountParams.delegatedPwTokenBalance +
                pwTokenAmount;
            emit AddPwIporToBalance(block.timestamp, account, ipToken, pwTokenAmount);
            return;
        }

        uint256 rewards = _accountRewards(accountParams, globalParams);

        if (rewards > 0) {
            _claim(account, ipToken, rewards, accountParams, globalParams);
        }

        _rebalanceParams(
            accountParams,
            globalParams,
            accountParams.ipTokensBalance,
            accountParams.delegatedPwTokenBalance + pwTokenAmount,
            ipToken,
            account
        );
        emit AddPwIporToBalance(block.timestamp, account, ipToken, pwTokenAmount);
    }

    function _accountRewards(
        JohnTypes.AccountRewardsParams memory accountParams,
        JohnTypes.GlobalRewardsParams memory globalParams
    ) internal view returns (uint256) {
        uint256 compositeMultiplierCumulativeBeforeBlock = globalParams
            .compositeMultiplierCumulativeBeforeBlock +
            (block.number - globalParams.blockNumber) *
            globalParams.compositeMultiplierInTheBlock;

        return
            MiningCalculation.calculateAccountRewards(
                accountParams.ipTokensBalance,
                accountParams.powerUp,
                compositeMultiplierCumulativeBeforeBlock,
                accountParams.compositeMultiplierCumulative
            );
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
