// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/ILiquidityMiningV2.sol";
import "./LiquidityMiningInternalV2.sol";

/// @title Smart contract responsible for distribution of Power Token rewards across accounts contributing to Liquidity Mining
/// by staking lpTokens and / or delegating Power Tokens.
contract LiquidityMiningV2 is ILiquidityMiningV2, LiquidityMiningInternalV2 {
    using SafeCast for uint256;
    using SafeCast for int256;

    //    ----------------------------------------------
    //    New implementation
    //    ----------------------------------------------

    constructor(address routerAddress) LiquidityMiningInternalV2(routerAddress) {
        _disableInitializers();
    }

    //    ----------------------------------------------
    //    New implementation
    //    ----------------------------------------------

    function getContractId() external pure returns (bytes32) {
        return 0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06;
    }

    function balanceOf(address account, address lpToken) external view override returns (uint256) {
        return _accountIndicators[account][lpToken].lpTokenBalance;
    }

    function balanceOfDelegatedPwToken(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances)
    {
        uint256 lpTokensLength = lpTokens.length;
        balances = new LiquidityMiningTypes.DelegatedPwTokenBalance[](lpTokensLength);
        address lpToken;

        for (uint256 i; i != lpTokensLength; ++i) {
            lpToken = lpTokens[i];
            require(_lpTokens[lpToken], Errors.LP_TOKEN_NOT_SUPPORTED);
            balances[i] = LiquidityMiningTypes.DelegatedPwTokenBalance(
                lpToken,
                _accountIndicators[account][lpToken].delegatedPwTokenBalance
            );
        }
    }

    function calculateAccruedRewards(address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.AccruedRewardsResult[] memory result)
    {
        uint256 lpTokensLength = lpTokens.length;
        LiquidityMiningTypes.AccruedRewardsResult[]
            memory rewards = new LiquidityMiningTypes.AccruedRewardsResult[](lpTokensLength);
        for (uint256 i; i != lpTokensLength; ++i) {
            LiquidityMiningTypes.GlobalRewardsIndicators
                memory globalIndicators = _globalIndicators[lpTokens[i]];
            if (globalIndicators.aggregatedPowerUp == 0) {
                rewards[i] = LiquidityMiningTypes.AccruedRewardsResult(
                    lpTokens[i],
                    globalIndicators.accruedRewards
                );
            }

            uint256 reward = MiningCalculation.calculateAccruedRewards(
                block.number,
                globalIndicators.blockNumber,
                globalIndicators.rewardsPerBlock,
                globalIndicators.accruedRewards
            );
            rewards[i] = LiquidityMiningTypes.AccruedRewardsResult(lpTokens[i], reward);
        }
        return rewards;
    }

    function calculateAccountRewards(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.AccountRewardResult[] memory)
    {
        uint256 lpTokensLength = lpTokens.length;
        LiquidityMiningTypes.AccountRewardResult[]
            memory rewards = new LiquidityMiningTypes.AccountRewardResult[](lpTokensLength);
        for (uint256 i; i != lpTokensLength; ) {
            LiquidityMiningTypes.GlobalRewardsIndicators
                memory globalIndicators = _globalIndicators[lpTokens[i]];
            LiquidityMiningTypes.AccountRewardsIndicators
                memory accountIndicators = _accountIndicators[account][lpTokens[i]];
            (uint256 rewardsAmount, ) = _calculateAccountRewards(
                globalIndicators,
                accountIndicators
            );
            rewards[i] = LiquidityMiningTypes.AccountRewardResult(
                lpTokens[i],
                rewardsAmount,
                _allocatedPwTokens[account]
            );
            unchecked {
                ++i;
            }
        }
        return rewards;
    }

    function updateIndicators(address account, address[] calldata lpTokens)
        external
        override
        nonReentrant
        whenNotPaused
    {
        require(account != address(0), Errors.WRONG_ADDRESS);
        uint256 lpTokensLength = lpTokens.length;
        uint256 rewardsAmountToTransfer;
        for (uint256 i; i != lpTokensLength; ++i) {
            address lpToken = lpTokens[i];
            LiquidityMiningTypes.AccountRewardsIndicators
                memory accountIndicators = _accountIndicators[account][lpToken];
            LiquidityMiningTypes.GlobalRewardsIndicators
                memory globalIndicators = _globalIndicators[lpToken];

            if (accountIndicators.lpTokenBalance == 0) {
                continue;
            }

            (
                uint256 rewardsAmount,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);
            rewardsAmountToTransfer += rewardsAmount;
            _rebalanceIndicators(
                account,
                lpToken,
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance,
                accountIndicators.delegatedPwTokenBalance
            );
            emit IndicatorsUpdated(account, lpToken);
        }
        if (rewardsAmountToTransfer > 0) {
            _allocatedPwTokens[account] += rewardsAmountToTransfer;
        }
    }

    function claim(address account, address[] calldata lpTokens)
        external
        override
        whenNotPaused
        onlyRouter
        returns (uint256 rewardsAmountToTransfer)
    {
        uint256 lpTokensLength = lpTokens.length;
        for (uint256 i; i != lpTokensLength; ) {
            address lpToken = lpTokens[i];
            LiquidityMiningTypes.AccountRewardsIndicators
                memory accountIndicators = _accountIndicators[account][lpToken];
            LiquidityMiningTypes.GlobalRewardsIndicators
                memory globalIndicators = _globalIndicators[lpToken];

            (
                uint256 rewardsAmount,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            if (rewardsAmount > 0) {
                _accountIndicators[account][lpToken] = LiquidityMiningTypes
                    .AccountRewardsIndicators(
                        accruedCompMultiplierCumulativePrevBlock.toUint128(),
                        accountIndicators.lpTokenBalance,
                        accountIndicators.powerUp,
                        accountIndicators.delegatedPwTokenBalance
                    );
                rewardsAmountToTransfer += rewardsAmount;
            }

            unchecked {
                ++i;
            }
        }
        uint256 allocatedRewards = _allocatedPwTokens[account];
        if (allocatedRewards > 0) {
            _allocatedPwTokens[account] = 0;
            rewardsAmountToTransfer += allocatedRewards;
        }
        emit Claimed(account, lpTokens, rewardsAmountToTransfer);
        return rewardsAmountToTransfer;
    }

    function addLpTokens(LiquidityMiningTypes.UpdateLpToken[] memory updateLpToken)
        external
        override
        onlyRouter
        whenNotPaused
    {
        uint256 length = updateLpToken.length;
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators;
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators;
        for (uint256 i; i != length; ) {
            LiquidityMiningTypes.UpdateLpToken memory update = updateLpToken[i];
            require(update.lpTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
            require(_lpTokens[update.lpToken], Errors.LP_TOKEN_NOT_SUPPORTED);

            accountIndicators = _accountIndicators[update.onBehalfOf][update.lpToken];
            globalIndicators = _globalIndicators[update.lpToken];

            (
                uint256 rewardsAmount,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            _rebalanceIndicators(
                update.onBehalfOf,
                update.lpToken,
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance + update.lpTokenAmount,
                accountIndicators.delegatedPwTokenBalance
            );
            if (rewardsAmount > 0) {
                _allocatedPwTokens[update.onBehalfOf] += rewardsAmount;
            }
            unchecked {
                ++i;
            }
            emit LpTokenAdded(update.onBehalfOf, update.lpToken, update.lpTokenAmount);
        }
    }

    function addPwTokens(LiquidityMiningTypes.UpdatePwToken[] memory updatePwTokens)
        external
        onlyRouter
        whenNotPaused
    {
        uint256 rewards;
        uint256 lpTokensLength = updatePwTokens.length;
        uint256 rewardsIteration;
        uint256 accruedCompMultiplierCumulativePrevBlock;
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators;
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators;

        for (uint256 i; i != lpTokensLength; ) {
            LiquidityMiningTypes.UpdatePwToken memory update = updatePwTokens[i];
            require(_lpTokens[update.lpToken], Errors.LP_TOKEN_NOT_SUPPORTED);

            accountIndicators = _accountIndicators[update.onBehalfOf][update.lpToken];
            globalIndicators = _globalIndicators[update.lpToken];

            /// @dev when account not stake any IP Token then calculation rewards and rebalancing is redundant
            if (accountIndicators.lpTokenBalance == 0) {
                uint256 newBalance = accountIndicators.delegatedPwTokenBalance +
                    update.pwTokenAmount;
                _accountIndicators[update.onBehalfOf][update.lpToken]
                    .delegatedPwTokenBalance = newBalance.toUint96();
                emit PwTokenDelegated(update.onBehalfOf, update.lpToken, update.pwTokenAmount);
                unchecked {
                    ++i;
                }
                continue;
            }

            (rewardsIteration, accruedCompMultiplierCumulativePrevBlock) = _calculateAccountRewards(
                globalIndicators,
                accountIndicators
            );

            rewards += rewardsIteration;

            _rebalanceIndicators(
                update.onBehalfOf,
                update.lpToken,
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance,
                accountIndicators.delegatedPwTokenBalance + update.pwTokenAmount
            );
            unchecked {
                ++i;
            }
            emit PwTokensAdded(update.onBehalfOf, update.lpToken, update.pwTokenAmount);
        }

        if (rewards > 0) {
            _allocatedPwTokens[updatePwTokens[0].onBehalfOf] += rewards;
        }
    }

    function removePwTokens(LiquidityMiningTypes.UpdatePwToken[] memory updatePwTokens)
        external
        onlyRouter
        whenNotPaused
    {
        uint256 rewards;
        uint256 length = updatePwTokens.length;
        uint256 rewardsIteration;
        uint256 accruedCompMultiplierCumulativePrevBlock;
        LiquidityMiningTypes.AccountRewardsIndicators memory accountIndicators;
        LiquidityMiningTypes.GlobalRewardsIndicators memory globalIndicators;

        for (uint256 i; i != length; ) {
            LiquidityMiningTypes.UpdatePwToken memory update = updatePwTokens[i];
            require(_lpTokens[update.lpToken], Errors.LP_TOKEN_NOT_SUPPORTED);

            accountIndicators = _accountIndicators[update.onBehalfOf][update.lpToken];

            require(
                accountIndicators.delegatedPwTokenBalance >= update.pwTokenAmount,
                Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW
            );

            globalIndicators = _globalIndicators[update.lpToken];

            (rewardsIteration, accruedCompMultiplierCumulativePrevBlock) = _calculateAccountRewards(
                globalIndicators,
                accountIndicators
            );

            rewards += rewardsIteration;

            _rebalanceIndicators(
                update.onBehalfOf,
                update.lpToken,
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance,
                accountIndicators.delegatedPwTokenBalance - update.pwTokenAmount
            );

            unchecked {
                ++i;
            }
            emit PwTokensRemoved(update.onBehalfOf, update.lpToken, update.pwTokenAmount);
        }

        if (rewards > 0) {
            _allocatedPwTokens[updatePwTokens[0].onBehalfOf] += rewards;
        }
    }

    function removeLpTokens(LiquidityMiningTypes.UpdateLpToken[] memory updateLpToken)
        external
        override
        onlyRouter
        whenNotPaused
    {
        uint256 length = updateLpToken.length;
        for (uint256 i; i != length; ) {
            LiquidityMiningTypes.UpdateLpToken memory update = updateLpToken[i];
            require(update.lpTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

            LiquidityMiningTypes.AccountRewardsIndicators
                memory accountIndicators = _accountIndicators[update.onBehalfOf][update.lpToken];
            LiquidityMiningTypes.GlobalRewardsIndicators
                memory globalIndicators = _globalIndicators[update.lpToken];

            require(
                accountIndicators.lpTokenBalance >= update.lpTokenAmount,
                Errors.ACCOUNT_LP_TOKEN_BALANCE_IS_TOO_LOW
            );

            (
                uint256 rewardsAmount,
                uint256 accruedCompMultiplierCumulativePrevBlock
            ) = _calculateAccountRewards(globalIndicators, accountIndicators);

            _rebalanceIndicators(
                update.onBehalfOf,
                update.lpToken,
                accruedCompMultiplierCumulativePrevBlock,
                globalIndicators,
                accountIndicators,
                accountIndicators.lpTokenBalance - update.lpTokenAmount,
                accountIndicators.delegatedPwTokenBalance
            );

            if (rewardsAmount > 0) {
                _allocatedPwTokens[update.onBehalfOf] += rewardsAmount;
            }
            unchecked {
                ++i;
            }
            emit LpTokensRemoved(update.onBehalfOf, update.lpToken, update.lpTokenAmount);
        }
    }

    function getGlobalIndicators(address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.GlobalIndicatorsResult[] memory)
    {
        uint256 length = lpTokens.length;

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory accountIndicators = new LiquidityMiningTypes.GlobalIndicatorsResult[](length);

        for (uint256 i; i != length; ) {
            accountIndicators[i] = LiquidityMiningTypes.GlobalIndicatorsResult(
                lpTokens[i],
                _globalIndicators[lpTokens[i]]
            );
            unchecked {
                ++i;
            }
        }
        return accountIndicators;
    }

    function getAccountIndicators(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.AccountIndicatorsResult[] memory)
    {
        uint256 length = lpTokens.length;

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicators = new LiquidityMiningTypes.AccountIndicatorsResult[](length);

        for (uint256 i; i != length; ) {
            accountIndicators[i] = LiquidityMiningTypes.AccountIndicatorsResult(
                lpTokens[i],
                _accountIndicators[account][lpTokens[i]]
            );
            unchecked {
                ++i;
            }
        }
        return accountIndicators;
    }
}
