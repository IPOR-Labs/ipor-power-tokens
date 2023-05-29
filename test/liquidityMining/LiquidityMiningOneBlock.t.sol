// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/ILiquidityMiningLens.sol";
import "../../contracts/interfaces/ILiquidityMiningInternal.sol";
import "../../contracts/interfaces/IStakeService.sol";
import "../../contracts/interfaces/IFlowsService.sol";
import "../../contracts/tokens/PowerTokenInternal.sol";

contract LiquidityMiningOneBlockTest is TestCommons {
    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;
    address _userTwo;
    address _userThree;
    address _miningAddress;
    address _lpDai;
    address _lpUsdc;
    address _lpUsdt;
    address _owner;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _userTwo = _getUserAddress(2);
        _userThree = _getUserAddress(3);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.makeAllApprovals(_userTwo);
        _powerTokensSystem.makeAllApprovals(_userThree);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
        _powerTokensSystem.transferIporToken(_userTwo, 10_000e18);
        _powerTokensSystem.transferIporToken(_userThree, 10_000e18);
        _miningAddress = _powerTokensSystem.liquidityMining();
        _lpDai = _powerTokensSystem.lpDai();
        _lpUsdc = _powerTokensSystem.lpUsdc();
        _lpUsdt = _powerTokensSystem.lpUsdt();
        address iporToken = _powerTokensSystem.iporToken();
        _owner = _powerTokensSystem.owner();

        vm.prank(_powerTokensSystem.dao());
        ERC20(iporToken).transfer(_miningAddress, 10_000e18);

        _powerTokensSystem.mintLpTokens(_lpDai, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(_lpDai, _userTwo, 10_000e18);
        _powerTokensSystem.mintLpTokens(_lpDai, _userThree, 10_000e18);
        _powerTokensSystem.mintLpTokens(_lpUsdc, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(_lpUsdc, _userTwo, 10_000e18);
    }

    function testShouldHasTheSameAccountParamsWhen2UserStakeLpTokensInOneBlock() external {
        // given
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        vm.prank(_owner);
        ILiquidityMiningInternal(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        // when
        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userTwo);
        IStakeService(_router).stakeLpTokens(_userTwo, lpTokens, lpTokenAmounts);

        // then
        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory userOneIndicators = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );
        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory userTwoIndicators = ILiquidityMiningLens(_router).getAccountIndicators(
                _userTwo,
                lpTokens
            );

        assertEq(
            userOneIndicators[0].indicators.compositeMultiplierCumulativePrevBlock,
            userTwoIndicators[0].indicators.compositeMultiplierCumulativePrevBlock,
            "compositeMultiplierCumulativePrevBlock should be the same"
        );

        assertEq(
            userOneIndicators[0].indicators.lpTokenBalance,
            userTwoIndicators[0].indicators.lpTokenBalance,
            "lpTokenBalance should be the same"
        );

        assertEq(
            userOneIndicators[0].indicators.powerUp,
            userTwoIndicators[0].indicators.powerUp,
            "powerUp should be the same"
        );

        assertEq(
            userOneIndicators[0].indicators.delegatedPwTokenBalance,
            userTwoIndicators[0].indicators.delegatedPwTokenBalance,
            "delegatedPwTokenBalance should be the same"
        );
    }

    function testShouldHasTheSameRewardsWhen2UserUnstakeLpTokensInOneBlock() external {
        // given
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        vm.prank(_owner);
        ILiquidityMiningInternal(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userTwo);
        IStakeService(_router).stakeLpTokens(_userTwo, lpTokens, lpTokenAmounts);

        vm.roll(block.number + 100);

        // when
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userTwo);
        IStakeService(_router).unstakeLpTokens(_userTwo, lpTokens, lpTokenAmounts);

        // then

        LiquidityMiningTypes.AccountRewardResult[] memory userOneRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);
        LiquidityMiningTypes.AccountRewardResult[] memory userTwoRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userTwo, lpTokens);

        assertEq(
            userOneRewards[0].lpToken,
            userTwoRewards[0].lpToken,
            "lpToken should be the same"
        );
        assertEq(
            userOneRewards[0].rewardsAmount,
            userTwoRewards[0].rewardsAmount,
            "rewardsAmount should be the same"
        );
        assertEq(
            userOneRewards[0].allocatedPwTokens,
            userTwoRewards[0].allocatedPwTokens,
            "reward should be the same"
        );
    }

    function testShouldNotGetAnyRewardsIfStakeAndUnstakeInOneBlock() external {
        // given
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        vm.prank(_owner);
        ILiquidityMiningInternal(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        // when
        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(_userOne, lpTokens, lpTokenAmounts);

        vm.roll(block.number + 100);

        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(_userOne, lpTokens, lpTokenAmounts);

        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory userOneRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        assertEq(userOneRewards[0].rewardsAmount, 0, "rewardsAmount should be 0");
        assertEq(userOneRewards[0].allocatedPwTokens, 0, "allocatedPwTokens should be 0");
    }

    function testShouldTransferAllRewardsToOneUserWhen2UsersConcurrentlyStakeOneWithdraws()
        external
    {
        // given
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 1_000e18;
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        vm.prank(_owner);
        ILiquidityMiningInternal(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        // when
        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userTwo);
        IStakeService(_router).stakeLpTokens(_userTwo, lpTokens, lpTokenAmounts);

        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory userOneRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[] memory userTwoRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userTwo, lpTokens);

        assertEq(userOneRewards[0].rewardsAmount, 0, "rewardsAmount should be 0");
        assertEq(userOneRewards[0].allocatedPwTokens, 0, "allocatedPwTokens should be 0");
        assertEq(userTwoRewards[0].rewardsAmount, 100e18, "rewardsAmount should be 100e18");
        assertEq(userTwoRewards[0].allocatedPwTokens, 0, "allocatedPwTokens should be 0");
    }

    function testShouldNotDependsOnOrderOfUnstake() external {
        // given
        uint256[] memory lpTokenAmounts = new uint256[](2);
        lpTokenAmounts[0] = 1_000e18;
        lpTokenAmounts[1] = 1_000e18;
        address[] memory lpTokens = new address[](2);
        lpTokens[0] = _lpDai;
        lpTokens[1] = _lpUsdc;

        address[] memory lpDai = new address[](1);
        lpDai[0] = _lpDai;

        address[] memory lpUsdc = new address[](1);
        lpUsdc[0] = _lpUsdc;

        uint256[] memory lpAmount = new uint256[](1);
        lpAmount[0] = 1_000e18;

        vm.startPrank(_owner);
        ILiquidityMiningInternal(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);
        ILiquidityMiningInternal(_miningAddress).setRewardsPerBlock(_lpUsdc, 1e8);
        vm.stopPrank();

        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.prank(_userTwo);
        IStakeService(_router).stakeLpTokens(_userTwo, lpTokens, lpTokenAmounts);

        vm.roll(block.number + 100);

        // when
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(_userOne, lpDai, lpAmount);
        vm.prank(_userTwo);
        IStakeService(_router).unstakeLpTokens(_userTwo, lpDai, lpAmount);

        vm.prank(_userTwo);
        IStakeService(_router).unstakeLpTokens(_userTwo, lpUsdc, lpAmount);
        vm.prank(_userOne);
        IStakeService(_router).unstakeLpTokens(_userOne, lpUsdc, lpAmount);

        vm.roll(block.number + 100);

        // then

        LiquidityMiningTypes.AccountRewardResult[] memory userOneRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[] memory userTwoRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userTwo, lpTokens);

        assertEq(
            userOneRewards[0].rewardsAmount,
            userTwoRewards[1].rewardsAmount,
            "rewardsAmount from lpDai for userOne and lpUsdc for userTwo should be the same"
        );
        assertEq(
            userOneRewards[0].allocatedPwTokens,
            userTwoRewards[1].allocatedPwTokens,
            "allocatedPwTokens from lpDai for userOne and lpUsdc for userTwo should be the same"
        );
    }

    function testShouldCalculateProperRewardsBasedOnExcelFromDocumentation() external {
        uint256[] memory lpTokenAmounts = new uint256[](1);
        lpTokenAmounts[0] = 100e18;
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;
        vm.prank(_owner);
        ILiquidityMiningInternal(_miningAddress).setRewardsPerBlock(_lpDai, 3e8);
        vm.roll(block.number + 1);

        vm.startPrank(_userOne);
        IStakeService(_router).stakeProtocolToken(_userOne, 100e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, lpTokenAmounts);
        vm.stopPrank();

        vm.roll(block.number + 2);

        vm.startPrank(_userTwo);
        IStakeService(_router).stakeProtocolToken(_userTwo, 100e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        IStakeService(_router).stakeLpTokens(_userTwo, lpTokens, lpTokenAmounts);
        vm.stopPrank();

        vm.roll(block.number + 2);

        vm.startPrank(_userThree);
        IStakeService(_router).stakeProtocolToken(_userThree, 100e18);
        IFlowsService(_router).delegate(lpTokens, lpTokenAmounts);
        lpTokenAmounts[0] = 300e18;
        IStakeService(_router).stakeLpTokens(_userThree, lpTokens, lpTokenAmounts);
        vm.stopPrank();
        vm.roll(block.number + 1);

        LiquidityMiningTypes.AccruedRewardsResult[] memory accruedRewards = ILiquidityMiningLens(
            _router
        ).calculateAccruedRewards(lpTokens);
        LiquidityMiningTypes.AccountRewardResult[] memory userOneRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[] memory userTwoRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userTwo, lpTokens);

        LiquidityMiningTypes.AccountRewardResult[] memory userThreeRewards = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userThree, lpTokens);

        uint256 totalRewards = userOneRewards[0].rewardsAmount +
            userTwoRewards[0].rewardsAmount +
            userThreeRewards[0].rewardsAmount;

        assertEq(accruedRewards[0].rewardsAmount, 15e18, "rewardsAmount should be 15");
        assertEq(totalRewards, 15e18, "totalRewards should be 15");
    }
}
