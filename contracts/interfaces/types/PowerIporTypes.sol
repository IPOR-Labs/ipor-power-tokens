// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.17;

/// @title Struct used across liquidity rewards.
library PowerIporTypes {
    struct PwTokenCoolDown {
        // @dev timestamp when account can redeem Ipor Tokens
        uint256 endTimestamp;
        // @dev amount of Power Ipor Tokens which can be redeem without fee when cooldown reached `endTimestamp`
        uint256 pwTokenAmount;
    }
}
