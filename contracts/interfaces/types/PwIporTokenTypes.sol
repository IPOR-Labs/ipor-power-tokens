// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.15;

/// @title Struct used across liquidity rewards.
library PwIporTokenTypes {
    struct PwCoolDown {
        uint256 coolDownFinish;
        uint256 amount;
    }
}
