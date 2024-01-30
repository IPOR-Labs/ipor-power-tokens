// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../TestCommons.sol";
import "@power-tokens/contracts/libraries/math/MiningCalculation.sol";
import "abdk-libraries-solidity/ABDKMathQuad.sol";

contract MiningCalculationStepFunctionTest is TestCommons {
    TestData private _testData;

    struct TestData {
        uint256 inputRatio;
        uint256 expectedResult;
    }

    modifier parameterizedTest(TestData[] memory items) {
        uint256 length = items.length;
        for (uint256 i = 0; i < length; ++i) {
            _testData = items[i];
            _;
        }
    }

    function testShouldCalculateProperAccountPowerUp() public parameterizedTest(getDataForTest()) {
        // given
        bytes16 ratio = _toQuadruplePrecision(_testData.inputRatio, 1e18);

        // when
        bytes16 result = MiningCalculation.accountPowerUpStepFunction(ratio);

        // then

        uint256 resultD18 = _bytes16ToUint(result);

        assertEq(
            resultD18,
            _testData.expectedResult,
            string.concat(
                "Expected: ",
                Strings.toString(_testData.expectedResult),
                " but got: ",
                Strings.toString(resultD18),
                ", input value: ",
                Strings.toString(_testData.inputRatio)
            )
        );
    }

    function getDataForTest() private returns (TestData[] memory) {
        TestData[] memory items = new TestData[](24);
        items[0] = TestData(0, 2e17);
        items[1] = TestData(1e15, 205000000000000005);
        items[2] = TestData(2e15, 210000000000000005);
        items[3] = TestData(7e15, 235000000000000005);
        items[4] = TestData(10e15, 250000000000000005);
        items[5] = TestData(11e15, 255000000000000005);
        items[6] = TestData(12e15, 260000000000000005);
        items[7] = TestData(18e15, 290000000000000005);
        items[8] = TestData(20e15, 300000000000000005);
        items[9] = TestData(21e15, 305000000000000005);
        items[10] = TestData(23e15, 315000000000000005);
        items[11] = TestData(26e15, 330000000000000005);
        items[12] = TestData(28e15, 340000000000000005);
        items[13] = TestData(30e15, 320000000000000002);
        items[14] = TestData(32e15, 324000000000000002);
        items[15] = TestData(34e15, 328000000000000002);
        items[16] = TestData(36e15, 332000000000000002);
        items[17] = TestData(38e15, 336000000000000002);
        items[18] = TestData(40e15, 340000000000000002);
        items[19] = TestData(41e15, 342000000000000002);
        items[20] = TestData(43e15, 346000000000000002);
        items[21] = TestData(45e15, 350000000000000002);
        items[22] = TestData(47e15, 354000000000000002);
        items[23] = TestData(50e15, 355000000000000002);
        return items;
    }

    /// @dev Quadruple precision, 128 bits
    function _toQuadruplePrecision(
        uint256 number,
        uint256 decimals
    ) private pure returns (bytes16) {
        if (number % decimals > 0) {
            /// @dev during calculation this value is lost in the conversion
            number += 1;
        }
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        return fraction;
    }

    function _bytes16ToUint(bytes16 number) private pure returns (uint256) {
        bytes16 resultD18 = ABDKMathQuad.mul(number, ABDKMathQuad.fromUInt(1e18));
        return ABDKMathQuad.toUInt(resultD18);
    }
}
