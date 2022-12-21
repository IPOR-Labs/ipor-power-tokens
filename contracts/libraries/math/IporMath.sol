// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

library IporMath {
    //@notice Division with rounding up on last position, x, and y is with MD
    function division(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = (x + (y / 2)) / y;
    }
}
