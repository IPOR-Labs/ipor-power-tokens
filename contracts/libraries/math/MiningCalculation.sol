// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../errors/Errors.sol";
import "./MathOperation.sol";

/// @title Library containing the core logic used in the Liquidity Mining module.
library MiningCalculation {
    using SafeCast for uint256;
    using SafeCast for int256;

    /// @notice Calculates the aggreagated power-up. Aggregate power-up is a synthetic summary of all power-ups across all users.
    /// It's used to calculate the individual rewards in relation to the rest of the pool.
    /// @param accountPowerUp power up indicator is calculated for a given account
    /// @param accountLpTokenAmount lpToken amount for a given account
    /// @param previousAccountPowerUp previous power-up indicator for a given account
    /// @param previousAccountLpTokenAmount previous lpToken amount for a given account
    /// @param previousAggregatedPowerUp previous aggregated power-up indicator
    function calculateAggregatedPowerUp(
        uint256 accountPowerUp,
        uint256 accountLpTokenAmount,
        uint256 previousAccountPowerUp,
        uint256 previousAccountLpTokenAmount,
        uint256 previousAggregatedPowerUp
    ) internal pure returns (uint256) {
        int256 apu = accountPowerUp.toInt256() *
            accountLpTokenAmount.toInt256() -
            previousAccountPowerUp.toInt256() *
            previousAccountLpTokenAmount.toInt256();

        uint256 newApu;

        if (apu < 0) {
            uint256 absApu = MathOperation.division((-apu).toUint256(), 1e18);

            /// @dev the last unstaking of lpTokens can experience a rounding error
            if (previousAggregatedPowerUp < absApu && previousAggregatedPowerUp + 10000 >= absApu) {
                return 0;
            }

            require(
                previousAggregatedPowerUp >= absApu,
                Errors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE
            );

            newApu = previousAggregatedPowerUp - absApu;
        } else {
            newApu = previousAggregatedPowerUp + MathOperation.division(apu.toUint256(), 1e18);
        }

        if (newApu < 10000) {
            return 0;
        }
        return newApu;
    }

    /// @notice Calculates the rewards from last rebalancing including block number given as a param.
    /// @param blockNumber block number for which the rewards calculation is executed
    /// @param lastRebalanceBlockNumber block number when last rewards rebalance was executed
    /// @param rewardsPerBlock configuration param describing how many pwTokens are rewarded across all participants per one block, represendet with 8 decimals
    /// @param previousAccruedRewards number of previously cumulated/accrued rewards
    /// @return new accrued rewards, amount of Power Tokens accrued for given params
    function calculateAccruedRewards(
        uint256 blockNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 rewardsPerBlock,
        uint256 previousAccruedRewards
    ) internal pure returns (uint256) {
        require(
            blockNumber >= lastRebalanceBlockNumber,
            Errors.BLOCK_NUMBER_LOWER_THAN_PREVIOUS_BLOCK_NUMBER
        );
        uint256 newRewards = (blockNumber - lastRebalanceBlockNumber) * rewardsPerBlock * 1e10;
        return previousAccruedRewards + newRewards;
    }

    /// @notice Calculates the Composite Multiplier Indicator
    /// @param rewardsPerBlock config param, number of Power Token rewardes across all participants in one block, represented with 8 decimals
    /// @param aggregatedPowerUp Aggregated Power-up indicator, represented with 18 decimals
    /// @return composite multiplier, value represented with 27 decimals
    function calculateCompositeMultiplier(
        uint256 rewardsPerBlock,
        uint256 aggregatedPowerUp
    ) internal pure returns (uint256) {
        if (aggregatedPowerUp == 0) {
            return 0;
        }
        /// @dev decimals: 8 + 18 + 19 - 18 = 27
        return MathOperation.division(rewardsPerBlock * 1e18 * 1e19, aggregatedPowerUp);
    }

    /// @notice calculates the account's rewards issued in pwTokens
    /// @param accountLpTokenAmount amount of lpTokens for a given account
    /// @param accountPowerUp value of power-up indicator for a given account
    /// @param accountCompMultiplierCumulativePrevBlock Account Composite Multiplier Cumulative for the Previous Block, value from last Account Indicator update of param Composite Multiplier Cumulative for a given account
    /// @param accruedCompMultiplierCumulativePrevBlock Accrued Composite Multiplier Cumulative for the Previous Block, accrued value (in a current block) of param Composite Multiplier Cumulative global
    /// @return rewards, amount of Staked Tokens (or Power Tokens because are in 1:1 relation with Staked Tokens), represented with 18 decimals
    function calculateAccountRewards(
        uint256 accountLpTokenAmount,
        uint256 accountPowerUp,
        uint256 accountCompMultiplierCumulativePrevBlock,
        uint256 accruedCompMultiplierCumulativePrevBlock
    ) internal pure returns (uint256) {
        require(
            accruedCompMultiplierCumulativePrevBlock >= accountCompMultiplierCumulativePrevBlock,
            Errors.ACCOUNT_COMPOSITE_MULTIPLIER_GT_COMPOSITE_MULTIPLIER
        );

        uint256 accountGovernanceTokenRewards = accountLpTokenAmount *
            accountPowerUp *
            (accruedCompMultiplierCumulativePrevBlock - accountCompMultiplierCumulativePrevBlock);

        /// @dev decimals: 18 + 18 + 27 - 45 =  18
        return MathOperation.division(accountGovernanceTokenRewards, 1e45);
    }

    /// @notice Calculates the accrued Composite Multiplier Cumulative for the previous block
    /// @param currentBlockNumber Current block number
    /// @param globalIndBlockNumber Block number of the last update of the Global Indicators
    /// @param globalIndCompositeMultiplierInTheBlock Configuration param - Composite Multiplier for one block defined in Global Indicators
    /// @param globalIndCompositeMultiplierCumulativePrevBlock Compositne Multiplier Comulative for a previous block defined in Global Indicators structure.
    function calculateAccruedCompMultiplierCumulativePrevBlock(
        uint256 currentBlockNumber,
        uint256 globalIndBlockNumber,
        uint256 globalIndCompositeMultiplierInTheBlock,
        uint256 globalIndCompositeMultiplierCumulativePrevBlock
    ) internal pure returns (uint256) {
        return
            globalIndCompositeMultiplierCumulativePrevBlock +
            (currentBlockNumber - globalIndBlockNumber) *
            globalIndCompositeMultiplierInTheBlock;
    }
}
