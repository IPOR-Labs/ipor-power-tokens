// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "forge-std/Test.sol";
import "../../contracts/mocks/tokens/MockLpToken.sol";
import "../../contracts/lens/LiquidityMiningLens.sol";
import "../../contracts/lens/PowerTokenLens.sol";
import "../../contracts/services/StakeService.sol";
import "../../contracts/services/FlowsService.sol";
import "../../contracts/router/PowerTokenRouter.sol";
import "../../contracts/mining/LiquidityMiningEthereum.sol";
import "../../contracts/tokens/PowerToken.sol";

contract TestEthMarketCommons is Test {
    uint256 constant public COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;

    address public constant owner = 0xD92E9F039E4189c342b4067CC61f5d063960D248;

    address public constant stEth = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address public constant iporToken = 0x1e4746dC744503b53b4A082cB3607B169a289090;
    address public constant ipUSDT = 0x9Bd2177027edEE300DC9F1fb88F24DB6e5e1edC6;
    address public constant ipUSDC = 0x7c0e72f431FD69560D951e4C04A4de3657621a88;
    address public constant ipDAI = 0x8537b194BFf354c4738E9F3C81d67E3371DaDAf8;
    address public constant powerToken = 0xD72915B95c37ae1B16B926f85ad61ccA6395409F;
    address public constant liquidityMining = 0xCC3Fc4C9Ba7f8b8aA433Bc586D390A70560FF366;

    address public constant ethUsdOracle = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;

    address public lpStEth;
    address public liquidityMiningLens;
    address public powerTokenLens;
    address public stakeService;
    address public flowsService;
    address public router;

    address public userOne = address(11);
    address public userTwo = address(22);

    function _init() internal {
        _createTokens();
        _createServices();
        _createRouter();
        _updateLiquidityMiningImplementation();
        _updatePowerTokenImplementation();
        _addLpStEth();

        _setupUser(userOne);
        _setupUser(userTwo);
    }

    function _createTokens() private {
        vm.startPrank(owner);
        lpStEth = address(new MockLpToken("lpStEth", "lpStEth", stEth));
        MockLpToken(lpStEth).setJoseph(owner);
        vm.stopPrank();
    }

    function _createServices() private {
        liquidityMiningLens = address(new LiquidityMiningLens(liquidityMining));
        powerTokenLens = address(new PowerTokenLens(powerToken));
        stakeService = address(new StakeService(liquidityMining, powerToken, iporToken));
        flowsService = address(new FlowsService(liquidityMining, iporToken, powerToken));
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

    function _updateLiquidityMiningImplementation() private {
        vm.startPrank(owner);
        LiquidityMiningEthereum implementation = new LiquidityMiningEthereum(
            router,
            lpStEth,
            ethUsdOracle
        );
        LiquidityMiningEthereum(liquidityMining).upgradeTo(address(implementation));
        ILiquidityMiningInternal(liquidityMining).grantAllowanceForRouter(lpStEth);
        ILiquidityMiningInternal(liquidityMining).grantAllowanceForRouter(iporToken);
        vm.stopPrank();
    }

    function _updatePowerTokenImplementation() private {
        PowerToken implementation = new PowerToken(router, address(iporToken), COOL_DOWN_IN_SECONDS);
        vm.startPrank(owner);
        PowerToken(powerToken).upgradeTo(address(implementation));
        IPowerTokenInternal(powerToken).grantAllowanceForRouter(iporToken);
        vm.stopPrank();
    }

    function _addLpStEth() private {
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = lpStEth;
        uint32[] memory rewards = new uint32[](1);
        rewards[0] = 35e6;
        vm.startPrank(owner);
        ILiquidityMiningInternal(liquidityMining).newSupportedLpToken(lpStEth);
        ILiquidityMiningInternal(liquidityMining).setRewardsPerBlock(lpTokens, rewards);
        vm.stopPrank();
    }

    function _setupUser(address user) internal {
        deal(user, 1_000_000e18);
        deal(iporToken, user, 10_000e18);
        vm.prank(user);
        MockLpToken(lpStEth).approve(router, type(uint256).max);
        vm.prank(user);
        IERC20(iporToken).approve(router, type(uint256).max);

        vm.prank(owner);
        MockLpToken(lpStEth).mint(user, 10_000e18);
    }
}
