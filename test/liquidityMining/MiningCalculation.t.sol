// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../TestCommons.sol";
import "../../contracts/libraries/math/MiningCalculationAccountPowerUp.sol";
import "../../contracts/libraries/math/MiningCalculation.sol";

contract MiningCalculationTest is TestCommons {
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
        _testData.push(TestData(1e18, 1e18, 2499535673550914421));
        _testData.push(TestData(1e18, 2e18, 3347532580105864436));
        _testData.push(TestData(2e18, 1e18, 1762570079384708255));
        _testData.push(TestData(10e18, 1e18, 400000000000000001));
        _testData.push(TestData(10e18, 123e18, 5827223037726961717));
        _testData.push(TestData(33e18, 44e18, 2840572591385981386));
        _testData.push(TestData(1000e18, 99e18, 399500000000000001)); // should be jump between 99 and 101
        _testData.push(TestData(1000e18, 101e18, 667150514306025735)); // should be jump between 99 and 101
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
                logBase: 2e18,
                pwTokenModifier: 2e18,
                vectorOfCurve: 0
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
                logBase: 2e18,
                pwTokenModifier: 2e18,
                vectorOfCurve: 0
            })
        );

        // then
        assertEq(result, 2e17, "Should return 2e17");
    }

    function testShouldReturn0_2WhenPwTokenAmountIs0HS0_5VS1_4() external {
        // given
        // when
        uint256 result = MiningCalculationAccountPowerUp.calculateAccountPowerUp(
            AccountPowerUpData({
                accountPwTokenAmount: 0,
                accountLpTokenAmount: 1e18,
                verticalShift: 0x3fff6666666666666666666666666666,
                horizontalShift: 0x3ffe0000000000000000000000000000,
                logBase: 2e18,
                pwTokenModifier: 2e18,
                vectorOfCurve: 0
            })
        );

        // then
        assertEq(result, 2e17, "Should return 2e17");
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
                logBase: 2e18,
                pwTokenModifier: 2e18,
                vectorOfCurve: 0
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
                logBase: 2e18,
                pwTokenModifier: 2e18,
                vectorOfCurve: 0
            })
        );

        // then
        assertEq(result, 2499535673550914421, "Should return 2499535673550914421");
    }

    function testShouldThrowPT_711AggregatePowerUpIsNegative() external {
        // given
        uint256 accountPowerUp = 900e18;
        uint256 accountLpTokenAmount = 1e18;
        uint256 previousAccountPowerUp = 1_000e18;
        uint256 previousAccountLpTokenAmount = 10e18;
        uint256 previousAggregatedPowerUp = 900e18;

        // when
        vm.expectRevert(bytes(Errors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE));
        MiningCalculation.calculateAggregatedPowerUp(
            accountPowerUp,
            accountLpTokenAmount,
            previousAccountPowerUp,
            previousAccountLpTokenAmount,
            previousAggregatedPowerUp
        );
    }

    function testShouldThrowPT_712BlockNumberLowerThanPreviousBlockNumber() external {
        // given
        uint256 blockNumber = 900e18;
        uint256 lastRebalanceBlockNumber = 1_000e18;
        uint256 rewardsPerBlock = 1e18;
        uint256 previousAccruedRewards = 900e18;

        // when
        vm.expectRevert(bytes(Errors.BLOCK_NUMBER_LOWER_THAN_PREVIOUS_BLOCK_NUMBER));
        MiningCalculation.calculateAccruedRewards(
            blockNumber,
            lastRebalanceBlockNumber,
            rewardsPerBlock,
            previousAccruedRewards
        );
    }

    function testShouldThrowPT_713CompositeMultiplierLowerThanAccountCompositeMultiplier()
        external
    {
        // given
        uint256 accountLpTokenAmount = 1_000e18;
        uint256 accountPowerUp = 1_000e18;
        uint256 accountCompositeMultiplierCumulativePrevBlock = 1_000e18;
        uint256 compositeMultiplierCumulativePrevBlock = 900e18;

        // when
        vm.expectRevert(bytes(Errors.ACCOUNT_COMPOSITE_MULTIPLIER_GT_COMPOSITE_MULTIPLIER));
        MiningCalculation.calculateAccountRewards(
            accountLpTokenAmount,
            accountPowerUp,
            accountCompositeMultiplierCumulativePrevBlock,
            compositeMultiplierCumulativePrevBlock
        );
    }

    function testShouldNotCalculateAnyRewardsWhenIpTokenAmount0() external {
        // given
        uint256 accountLpTokenAmount = 0;
        uint256 accountPowerUp = 1_000e18;
        uint256 accountCompositeMultiplierCumulativePrevBlock = 1_000e18;
        uint256 compositeMultiplierCumulativePrevBlock = 2_000e18;

        // when
        uint256 result = MiningCalculation.calculateAccountRewards(
            accountLpTokenAmount,
            accountPowerUp,
            accountCompositeMultiplierCumulativePrevBlock,
            compositeMultiplierCumulativePrevBlock
        );

        // then
        assertEq(result, 0, "Should return 0");
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
                logBase: 2e18,
                pwTokenModifier: 2e18,
                vectorOfCurve: 0
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
