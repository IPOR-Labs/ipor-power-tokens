// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "./TestCommons.sol";
import "../contracts/router/PowerTokenRouter.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract RouterTest is TestCommons {
    function testSwitchImplementation() public {
        // given
        PowerTokenRouter.DeployedContracts memory deployedContracts = PowerTokenRouter
            .DeployedContracts(
                address(this),
                address(this),
                address(this),
                address(this),
                address(this),
                address(this)
            );

        PowerTokenRouter oldImplementation = new PowerTokenRouter(deployedContracts);
        PowerTokenRouter router = PowerTokenRouter(
            address(
                new ERC1967Proxy(
                    address(oldImplementation),
                    abi.encodeWithSignature("initialize(uint256)", 0)
                )
            )
        );

        address newImplementation = address(new PowerTokenRouter(deployedContracts));
        address oldImplementationAddress = router.getImplementation();
        // when
        router.upgradeTo(newImplementation);

        // then
        assertTrue(
            router.getImplementation() == newImplementation,
            "Implementation should be equal to newImplementation"
        );
        assertTrue(
            router.getImplementation() != oldImplementationAddress,
            "Implementation should be changed"
        );
    }
}
