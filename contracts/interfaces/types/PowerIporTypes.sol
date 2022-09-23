// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.16;

/// @title Struct used across liquidity rewards.
library PowerIporTypes {
    struct PwIporCoolDown {
        // @dev timestamp when account can redeem Ipor Tokens
        uint256 endTimestamp;
        // @dev amount of pwIpor tokens which can be redeem without fee when cooldown reached `endTimestamp`
        uint256 pwIporAmount;
    }
}
