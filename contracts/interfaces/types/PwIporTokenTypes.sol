// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.16;

/// @title Struct used across liquidity rewards.
library PwIporTokenTypes {
    struct PwCoolDown {
        // @dev timestamp when one can redeem tokens
        uint256 coolDownFinish;
        // @dev amount of tokens which can be redeem without fee
        uint256 amount;
    }
}
