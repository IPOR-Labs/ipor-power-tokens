// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenInternal.sol";

contract PwTokenConfigurationTest is TestCommons {
    PowerTokensTestsSystem internal _powerTokensSystem;
    event PauseGuardiansAdded(address[] indexed guardians);
    event PauseGuardiansRemoved(address[] indexed guardians);

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

    function testShouldBeAbleToSet4NewPauseGuardians() external {
        // given
        address[] memory guardians = new address[](4);
        guardians[0] = _getUserAddress(10);
        guardians[1] = _getUserAddress(11);
        guardians[2] = _getUserAddress(12);
        guardians[3] = _getUserAddress(13);

        address pw = _powerTokensSystem.powerToken();
        bool userOneIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[3]);

        // when
        vm.prank(_powerTokensSystem.owner());
        vm.expectEmit(true, true, true, true);
        emit PauseGuardiansAdded(guardians);
        PowerToken(pw).addPauseGuardians(guardians);

        // then

        bool userOneIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[3]);

        assertFalse(userOneIsPauseGuardianBefore, "should not be pause guardian before");
        assertFalse(userTwoIsPauseGuardianBefore, "should not be pause guardian before");
        assertFalse(userThreeIsPauseGuardianBefore, "should not be pause guardian before");
        assertFalse(userFourIsPauseGuardianBefore, "should not be pause guardian before");

        assertTrue(userOneIsPauseGuardianAfter, "should be pause guardian after");
        assertTrue(userTwoIsPauseGuardianAfter, "should be pause guardian after");
        assertTrue(userThreeIsPauseGuardianAfter, "should be pause guardian after");
        assertTrue(userFourIsPauseGuardianAfter, "should be pause guardian after");
    }

    function testShoudBeAbleToRemove2UsersFromGuardians() external {
        // given
        address[] memory guardians = new address[](4);
        guardians[0] = _getUserAddress(10);
        guardians[1] = _getUserAddress(11);
        guardians[2] = _getUserAddress(12);
        guardians[3] = _getUserAddress(13);

        address pw = _powerTokensSystem.powerToken();

        vm.prank(_powerTokensSystem.owner());
        PowerToken(pw).addPauseGuardians(guardians);

        address[] memory guardiansToRemove = new address[](2);
        guardiansToRemove[0] = guardians[0];
        guardiansToRemove[1] = guardians[1];

        bool userOneIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianBefore = PowerToken(pw).isPauseGuardian(guardians[3]);

        // when
        vm.prank(_powerTokensSystem.owner());
        vm.expectEmit(true, true, true, true);
        emit PauseGuardiansRemoved(guardiansToRemove);
        PowerToken(pw).removePauseGuardians(guardiansToRemove);

        // then

        bool userOneIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianAfter = PowerToken(pw).isPauseGuardian(guardians[3]);

        assertTrue(userOneIsPauseGuardianBefore, "should be pause guardian before");
        assertTrue(userTwoIsPauseGuardianBefore, "should be pause guardian before");
        assertTrue(userThreeIsPauseGuardianBefore, "should not be pause guardian before");
        assertTrue(userFourIsPauseGuardianBefore, "should not be pause guardian before");

        assertFalse(userOneIsPauseGuardianAfter, "should not be pause guardian after");
        assertFalse(userTwoIsPauseGuardianAfter, "should not be pause guardian after");
        assertTrue(userThreeIsPauseGuardianAfter, "should not be pause guardian after");
        assertTrue(userFourIsPauseGuardianAfter, "should not be pause guardian after");
    }

    function testShouldBeAbleToPauseWhenUserIsGuardian() external {
        // given
        address[] memory guardians = new address[](1);
        guardians[0] = _getUserAddress(10);

        address pw = _powerTokensSystem.powerToken();

        vm.prank(_powerTokensSystem.owner());
        PowerToken(pw).addPauseGuardians(guardians);

        bool isPausedBefore = PausableUpgradeable(pw).paused();

        // when
        vm.prank(guardians[0]);
        PowerToken(pw).pause();

        // then
        bool isPausedAfter = PausableUpgradeable(pw).paused();

        assertFalse(isPausedBefore, "should not be paused before");
        assertTrue(isPausedAfter, "should be paused after");
    }

    function testShouldNotBeAbleToPauseWhenRemovedFromGuardians() external {
        // given
        address[] memory guardians = new address[](1);
        guardians[0] = _getUserAddress(10);

        address pw = _powerTokensSystem.powerToken();

        vm.prank(_powerTokensSystem.owner());
        PowerToken(pw).addPauseGuardians(guardians);

        bool isPausedBefore = PausableUpgradeable(pw).paused();

        // when
        vm.prank(_powerTokensSystem.owner());
        PowerToken(pw).removePauseGuardians(guardians);

        vm.prank(guardians[0]);
        vm.expectRevert(bytes(Errors.CALLER_NOT_GUARDIAN));
        PowerToken(pw).pause();
    }
}
