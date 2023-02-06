// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "./PowerTokensSetup.sol";

contract ExampleTest is Test {
    function testExample() public {
        PowerTokensSetup setup = new PowerTokensSetup(address(this));
        assertTrue(true);
    }
}
