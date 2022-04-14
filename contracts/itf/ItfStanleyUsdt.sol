// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "./ItfStanley.sol";

contract ItfStanleyUsdt is ItfStanley {
    function _getDecimals() internal pure virtual override returns (uint256) {
        return 6;
    }
}
