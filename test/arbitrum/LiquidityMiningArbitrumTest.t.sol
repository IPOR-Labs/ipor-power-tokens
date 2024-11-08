// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "../../contracts/mocks/tokens/MockLpToken.sol";
import "../../contracts/mining/arbitrum/LiquidityMiningArbitrum.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../contracts/interfaces/types/LiquidityMiningTypes.sol";

contract LiquidityMiningArbitrumTest is Test {
    address public constant wstEth = 0x5979D7b546E38E414F7E9822514be443A4800529;
    address public constant usdc = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address public constant ipor = 0x34229B3f16fBCDfA8d8d9d17C0852F9496f4C7BB;
    address public constant ethUsdOracle = 0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612;
    address public constant wstEthStEthOracle = 0xB1552C5e96B312d0Bf8b554186F846C40614a540;

    address public lpWstEth;
    address public lpUsdc;
    LiquidityMiningArbitrum public liquidityMining;

    function setUp() public {
        vm.createSelectFork(vm.envString("ARBITRUM_PROVIDER_URL"), 18983640);
        lpWstEth = address(new MockLpToken("lpWstEth", "lpWstEth", wstEth));
        lpUsdc = address(new MockLpToken("lpUsdc", "lpUsdc", wstEth));
        MockLpToken(lpWstEth).setJoseph(address(this));
        MockLpToken(lpUsdc).setJoseph(address(this));
        LiquidityMiningArbitrum liquidityMiningImpl = new LiquidityMiningArbitrum(
            address(this),
            ethUsdOracle,
            wstEthStEthOracle,
            lpWstEth
        );

        address[] memory lpTokewns = new address[](2);
        lpTokewns[0] = lpWstEth;
        lpTokewns[1] = lpUsdc;

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(liquidityMiningImpl),
            abi.encodeWithSignature("initialize(address[])", lpTokewns)
        );

        liquidityMining = LiquidityMiningArbitrum(address(proxy));
    }

    function testOracles() external {
        // given
        // answerEthUsd 264703534116
        // answerWstEthStEth 1153222004578747471
        // block 18983640
        //
        MockLpToken(lpWstEth).mint(address(this), 100e18);
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdateLpToken[](1);

        updateLpToken[0] = LiquidityMiningTypes.UpdateLpToken(address(this), lpWstEth, 10e18);
        address[] memory lpTokewns = new address[](1);
        lpTokewns[0] = lpWstEth;

        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](1);
        updatePwTokens[0] = LiquidityMiningTypes.UpdatePwToken(address(this), lpWstEth, 100e18);

        liquidityMining.addPwTokensInternal(updatePwTokens);

        // when
        liquidityMining.addLpTokensInternal(updateLpToken);

        // then
        LiquidityMiningTypes.AccountIndicatorsResult[] memory indicatorsList = liquidityMining
            .getAccountIndicators(address(this), lpTokewns);
        LiquidityMiningTypes.AccountRewardsIndicators memory indicators = indicatorsList[0]
            .indicators;

        assertEq(
            indicators.compositeMultiplierCumulativePrevBlock,
            0,
            "compositeMultiplierCumulativePrevBlock should be 0"
        );
        assertEq(indicators.lpTokenBalance, 10e18, "lpTokenBalance should be 10e18");
        assertEq(indicators.powerUp, 227236277435590833, "powerUp should be 227236277435590833");
        assertEq(
            indicators.delegatedPwTokenBalance,
            100e18,
            "delegatedPwTokenBalance should be 100e18"
        );
    }

    function testShouldCalculateDifferentValueForWstEthAndUsdc() external {
        //        wstEth
        MockLpToken(lpWstEth).mint(address(this), 100e18);
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdateLpToken[](1);

        updateLpToken[0] = LiquidityMiningTypes.UpdateLpToken(address(this), lpWstEth, 10e18);
        address[] memory lpTokewns = new address[](1);

        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](1);
        updatePwTokens[0] = LiquidityMiningTypes.UpdatePwToken(address(this), lpWstEth, 100e18);

        liquidityMining.addPwTokensInternal(updatePwTokens);
        liquidityMining.addLpTokensInternal(updateLpToken);

        //        usdc
        MockLpToken(lpUsdc).mint(address(this), 100e18);
        updateLpToken[0] = LiquidityMiningTypes.UpdateLpToken(address(this), lpUsdc, 10e18);
        updatePwTokens[0] = LiquidityMiningTypes.UpdatePwToken(address(this), lpUsdc, 100e18);

        liquidityMining.addPwTokensInternal(updatePwTokens);
        liquidityMining.addLpTokensInternal(updateLpToken);

        lpTokewns[0] = lpWstEth;
        LiquidityMiningTypes.AccountIndicatorsResult[] memory indicatorsListWstEth = liquidityMining
            .getAccountIndicators(address(this), lpTokewns);

        lpTokewns[0] = lpUsdc;
        LiquidityMiningTypes.AccountIndicatorsResult[] memory indicatorsListUsdc = liquidityMining
            .getAccountIndicators(address(this), lpTokewns);

        assertEq(
            indicatorsListWstEth[0].indicators.powerUp,
            227236277435590833,
            "powerUp should be 227236277435590833"
        );
        assertEq(
            indicatorsListUsdc[0].indicators.powerUp,
            5535159583281635767,
            "powerUp should be 5535159583281635767"
        );
    }
}
