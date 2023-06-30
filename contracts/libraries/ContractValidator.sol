// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import "./errors/Errors.sol";

library ContractValidator {
    function checkAddress(address addr) internal pure returns (address) {
        require(addr != address(0), Errors.WRONG_ADDRESS);
        return addr;
    }
}
