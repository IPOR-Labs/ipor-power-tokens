// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.26;

import "forge-std/Test.sol";

contract TestCommons is Test {
    address internal _activeLpToken;

    function _getUserAddress(uint256 number) internal returns (address) {
        return vm.rememberKey(number);
    }

    modifier parameterizedLpTokens(address[] memory testData) {
        uint256 length = testData.length;
        for (uint256 i = 0; i < length; ) {
            _activeLpToken = testData[i];
            _;
            unchecked {
                i += 1;
            }
        }
    }
}
