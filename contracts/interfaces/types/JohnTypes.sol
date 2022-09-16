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
        uint256 accruedRewards;
        // represented in 27 decimals
        uint256 compositeMultiplierInTheBlock;
        // represented in 27 decimals
        uint256 compositeMultiplierCumulativeBeforeBlock;
        uint32 blockNumber;
        // represented in 8 decimals
        uint32 blockRewards;
    }

    struct AccountRewardsParams {
        uint256 powerUp;
        // represented in 27 decimals
        uint256 compositeMultiplierCumulative;
        uint256 ipTokensBalance;
        uint256 delegatedPwTokenBalance;
    }
}
