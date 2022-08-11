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
}
