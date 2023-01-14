// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {MiningOwnableUpgradeable} from "../security/MiningOwnableUpgradeable.sol";

contract MockOwnableUpgradeable is MiningOwnableUpgradeable {
    function initialize() public initializer {
        __Ownable_init();
    }
}
