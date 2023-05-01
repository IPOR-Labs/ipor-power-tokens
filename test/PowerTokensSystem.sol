// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/mocks/tokens/MockStakedToken.sol";
import "../contracts/mocks/tokens/MockToken.sol";
import "../contracts/mocks/tokens/MockLpToken.sol";
import "./TestCommons.sol";
import "../contracts/mining/LiquidityMiningV2.sol";
import "../contracts/tokens/PowerToken.sol";
import "../contracts/lens/LiquidityMiningLens.sol";
import "../contracts/services/StakeService.sol";
import "../contracts/services/MiningService.sol";
import "../contracts/router/PowerTokenRouter.sol";

contract PowerTokensSystem is TestCommons {
    address public dao;
    address public owner;
    address public iporToken;

    address public dai;
    address public usdc;
    address public usdt;

    address public lpDai;
    address public lpUsdc;
    address public lpUsdt;

    address public powerToken;
    address public liquidityMining;
    address public router;

    address public liquidityMiningLens;
    address public stakeService;
    address public miningService;

    constructor() {
        owner = vm.rememberKey(1);
        dao = vm.rememberKey(2);
        _createTokens();
        _createPowerToken();
        _createLiquidityMining();
        _createServices();
        _createRouter();
        _updateLiquidityMiningImplementation();
    }

    function mintStable(
        address stable,
        address onBehalfOf,
        uint256 amount
    ) external {
        vm.prank(owner);
        MockToken(stable).mint(onBehalfOf, amount);
    }

    function mintLpTokens(
        address lpToken,
        address onBehalfOf,
        uint256 amount
    ) external {
        vm.startPrank(owner);
        MockLpToken(lpToken).mint(onBehalfOf, amount);
        vm.stopPrank();
    }

    function approveRouter(address account) external {
        vm.startPrank(account);
        MockLpToken(lpDai).approve(router, type(uint256).max);
        MockLpToken(lpUsdc).approve(router, type(uint256).max);
        MockLpToken(lpUsdt).approve(router, type(uint256).max);
        vm.stopPrank();
    }

    function _createTokens() private {
        vm.startPrank(owner);
        dai = address(new MockToken("DAI", "DAI", 100_000_000 * 1e18, 18));
        usdc = address(new MockToken("USDC", "USDC", 100_000_000 * 1e6, 6));
        usdt = address(new MockToken("USDT", "USDT", 100_000_000 * 1e6, 6));
        lpDai = address(new MockLpToken("lpDai", "lpDai", dai));
        lpUsdc = address(new MockLpToken("lpUsdc", "lpUsdc", usdc));
        lpUsdt = address(new MockLpToken("lpUsdt", "lpUsdt", usdt));

        MockLpToken(lpDai).setJoseph(owner);
        MockLpToken(lpUsdc).setJoseph(owner);
        MockLpToken(lpUsdt).setJoseph(owner);

        iporToken = address(new MockStakedToken("IPOR", "IPOR", dao));
        vm.stopPrank();
    }

    function _createPowerToken() private {
        PowerToken implementation = new PowerToken();
        vm.startPrank(owner);
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize(address)", address(iporToken))
        );
        powerToken = address(proxy);
        vm.stopPrank();
    }

    function _createLiquidityMining() private {
        // address in constructor will be replaced
        LiquidityMiningV2 implementation = new LiquidityMiningV2(dao);

        vm.startPrank(owner);
        address[] memory lpTokewns = new address[](3);
        lpTokewns[0] = lpDai;
        lpTokewns[1] = lpUsdc;
        lpTokewns[2] = lpUsdt;
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature(
                "initialize(address[],address,address)",
                lpTokewns,
                powerToken,
                iporToken
            )
        );
        liquidityMining = address(proxy);
        vm.stopPrank();
    }

    function _createServices() private {
        liquidityMiningLens = address(new LiquidityMiningLens(liquidityMining));
        stakeService = address(new StakeService(liquidityMining, powerToken));
        miningService = address(new MiningService(liquidityMining, iporToken));
    }

    function _updateLiquidityMiningImplementation() private {
        LiquidityMiningV2 implementation = new LiquidityMiningV2(router);
        vm.startPrank(owner);
        LiquidityMiningV2(liquidityMining).upgradeTo(address(implementation));
        ILiquidityMiningInternalV2(liquidityMining).grantAllowanceForRouter(router, lpDai);
        ILiquidityMiningInternalV2(liquidityMining).grantAllowanceForRouter(router, lpUsdc);
        ILiquidityMiningInternalV2(liquidityMining).grantAllowanceForRouter(router, lpUsdt);
        ILiquidityMiningInternalV2(liquidityMining).grantAllowanceForRouter(router, iporToken);
        vm.stopPrank();
    }

    function _createRouter() private {
        vm.startPrank(owner);
        PowerTokenRouter implementation = new PowerTokenRouter(
            PowerTokenRouter.DeployedContracts({
                liquidityMiningAddress: liquidityMining,
                powerTokenAddress: powerToken,
                liquidityMiningLens: liquidityMiningLens,
                stakeService: stakeService,
                miningService: miningService
            })
        );

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize(uint256)", 0)
        );
        router = address(proxy);
        vm.stopPrank();
    }
}
