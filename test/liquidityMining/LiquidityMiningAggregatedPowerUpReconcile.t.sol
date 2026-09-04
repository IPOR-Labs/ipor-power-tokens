// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "@power-tokens/contracts/interfaces/ILiquidityMiningLens.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenStakeService.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenFlowsService.sol";
import "@power-tokens/contracts/interfaces/ILiquidityMiningInternal.sol";
import "@power-tokens/contracts/libraries/errors/Errors.sol";

/// @notice An under-counted `aggregatedPowerUp` must never block withdrawal of lpToken principal,
/// and the owner can reconcile the aggregate once, atomically with the upgrade.
contract LiquidityMiningAggregatedPowerUpReconcileTest is TestCommons {
    event AggregatedPowerUpReconciled(
        address lpToken,
        uint256 previousAggregatedPowerUp,
        uint256 newAggregatedPowerUp
    );

    /// @dev storage slot of `_globalIndicators` mapping in LiquidityMiningEthereum (forge inspect storage-layout)
    uint256 internal constant GLOBAL_INDICATORS_SLOT = 306;

    PowerTokensTestsSystem internal _system;
    address internal _router;
    address internal _lm;
    address internal _owner;
    address internal _lpDai;
    address internal _lpUsdc;
    address internal _userOne;
    address internal _userTwo;

    function setUp() external {
        _system = new PowerTokensTestsSystem();
        _router = _system.router();
        _lm = _system.liquidityMining();
        _owner = _system.owner();
        _lpDai = _system.lpDai();
        _lpUsdc = _system.lpUsdc();
        _userOne = _getUserAddress(1);
        _userTwo = _getUserAddress(2);

        _system.makeAllApprovals(_userOne);
        _system.makeAllApprovals(_userTwo);
        _system.transferIporToken(_userOne, 100_000e18);
        _system.transferIporToken(_userTwo, 100_000e18);
        _system.mintLpTokens(_lpDai, _userOne, 100_000e18);
        _system.mintLpTokens(_lpDai, _userTwo, 100_000e18);
        _system.mintLpTokens(_lpUsdc, _userOne, 100_000e18);

        _system.setRewardsPerBlock(_lpDai, 1e8);
        _system.setRewardsPerBlock(_lpUsdc, 1e8);
    }

    // ---------------------------------------------------------------------
    // clamp: principal always exits
    // ---------------------------------------------------------------------

    function testShouldUnstakeFullBalanceWhenAggregatedPowerUpIsUnderCounted() external {
        // given: two stakers with delegated pwTokens, then the aggregate is corrupted to ~10% of its value
        _stakeAndDelegate(_userOne, _lpDai, 1_000e18, 500e18);
        _stakeAndDelegate(_userTwo, _lpDai, 2_000e18, 800e18);
        vm.roll(block.number + 100);

        uint256 aggregateBefore = _aggregatedPowerUp(_lpDai);
        uint256 userOneContribution = _contribution(_userOne, _lpDai);
        _corruptAggregatedPowerUp(_lpDai, aggregateBefore / 10);
        assertLt(_aggregatedPowerUp(_lpDai), userOneContribution, "precondition: aggregate < contribution");

        uint256 lpBalanceBefore = IERC20(_lpDai).balanceOf(_userOne);

        // when: full unstake, previously reverted with PT_711
        _unstake(_userOne, _lpDai, 1_000e18);

        // then
        assertEq(
            IERC20(_lpDai).balanceOf(_userOne) - lpBalanceBefore,
            1_000e18,
            "full principal must be returned"
        );
        assertEq(_lpBalance(_userOne, _lpDai), 0, "account lp balance zeroed");
        assertEq(_aggregatedPowerUp(_lpDai), 0, "aggregate clamped to 0");

        // and: the second staker can still exit in full afterwards
        uint256 lpBalanceTwoBefore = IERC20(_lpDai).balanceOf(_userTwo);
        _unstake(_userTwo, _lpDai, 2_000e18);
        assertEq(
            IERC20(_lpDai).balanceOf(_userTwo) - lpBalanceTwoBefore,
            2_000e18,
            "second staker principal returned"
        );
        assertEq(_aggregatedPowerUp(_lpDai), 0, "aggregate stays 0 on an empty pool");
    }

    function testShouldResumeRewardsAccrualAfterAggregateClampedToZero() external {
        // given: aggregate clamped to 0 while userTwo is still staked
        _stakeAndDelegate(_userOne, _lpDai, 1_000e18, 500e18);
        _stakeAndDelegate(_userTwo, _lpDai, 2_000e18, 800e18);
        _corruptAggregatedPowerUp(_lpDai, 1);
        _unstake(_userOne, _lpDai, 1_000e18);
        assertEq(_aggregatedPowerUp(_lpDai), 0, "precondition: clamped to 0");

        // when: next stake re-seeds the aggregate from the account contributions
        _stakeAndDelegate(_userOne, _lpDai, 10e18, 0);
        vm.roll(block.number + 100);

        // then: aggregate is back to userOne's fresh contribution and rewards accrue again
        assertGt(_aggregatedPowerUp(_lpDai), 0, "aggregate re-seeded");
        assertEq(
            _aggregatedPowerUp(_lpDai),
            _contribution(_userOne, _lpDai),
            "aggregate equals the only rebalanced contribution"
        );
        assertGt(_accountRewards(_userOne, _lpDai), 0, "rewards accrue after recovery");
    }

    // ---------------------------------------------------------------------
    // reconcile
    // ---------------------------------------------------------------------

    function testShouldReconcileAggregatedPowerUpOnce() external {
        // given: deficits simulated on two pools
        _stakeAndDelegate(_userOne, _lpDai, 1_000e18, 500e18);
        _stakeAndDelegate(_userOne, _lpUsdc, 3_000e18, 0);
        uint256 daiTrue = _aggregatedPowerUp(_lpDai);
        uint256 usdcTrue = _aggregatedPowerUp(_lpUsdc);
        uint256 daiDeficit = 123e18;
        uint256 usdcDeficit = 45e18;
        _corruptAggregatedPowerUp(_lpDai, daiTrue - daiDeficit);
        _corruptAggregatedPowerUp(_lpUsdc, usdcTrue - usdcDeficit);

        address[] memory pools = new address[](2);
        pools[0] = _lpDai;
        pools[1] = _lpUsdc;
        uint256[] memory deltas = new uint256[](2);
        deltas[0] = daiDeficit;
        deltas[1] = usdcDeficit;

        // when
        vm.expectEmit(true, true, true, true);
        emit AggregatedPowerUpReconciled(_lpDai, daiTrue - daiDeficit, daiTrue);
        vm.expectEmit(true, true, true, true);
        emit AggregatedPowerUpReconciled(_lpUsdc, usdcTrue - usdcDeficit, usdcTrue);
        vm.prank(_owner);
        ILiquidityMiningInternal(_lm).reconcileAggregatedPowerUp(pools, deltas);

        // then
        assertEq(_aggregatedPowerUp(_lpDai), daiTrue, "dai aggregate restored");
        assertEq(_aggregatedPowerUp(_lpUsdc), usdcTrue, "usdc aggregate restored");
        assertEq(_aggregatedPowerUp(_lpDai), _contribution(_userOne, _lpDai), "dai invariant");
        assertEq(_aggregatedPowerUp(_lpUsdc), _contribution(_userOne, _lpUsdc), "usdc invariant");

        // and: reinitializer(2) is consumed
        vm.prank(_owner);
        vm.expectRevert("Initializable: contract is already initialized");
        ILiquidityMiningInternal(_lm).reconcileAggregatedPowerUp(pools, deltas);
    }

    function testShouldSettleAccruedRewardsBeforeReconcile() external {
        // given: rewards accrue for 1_000 blocks on the OLD (deficient) aggregate
        _stakeAndDelegate(_userOne, _lpDai, 1_000e18, 500e18);
        uint256 trueAggregate = _aggregatedPowerUp(_lpDai);
        _corruptAggregatedPowerUp(_lpDai, trueAggregate / 2);
        vm.roll(block.number + 1_000);

        LiquidityMiningTypes.GlobalRewardsIndicators memory before = _global(_lpDai);
        uint256 expectedAccrued = uint256(before.accruedRewards) +
            1_000 * uint256(before.rewardsPerBlock) * 1e10;
        uint256 expectedCumulative = uint256(before.compositeMultiplierCumulativePrevBlock) +
            1_000 * uint256(before.compositeMultiplierInTheBlock);

        // when
        vm.prank(_owner);
        ILiquidityMiningInternal(_lm).reconcileAggregatedPowerUp(
            _one(_lpDai),
            _oneAmount(trueAggregate - trueAggregate / 2)
        );

        // then
        LiquidityMiningTypes.GlobalRewardsIndicators memory after_ = _global(_lpDai);
        assertEq(after_.aggregatedPowerUp, trueAggregate, "aggregate restored");
        assertEq(after_.blockNumber, block.number, "rebalanced to the current block");
        assertEq(after_.accruedRewards, expectedAccrued, "rewards settled with the old aggregate");
        assertEq(
            after_.compositeMultiplierCumulativePrevBlock,
            expectedCumulative,
            "cumulative multiplier settled with the old multiplier"
        );
        assertEq(
            after_.compositeMultiplierInTheBlock,
            (uint256(before.rewardsPerBlock) * 1e18 * 1e19 + trueAggregate / 2) / trueAggregate,
            "multiplier recomputed for the new aggregate"
        );
        assertEq(after_.rewardsPerBlock, before.rewardsPerBlock, "rewardsPerBlock untouched");
    }

    function testShouldRevertReconcileWhenNotOwner() external {
        // note: PowerTokensTestsSystem.owner == rememberKey(1) == _userOne, so use a third address
        vm.prank(_getUserAddress(77));
        vm.expectRevert("Ownable: caller is not the owner");
        ILiquidityMiningInternal(_lm).reconcileAggregatedPowerUp(_one(_lpDai), _oneAmount(1e18));
    }

    function testShouldRevertReconcileOnLengthMismatch() external {
        address[] memory pools = new address[](2);
        pools[0] = _lpDai;
        pools[1] = _lpUsdc;

        vm.prank(_owner);
        vm.expectRevert(bytes(Errors.INPUT_ARRAYS_LENGTH_MISMATCH));
        ILiquidityMiningInternal(_lm).reconcileAggregatedPowerUp(pools, _oneAmount(1e18));
    }

    function testShouldRevertReconcileOnUnsupportedPool() external {
        vm.prank(_owner);
        vm.expectRevert(bytes(Errors.LP_TOKEN_NOT_SUPPORTED));
        ILiquidityMiningInternal(_lm).reconcileAggregatedPowerUp(
            _one(_getUserAddress(99)),
            _oneAmount(1e18)
        );
    }

    function testShouldRevertReconcileOnZeroDelta() external {
        vm.prank(_owner);
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        ILiquidityMiningInternal(_lm).reconcileAggregatedPowerUp(_one(_lpDai), _oneAmount(0));
    }

    function testShouldReportVersion2003() external {
        assertEq(ILiquidityMiningInternal(_lm).getVersion(), 2_003, "version bumped");
    }

    // ---------------------------------------------------------------------
    // helpers
    // ---------------------------------------------------------------------

    function _stakeAndDelegate(
        address user,
        address lpToken,
        uint256 lpAmount,
        uint256 pwAmount
    ) internal {
        address[] memory pools = _one(lpToken);
        vm.startPrank(user);
        if (pwAmount > 0) {
            IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(user, pwAmount);
            IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(
                pools,
                _oneAmount(pwAmount)
            );
        }
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            user,
            pools,
            _oneAmount(lpAmount)
        );
        vm.stopPrank();
    }

    function _unstake(address user, address lpToken, uint256 amount) internal {
        vm.prank(user);
        IPowerTokenStakeService(_router).unstakeLpTokensFromLiquidityMining(
            user,
            _one(lpToken),
            _oneAmount(amount)
        );
    }

    /// @dev overwrite `_globalIndicators[lpToken].aggregatedPowerUp` (first word of the struct)
    function _corruptAggregatedPowerUp(address lpToken, uint256 value) internal {
        bytes32 slot = keccak256(abi.encode(lpToken, GLOBAL_INDICATORS_SLOT));
        vm.store(_lm, slot, bytes32(value));
        assertEq(_aggregatedPowerUp(lpToken), value, "storage slot mismatch");
    }

    function _global(
        address lpToken
    ) internal view returns (LiquidityMiningTypes.GlobalRewardsIndicators memory) {
        return
            ILiquidityMiningLens(_router).getGlobalIndicatorsFromLiquidityMining(_one(lpToken))[0]
                .indicators;
    }

    function _aggregatedPowerUp(address lpToken) internal view returns (uint256) {
        return _global(lpToken).aggregatedPowerUp;
    }

    function _account(
        address user,
        address lpToken
    ) internal view returns (LiquidityMiningTypes.AccountRewardsIndicators memory) {
        return
            ILiquidityMiningLens(_router)
                .getAccountIndicatorsFromLiquidityMining(user, _one(lpToken))[0]
                .indicators;
    }

    function _contribution(address user, address lpToken) internal view returns (uint256) {
        LiquidityMiningTypes.AccountRewardsIndicators memory a = _account(user, lpToken);
        return (uint256(a.powerUp) * uint256(a.lpTokenBalance) + 5e17) / 1e18;
    }

    function _lpBalance(address user, address lpToken) internal view returns (uint256) {
        return _account(user, lpToken).lpTokenBalance;
    }

    function _accountRewards(address user, address lpToken) internal view returns (uint256) {
        return
            ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(user, _one(lpToken))[0]
                .rewardsAmount;
    }

    function _one(address a) internal pure returns (address[] memory arr) {
        arr = new address[](1);
        arr[0] = a;
    }

    function _oneAmount(uint256 v) internal pure returns (uint256[] memory arr) {
        arr = new uint256[](1);
        arr[0] = v;
    }
}
