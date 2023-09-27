// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "./TestEthMarketCommons.sol";
import "../../contracts/interfaces/types/LiquidityMiningTypes.sol";
import "../../contracts/interfaces/ILiquidityMiningLens.sol";

contract ProvideStEthTest is TestEthMarketCommons {
    using SafeCast for int256;

    function setUp() public {
        vm.createSelectFork(vm.envString("PROVIDER_URL"), 17810000);
        _init();
    }

    function testShouldReturnProperRewardsPerBlock() external {
        //given
        address[] memory pools = new address[](1);
        pools[0] = lpStEth;

        //when
        LiquidityMiningTypes.GlobalIndicatorsResult[] memory global = ILiquidityMiningLens(router)
            .getGlobalIndicatorsFromLiquidityMining(pools);

        //then
        assertEq(global[0].indicators.rewardsPerBlock, 35e6, "rewards per block should be 35e6");
    }

    function testShouldBeAbleToStakeLpStEth() external {
        //given
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 100e18;
        address[] memory pools = new address[](1);
        pools[0] = lpStEth;

        //when
        vm.prank(userOne);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(userOne, pools, amounts);

        //then
        LiquidityMiningTypes.AccountIndicatorsResult[] memory account = ILiquidityMiningLens(router)
            .getAccountIndicatorsFromLiquidityMining(userOne, pools);

        assertEq(account[0].indicators.compositeMultiplierCumulativePrevBlock, 0, "compositeMultiplierCumulativePrevBlock should be 0");
        assertEq(account[0].indicators.lpTokenBalance, 100e18, "lpTokenBalance should be 100e18");
        assertEq(account[0].indicators.powerUp, 2e17, "powerUp should be 2e17");
        assertEq(account[0].indicators.delegatedPwTokenBalance, 0, "delegatedPwTokenBalance should be 0");
    }

    function testShouldProperVaaluesWhenStake1lpTokenAndDelegatePriceOfEth() external {
        //given
        uint256[] memory lpAmounts = new uint256[](1);
        lpAmounts[0] = 1e18;
        address[] memory pools = new address[](1);
        pools[0] = lpStEth;
        uint256[] memory delegateAmounts = new uint256[](1);
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = AggregatorV3Interface(ethUsdOracle).latestRoundData();

        uint priceEth = answer.toUint256();
        delegateAmounts[0] = priceEth*1e10;
        console2.log("answer", answer.toUint256());


        //when
        vm.startPrank(userOne);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(userOne, pools, lpAmounts);
        IPowerTokenStakeService(router).stakeGovernanceTokenToPowerToken(userOne, delegateAmounts[0]);
        IPowerTokenFlowsService(router).delegatePwTokensToLiquidityMining(pools, delegateAmounts);
        vm.stopPrank();

        //then
        LiquidityMiningTypes.AccountIndicatorsResult[] memory account = ILiquidityMiningLens(router)
            .getAccountIndicatorsFromLiquidityMining(userOne, pools);

        assertEq(account[0].indicators.compositeMultiplierCumulativePrevBlock, 0, "compositeMultiplierCumulativePrevBlock should be 0");
        assertEq(account[0].indicators.lpTokenBalance, 1e18, "lpTokenBalance should be 1e18");
        assertEq(account[0].indicators.powerUp, 2721928094887362347, "powerUp should be 2e17");
        assertEq(account[0].indicators.delegatedPwTokenBalance, 187092255777e10, "delegatedPwTokenBalance should be 187092255777e10");
    }
}