// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../../contracts/mocks/tokens/MockLpToken.sol";
import "../../contracts/mining/LiquidityMiningArbitrum.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../contracts/interfaces/types/LiquidityMiningTypes.sol";

contract LiquidityMiningArbitrumTest is Test {
    address public constant wstEth = 0x5979D7b546E38E414F7E9822514be443A4800529;
    address public constant ipor = 0x34229B3f16fBCDfA8d8d9d17C0852F9496f4C7BB;
    address public constant ethUsdOracle = 0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612;
    address public constant wstEthStEthOracle = 0xB1552C5e96B312d0Bf8b554186F846C40614a540;

    address public lpWstEth;
    LiquidityMiningArbitrum public liquidityMining;

    function setUp() public {
        vm.createSelectFork(vm.envString("ARBITRUM_PROVIDER_URL"), 18983640);
        lpWstEth = address(new MockLpToken("lpWstEth", "lpWstEth", wstEth));
        MockLpToken(lpWstEth).setJoseph(address(this));
        LiquidityMiningArbitrum liquidityMiningImpl = new LiquidityMiningArbitrum(
            address(this),
            ethUsdOracle,
            wstEthStEthOracle
        );

        address[] memory lpTokewns = new address[](1);
        lpTokewns[0] = lpWstEth;

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(liquidityMiningImpl),
            abi.encodeWithSignature("initialize(address[])", lpTokewns)
        );

        liquidityMining = LiquidityMiningArbitrum(address(proxy));
    }

    function testT() external {
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
        assertEq(indicators.powerUp, 254472554871181666, "powerUp should be 254472554871181666");
        assertEq(
            indicators.delegatedPwTokenBalance,
            100e18,
            "delegatedPwTokenBalance should be 100e18"
        );
    }
}
