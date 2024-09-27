pragma solidity 0.8.26;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "forge-std/Script.sol";
import "@power-tokens/contracts/router/PowerTokenRouter.sol";
import "@power-tokens/contracts/mining/LiquidityMining.sol";
import "@power-tokens/contracts/tokens/PowerToken.sol";
import "@power-tokens/contracts/mocks/tokens/MockGovernanceToken.sol";
import "@power-tokens/contracts/lens/LiquidityMiningLens.sol";
import "@power-tokens/contracts/services/StakeService.sol";
import "@power-tokens/contracts/services/FlowsService.sol";
import "@power-tokens/contracts/lens/PowerTokenLens.sol";
import "@power-tokens/contracts/mocks/tokens/MockLpToken.sol";
import "@power-tokens/contracts/mocks/tokens/MockToken.sol";

// run:
// $ anvil
// get private key from anvil then set SC_ADMIN_PRIV_KEY variable in .env file
// then run:
// $ forge script scripts/DeployLocal.s.sol --fork-url http://127.0.0.1:8545 --broadcast
contract LocalDeployment is Script {
    address defaultAnvilAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    struct System {
        address powerTokenRouterProxy;
        address powerTokenRouterImpl;
        address liquidityMiningProxy;
        address liquidityMiningImpl;
        address powerTokenProxy;
        address powerTokenImpl;
        address governanceToken;
        address liquidityMiningLens;
        address stakeService;
        address flowService;
        address powerTokenLens;
        address dai;
        address usdc;
        address usdt;
        address lpDai;
        address lpUsdc;
        address lpUsdt;
    }

    uint256 _private_key;

    function setUp() public {
        _private_key = vm.envUint("SC_ADMIN_PRIV_KEY");
    }

    function run() public {
        System memory system;
        vm.startBroadcast(_private_key);
        _getFullInstance(system);
        vm.stopBroadcast();
        toAddressesJson(system);
    }

    function _getFullInstance(System memory system) internal {
        deployDummyPowerTokenRouter(system);
        deployTokens(system);
        deployGovernanceToken(system);
        deployLpTokens(system);
        deployPowerToken(system);
        deployPowerTokenLens(system);
        deployLiquidityMining(system);
        deployLiquidityMiningLens(system);
        deployPowerTokenStakeService(system);
        deployPowerTokenFlowService(system);
        upgradePowerTokenRouter(system);
        grantAllowances(system);
    }

    function grantAllowances(System memory system) internal {
        ILiquidityMiningInternal(system.liquidityMiningProxy).grantAllowanceForRouter(system.lpDai);
        ILiquidityMiningInternal(system.liquidityMiningProxy).grantAllowanceForRouter(
            system.lpUsdc
        );
        ILiquidityMiningInternal(system.liquidityMiningProxy).grantAllowanceForRouter(
            system.lpUsdt
        );
        ILiquidityMiningInternal(system.liquidityMiningProxy).grantAllowanceForRouter(
            system.governanceToken
        );
        IPowerTokenInternal(system.powerTokenProxy).grantAllowanceForRouter(system.governanceToken);
    }

    function deployGovernanceToken(System memory system) internal {
        system.governanceToken = address(
            new MockGovernanceToken("IPOR", "IPOR", defaultAnvilAddress)
        );
    }

    function upgradePowerTokenRouter(System memory system) internal {
        PowerTokenRouter.DeployedContracts memory deployedContracts = PowerTokenRouter
            .DeployedContracts({
                liquidityMiningAddress: system.liquidityMiningProxy,
                powerTokenAddress: system.powerTokenProxy,
                liquidityMiningLens: system.liquidityMiningLens,
                stakeService: system.stakeService,
                flowsService: system.flowService,
                powerTokenLens: system.powerTokenLens
            });

        system.powerTokenRouterImpl = address(new PowerTokenRouter(deployedContracts));
        PowerTokenRouter(system.powerTokenRouterProxy).upgradeTo(system.powerTokenRouterImpl);
    }

    function deployLiquidityMining(System memory system) internal {
        address[] memory lpTokens = new address[](3);
        lpTokens[0] = system.lpDai;
        lpTokens[1] = system.lpUsdc;
        lpTokens[2] = system.lpUsdt;

        system.liquidityMiningImpl = address(new LiquidityMining(system.powerTokenRouterProxy));
        system.liquidityMiningProxy = address(
            new ERC1967Proxy(
                system.liquidityMiningImpl,
                abi.encodeWithSignature("initialize(address[])", lpTokens)
            )
        );
    }

    function deployTokens(System memory system) internal {
        system.dai = address(new MockToken("DAI", "DAI", 100_000_000 * 1e18, 18));
        system.usdc = address(new MockToken("USDC", "USDC", 100_000_000 * 1e6, 6));
        system.usdt = address(new MockToken("USDT", "USDT", 100_000_000 * 1e6, 6));
        system.lpDai = address(new MockLpToken("lpDai", "lpDai", system.dai));
        system.lpUsdc = address(new MockLpToken("lpUsdc", "lpUsdc", system.usdc));
        system.lpUsdt = address(new MockLpToken("lpUsdt", "lpUsdt", system.usdt));

        MockLpToken(system.lpDai).setJoseph(defaultAnvilAddress);
        MockLpToken(system.lpUsdc).setJoseph(defaultAnvilAddress);
        MockLpToken(system.lpUsdt).setJoseph(defaultAnvilAddress);
    }

    function deployLpTokens(System memory system) internal {
        system.lpDai = address(new MockLpToken("lpDai", "lpDai", system.dai));
        system.lpUsdc = address(new MockLpToken("lpUsdc", "lpUsdc", system.usdc));
        system.lpUsdt = address(new MockLpToken("lpUsdt", "lpUsdt", system.usdt));

        MockLpToken(system.lpDai).setJoseph(defaultAnvilAddress);
        MockLpToken(system.lpUsdc).setJoseph(defaultAnvilAddress);
        MockLpToken(system.lpUsdt).setJoseph(defaultAnvilAddress);
    }

    function deployPowerToken(System memory system) internal {
        system.powerTokenImpl = address(
            new PowerToken(system.powerTokenRouterProxy, system.governanceToken)
        );
        system.powerTokenProxy = address(
            new ERC1967Proxy(system.powerTokenImpl, abi.encodeWithSignature("initialize()"))
        );
    }

    function deployLiquidityMiningLens(System memory system) internal {
        system.liquidityMiningLens = address(new LiquidityMiningLens(system.liquidityMiningProxy));
    }

    function deployPowerTokenStakeService(System memory system) internal {
        system.stakeService = address(
            new StakeService(
                system.liquidityMiningProxy,
                system.powerTokenProxy,
                system.governanceToken
            )
        );
    }

    function deployPowerTokenFlowService(System memory system) internal {
        system.flowService = address(
            new FlowsService(
                system.liquidityMiningProxy,
                system.governanceToken,
                system.powerTokenProxy
            )
        );
    }

    function deployPowerTokenLens(System memory system) internal {
        system.powerTokenLens = address(new PowerTokenLens(system.powerTokenProxy));
    }

    function deployDummyPowerTokenRouter(System memory system) internal {
        PowerTokenRouter.DeployedContracts memory deployedContracts = PowerTokenRouter
            .DeployedContracts({
                liquidityMiningAddress: defaultAnvilAddress,
                powerTokenAddress: defaultAnvilAddress,
                liquidityMiningLens: defaultAnvilAddress,
                stakeService: defaultAnvilAddress,
                flowsService: defaultAnvilAddress,
                powerTokenLens: defaultAnvilAddress
            });

        system.powerTokenRouterImpl = address(new PowerTokenRouter(deployedContracts));
        system.powerTokenRouterProxy = address(
            new ERC1967Proxy(
                system.powerTokenRouterImpl,
                abi.encodeWithSignature("initialize(uint256)", 0)
            )
        );
    }

    function toAddressesJson(System memory system) internal {
        string memory path = vm.projectRoot();
        string memory addressesJson = "";

        vm.serializeAddress(addressesJson, "PowerTokenProxy", system.powerTokenProxy);
        vm.serializeAddress(addressesJson, "PowerTokenImpl", system.powerTokenImpl);
        vm.serializeAddress(addressesJson, "LiquidityMiningProxy", system.liquidityMiningProxy);
        vm.serializeAddress(addressesJson, "LiquidityMiningImpl", system.liquidityMiningImpl);
        vm.serializeAddress(addressesJson, "StakedToken", system.governanceToken);
        vm.serializeAddress(addressesJson, "LiquidityMiningLens", system.liquidityMiningLens);
        vm.serializeAddress(addressesJson, "StakeService", system.stakeService);
        vm.serializeAddress(addressesJson, "FlowService", system.flowService);
        vm.serializeAddress(addressesJson, "FlowService", system.flowService);
        vm.serializeAddress(addressesJson, "PowerTokenRouterProxy", system.powerTokenRouterImpl);

        string memory finalJson = vm.serializeAddress(
            addressesJson,
            "PowerTokenRouterProxy",
            system.powerTokenRouterProxy
        );

        vm.writeJson(finalJson, string.concat(path, "/ipor-power-token-addresses.json"));
    }
}
