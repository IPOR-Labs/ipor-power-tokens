// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import {MiningOwnableUpgradeable} from "../security/MiningOwnableUpgradeable.sol";

contract MockOwnableUpgradeable is MiningOwnableUpgradeable {
    function initialize() public initializer {
        __Ownable_init();
    }
}
