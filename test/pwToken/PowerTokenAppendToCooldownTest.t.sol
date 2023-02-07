// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "../PowerTokensSetup.sol";
import "../TestCommons.sol";

contract PowerTokenAppendToCooldownTest is TestCommons {
    uint256 internal _blockTimestamp = 10_000_000;

    PowerTokensSetup internal _miningSystem;
    address internal _userOne;
    PowerToken internal _powerToken;
    MockStakedToken _stakedToken;

    function setUp() public {
        _miningSystem = new PowerTokensSetup(address(this));
        _powerToken = _miningSystem.powerToken();
        _userOne = _getUserAddress(1);
        _stakedToken = _miningSystem.stakedToken();
        _stakedToken.transfer(_userOne, 1000 * 1e18);
        vm.prank(_userOne);
        _stakedToken.approve(address(_powerToken), type(uint256).max);
    }

    function testShouldNotBeAbleToAppendToCooldownWhenNoActiveCooldown() public {
        // given
        // when
        vm.warp(_blockTimestamp);
        vm.expectRevert(bytes(Errors.ACC_COOLDOWN_IS_NOT_ACTIVE));
        _powerToken.appendToCooldown(10 * 1e18);
    }

    function testShouldNotBeAbleToAppendToCooldownWhenZeroAmount() public {
        // given
        // when
        vm.warp(_blockTimestamp);
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        _powerToken.appendToCooldown(0);
    }

    function testShouldNotBeAbleToAppendToCooldownWhenAvailablePowerTokenBalanceTooLowInCooldown()
        public
    {
        // given
        uint256 stakeAmount = 500 * 1e18;
        uint256 cooldownAmount = 300 * 1e18;

        vm.warp(_blockTimestamp);
        vm.startPrank(_userOne);
        _powerToken.stake(stakeAmount);
        _powerToken.cooldown(cooldownAmount);
        vm.stopPrank();
        _blockTimestamp += 60 * 60 * 24;

        // when
        vm.warp(_blockTimestamp);
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        _powerToken.appendToCooldown(cooldownAmount);
    }

    function testShouldNotBeAbleToAppendToCooldownWhenAvailablePowerTokenBalanceTooLowDelegated()
        public
    {
        // given
        uint256 stakeAmount = 500 * 1e18;
        uint256 cooldownAmount = 100 * 1e18;
        uint256 delegateAmount = 200 * 1e18;

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = address(_miningSystem.lpDai());
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = delegateAmount;
        vm.warp(_blockTimestamp);

        vm.startPrank(_userOne);
        _powerToken.stake(stakeAmount);
        _powerToken.cooldown(cooldownAmount);
        _powerToken.delegateToLiquidityMining(lpTokens, amounts);
        vm.stopPrank();

        _blockTimestamp += 60 * 60 * 24;

        // when
        vm.warp(_blockTimestamp);
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        _powerToken.appendToCooldown(300 * 1e18);
    }

    function testShouldAppendToCooldownWhenAddInTheSameTimestamp() public {
        // given
        uint256 stakeAmount = 500 * 1e18;
        uint256 cooldownAmount = 100 * 1e18;

        vm.warp(_blockTimestamp);
        vm.startPrank(_userOne);
        _powerToken.stake(stakeAmount);
        _powerToken.cooldown(cooldownAmount);
        vm.stopPrank();

        PowerTokenTypes.PwTokenCooldown memory activeCooldownBefore = _powerToken.getActiveCooldown(
            _userOne
        );
        vm.warp(_blockTimestamp);

        // when
        vm.expectEmit(true, true, true, true);
        emit CooldownChanged(_userOne, 2 * cooldownAmount, activeCooldownBefore.endTimestamp);
        vm.prank(_userOne);
        _powerToken.appendToCooldown(cooldownAmount);

        // then
        PowerTokenTypes.PwTokenCooldown memory activeCooldownAfter = _powerToken.getActiveCooldown(
            _userOne
        );

        assertEq(
            activeCooldownAfter.pwTokenAmount,
            activeCooldownBefore.pwTokenAmount + cooldownAmount
        );
        assertEq(activeCooldownAfter.endTimestamp, activeCooldownBefore.endTimestamp);
    }

    function testShouldAppendToCooldownWhenAddAfterSevenDays() public {
        // given
        uint256 stakeAmount = 500 * 1e18;
        uint256 cooldownAmount = 100 * 1e18;
        uint256 time3AndHalfDays = 60 * 60 * 24 * 3 + 60 * 60 * 12;

        vm.warp(_blockTimestamp);
        vm.startPrank(_userOne);
        _powerToken.stake(stakeAmount);
        _powerToken.cooldown(cooldownAmount);
        vm.stopPrank();
        _blockTimestamp += 60 * 60 * 24 * 7;

        vm.warp(_blockTimestamp);
        PowerTokenTypes.PwTokenCooldown memory activeCooldownBefore = _powerToken.getActiveCooldown(
            _userOne
        );

        // when
        vm.expectEmit(true, true, true, true);
        emit CooldownChanged(
            _userOne,
            2 * cooldownAmount,
            activeCooldownBefore.endTimestamp + time3AndHalfDays
        );
        vm.prank(_userOne);
        _powerToken.appendToCooldown(cooldownAmount);

        // then
        PowerTokenTypes.PwTokenCooldown memory activeCooldownAfter = _powerToken.getActiveCooldown(
            _userOne
        );

        uint256 addedTime = activeCooldownAfter.endTimestamp - activeCooldownBefore.endTimestamp;

        assertEq(
            activeCooldownAfter.pwTokenAmount,
            activeCooldownBefore.pwTokenAmount + cooldownAmount
        );
        assertEq(time3AndHalfDays, addedTime); // 3.5 days
    }

    /// @notice Emitted when the sender sets the cooldown on Power Tokens
    /// @param changedBy account address that has changed the cooldown rules
    /// @param pwTokenAmount amount of pwToken in cooldown
    /// @param endTimestamp end time of the cooldown
    event CooldownChanged(address indexed changedBy, uint256 pwTokenAmount, uint256 endTimestamp);
}
