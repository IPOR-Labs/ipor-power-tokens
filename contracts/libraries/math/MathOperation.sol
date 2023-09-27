// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

library MathOperation {
    //@notice Division with the rounding up on last position, x, and y is with MD
    function division(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = (x + (y / 2)) / y;
    }
}
