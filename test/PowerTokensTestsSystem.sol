// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "../contracts/mocks/tokens/MockGovernanceToken.sol";
import "../contracts/mocks/tokens/MockToken.sol";
import "../contracts/mocks/tokens/MockLpToken.sol";
import "./TestCommons.sol";
import "../contracts/mining/LiquidityMining.sol";
import "../contracts/tokens/PowerToken.sol";
import "../contracts/lens/LiquidityMiningLens.sol";
import "../contracts/services/StakeService.sol";
import "../contracts/services/FlowsService.sol";
import "../contracts/router/PowerTokenRouter.sol";
import "../contracts/lens/PowerTokenLens.sol";

contract PowerTokensTestsSystem is TestCommons {
    using SafeCast for uint256;

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
    address public powerTokenLens;
    address public stakeService;
    address public flowsService;

    constructor() {
        owner = vm.rememberKey(1);
        dao = vm.rememberKey(2);
        _createTokens();
        _createPowerToken();
        _createLiquidityMining();
        _createServices();
        _createRouter();
        _updateLiquidityMiningImplementation();
        _updatePowerTokenImplementation();
    }

    function mintStable(address stable, address beneficiary, uint256 amount) external {
        vm.prank(owner);
        MockToken(stable).mint(beneficiary, amount);
    }

    function mintLpTokens(address lpToken, address beneficiary, uint256 amount) external {
        vm.startPrank(owner);
        MockLpToken(lpToken).mint(beneficiary, amount);
        vm.stopPrank();
    }

    function setRewardsPerBlock(address lpToken, uint256 rewardsPerBlock) external {
        vm.startPrank(owner);
        ILiquidityMiningInternal(liquidityMining).setRewardsPerBlock(
            lpToken,
            rewardsPerBlock.toUint32()
        );
        vm.stopPrank();
    }

    function transferIporToken(address to, uint256 amount) external {
        vm.startPrank(dao);
        MockToken(iporToken).transfer(to, amount);
        vm.stopPrank();
    }

    function approveRouter(address account) external {
        vm.startPrank(account);
        MockLpToken(lpDai).approve(router, type(uint256).max);
        MockLpToken(lpUsdc).approve(router, type(uint256).max);
        MockLpToken(lpUsdt).approve(router, type(uint256).max);
        MockGovernanceToken(iporToken).approve(router, type(uint256).max);
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

        iporToken = address(new MockGovernanceToken("IPOR", "IPOR", dao));
        vm.stopPrank();
    }

    function _createPowerToken() private {
        // address in constructor will be replaced
        PowerToken implementation = new PowerToken(dao, address(iporToken));
        vm.startPrank(owner);
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize()")
        );
        powerToken = address(proxy);
        vm.stopPrank();
    }

    function createPowerToken(address iporTokenAddress, address routerAddress) public {
        PowerToken implementation = new PowerToken(routerAddress, address(iporTokenAddress));
        vm.startPrank(owner);
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize()")
        );
        powerToken = address(proxy);
        vm.stopPrank();
    }

    function _createLiquidityMining() private {
        // address in constructor will be replaced
        LiquidityMining implementation = new LiquidityMining(dao);

        vm.startPrank(owner);
        address[] memory lpTokewns = new address[](3);
        lpTokewns[0] = lpDai;
        lpTokewns[1] = lpUsdc;
        lpTokewns[2] = lpUsdt;
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize(address[])", lpTokewns)
        );
        liquidityMining = address(proxy);
        vm.stopPrank();
    }

    function _createServices() private {
        liquidityMiningLens = address(new LiquidityMiningLens(liquidityMining));
        powerTokenLens = address(new PowerTokenLens(powerToken));
        stakeService = address(new StakeService(liquidityMining, powerToken, iporToken));
        flowsService = address(new FlowsService(liquidityMining, iporToken, powerToken));
    }

    function _updateLiquidityMiningImplementation() private {
        LiquidityMining implementation = new LiquidityMining(router);
        vm.startPrank(owner);
        LiquidityMining(liquidityMining).upgradeTo(address(implementation));
        ILiquidityMiningInternal(liquidityMining).grantAllowanceForRouter(lpDai);
        ILiquidityMiningInternal(liquidityMining).grantAllowanceForRouter(lpUsdc);
        ILiquidityMiningInternal(liquidityMining).grantAllowanceForRouter(lpUsdt);
        ILiquidityMiningInternal(liquidityMining).grantAllowanceForRouter(iporToken);
        IPowerTokenInternal(powerToken).grantAllowanceForRouter(iporToken);
        vm.stopPrank();
    }

    function _updatePowerTokenImplementation() private {
        PowerToken implementation = new PowerToken(router, address(iporToken));
        vm.startPrank(owner);
        PowerToken(powerToken).upgradeTo(address(implementation));
        IPowerTokenInternal(powerToken).grantAllowanceForRouter(iporToken);
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
                flowsService: flowsService,
                powerTokenLens: powerTokenLens
            })
        );

        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize(uint256)", 0)
        );
        router = address(proxy);
        vm.stopPrank();
    }

    function makeAllApprovals(address account) external {
        vm.startPrank(account);
        MockToken(dai).approve(router, type(uint256).max);
        MockToken(usdc).approve(router, type(uint256).max);
        MockToken(usdt).approve(router, type(uint256).max);
        MockLpToken(lpDai).approve(router, type(uint256).max);
        MockLpToken(lpUsdc).approve(router, type(uint256).max);
        MockLpToken(lpUsdt).approve(router, type(uint256).max);
        MockGovernanceToken(iporToken).approve(router, type(uint256).max);
        vm.stopPrank();
    }
}
