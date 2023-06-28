// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "@power-tokens/contracts/interfaces/ILiquidityMiningLens.sol";

contract LiquidityMiningUpdateIndicatorsTest is TestCommons {
    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
        address miningAddress = _powerTokensSystem.liquidityMining();
        address lpDai = _powerTokensSystem.lpDai();
        address lpUsdc = _powerTokensSystem.lpUsdc();
        address lpUsdt = _powerTokensSystem.lpUsdt();
        address iporToken = _powerTokensSystem.iporToken();

        vm.startPrank(_powerTokensSystem.owner());
        ILiquidityMiningInternal(miningAddress).setRewardsPerBlock(lpDai, 1e8);
        ILiquidityMiningInternal(miningAddress).setRewardsPerBlock(lpUsdc, 1e8);
        ILiquidityMiningInternal(miningAddress).setRewardsPerBlock(lpUsdt, 1e8);
        vm.stopPrank();
        vm.prank(_powerTokensSystem.dao());
        ERC20(iporToken).transfer(miningAddress, 10_000e18);

        _powerTokensSystem.mintLpTokens(lpDai, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(lpUsdc, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(lpUsdt, _userOne, 10_000e18);
    }

    function testShouldRebalanceIndicatorsOnePoolWhen100BlocksWereMint() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            lpTokens,
            lpTokenAmounts
        );
        vm.stopPrank();

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_router)
                .getGlobalIndicatorsFromLiquidityMining(lpTokens);

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsBefore = ILiquidityMiningLens(_router)
                .getAccountIndicatorsFromLiquidityMining(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[]
            memory accountRewardsBefore = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, lpTokens);
        vm.roll(block.number + 100);

        // when
        IPowerTokenFlowsService(_router).updateIndicatorsInLiquidityMining(_userOne, lpTokens);

        // then
        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_router)
                .getGlobalIndicatorsFromLiquidityMining(lpTokens);

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfter = ILiquidityMiningLens(_router)
                .getAccountIndicatorsFromLiquidityMining(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[]
            memory accountRewardsAfter = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, lpTokens);

        //    globalIndicatorsBefore[0].indicators.blockNumber
        assertTrue(
            globalIndicatorsBefore[0].indicators.blockNumber + 100 ==
                globalIndicatorsAfter[0].indicators.blockNumber
        );
        assertTrue(
            globalIndicatorsBefore[0].indicators.accruedRewards + 100e18 ==
                globalIndicatorsAfter[0].indicators.accruedRewards
        );

        assertTrue(
            accountIndicatorsBefore[0].indicators.powerUp ==
                accountIndicatorsAfter[0].indicators.powerUp
        );
        assertEq(0, accountRewardsBefore[0].rewardsAmount);
        assertEq(100e18, accountRewardsAfter[0].allocatedPwTokens);
        assertEq(0, accountRewardsAfter[0].rewardsAmount);
    }

    function testShouldRebalanceIndicatorsThreePoolWhen100BlocksWereMint() external {
        // given
        address[] memory lpTokens = new address[](3);
        lpTokens[0] = _powerTokensSystem.lpDai();
        lpTokens[1] = _powerTokensSystem.lpUsdc();
        lpTokens[2] = _powerTokensSystem.lpUsdt();
        uint256[] memory lpTokenAmounts = new uint256[](3);
        lpTokenAmounts[0] = 1_000e18;
        lpTokenAmounts[1] = 1_000e18;
        lpTokenAmounts[2] = 1_000e18;
        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 3_000e18);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            lpTokens,
            lpTokenAmounts
        );
        vm.stopPrank();

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_router)
                .getGlobalIndicatorsFromLiquidityMining(lpTokens);

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsBefore = ILiquidityMiningLens(_router)
                .getAccountIndicatorsFromLiquidityMining(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[]
            memory accountRewardsBefore = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, lpTokens);
        vm.roll(block.number + 100);

        // when
        IPowerTokenFlowsService(_router).updateIndicatorsInLiquidityMining(_userOne, lpTokens);

        // then
        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_router)
                .getGlobalIndicatorsFromLiquidityMining(lpTokens);

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfter = ILiquidityMiningLens(_router)
                .getAccountIndicatorsFromLiquidityMining(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[]
            memory accountRewardsAfter = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, lpTokens);

        assertTrue(
            globalIndicatorsBefore[0].indicators.blockNumber + 100 ==
                globalIndicatorsAfter[0].indicators.blockNumber
        );
        assertTrue(
            globalIndicatorsBefore[0].indicators.accruedRewards + 100e18 ==
                globalIndicatorsAfter[0].indicators.accruedRewards
        );
        assertTrue(
            globalIndicatorsBefore[1].indicators.blockNumber + 100 ==
                globalIndicatorsAfter[1].indicators.blockNumber
        );
        assertTrue(
            globalIndicatorsBefore[1].indicators.accruedRewards + 100e18 ==
                globalIndicatorsAfter[1].indicators.accruedRewards
        );

        assertTrue(
            globalIndicatorsBefore[2].indicators.blockNumber + 100 ==
                globalIndicatorsAfter[2].indicators.blockNumber
        );
        assertTrue(
            globalIndicatorsBefore[2].indicators.accruedRewards + 100e18 ==
                globalIndicatorsAfter[2].indicators.accruedRewards
        );

        assertTrue(
            accountIndicatorsBefore[0].indicators.powerUp ==
                accountIndicatorsAfter[0].indicators.powerUp
        );
        assertTrue(
            accountIndicatorsBefore[1].indicators.powerUp ==
                accountIndicatorsAfter[1].indicators.powerUp
        );
        assertTrue(
            accountIndicatorsBefore[1].indicators.powerUp ==
                accountIndicatorsAfter[1].indicators.powerUp
        );

        assertEq(0, accountRewardsBefore[0].rewardsAmount);
        assertEq(300e18, accountRewardsAfter[0].allocatedPwTokens);
        assertEq(0, accountRewardsAfter[0].rewardsAmount);
    }
}
