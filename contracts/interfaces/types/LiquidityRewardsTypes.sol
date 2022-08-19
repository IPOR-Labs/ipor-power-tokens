// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.15;

/// @title Struct used across liquidity rewards.
library LiquidityRewardsTypes {
    struct DelegatedPwIpor {
        address asset;
        uint256 amount;
    }

    struct BalanceOfDelegatedPwIpor {
        DelegatedPwIpor[] balances;
    }

    struct GlobalRewardsParams {
        uint256 aggregatePowerUp;
        uint256 accruedRewards;
        uint256 compositeMultiplier;
        uint32 lastRebalancingBlockNumber;
        uint32 blockRewords;
    }

    struct UserRewardsParams {
        uint256 powerUp;
        uint256 compositeMultiplier;
        uint256 ipTokensBalance;
        uint256 delegatedPowerTokenBalance;
    }
}