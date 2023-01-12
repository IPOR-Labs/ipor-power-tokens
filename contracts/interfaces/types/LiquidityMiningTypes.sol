// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.17;

/// @title Structures used in LiquidityMining smart contract.
library LiquidityMiningTypes {
    /// @title Struct pair represented pwIpor balance delegated
    struct DelegatedPwIporBalance {
        /// @notice lpToken address
        address lpToken;
        /// @notice amount of Power Ipor Token which was delegated for given lpToken
        /// @dev value represented in 18 decimals
        uint256 pwIporAmount;
    }

    /// @title Global indicators used in rewards calculation.
    struct GlobalRewardsIndicators {
        /// @notice powerUp indicator aggregated
        /// @dev could be change many times per transaction, represended in 18 decimals
        uint256 aggregatedPowerUp;
        /// @notice composite multiplier in a given block described in field blockNumber
        /// @dev could be change many times per transaction, represented in 27 decimals
        uint128 compositeMultiplierInTheBlock;
        /// @notice Composite multiplier updated in block {blockNumber} but calculated for PREVIOUS (!) block.
        /// @dev could be changed one time per block, represented in 27 decimals
        uint128 compositeMultiplierCumulativePrevBlock;
        /// @dev could be changed one time per block, Block number in which all others params in this structure are updated
        uint32 blockNumber;
        /// @notice value describes how many rewards are per one block,
        /// @dev could be changed at most one time per block, represented in 8 decimals
        uint32 rewardsPerBlock;
        /// @notice amount of accrued rewards in all history
        /// @dev could be changed at most one time per block, represented in 8 decimals
        uint88 accruedRewards;
    }

    /// @title Rewards params specified for one account. Params used in algorithm responsible for rewards distribution.
    /// @dev Structure in storage is updated in moment when account interacts with LiquidityMining smart contract (stake, unstake, delegate, undelegate, claim)
    struct AccountRewardsIndicators {
        /// @notice composite multiplier cumulative calculated for previous block
        /// @dev represented in 27 decimals
        uint128 compositeMultiplierCumulativePrevBlock;
        /// @notice lpToken account's balance
        uint128 lpTokenBalance;
        /// @notive PowerUp is a result of logarithmic equastion defined in documentation,
        /// parameter used to recalculate composite multiplier.
        /// @dev  powerUp < 100 *10^18
        uint72 powerUp;
        /// @notice balance of Power Ipor Tokens which are delegated to LiquidityMining
        /// @dev delegatedPwTokenBalance < 10^26 < 2^87
        uint96 delegatedPwIporBalance;
    }
}
