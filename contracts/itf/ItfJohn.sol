// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "../mining/John.sol";

contract ItfJohn is John {
    function setPowerIpor(address powerIpor) external {
        _powerIpor = powerIpor;
    }
}
