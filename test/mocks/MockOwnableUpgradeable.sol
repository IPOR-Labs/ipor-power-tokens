// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import {MiningOwnableUpgradeable} from "@power-tokens/contracts/security/MiningOwnableUpgradeable.sol";

contract MockOwnableUpgradeable is MiningOwnableUpgradeable {
    function initialize() public initializer {
        __Ownable_init();
    }
}
