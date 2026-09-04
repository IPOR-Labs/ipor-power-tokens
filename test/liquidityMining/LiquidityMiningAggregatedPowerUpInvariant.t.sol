// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "@power-tokens/contracts/interfaces/ILiquidityMiningLens.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenStakeService.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenFlowsService.sol";
import "@power-tokens/contracts/interfaces/ILiquidityMiningInternal.sol";

/// @dev Drives random stake / unstake / delegate / undelegate / claim sequences through the router.
contract AggregatedPowerUpHandler is Test {
    address public immutable router;
    address[] public actors;
    address[] public pools;
    uint256 public operations;

    constructor(address routerInput, address[] memory actorsInput, address[] memory poolsInput) {
        router = routerInput;
        actors = actorsInput;
        pools = poolsInput;
    }

    function stakeLp(uint256 actorSeed, uint256 poolSeed, uint256 amount) external {
        address actor = _actor(actorSeed);
        address pool = _pool(poolSeed);
        amount = bound(amount, 1, IERC20(pool).balanceOf(actor));
        if (amount == 0) return;
        vm.prank(actor);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(
            actor,
            _one(pool),
            _oneAmount(amount)
        );
        ++operations;
    }

    function unstakeLp(uint256 actorSeed, uint256 poolSeed, uint256 amount) external {
        address actor = _actor(actorSeed);
        address pool = _pool(poolSeed);
        uint256 staked = _account(actor, pool).lpTokenBalance;
        if (staked == 0) return;
        amount = bound(amount, 1, staked);
        vm.prank(actor);
        IPowerTokenStakeService(router).unstakeLpTokensFromLiquidityMining(
            actor,
            _one(pool),
            _oneAmount(amount)
        );
        ++operations;
    }

    function delegatePw(uint256 actorSeed, uint256 poolSeed, uint256 amount) external {
        address actor = _actor(actorSeed);
        address pool = _pool(poolSeed);
        amount = bound(amount, 1, 5_000e18);
        vm.prank(actor);
        IPowerTokenStakeService(router).stakeGovernanceTokenToPowerTokenAndDelegate(
            actor,
            amount,
            _one(pool),
            _oneAmount(amount)
        );
        ++operations;
    }

    function undelegatePw(uint256 actorSeed, uint256 poolSeed, uint256 amount) external {
        address actor = _actor(actorSeed);
        address pool = _pool(poolSeed);
        uint256 delegated = _account(actor, pool).delegatedPwTokenBalance;
        if (delegated == 0) return;
        amount = bound(amount, 1, delegated);
        vm.prank(actor);
        IPowerTokenFlowsService(router).undelegatePwTokensFromLiquidityMining(
            _one(pool),
            _oneAmount(amount)
        );
        ++operations;
    }

    function claim(uint256 actorSeed, uint256 poolSeed) external {
        address actor = _actor(actorSeed);
        address pool = _pool(poolSeed);
        if (_account(actor, pool).lpTokenBalance == 0) return;
        vm.prank(actor);
        IPowerTokenFlowsService(router).claimRewardsFromLiquidityMining(_one(pool));
        ++operations;
    }

    function roll(uint256 blocks) external {
        vm.roll(block.number + bound(blocks, 1, 1_000));
    }

    function actorsLength() external view returns (uint256) {
        return actors.length;
    }

    function poolsLength() external view returns (uint256) {
        return pools.length;
    }

    function _account(
        address actor,
        address pool
    ) internal view returns (LiquidityMiningTypes.AccountRewardsIndicators memory) {
        return
            ILiquidityMiningLens(router).getAccountIndicatorsFromLiquidityMining(actor, _one(pool))[0]
                .indicators;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function _pool(uint256 seed) internal view returns (address) {
        return pools[seed % pools.length];
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

/// @notice `aggregatedPowerUp == sum(round(powerUp_i * lpTokenBalance_i / 1e18))` per pool
/// must survive any sequence of user actions (each rebalance may lose at most 1 wei to rounding).
contract LiquidityMiningAggregatedPowerUpInvariantTest is TestCommons {
    PowerTokensTestsSystem internal _system;
    AggregatedPowerUpHandler internal _handler;
    address internal _router;

    function setUp() external {
        _system = new PowerTokensTestsSystem();
        _router = _system.router();

        address[] memory actors = new address[](3);
        actors[0] = _getUserAddress(11);
        actors[1] = _getUserAddress(12);
        actors[2] = _getUserAddress(13);
        address[] memory pools = new address[](2);
        pools[0] = _system.lpDai();
        pools[1] = _system.lpUsdc();

        _system.setRewardsPerBlock(pools[0], 1e8);
        _system.setRewardsPerBlock(pools[1], 3e8);

        for (uint256 i; i < actors.length; ++i) {
            _system.makeAllApprovals(actors[i]);
            _system.transferIporToken(actors[i], 1_000_000e18);
            _system.mintLpTokens(pools[0], actors[i], 1_000_000e18);
            _system.mintLpTokens(pools[1], actors[i], 1_000_000e18);
        }

        _handler = new AggregatedPowerUpHandler(_router, actors, pools);
        targetContract(address(_handler));
    }

    function invariant_aggregatedPowerUpEqualsSumOfContributions() external {
        uint256 poolsLength = _handler.poolsLength();
        uint256 actorsLength = _handler.actorsLength();

        for (uint256 p; p < poolsLength; ++p) {
            address pool = _handler.pools(p);
            address[] memory one = new address[](1);
            one[0] = pool;

            uint256 aggregate = ILiquidityMiningLens(_router)
                .getGlobalIndicatorsFromLiquidityMining(one)[0]
                .indicators
                .aggregatedPowerUp;

            uint256 sum;
            for (uint256 a; a < actorsLength; ++a) {
                LiquidityMiningTypes.AccountRewardsIndicators memory acc = ILiquidityMiningLens(
                    _router
                ).getAccountIndicatorsFromLiquidityMining(_handler.actors(a), one)[0].indicators;
                sum += (uint256(acc.powerUp) * uint256(acc.lpTokenBalance) + 5e17) / 1e18;
            }

            /// @dev each rebalance rounds once (<= 1 wei); a drained pool flushes dust below 10_000 wei to 0
            uint256 tolerance = _handler.operations() + 10_000;
            uint256 diff = aggregate > sum ? aggregate - sum : sum - aggregate;
            assertLe(diff, tolerance, "aggregatedPowerUp drifted from the sum of account contributions");
        }
    }
}
