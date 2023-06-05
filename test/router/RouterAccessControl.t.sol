// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "contracts/router/AccessControl.sol";
import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";

contract RouterAccessControlTest is TestCommons {
    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address internal _userOne;
    address internal _owner;

    function setUp() public {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(10);
        _owner = _powerTokensSystem.owner();

        _powerTokensSystem.mintLpTokens(_powerTokensSystem.lpDai(), _userOne, 10_000e18);
        _powerTokensSystem.approveRouter(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
    }

    function testShouldReturnOwnerOfRouter() external {
        address owner = AccessControl(_router).owner();
        assertEq(owner, _owner, "Should return owner of router");
    }

    function testShouldBeAbleTransferOwnership() external {
        // given
        address ownerBefore = AccessControl(_router).owner();

        // when
        vm.prank(_owner);
        AccessControl(_router).transferOwnership(_userOne);
        vm.prank(_userOne);
        AccessControl(_router).confirmTransferOwnership();

        // then
        address ownerAfter = AccessControl(_router).owner();
        assertEq(ownerBefore, _owner, "old owner should be equal to owner before");
        assertEq(ownerAfter, _userOne, "new owner should be equal to userOne after");
    }

    function testShouldNotBeAbleToTransferOwnershipWhenNotOwner() external {
        // given
        address ownerBefore = AccessControl(_router).owner();

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.CALLER_NOT_OWNER));
        AccessControl(_router).transferOwnership(_userOne);

        // then
        address ownerAfter = AccessControl(_router).owner();
        assertEq(ownerBefore, _owner, "old owner should be equal to owner before");
        assertEq(ownerAfter, _owner, "new owner should be equal to owner after");
    }

    function testShouldNotBeAbleToConfirmTransferOwnershipWhenNotAppointed() external {
        // given
        address ownerBefore = AccessControl(_router).owner();
        address userThree = _getUserAddress(3);

        // when
        vm.prank(_owner);
        AccessControl(_router).transferOwnership(_userOne);
        vm.prank(userThree);
        vm.expectRevert(bytes(Errors.SENDER_NOT_APPOINTED_OWNER));
        AccessControl(_router).confirmTransferOwnership();

        // then
        address ownerAfter = AccessControl(_router).owner();
        assertEq(ownerBefore, _owner, "owner before should be equal to _owner");
        assertEq(ownerAfter, _owner, "owner after should be equal to _owner");
    }

    function testShouldNotBeAbleToTranferOwnershipWhenSendZeroAddress() external {
        // given
        address ownerBefore = AccessControl(_router).owner();

        // when
        vm.prank(_owner);
        vm.expectRevert(bytes(Errors.WRONG_ADDRESS));
        AccessControl(_router).transferOwnership(address(0));

        // then
        address ownerAfter = AccessControl(_router).owner();
        assertEq(ownerBefore, _owner, "owner before should be equal to _owner");
        assertEq(ownerAfter, _owner, "owner after should be equal to _owner");
    }

    function testShouldBeAbleToRenounceOwnership() external {
        // given
        address ownerBefore = AccessControl(_router).owner();

        // when
        vm.prank(_owner);
        AccessControl(_router).renounceOwnership();

        // then
        address ownerAfter = AccessControl(_router).owner();
        assertEq(ownerBefore, _owner, "owner before should be equal to _owner");
        assertEq(ownerAfter, address(0), "owner after should be equal to address(0)");
    }

    function testShouldNotBeAbleToRenounceOwnershipWhenNotOwner() external {
        // given
        address ownerBefore = AccessControl(_router).owner();

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.CALLER_NOT_OWNER));
        AccessControl(_router).renounceOwnership();

        // then
        address ownerAfter = AccessControl(_router).owner();
        assertEq(ownerBefore, _owner, "owner before should be equal to _owner");
        assertEq(ownerAfter, _owner, "owner after should be equal to _owner");
    }

    function testShouldOwnerBeGuardian() external {
        // when
        bool isGuardian = AccessControl(_router).isPauseGuardian(_owner);

        // then
        assertTrue(isGuardian, "owner should be guardian");
    }

    function testShouldBeAbleToAddNewGuardian() external {
        // given
        bool isGuardianBefore = AccessControl(_router).isPauseGuardian(_userOne);

        // when
        vm.prank(_owner);
        AccessControl(_router).addPauseGuardian(_userOne);

        // then
        bool isGuardianAfter = AccessControl(_router).isPauseGuardian(_userOne);

        assertFalse(isGuardianBefore, "userOne should not be guardian");
        assertTrue(isGuardianAfter, "userOne should be guardian");
    }

    function testShouldNotBeAbleToAddNewGuardianWhenNotOwner() external {
        // given
        bool isGuardianBefore = AccessControl(_router).isPauseGuardian(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.CALLER_NOT_OWNER));
        AccessControl(_router).addPauseGuardian(_userOne);

        // then
        bool isGuardianAfter = AccessControl(_router).isPauseGuardian(_userOne);

        assertFalse(isGuardianBefore, "userOne should not be guardian");
        assertFalse(isGuardianAfter, "userOne should not be guardian");
    }

    function testShouldBeAbleToRemoveGuardian() external {
        // given
        vm.prank(_owner);
        AccessControl(_router).addPauseGuardian(_userOne);
        bool isGuardianBefore = AccessControl(_router).isPauseGuardian(_userOne);

        // when
        vm.prank(_owner);
        AccessControl(_router).removePauseGuardian(_userOne);

        // then
        bool isGuardianAfter = AccessControl(_router).isPauseGuardian(_userOne);

        assertTrue(isGuardianBefore, "userOne should be guardian");
        assertFalse(isGuardianAfter, "userOne should not be guardian");
    }

    function testShouldNotBeAbleToRemoveGuardianWhenNotOwner() external {
        // given
        vm.prank(_owner);
        AccessControl(_router).addPauseGuardian(_userOne);
        bool isGuardianBefore = AccessControl(_router).isPauseGuardian(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.CALLER_NOT_OWNER));
        AccessControl(_router).removePauseGuardian(_userOne);

        // then
        bool isGuardianAfter = AccessControl(_router).isPauseGuardian(_userOne);

        assertTrue(isGuardianBefore, "userOne should be guardian");
        assertTrue(isGuardianAfter, "userOne should be guardian");
    }

    function testShouldBeAbleToPause() external {
        // given
        uint256 isPausedBefore = AccessControl(_router).paused();

        // when
        vm.prank(_owner);
        AccessControl(_router).pause();

        // then
        uint256 isPausedAfter = AccessControl(_router).paused();

        assertTrue(isPausedBefore == 0, "should not be paused before");
        assertTrue(isPausedAfter == 1, "should be paused after");
    }

    function testShouldNotBeAbleToPauseWhenNotGuardian() external {
        // given
        uint256 isPausedBefore = AccessControl(_router).paused();

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.CALLER_NOT_GUARDIAN));
        AccessControl(_router).pause();

        // then
        uint256 isPausedAfter = AccessControl(_router).paused();

        assertTrue(isPausedBefore == 0, "should not be paused before");
        assertTrue(isPausedAfter == 0, "should not be paused after");
    }

    function testShouldBeAbleToUnpause() external {
        // given
        vm.prank(_owner);
        AccessControl(_router).pause();
        uint256 isPausedBefore = AccessControl(_router).paused();

        // when
        vm.prank(_owner);
        AccessControl(_router).unpause();

        // then
        uint256 isPausedAfter = AccessControl(_router).paused();

        assertTrue(isPausedBefore == 1, "should be paused before");
        assertTrue(isPausedAfter == 0, "should not be paused after");
    }

    function testShouldNotBeAbleToUnpauseWhenNotGuardian() external {
        // given
        vm.prank(_owner);
        AccessControl(_router).pause();
        uint256 isPausedBefore = AccessControl(_router).paused();

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.CALLER_NOT_OWNER));
        AccessControl(_router).unpause();

        // then
        uint256 isPausedAfter = AccessControl(_router).paused();

        assertTrue(isPausedBefore == 1, "should be paused before");
        assertTrue(isPausedAfter == 1, "should be paused after");
    }
}
