// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../TestCommons.sol";
import "../../contracts/libraries/math/MiningCalculationAccountPowerUp.sol";
import "../../contracts/libraries/math/MiningCalculation.sol";

contract MiningCalculationLog3Mod5Curv02Test is TestCommons {
    struct TestData {
        uint256 lpTokenAmount;
        uint256 pwTokenAmount;
        uint256 result;
    }

    bytes16 private _verticalShift = 0x3fff6666666666666666666666666666;
    bytes16 private _horizontalShift = 0x3ffe0000000000000000000000000000;
    TestData[] private _testData;
    TestData private _testItem;

    function setUp() external {
        _testData.push(TestData(1e18, 1e18, 2729336163736232717));
        _testData.push(TestData(1e18, 2e18, 3317921574253516896));
        _testData.push(TestData(2e18, 1e18, 2177607578663552073));
        _testData.push(TestData(10e18, 1e18, 600000000000000001));
        _testData.push(TestData(10e18, 123e18, 4934287189492024347));
        _testData.push(TestData(33e18, 44e18, 2970269709589774227));
        _testData.push(TestData(1000e18, 99e18, 599500000000000001)); // should be jump between 99 and 101
        _testData.push(TestData(1000e18, 101e18, 1182147434591329528)); // should be jump between 99 and 101
    }

    function testShouldReturnZeroWhenLpTokenAmountIs0() external {
        // given
        // when
        uint256 result = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: 2,
                accountLpTokenAmount: 0,
                verticalShift: _verticalShift,
                horizontalShift: _horizontalShift,
                logBase: 3e18,
                pwTokenModifier: 5e18,
                vectorOfCurve: 2e17
            })
        );

        // then
        assertEq(result, 0, "Should return 0");
    }

    function testShouldReturnVerticalShiftWhenPwTokenAmount0() external {
        // given
        // when
        uint256 result = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: 0,
                accountLpTokenAmount: 1e18,
                verticalShift: _verticalShift,
                horizontalShift: _horizontalShift,
                logBase: 3e18,
                pwTokenModifier: 5e18,
                vectorOfCurve: 2e17
            })
        );

        // then
        assertEq(result, 4e17, "Should return 4e17");
    }

    function testShouldReturn0_4WhenPwTokenAmountIs0HS0_5VS1_4() external {
        // given
        // when
        uint256 result = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: 0,
                accountLpTokenAmount: 1e18,
                verticalShift: 0x3fff6666666666666666666666666666,
                horizontalShift: 0x3ffe0000000000000000000000000000,
                logBase: 3e18,
                pwTokenModifier: 5e18,
                vectorOfCurve: 2e17
            })
        );

        // then
        assertEq(result, 4e17, "Should return 4e17");
    }

    function testShouldReturn0WhenLpTokenLessThan1() external {
        // given
        // when
        uint256 result = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: 0,
                accountLpTokenAmount: 999999999999999999,
                verticalShift: _verticalShift,
                horizontalShift: _horizontalShift,
                logBase: 3e18,
                pwTokenModifier: 5e18,
                vectorOfCurve: 2e17
            })
        );

        // then
        assertEq(result, 0, "Should return 0");
    }

    function testShouldCalculateSimpleCase1() external {
        // given
        // when
        uint256 result = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: 1e18,
                accountLpTokenAmount: 1e18,
                verticalShift: _verticalShift,
                horizontalShift: _horizontalShift,
                logBase: 3e18,
                pwTokenModifier: 5e18,
                vectorOfCurve: 2e17
            })
        );

        // then
        assertEq(result, 2729336163736232717, "Should return 2729336163736232717");
    }

    modifier testAccountPowerUpData() {
        uint256 length = _testData.length;
        for (uint256 i = 0; i < length; ) {
            _testItem = _testData[i];
            _;
            unchecked {
                i += 1;
            }
        }
    }

    function testShouldCalculateProperAccountPowerUp() external testAccountPowerUpData {
        // given
        // when
        uint256 result = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: _testItem.pwTokenAmount,
                accountLpTokenAmount: _testItem.lpTokenAmount,
                verticalShift: _verticalShift,
                horizontalShift: _horizontalShift,
                logBase: 3e18,
                pwTokenModifier: 5e18,
                vectorOfCurve: 2e17
            })
        );
        // then
        assertEq(
            result,
            _testItem.result,
            string.concat("Should return ", Strings.toString(_testItem.result))
        );
    }
}
