// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/IPowerTokenLens.sol";
import "../../contracts/tokens/PowerTokenInternal.sol";

contract PwTokenCoolDown is TestCommons {
    event CooldownChanged(address indexed changedBy, uint256 pwTokenAmount, uint256 endTimestamp);
    event Redeem(address indexed account, uint256 pwTokenAmount);

    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
    }

    function testShouldNotBeAbleCooldownWhenAmountIsZero() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        PowerTokenTypes.PwTokenCooldown memory cooldownBefore = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        IPowerTokenStakeService(_router).pwTokenCooldown(0);

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        assertEq(
            cooldownBefore.pwTokenAmount,
            cooldownAfter.pwTokenAmount,
            "Cooldown amount should not change"
        );
    }

    function testShouldNotBeAbleCooldownWhenAmountIsToBig() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        PowerTokenTypes.PwTokenCooldown memory cooldownBefore = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        IPowerTokenStakeService(_router).pwTokenCooldown(1_001e18);

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        assertEq(
            cooldownBefore.pwTokenAmount,
            cooldownAfter.pwTokenAmount,
            "Cooldown amount should not change"
        );
    }

    function testShouldBeAbleCooldownWhenAmountIsNotZero() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        PowerTokenTypes.PwTokenCooldown memory cooldownBefore = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        // when
        vm.prank(_userOne);
        emit CooldownChanged(_userOne, 500e18, block.timestamp + 2 * 7 * 24 * 60 * 60);
        IPowerTokenStakeService(_router).pwTokenCooldown(500e18);

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        assertEq(0, cooldownBefore.pwTokenAmount, "Cooldown amount should decrease");
        assertEq(500e18, cooldownAfter.pwTokenAmount, "Cooldown amount should decrease");

        assertEq(
            block.timestamp +
                PowerTokenInternal(_powerTokensSystem.powerToken()).COOL_DOWN_IN_SECONDS(),
            cooldownAfter.endTimestamp,
            "Cooldown end time should be 14 days from now"
        );
    }

    function testShouldBeAbleToOverrideCooldownWhenSecondTimeExecuteMethod() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(500e18);
        PowerTokenTypes.PwTokenCooldown memory cooldownBefore = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        vm.roll(100);
        vm.warp(1200);

        // when
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(600e18);

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        assertEq(500e18, cooldownBefore.pwTokenAmount, "Cooldown amount should decrease");
        assertEq(600e18, cooldownAfter.pwTokenAmount, "Cooldown amount should decrease");

        assertTrue(
            cooldownBefore.endTimestamp < cooldownAfter.endTimestamp,
            "Cooldown end time should be greater than before"
        );

        assertEq(
            block.timestamp +
                PowerTokenInternal(_powerTokensSystem.powerToken()).COOL_DOWN_IN_SECONDS(),
            cooldownAfter.endTimestamp,
            "Cooldown end time should be 14 days from now"
        );
    }

    function testShouldBeAbleToCancelCooldown() external {
        // given

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(500e18);
        PowerTokenTypes.PwTokenCooldown memory cooldownBefore = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        vm.roll(100);
        vm.warp(block.timestamp + 1200);

        // when
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCancelCooldown();

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        assertEq(500e18, cooldownBefore.pwTokenAmount, "Cooldown amount");
        assertEq(0, cooldownAfter.pwTokenAmount, "Cooldown amount should be zero");
        assertEq(0, cooldownAfter.endTimestamp, "Cooldown end time should be zero");
    }

    function testShouldNotBeAbleToUnstakeWhenSomeAmountIsInCooldownState() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(800e18);

        vm.roll(100);
        vm.warp(block.timestamp + 1200);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        IPowerTokenStakeService(_router).unstakeGovernanceTokenFromPowerToken(_userOne, 300e18);

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        assertEq(800e18, cooldownAfter.pwTokenAmount, "Cooldown amount should be 500");
    }

    function testShouldNotBeAbleToDelegateWhenSomeAmountIsInCooldownState() external {
        // given

        uint256[] memory amountsToDelegate = new uint256[](1);
        amountsToDelegate[0] = 300e18;
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(800e18);
        uint256 delegateAmountBefore = IPowerTokenLens(_router)
            .balanceOfPwTokenDelegatedToLiquidityMining(_userOne);

        vm.roll(100);
        vm.warp(block.timestamp + 1200);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(
            lpTokens,
            amountsToDelegate
        );

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);
        uint256 delegateAmountAfter = IPowerTokenLens(_router)
            .balanceOfPwTokenDelegatedToLiquidityMining(_userOne);

        assertEq(800e18, cooldownAfter.pwTokenAmount, "Cooldown amount should be 500");
        assertEq(delegateAmountBefore, delegateAmountAfter, "Delegate amount should not change");
    }

    function testShouldNotBeAbleToRedeemCooldownTokensWhenTimeNotPass() external {
        // given

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(500e18);

        vm.roll(100);
        vm.warp(block.timestamp + 1200);

        uint256 userBalanceBefore = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.COOL_DOWN_NOT_FINISH));
        IPowerTokenStakeService(_router).redeemPwToken(_userOne);

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        uint256 userBalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        assertEq(500e18, cooldownAfter.pwTokenAmount, "Cooldown amount should be 500");
        assertEq(userBalanceBefore, userBalanceAfter, "User balance should not change");
    }

    function testShouldBeAbleToRedeemCooldownTokensWhen2WeeksPass() external {
        // given
        uint256 cooldownTime = PowerTokenInternal(_powerTokensSystem.powerToken())
            .COOL_DOWN_IN_SECONDS();

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(500e18);

        vm.roll(cooldownTime / 12 + 1);
        vm.warp(block.timestamp + cooldownTime + 12);

        uint256 userBalanceBefore = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectEmit(true, true, true, true);
        emit Redeem(_userOne, 500e18);
        IPowerTokenStakeService(_router).redeemPwToken(_userOne);

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        uint256 userBalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        assertEq(0, cooldownAfter.pwTokenAmount, "Cooldown amount should be 0");
        assertEq(userBalanceBefore + 500e18, userBalanceAfter, "User balance should increase");
    }

    function testShouldBeAbleToRedeemCooldownTokensWhen2WeeksPassAndExchangeRateChanged() external {
        // given
        uint256 cooldownTime = PowerTokenInternal(_powerTokensSystem.powerToken())
            .COOL_DOWN_IN_SECONDS();

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).pwTokenCooldown(500e18);

        uint256 userBalanceBeforeExchangeRateChanged = IPowerTokenLens(_router).balanceOfPwToken(
            _userOne
        );

        address iporToken = _powerTokensSystem.iporToken();
        address powerToken = _powerTokensSystem.powerToken();
        vm.prank(_powerTokensSystem.dao());
        ERC20(iporToken).transfer(powerToken, 1_000e18);

        uint256 userBalanceAfterExchangeRateChanged = IPowerTokenLens(_router).balanceOfPwToken(
            _userOne
        );
        uint256 userBalanceERC20BeforeRedeem = IERC20(iporToken).balanceOf(_userOne);

        vm.roll(cooldownTime / 12 + 1);
        vm.warp(block.timestamp + cooldownTime + 12);

        // when
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).redeemPwToken(_userOne);

        // then
        uint256 userBalanceERC20AfterRedeem = IERC20(iporToken).balanceOf(_userOne);
        uint256 userBalanceAfterRedeem = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        assertEq(
            userBalanceERC20BeforeRedeem + 500e18,
            userBalanceERC20AfterRedeem,
            "User balance should increase"
        );
        assertEq(
            userBalanceAfterExchangeRateChanged,
            userBalanceBeforeExchangeRateChanged + 1_000e18,
            "User balance should increase"
        );

        assertEq(
            userBalanceAfterExchangeRateChanged - 500e18,
            userBalanceAfterRedeem,
            "User balance should be 0"
        );
    }

    function testShouldPowerTokenLensReturnCoolDownInSeconds() external {
        // given
        IPowerTokenLens powerTokenLens = IPowerTokenLens(_router);

        // when
        uint256 cool_down_in_secounds = powerTokenLens.getPwTokenCooldownTime();

        // then
        PowerTokenTypes.PwTokenCooldown memory cooldownAfter = IPowerTokenLens(_router)
            .getPwTokensInCooldown(_userOne);

        uint256 userBalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        assertEq(2 * 7 * 24 * 60 * 60, cool_down_in_secounds, "Cooldown should be 2 weeks");
    }
}
