pragma solidity 0.8.20;

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

// run:
// $ anvil
// get private key from anvil then set SC_ADMIN_PRIV_KEY variable in .env file
// then run:
// $ forge script scripts/DeployLocal.s.sol --fork-url http://127.0.0.1:8545 --broadcast
contract LocalDeployment is Script {
    address fakeAddress = 0x976EA74026E726554dB657fA54763abd0C3a0aa9;

    struct PowerTokenSystem {
        address powerTokenRouter;
        address liquidityMining;
        address powerToken;
        address stakedToken;
        address liquidityMiningLens;
        address stakeService;
        address flowService;
        address powerTokenLens;
    }

    uint256 _private_key;

    function setUp() public {
        _private_key = vm.envUint("SC_ADMIN_PRIV_KEY");
    }

    function run() public {
        PowerTokenSystem memory system;
        vm.startBroadcast(_private_key);
        _getFullInstance(system);
        vm.stopBroadcast();
        toAddressesJson(system);
    }

    function _getFullInstance(PowerTokenSystem memory system) internal {
        deployEmptyPowerTokenRouter(system);
        deployLiquidityMining(system);
        deployPowerToken(system);
        deployLiquidityMiningLens(system);
        deployPowerTokenStakeService(system);
        deployPowerTokenFlowService(system);
        deployPowerTokenLens(system);
    }

    function deployLiquidityMining(PowerTokenSystem memory system) internal {
        system.liquidityMining = address(new LiquidityMining(system.powerTokenRouter));
    }

    function deployPowerToken(PowerTokenSystem memory system) internal {
        system.stakedToken = address(new MockGovernanceToken("IPOR", "IPOR", msg.sender));
        system.powerToken = address(new PowerToken(system.powerTokenRouter, system.stakedToken));
    }

    function deployLiquidityMiningLens(PowerTokenSystem memory system) internal {
        system.liquidityMiningLens = address(new LiquidityMiningLens(system.liquidityMining));
    }

    function deployPowerTokenStakeService(PowerTokenSystem memory system) internal {
        system.stakeService = address(
            new StakeService(system.liquidityMining, system.powerToken, system.stakedToken)
        );
    }

    function deployPowerTokenFlowService(PowerTokenSystem memory system) internal {
        system.flowService = address(
            new FlowsService(system.liquidityMining, system.stakedToken, system.powerToken)
        );
    }

    function deployPowerTokenLens(PowerTokenSystem memory system) internal {
        system.powerTokenLens = address(new PowerTokenLens(system.powerToken));
    }

    function deployEmptyPowerTokenRouter(PowerTokenSystem memory system) internal {
        PowerTokenRouter.DeployedContracts memory deployedContracts = PowerTokenRouter
            .DeployedContracts({
                liquidityMiningAddress: fakeAddress,
                powerTokenAddress: fakeAddress,
                liquidityMiningLens: fakeAddress,
                stakeService: fakeAddress,
                flowsService: fakeAddress,
                powerTokenLens: fakeAddress
            });

        system.powerTokenRouter = address(
            new ERC1967Proxy(
                address(new PowerTokenRouter(deployedContracts)),
                abi.encodeWithSignature("initialize(uint256)", 0)
            )
        );
    }

    function toAddressesJson(PowerTokenSystem memory system) internal {
        string memory path = vm.projectRoot();
        string memory addressesJson = "";

        vm.serializeAddress(addressesJson, "PowerToken", system.powerToken);
        vm.serializeAddress(addressesJson, "StakedToken", system.stakedToken);
        vm.serializeAddress(addressesJson, "LiquidityMiningLens", system.liquidityMiningLens);
        vm.serializeAddress(addressesJson, "StakeService", system.stakeService);
        vm.serializeAddress(addressesJson, "FlowService", system.flowService);
        vm.serializeAddress(addressesJson, "PowerTokenLens", system.powerTokenLens);

        string memory finalJson = vm.serializeAddress(
            addressesJson,
            "PowerTokenRouter",
            system.powerTokenRouter
        );

        vm.writeJson(finalJson, string.concat(path, "/ipor-power-token-addresses.json"));
    }
}
