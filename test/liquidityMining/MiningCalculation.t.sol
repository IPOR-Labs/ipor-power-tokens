// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../TestCommons.sol";
import "contracts/libraries/math/MiningCalculation.sol";

contract MiningCalculationTest is TestCommons {
    struct TestData {
        uint256 lpTokenAmount;
        uint256 pwTokenAmount;
        uint256 result;
    }

    bytes16 private _verticalShift = 0x3ffd99999999999999e36310e0e2a848;
    bytes16 private _horizontalShift = 0x3fff0000000000000000000000000000;
    TestData[] private _testData;
    TestData private _testItem;

    function setUp() external {
        _testData.push(TestData(1e18, 1e18, 1984962500721156182));
        _testData.push(TestData(1e18, 2e18, 2721928094887362348));
        _testData.push(TestData(2e18, 1e18, 1400000000000000000));
        _testData.push(TestData(10e18, 1e18, 663034405833793834));
        _testData.push(TestData(10e18, 123e18, 5078071905112637653));
        _testData.push(TestData(33e18, 44e18, 2274469117916141075));
    }

    function testShouldReturnZeroWhenLpTokenAmountIs0() external {
        // given
        // when
        uint256 result = MiningCalculation.calculateAccountPowerUp(
            2,
            0,
            _verticalShift,
            _horizontalShift
        );

        // then
        assertEq(result, 0, "Should return 0");
    }

    function testShouldReturnVerticalShiftWhenPwTokenAmount0() external {
        // given
        // when
        uint256 result = MiningCalculation.calculateAccountPowerUp(
            0,
            1e18,
            _verticalShift,
            _horizontalShift
        );

        // then
        assertEq(result, 2e17, "Should return 2e17");
    }

    function testShouldReturn0_2WhenPwTokenAmountIs0HS0_5VS1_4() external {
        // given
        // when
        uint256 result = MiningCalculation.calculateAccountPowerUp(
            0,
            1e18,
            0x3fff6666666666666666666666666666,
            0x3ffe0000000000000000000000000000
        );

        // then
        assertEq(result, 2e17, "Should return 2e17");
    }

    function testShouldReturn0WhenLpTokenLessThan1() external {
        // given
        // when
        uint256 result = MiningCalculation.calculateAccountPowerUp(
            0,
            999999999999999999,
            _verticalShift,
            _horizontalShift
        );

        // then
        assertEq(result, 0, "Should return 0");
    }

    function testShouldCalculateSimpleCase1() external {
        // given
        // when
        uint256 result = MiningCalculation.calculateAccountPowerUp(
            1e18,
            1e18,
            _verticalShift,
            _horizontalShift
        );

        // then
        assertEq(result, 1984962500721156182, "Should return 1984962500721156182");
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
        uint256 result = MiningCalculation.calculateAccountPowerUp(
            _testItem.pwTokenAmount,
            _testItem.lpTokenAmount,
            _verticalShift,
            _horizontalShift
        );
        console2.log("result", result);
        // then
        assertEq(
            result,
            _testItem.result,
            string.concat("Should return ", Strings.toString(_testItem.result))
        );
    }
}
