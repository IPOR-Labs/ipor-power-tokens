// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../TestCommons.sol";
import "../PowerTokensSystem.sol";

contract PwTokenConfigurationTest is TestCommons {
    PowerTokensSystem internal _powerTokensSystem;

    function setUp() external {
        _powerTokensSystem = new PowerTokensSystem();
    }

    function testShouldDeployContract() external {
        // given
        address powerToken = _powerTokensSystem.powerToken();
        address router = _powerTokensSystem.router();
        // when
        // then
        assertTrue(powerToken != address(0), "PowerToken address should not be zero");
        assertEq(
            "Power IPOR",
            PowerTokenV2(powerToken).name(),
            "PowerToken name should be Power IPOR"
        );
        assertEq(
            "Power IPOR",
            PowerTokenLens(router).powerTokenName(),
            "PowerToken name should be Power IPOR"
        );
        assertEq("pwIPOR", PowerTokenV2(powerToken).symbol(), "PowerToken symbol should be pwIPOR");
        assertEq(
            "pwIPOR",
            PowerTokenLens(router).powerTokenSymbol(),
            "PowerToken symbol should be pwIPOR"
        );
        assertEq(18, PowerTokenV2(powerToken).decimals(), "PowerToken decimals should be 18");
        assertEq(
            18,
            PowerTokenLens(router).powerTokenDecimals(),
            "PowerToken decimals should be 18"
        );
    }

    function testShouldNotBeAbleToDeployContractWhenNoStakedTokenAddress() external {
        // given
        address router = _powerTokensSystem.dao();
        // when
        // then
        vm.expectRevert(bytes(Errors.WRONG_ADDRESS));
        _powerTokensSystem.createPowerToken(address(0x00), router);
    }

    function testShouldNotBeAbleToDeployContractWhenNoRouterAddress() external {
        // given
        address ipor = _powerTokensSystem.iporToken();
        // when
        // then
        vm.expectRevert(bytes(Errors.WRONG_ADDRESS));
        _powerTokensSystem.createPowerToken(ipor, address(0x00));
    }

    function textShouldBeAbleToTransferOwnership() external {
        // given
        address user2 = _getUserAddress(2);
        address ownerBefore = _powerTokensSystem.owner();
        address powerToken = _powerTokensSystem.powerToken();

        // when
        vm.prank(ownerBefore);
        MiningOwnableUpgradeable(powerToken).transferOwnership(user2);
        vm.prank(user2);
        MiningOwnableUpgradeable(powerToken).confirmTransferOwnership();

        // then
        assertEq(user2, MiningOwnableUpgradeable(powerToken).owner(), "Owner should be user2");
    }

    function testShouldNotBeAbleToTransferOwnershipWhenNotOwner() external {
        // given
        address user2 = _getUserAddress(2);
        address ownerBefore = _powerTokensSystem.owner();
        address powerToken = _powerTokensSystem.powerToken();

        // when
        vm.prank(user2);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        MiningOwnableUpgradeable(powerToken).transferOwnership(user2);

        // then
        assertEq(
            ownerBefore,
            MiningOwnableUpgradeable(powerToken).owner(),
            "Owner should be ownerBefore"
        );
    }

    function testShouldBeAbleToPauseContractWhenOwnerInitialDeployment() external {
        // given
        address powerToken = _powerTokensSystem.powerToken();
        address owner = MiningOwnableUpgradeable(powerToken).owner();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        // when
        vm.prank(owner);
        PowerTokenInternalV2(powerToken).pause();

        // then
        assertTrue(
            pausedBefore != PausableUpgradeable(powerToken).paused(),
            "Paused should be different"
        );
    }

    function testShouldBeAbleToPauseContractWhenPauseManager() external {
        // given
        address user2 = _getUserAddress(2);
        address owner = _powerTokensSystem.owner();
        address powerToken = _powerTokensSystem.powerToken();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        vm.prank(owner);
        IPowerTokenInternalV2(powerToken).setPauseManager(user2);

        // when
        vm.prank(user2);
        PowerTokenInternalV2(powerToken).pause();

        // then
        assertTrue(
            pausedBefore != PausableUpgradeable(powerToken).paused(),
            "Paused should be different"
        );
        assertEq(
            user2,
            IPowerTokenInternalV2(powerToken).getPauseManager(),
            "Pause manager should be user2"
        );
    }

    function testShouldNotBeAbleToPauseContractWhenNoPauseManager() external {
        // given
        address user2 = _getUserAddress(2);
        address powerToken = _powerTokensSystem.powerToken();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        // when
        vm.prank(user2);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        PowerTokenInternalV2(powerToken).pause();

        // then
        assertTrue(
            pausedBefore == PausableUpgradeable(powerToken).paused(),
            "Paused should be the same"
        );
    }

    function testShouldBeAbleToUnpauseContractWhenPauseManager() external {
        // given
        address owner = _powerTokensSystem.owner();
        address powerToken = _powerTokensSystem.powerToken();

        vm.prank(owner);
        PowerTokenInternalV2(powerToken).pause();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        // when
        vm.prank(owner);
        PowerTokenInternalV2(powerToken).unpause();

        // then
        assertTrue(
            pausedBefore != PausableUpgradeable(powerToken).paused(),
            "Paused should be different"
        );
    }

    function testShouldNotBeAbleToUnpauseContractWhenNoPauseManager() external {
        // given
        address user2 = _getUserAddress(2);
        address owner = _powerTokensSystem.owner();
        address powerToken = _powerTokensSystem.powerToken();

        vm.prank(owner);
        PowerTokenInternalV2(powerToken).pause();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        // when
        vm.prank(user2);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        PowerTokenInternalV2(powerToken).unpause();

        // then
        assertTrue(
            pausedBefore == PausableUpgradeable(powerToken).paused(),
            "Paused should be the same"
        );
    }

    function testShouldNotBeAbleToUnpauseContractWhenInitialPauseManagerChanged() external {
        // given
        address user2 = _getUserAddress(2);
        address owner = _powerTokensSystem.owner();
        address powerToken = _powerTokensSystem.powerToken();

        vm.prank(owner);
        PowerTokenInternalV2(powerToken).pause();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        vm.prank(owner);
        IPowerTokenInternalV2(powerToken).setPauseManager(user2);

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        PowerTokenInternalV2(powerToken).unpause();

        // then
        assertTrue(
            pausedBefore == PausableUpgradeable(powerToken).paused(),
            "Paused should be the same"
        );
        assertEq(
            user2,
            IPowerTokenInternalV2(powerToken).getPauseManager(),
            "Pause manager should be user2"
        );
    }
}