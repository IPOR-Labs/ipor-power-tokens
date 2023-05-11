// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../TestCommons.sol";
import "../PowerTokensSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/ILiquidityMiningLens.sol";
import "../../contracts/interfaces/IPowerTokenLens.sol";
import "../../contracts/interfaces/IStakeService.sol";
import "../../contracts/tokens/PowerTokenInternalV2.sol";

contract PwTokenUnstakeLpTokensTest is TestCommons {
    PowerTokensSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;
    address _userTwo;
    address _userThree;

    function setUp() external {
        _powerTokensSystem = new PowerTokensSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _userTwo = _getUserAddress(2);
        _userThree = _getUserAddress(3);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.makeAllApprovals(_userTwo);
        _powerTokensSystem.makeAllApprovals(_userThree);
        _powerTokensSystem.transferIporToken(_userOne, 100_000e18);
        _powerTokensSystem.transferIporToken(_userTwo, 100_000e18);
        _powerTokensSystem.transferIporToken(_userThree, 100_000e18);
        address miningAddress = _powerTokensSystem.liquidityMining();
        address lpDai = _powerTokensSystem.lpDai();
        address lpUsdc = _powerTokensSystem.lpUsdc();
        address lpUsdt = _powerTokensSystem.lpUsdt();
        address iporToken = _powerTokensSystem.iporToken();

        vm.startPrank(_powerTokensSystem.owner());
        ILiquidityMiningInternalV2(miningAddress).setRewardsPerBlock(lpDai, 1e8);
        ILiquidityMiningInternalV2(miningAddress).setRewardsPerBlock(lpUsdc, 1e8);
        ILiquidityMiningInternalV2(miningAddress).setRewardsPerBlock(lpUsdt, 1e8);
        vm.stopPrank();

        _powerTokensSystem.mintLpTokens(lpDai, _userOne, 100_000e18);
        _powerTokensSystem.mintLpTokens(lpDai, _userTwo, 100_000e18);
        _powerTokensSystem.mintLpTokens(lpDai, _userThree, 100_000e18);
    }

    function testShouldStakeAndUnstake1Users() external {
        // given
        address lpDai = _powerTokensSystem.lpDai();
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = lpDai;
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        uint256[] memory lpTokenAmountsToUnstake = new uint256[](1);
        lpTokenAmountsToUnstake[0] = 50_000e18;
        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        vm.stopPrank();

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsBefore = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        // when

        for (uint256 i; i < 50; ++i) {
            vm.prank(_userOne);
            IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
            vm.roll(block.number + 100);
        }

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfterStake = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfterStake = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(lpTokens, lpTokenAmountsToUnstake);

        // then

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfterUnstake = ILiquidityMiningLens(_router)
                .getAccountIndicators(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[]
            memory rewardsAfterUnstake = ILiquidityMiningLens(_router).calculateAccountRewards(
                _userOne,
                lpTokens
            );

        assertEq(
            accountIndicatorsBefore[0].indicators.delegatedPwTokenBalance,
            1_000e18,
            "delegatedPwTokenBalance before"
        );
        assertEq(
            accountIndicatorsBefore[0].indicators.lpTokenBalance,
            0,
            "delegatedPwTokenBalance before"
        );
        assertEq(
            accountIndicatorsAfterStake[0].indicators.delegatedPwTokenBalance,
            1_000e18,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(
            accountIndicatorsAfterStake[0].indicators.lpTokenBalance,
            50_000e18,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(
            accountIndicatorsAfterUnstake[0].indicators.delegatedPwTokenBalance,
            1_000e18,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(
            accountIndicatorsAfterUnstake[0].indicators.lpTokenBalance,
            0,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(rewardsBefore[0].rewardsAmount, 0, "rewards before");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewards before");
        assertEq(rewardsAfterStake[0].rewardsAmount, 100e18, "rewards after stake");
        assertEq(rewardsAfterStake[0].allocatedPwTokens, 4_900e18, "rewards after stake");
        assertEq(rewardsAfterUnstake[0].rewardsAmount, 0, "rewards after unstake");
        assertEq(rewardsAfterUnstake[0].allocatedPwTokens, 5_000e18, "rewards after unstake");
    }

    function testShouldStakeAndUnstake1UsersWhenAssetUnsuportedBeforeUnstake() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address lpDai = _powerTokensSystem.lpDai();
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = lpDai;
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        uint256[] memory lpTokenAmountsToUnstake = new uint256[](1);
        lpTokenAmountsToUnstake[0] = 50_000e18;
        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        vm.stopPrank();

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsBefore = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        // when

        for (uint256 i; i < 50; ++i) {
            vm.prank(_userOne);
            IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
            vm.roll(block.number + 100);
        }

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfterStake = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfterStake = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        vm.prank(owner);
        ILiquidityMiningInternalV2(liquidityMining).phasingOutLpToken(lpDai);

        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(lpTokens, lpTokenAmountsToUnstake);

        // then

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfterUnstake = ILiquidityMiningLens(_router)
                .getAccountIndicators(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[]
            memory rewardsAfterUnstake = ILiquidityMiningLens(_router).calculateAccountRewards(
                _userOne,
                lpTokens
            );

        assertEq(
            accountIndicatorsBefore[0].indicators.delegatedPwTokenBalance,
            1_000e18,
            "delegatedPwTokenBalance before"
        );
        assertEq(
            accountIndicatorsBefore[0].indicators.lpTokenBalance,
            0,
            "delegatedPwTokenBalance before"
        );
        assertEq(
            accountIndicatorsAfterStake[0].indicators.delegatedPwTokenBalance,
            1_000e18,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(
            accountIndicatorsAfterStake[0].indicators.lpTokenBalance,
            50_000e18,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(
            accountIndicatorsAfterUnstake[0].indicators.delegatedPwTokenBalance,
            1_000e18,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(
            accountIndicatorsAfterUnstake[0].indicators.lpTokenBalance,
            0,
            "delegatedPwTokenBalance after stake"
        );
        assertEq(rewardsBefore[0].rewardsAmount, 0, "rewards before");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewards before");
        assertEq(rewardsAfterStake[0].rewardsAmount, 100e18, "rewards after stake");
        assertEq(rewardsAfterStake[0].allocatedPwTokens, 4_900e18, "rewards after stake");
        assertEq(rewardsAfterUnstake[0].rewardsAmount, 0, "rewards after unstake");
        assertEq(rewardsAfterUnstake[0].allocatedPwTokens, 5_000e18, "rewards after unstake");
    }

    function testShouldStakeAndUnstake3Users() external {
        // given
        address lpDai = _powerTokensSystem.lpDai();
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = lpDai;
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        uint256[] memory lpTokenAmountsToUnstake = new uint256[](1);
        lpTokenAmountsToUnstake[0] = 50_000e18;
        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        vm.stopPrank();
        vm.startPrank(_userTwo);
        IStakeService(_router).stakeIporToken(_userTwo, 1_000e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        vm.stopPrank();
        vm.startPrank(_userThree);
        IStakeService(_router).stakeIporToken(_userThree, 1_000e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        vm.stopPrank();

        // when
        for (uint256 i; i < 100; ++i) {
            vm.prank(_userOne);
            IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
            vm.prank(_userTwo);
            IStakeService(_router).stakeLpTokens(_userTwo, lpTokens, lpTokenAmounts);
            vm.prank(_userThree);
            IStakeService(_router).stakeLpTokens(_userThree, lpTokens, lpTokenAmounts);
            vm.roll(block.number + 150);
        }

        // then
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(lpTokens, lpTokenAmountsToUnstake);
        vm.prank(_userTwo);
        IStakeService(_router).unstakeLpTokens(lpTokens, lpTokenAmountsToUnstake);
        vm.prank(_userThree);
        IStakeService(_router).unstakeLpTokens(lpTokens, lpTokenAmountsToUnstake);

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsUserOne = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsUserTwo = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userTwo, lpTokens);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsUserThree = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userThree, lpTokens);

        LiquidityMiningTypes.AccruedRewardsResult[] memory accruedRewards = ILiquidityMiningLens(
            _router
        ).calculateAccruedRewards(lpTokens);

        uint256 sumOfRewards = rewardsUserOne[0].rewardsAmount +
            rewardsUserTwo[0].rewardsAmount +
            rewardsUserThree[0].rewardsAmount +
            rewardsUserOne[0].allocatedPwTokens +
            rewardsUserTwo[0].allocatedPwTokens +
            rewardsUserThree[0].allocatedPwTokens;

        assertEq(
            sumOfRewards,
            accruedRewards[0].rewardsAmount,
            "sumOfRewards should be equal accruedRewards"
        );
    }

    function testShouldUnstakeAllLpTokensCheckIndicators() external {
        // given
        address lpDai = _powerTokensSystem.lpDai();
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = lpDai;
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 100e18;
        uint256[] memory lpTokenAmountsToUnstake = new uint256[](1);
        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        vm.stopPrank();
        vm.roll(block.number + 100);

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsBefore = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_router).getGlobalIndicators(
                lpTokens
            );

        // when
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(lpTokens, lpTokenAmounts);

        // then
        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfter = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_router).getGlobalIndicators(
                lpTokens
            );

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsUserOne = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        assertEq(
            globalIndicatorsBefore[0].indicators.aggregatedPowerUp,
            272192809488736234700,
            "aggregatedPowerUp before"
        );
        assertEq(
            globalIndicatorsBefore[0].indicators.compositeMultiplierInTheBlock,
            3673866337168548782569648,
            "compositeMultiplierInTheBlock before"
        );
        assertEq(
            globalIndicatorsAfter[0].indicators.aggregatedPowerUp,
            0,
            "aggregatedPowerUp after"
        );
        assertEq(
            globalIndicatorsAfter[0].indicators.compositeMultiplierInTheBlock,
            0,
            "compositeMultiplierInTheBlock after"
        );

        assertEq(
            accountIndicatorsBefore[0].indicators.powerUp,
            2721928094887362347,
            "aggregatedPowerUp before"
        );
        assertEq(accountIndicatorsAfter[0].indicators.powerUp, 0, "aggregatedPowerUp after");
        assertEq(
            accountIndicatorsBefore[0].indicators.compositeMultiplierCumulativePrevBlock,
            0,
            "compositeMultiplierCumulativePrevBlock before"
        );
        assertEq(
            accountIndicatorsAfter[0].indicators.compositeMultiplierCumulativePrevBlock,
            367386633716854878256964800,
            "compositeMultiplierCumulativePrevBlock after"
        );
        assertEq(rewardsUserOne[0].rewardsAmount, 0, "rewardsAmount");
        assertEq(rewardsUserOne[0].allocatedPwTokens, 100e18, "allocatedPwTokens");
    }

    function testShouldNotAddRewardsWhenNoLpTokenWasStake() external {
        // given
        address[] memory tokens = new address[](1);
        tokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory amountsLpTokens = new uint256[](1);
        amountsLpTokens[0] = 1_000e18;
        uint256[] memory amountsPwTokens = new uint256[](1);
        amountsPwTokens[0] = 400e18;

        vm.startPrank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, tokens, amountsLpTokens);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        vm.stopPrank();

        vm.roll(block.number + 100);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, tokens);

        // when
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(tokens, amountsLpTokens);

        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfter = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, tokens);

        assertEq(rewardsBefore[0].rewardsAmount, 100e18, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");

        assertEq(rewardsAfter[0].rewardsAmount, 0, "rewardsAfter - rewardsAmount");
        assertEq(rewardsAfter[0].allocatedPwTokens, 100e18, "rewardsAfter - allocatedPwTokens");
    }

    function testShouldCountProperRewardsWhenOneAccountDelegatePwTokenTokensTwice() external {
        // given
        address[] memory tokens = new address[](1);
        tokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory amountsLpTokens = new uint256[](1);
        amountsLpTokens[0] = 1_000e18;
        uint256[] memory amountsPwTokens = new uint256[](1);
        amountsPwTokens[0] = 400e18;

        vm.startPrank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, tokens, amountsLpTokens);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(tokens, amountsPwTokens);
        vm.stopPrank();

        vm.roll(block.number + 100);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, tokens);

        // when

        vm.prank(_userOne);
        IFlowsService(_router).delegate(tokens, amountsPwTokens);
        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfter = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, tokens);

        assertEq(rewardsBefore[0].rewardsAmount, 100e18, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");

        assertEq(rewardsAfter[0].rewardsAmount, 100e18, "rewardsAfter - rewardsAmount");
        assertEq(rewardsAfter[0].allocatedPwTokens, 100e18, "rewardsAfter - allocatedPwTokens");
    }
}
