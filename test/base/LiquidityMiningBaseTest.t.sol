// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "../../contracts/mocks/tokens/MockLpToken.sol";
import "../../contracts/mining/base/LiquidityMiningBase.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../../contracts/interfaces/types/LiquidityMiningTypes.sol";

contract LiquidityMiningBaseTest is Test {
    address public constant WST_ETH = 0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452;
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant ETH_USD_ORACLE = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
    address public constant WST_ETH_ETH_ORACLE = 0x43a5C292A453A3bF3606fa856197f09D7B74251a;

    address public lpWstEth;
    address public lpUsdc;
    LiquidityMiningBase public liquidityMining;

    function setUp() public {
        vm.createSelectFork(vm.envString("BASE_PROVIDER_URL"), 22044599);
        lpWstEth = address(new MockLpToken("lpWstEth", "lpWstEth", WST_ETH));
        lpUsdc = address(new MockLpToken("lpUsdc", "lpUsdc", WST_ETH));
        MockLpToken(lpWstEth).setJoseph(address(this));
        MockLpToken(lpUsdc).setJoseph(address(this));
        LiquidityMiningBase liquidityMiningImpl = new LiquidityMiningBase(
            address(this),
            ETH_USD_ORACLE,
            WST_ETH_ETH_ORACLE,
            lpWstEth
        );

        address[] memory lpTokens = new address[](2);
        lpTokens[0] = lpWstEth;
        lpTokens[1] = lpUsdc;

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(liquidityMiningImpl),
            abi.encodeWithSignature("initialize(address[])", lpTokens)
        );

        liquidityMining = LiquidityMiningBase(address(proxy));
    }

    function testOracles() external {
        MockLpToken(lpWstEth).mint(address(this), 100e18);
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdateLpToken[](1);

        updateLpToken[0] = LiquidityMiningTypes.UpdateLpToken(address(this), lpWstEth, 10e18);
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = lpWstEth;

        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](1);
        updatePwTokens[0] = LiquidityMiningTypes.UpdatePwToken(address(this), lpWstEth, 100e18);

        liquidityMining.addPwTokensInternal(updatePwTokens);

        // when
        liquidityMining.addLpTokensInternal(updateLpToken);

        // then
        LiquidityMiningTypes.AccountIndicatorsResult[] memory indicatorsList = liquidityMining
            .getAccountIndicators(address(this), lpTokens);
        LiquidityMiningTypes.AccountRewardsIndicators memory indicators = indicatorsList[0]
            .indicators;

        assertEq(
            indicators.compositeMultiplierCumulativePrevBlock,
            0,
            "compositeMultiplierCumulativePrevBlock should be 0"
        );
        assertEq(indicators.lpTokenBalance, 10e18, "lpTokenBalance should be 10e18");
        assertEq(indicators.powerUp, 216028252059456695, "powerUp should be 216028252059456695");
        assertEq(
            indicators.delegatedPwTokenBalance,
            100e18,
            "delegatedPwTokenBalance should be 100e18"
        );
    }

    function testShouldCalculateDifferentValueForWstEthAndUsdc() external {
        // wstEth
        MockLpToken(lpWstEth).mint(address(this), 100e18);
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdateLpToken[](1);

        updateLpToken[0] = LiquidityMiningTypes.UpdateLpToken(address(this), lpWstEth, 10e18);
        address[] memory lpTokens = new address[](1);

        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](1);
        updatePwTokens[0] = LiquidityMiningTypes.UpdatePwToken(address(this), lpWstEth, 100e18);

        liquidityMining.addPwTokensInternal(updatePwTokens);
        liquidityMining.addLpTokensInternal(updateLpToken);

        // usdc
        MockLpToken(lpUsdc).mint(address(this), 100e18);
        updateLpToken[0] = LiquidityMiningTypes.UpdateLpToken(address(this), lpUsdc, 10e18);
        updatePwTokens[0] = LiquidityMiningTypes.UpdatePwToken(address(this), lpUsdc, 100e18);

        liquidityMining.addPwTokensInternal(updatePwTokens);
        liquidityMining.addLpTokensInternal(updateLpToken);

        lpTokens[0] = lpWstEth;
        LiquidityMiningTypes.AccountIndicatorsResult[] memory indicatorsListWstEth = liquidityMining
            .getAccountIndicators(address(this), lpTokens);

        lpTokens[0] = lpUsdc;
        LiquidityMiningTypes.AccountIndicatorsResult[] memory indicatorsListUsdc = liquidityMining
            .getAccountIndicators(address(this), lpTokens);

        assertEq(
            indicatorsListWstEth[0].indicators.powerUp,
            216028252059456695,
            "powerUp should be 216028252059456695"
        );
        assertEq(
            indicatorsListUsdc[0].indicators.powerUp,
            5535159583281635767,
            "powerUp should be 5535159583281635767"
        );
    }
}
