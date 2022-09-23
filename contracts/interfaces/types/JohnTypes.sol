// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.16;

/// @title Structures used in John smart contract.
library JohnTypes {
    /// @title Struct pair represented pwIpor balance delegated
    struct DelegatedPwIporBalance {
        /// @notice ipToken address
        address ipToken;
        /// @notice amount of pwIpor which was delegated for given ipToken
        /// @dev value represented in 18 decimals
        uint256 pwIporAmount;
    }

    /// @title Global indicators used in rewards calculation.
    struct GlobalRewardsIndicators {
        /// @notice powerUp indicator aggregated
        /// @dev represended in 18 decimals
        uint256 aggregatedPowerUp;
        /// @notice composite multiplier in a given block described in field blockNumber
        /// @dev represented in 27 decimals
        uint128 compositeMultiplierInTheBlock;
        /// @dev represented in 27 decimals
        uint128 compositeMultiplierCumulativePrevBlock;
        /// @dev Block number in which all others params in this structure are updated
        uint32 blockNumber;
        /// @notice value describes how many rewards are per one block,
        /// @dev represented in 8 decimals
        uint32 rewardsPerBlock;
        /// @notice amount of accrued rewards in all history
        uint88 accruedRewards;
    }

    /// @title Rewards params specified for one account. Params used in algorithm responsible for rewards distribution.
    struct AccountRewardsIndicators {
        /// @notice composite multiplier cumulative
        /// @dev represented in 27 decimals
        uint128 compositeMultiplierCumulative;
        /// @notice ipToken account's balance
        uint128 ipTokenBalance;
        /// @notive PowerUp is a result of logarythmic equastion defined in documentation,
        /// parameter used to recalculate composite multiplier.
        /// @dev  powerUp < 100 *10^18
        uint72 powerUp;
        /// @notice balance of pwIpor tokens which are delegated to John
        /// @dev delegatedPwTokenBalance < 10^26 < 2^87
        uint96 delegatedPwIporBalance;
    }
}
