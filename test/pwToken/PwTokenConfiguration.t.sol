// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "../../contracts/interfaces/IPowerTokenInternal.sol";

contract PwTokenConfigurationTest is TestCommons {
    PowerTokensTestsSystem internal _powerTokensSystem;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
    }

    function testShouldDeployContract() external {
        // given
        address powerToken = _powerTokensSystem.powerToken();
        address router = _powerTokensSystem.router();
        // when
        // then
        assertTrue(powerToken != address(0), "PowerToken address should not be zero");
        assertEq(
            1e18,
            IPowerTokenInternal(powerToken).calculateExchangeRate(),
            "Exchange rate should be 1"
        );
    }

    function testShouldNotBeAbleToDeployContractWhenNoGovernanceTokenAddress() external {
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
        PowerTokenInternal(powerToken).pause();

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
        IPowerTokenInternal(powerToken).setPauseManager(user2);

        // when
        vm.prank(user2);
        PowerTokenInternal(powerToken).pause();

        // then
        assertTrue(
            pausedBefore != PausableUpgradeable(powerToken).paused(),
            "Paused should be different"
        );
        assertEq(
            user2,
            IPowerTokenInternal(powerToken).getPauseManager(),
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
        PowerTokenInternal(powerToken).pause();

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
        PowerTokenInternal(powerToken).pause();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        // when
        vm.prank(owner);
        PowerTokenInternal(powerToken).unpause();

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
        PowerTokenInternal(powerToken).pause();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        // when
        vm.prank(user2);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        PowerTokenInternal(powerToken).unpause();

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
        PowerTokenInternal(powerToken).pause();
        bool pausedBefore = PausableUpgradeable(powerToken).paused();

        vm.prank(owner);
        IPowerTokenInternal(powerToken).setPauseManager(user2);

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        PowerTokenInternal(powerToken).unpause();

        // then
        assertTrue(
            pausedBefore == PausableUpgradeable(powerToken).paused(),
            "Paused should be the same"
        );
        assertEq(
            user2,
            IPowerTokenInternal(powerToken).getPauseManager(),
            "Pause manager should be user2"
        );
    }

    function testShouldRevokeAllowanceForRouter() external {
        // given
        address owner = _powerTokensSystem.owner();
        address iporToken = _powerTokensSystem.iporToken();
        address powerToken = _powerTokensSystem.powerToken();
        address router = _powerTokensSystem.router();
        uint256 allowanceBefore = IERC20(iporToken).allowance(powerToken, router);

        // when
        vm.prank(owner);
        IPowerTokenInternal(powerToken).revokeAllowanceForRouter(iporToken);

        // then
        assertEq(0, IERC20(iporToken).allowance(powerToken, router), "Allowance should be 0");
        assertEq(allowanceBefore, type(uint256).max, "Allowance should be max");
    }
}
