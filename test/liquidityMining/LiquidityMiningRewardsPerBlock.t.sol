// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/ILiquidityMiningLens.sol";
import "../../contracts/interfaces/ILiquidityMiningInternalV2.sol";
import "../../contracts/interfaces/IStakeService.sol";
import "../../contracts/tokens/PowerTokenInternalV2.sol";

contract LiquidityMiningRewardsPerBlockTest is TestCommons {
    event RewardsPerBlockChanged(
        address indexed changedBy,
        address lpToken,
        uint256 oldPwTokenAmount,
        uint256 newPwTokenAmount
    );

    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;
    address _miningAddress;
    address _lpDai;
    address _lpUsdc;
    address _lpUsdt;
    address _owner;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
        _miningAddress = _powerTokensSystem.liquidityMining();
        _lpDai = _powerTokensSystem.lpDai();
        _lpUsdc = _powerTokensSystem.lpUsdc();
        _lpUsdt = _powerTokensSystem.lpUsdt();
        address iporToken = _powerTokensSystem.iporToken();
        _owner = _powerTokensSystem.owner();

        vm.prank(_powerTokensSystem.dao());
        ERC20(iporToken).transfer(_miningAddress, 10_000e18);

        _powerTokensSystem.mintLpTokens(_lpDai, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(_lpUsdc, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(_lpUsdt, _userOne, 10_000e18);
    }

    function testShouldSetUpBlockRewardsForLpToken() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_miningAddress)
                .getGlobalIndicators(lpTokens);

        // when
        vm.prank(_owner);
        vm.expectEmit(true, true, true, true);
        emit RewardsPerBlockChanged(_owner, _lpDai, 0, 2e8);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 2e8);

        // then
        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_miningAddress).getGlobalIndicators(
                lpTokens
            );

        assertEq(globalIndicatorsBefore[0].indicators.rewardsPerBlock, 0);
        assertEq(globalIndicatorsAfter[0].indicators.rewardsPerBlock, 2e8);
    }

    function testShouldNotUpdateAccruedRewardsWhenUpdateBlockRewords() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_miningAddress)
                .getGlobalIndicators(lpTokens);

        // when
        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 2e8);

        // then
        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_miningAddress).getGlobalIndicators(
                lpTokens
            );

        assertEq(globalIndicatorsBefore[0].indicators.accruedRewards, 0);
        assertEq(globalIndicatorsAfter[0].indicators.accruedRewards, 0);
    }

    function testShouldSetupBlockRewardsFor3LpTokens() external {
        // given
        address[] memory lpTokens = new address[](3);
        lpTokens[0] = _lpDai;
        lpTokens[1] = _lpUsdc;
        lpTokens[2] = _lpUsdt;

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_miningAddress)
                .getGlobalIndicators(lpTokens);

        // when
        vm.startPrank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpUsdc, 2e8);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpUsdt, 1e7);
        vm.stopPrank();

        // then

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_miningAddress).getGlobalIndicators(
                lpTokens
            );

        assertEq(globalIndicatorsBefore[0].indicators.rewardsPerBlock, 0);
        assertEq(globalIndicatorsAfter[0].indicators.rewardsPerBlock, 1e8);
        assertEq(globalIndicatorsBefore[1].indicators.rewardsPerBlock, 0);
        assertEq(globalIndicatorsAfter[1].indicators.rewardsPerBlock, 2e8);
        assertEq(globalIndicatorsBefore[2].indicators.rewardsPerBlock, 0);
        assertEq(globalIndicatorsAfter[2].indicators.rewardsPerBlock, 1e7);
    }

    function testShouldNotBeAbleToUpdateValueWhenNotOwner() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_miningAddress)
                .getGlobalIndicators(lpTokens);

        // when
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 2e8);

        // then

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_miningAddress).getGlobalIndicators(
                lpTokens
            );

        assertEq(globalIndicatorsBefore[0].indicators.rewardsPerBlock, 0);
        assertEq(globalIndicatorsAfter[0].indicators.rewardsPerBlock, 0);
    }

    function testShouldStopAddingNewRewardsWhenRewardsPerBlockSetupToZero() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1_000e18;

        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, amounts);

        vm.roll(block.number + 100);

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _miningAddress
        ).calculateAccountRewards(_userOne, lpTokens);

        // when
        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 0);

        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfter = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        assertEq(rewardsBefore[0].rewardsAmount, 100e18);
        assertEq(rewardsAfter[0].rewardsAmount, 100e18);
    }

    function testShouldRestartGrantRewardsWhenRewardsPerBlockSetupFromZeroToOne() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1_000e18;

        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, amounts);

        vm.roll(block.number + 100);

        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _miningAddress
        ).calculateAccountRewards(_userOne, lpTokens);

        // when
        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfter = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        assertEq(rewardsBefore[0].rewardsAmount, 100e18);
        assertEq(rewardsAfter[0].rewardsAmount, 200e18);
    }

    function testShouldRecalculateGlobalParamsWhenBlockRewardsChanged() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1_000e18;

        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        vm.prank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, amounts);

        vm.roll(block.number + 100);

        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsBefore = ILiquidityMiningLens(_miningAddress)
                .getGlobalIndicators(lpTokens);

        // when
        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 2e8);

        // then
        LiquidityMiningTypes.GlobalIndicatorsResult[]
            memory globalIndicatorsAfter = ILiquidityMiningLens(_miningAddress).getGlobalIndicators(
                lpTokens
            );

        // then
        assertEq(globalIndicatorsAfter[0].indicators.aggregatedPowerUp, 200e18);
        assertEq(globalIndicatorsAfter[0].indicators.compositeMultiplierInTheBlock, 10_000_000e18);
        assertEq(
            globalIndicatorsAfter[0].indicators.compositeMultiplierCumulativePrevBlock,
            500_000_000e18
        );
        assertEq(globalIndicatorsAfter[0].indicators.blockNumber, 101);
        assertEq(globalIndicatorsAfter[0].indicators.rewardsPerBlock, 2e8);
        assertEq(globalIndicatorsAfter[0].indicators.accruedRewards, 100e18);

        assertEq(globalIndicatorsBefore[0].indicators.aggregatedPowerUp, 200e18);
        assertEq(globalIndicatorsBefore[0].indicators.compositeMultiplierInTheBlock, 5_000_000e18);
        assertEq(globalIndicatorsBefore[0].indicators.compositeMultiplierCumulativePrevBlock, 0);
        assertEq(globalIndicatorsBefore[0].indicators.blockNumber, 1);
        assertEq(globalIndicatorsBefore[0].indicators.rewardsPerBlock, 1e8);
        assertEq(globalIndicatorsBefore[0].indicators.accruedRewards, 0);
    }

    function testShouldNotBeAbleToSetNewBlockRewardWhenAssetNotActive() external {
        // given
        address dai = _powerTokensSystem.dai();
        //when
        vm.prank(_owner);
        vm.expectRevert(bytes(Errors.LP_TOKEN_NOT_SUPPORTED));
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(dai, 1e8);
    }

    function testShouldProperCalculateRewardWhenBlockRewardsDecrease() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1_000e18;

        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 2e8);

        vm.startPrank(_userOne);
        IStakeService(_router).stakeProtocolToken(_userOne, 2_000e18);
        IFlowsService(_router).delegate(lpTokens, amounts);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, amounts);
        vm.stopPrank();
        vm.roll(block.number + 100);

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        // when
        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfter = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        assertEq(rewardsBefore[0].rewardsAmount, 200e18);
        assertEq(rewardsAfter[0].rewardsAmount, 300e18);
    }

    function testShouldProperCalculateRewardWhenBlockRewardsIncrease() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _lpDai;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1_000e18;

        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 1e8);

        vm.startPrank(_userOne);
        IStakeService(_router).stakeProtocolToken(_userOne, 2_000e18);
        IFlowsService(_router).delegate(lpTokens, amounts);
        IStakeService(_router).stakeLpTokens(_userOne, lpTokens, amounts);
        vm.stopPrank();
        vm.roll(block.number + 100);

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        // when
        vm.prank(_owner);
        ILiquidityMiningInternalV2(_miningAddress).setRewardsPerBlock(_lpDai, 2e8);

        vm.roll(block.number + 100);

        // then
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfter = ILiquidityMiningLens(
            _router
        ).calculateAccountRewards(_userOne, lpTokens);

        assertEq(rewardsBefore[0].rewardsAmount, 100e18);
        assertEq(rewardsAfter[0].rewardsAmount, 300e18);
    }
}
