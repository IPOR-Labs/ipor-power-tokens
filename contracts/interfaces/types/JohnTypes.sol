// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.16;

/// @title Struct used across liquidity rewards.
library JohnTypes {
    struct DelegatedPwIpor {
        address ipToken;
        uint256 amount;
    }

    struct BalanceOfDelegatedPwIpor {
        DelegatedPwIpor[] balances;
    }

    struct GlobalRewardsParams {
        uint256 aggregatePowerUp;
        // represented in 27 decimals
        uint128 compositeMultiplierInTheBlock;
        // represented in 27 decimals
        uint128 compositeMultiplierCumulativePrevBlock;
        uint32 blockNumber;
        // represented in 8 decimals
        uint32 blockRewards;
        uint88 accruedRewards;
    }

    struct AccountRewardsParams {
        // represented in 27 decimals
        uint128 compositeMultiplierCumulative;
        uint128 ipTokenBalance;
        //  powerUp < 100 *10^18
        uint72 powerUp;
        //delegatedPwTokenBalance < 10^26 < 2^87
        uint96 delegatedPwIporBalance;
    }
}
