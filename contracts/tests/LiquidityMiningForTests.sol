// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../mining/LiquidityMining.sol";

contract LiquidityMiningForTests is LiquidityMining {
    function setPowerIpor(address powerIpor) external {
        _powerIpor = powerIpor;
    }
}