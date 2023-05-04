// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../../contracts/libraries/errors/Errors.sol";
import "../TestCommons.sol";
import "../mocks/MockOwnableUpgradeable.sol";

contract MiningOwnableUpgradeableTest is TestCommons {
    MockOwnableUpgradeable internal _miningOwnableUpgradeable;
    address internal _admin;

    function setUp() public {
        _admin = _getUserAddress(1);
        vm.startPrank(_admin);
        _miningOwnableUpgradeable = new MockOwnableUpgradeable();
        _miningOwnableUpgradeable.initialize();
        vm.stopPrank();
    }

    function testShould0x00AddressBeOwnerWhenDeployedWithoutInitialize() external {
        // given
        MockOwnableUpgradeable miningOwnableUpgradeable = new MockOwnableUpgradeable();

        // when
        address owner = miningOwnableUpgradeable.owner();

        // then
        assertEq(address(0x00), owner, "Owner should be zero address");
    }

    function testShouldDeployerBeOwnerOfContract() external {
        // when
        address owner = _miningOwnableUpgradeable.owner();

        // then
        assertEq(_admin, owner, "Owner should be _admin");
    }

    function testShouldNotBePossibleToTransfer0x00Address() external {
        // when
        // then
        vm.prank(_admin);
        vm.expectRevert(bytes(Errors.WRONG_ADDRESS));
        _miningOwnableUpgradeable.transferOwnership(address(0x00));
    }

    function testShouldNotBePossibleToConfirmTheTransferOwnershipForDifferentAddress() external {
        // given
        address user2 = _getUserAddress(2);
        address user3 = _getUserAddress(3);
        vm.prank(_admin);
        _miningOwnableUpgradeable.transferOwnership(user2);

        // when
        vm.prank(user3);
        vm.expectRevert(bytes(Errors.SENDER_NOT_APPOINTED_OWNER));
        _miningOwnableUpgradeable.confirmTransferOwnership();
    }

    function testShouldBeAbleToTransferOwnershipToUser2() external {
        // given
        address user2 = _getUserAddress(2);
        vm.prank(_admin);
        _miningOwnableUpgradeable.transferOwnership(user2);

        // when
        vm.prank(user2);
        _miningOwnableUpgradeable.confirmTransferOwnership();

        // then
        assertEq(user2, _miningOwnableUpgradeable.owner(), "Owner should be user2");
    }

    function testShouldZeroAddressIsTheOwnerWhenRenounceOwnershipWasExecute() external {
        // given
        address ownerBefore = _miningOwnableUpgradeable.owner();
        vm.prank(_admin);
        _miningOwnableUpgradeable.renounceOwnership();

        // when
        address owner = _miningOwnableUpgradeable.owner();

        // then
        assertEq(address(0x00), owner, "Owner should be zero address");
        assertEq(ownerBefore, _admin, "Owner should be _admin");
    }

    function testShouldNotBeAbleToRenounceOwnershipWhenUserIsNotOwner() external {
        // given
        address user2 = _getUserAddress(2);
        address ownerBefore = _miningOwnableUpgradeable.owner();

        // when
        vm.prank(user2);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        _miningOwnableUpgradeable.renounceOwnership();

        // then

        assertEq(ownerBefore, _admin, "Owner should be _admin");
        assertEq(_admin, _miningOwnableUpgradeable.owner(), "Owner should be _admin");
    }

    function testShouldNotBeAbleToConfirmTransferOwnershipWhenRenounceOwnership() external {
        // given
        address user2 = _getUserAddress(2);
        address ownerBefore = _miningOwnableUpgradeable.owner();
        vm.startPrank(_admin);
        _miningOwnableUpgradeable.transferOwnership(user2);
        _miningOwnableUpgradeable.renounceOwnership();
        vm.stopPrank();

        // when
        vm.prank(user2);
        vm.expectRevert(bytes(Errors.SENDER_NOT_APPOINTED_OWNER));
        _miningOwnableUpgradeable.confirmTransferOwnership();

        // then
        assertEq(ownerBefore, _admin, "Owner should be _admin");
        assertEq(address(0x00), _miningOwnableUpgradeable.owner(), "Owner should be 0x00");
    }
}
