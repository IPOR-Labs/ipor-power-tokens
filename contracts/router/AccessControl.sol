// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../libraries/errors/Errors.sol";
import "../security/StorageLib.sol";
import "../security/PauseManager.sol";

contract AccessControl {
    event AppointedToTransferOwnership(address indexed appointedOwner);
    event OwnershipTransferred(address indexed newOwner);

    uint256 internal constant _NOT_ENTERED = 1;
    uint256 internal constant _ENTERED = 2;

    /// @dev Throws error if called by any account other than the owner.
    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    /// @dev Throws error if called by any account other than the appointed owner.
    modifier onlyAppointedOwner() {
        require(
            address(StorageLib.getAppointedOwner().appointedOwner) == msg.sender,
            Errors.SENDER_NOT_APPOINTED_OWNER
        );
        _;
    }

    /// @dev Throws if called by any account other than the pause guardian.
    modifier onlyPauseGuardian() {
        require(PauseManager.isPauseGuardian(msg.sender), Errors.CALLER_NOT_GUARDIAN);
        _;
    }

    /// @notice Returns the address of the contract owner.
    /// @return The address of the contract owner.
    function owner() external view returns (address) {
        return StorageLib.getOwner().value;
    }

    /// @notice Transfers the ownership of the contract to a new appointed owner.
    /// @param newAppointedOwner The address of the new appointed owner.
    /// @dev Only the current contract owner can call this function.
    function transferOwnership(address newAppointedOwner) public onlyOwner {
        require(newAppointedOwner != address(0), Errors.WRONG_ADDRESS);
        StorageLib.AppointedOwnerStorage storage appointedOwnerStorage = StorageLib
            .getAppointedOwner();
        appointedOwnerStorage.appointedOwner = newAppointedOwner;
        emit AppointedToTransferOwnership(newAppointedOwner);
    }

    /// @notice Confirms the transfer of ownership by the appointed owner.
    /// @dev Only the appointed owner can call this function.
    function confirmTransferOwnership() public onlyAppointedOwner {
        StorageLib.AppointedOwnerStorage storage appointedOwnerStorage = StorageLib
            .getAppointedOwner();
        appointedOwnerStorage.appointedOwner = address(0);
        _transferOwnership(msg.sender);
    }

    /// @notice Renounces the ownership of the contract.
    /// @dev Only the contract owner can call this function.
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
        StorageLib.AppointedOwnerStorage storage appointedOwnerStorage = StorageLib
            .getAppointedOwner();
        appointedOwnerStorage.appointedOwner = address(0);
    }

    /// @notice Pauses the contract.
    /// @dev Only the pause guardian can call this function.
    function pause() external onlyPauseGuardian {
        _pause();
    }

    /// @notice Unpauses the contract.
    /// @dev Only the contract owner can call this function.
    function unpause() external onlyOwner {
        StorageLib.getPaused().value = 0;
    }

    /// @notice Returns the current pause status of the contract.
    /// @return The pause status represented as a uint256 value (0 for not paused, 1 for paused).
    function paused() external view returns (uint256) {
        return uint256(StorageLib.getPaused().value);
    }

    /// @notice Adds a new pause guardian to the contract.
    /// @param _guardian The address of the new pause guardian.
    /// @dev Only the contract owner can call this function.
    function addPauseGuardian(address _guardian) external onlyOwner {
        PauseManager.addPauseGuardian(_guardian);
    }

    /// @notice Removes a pause guardian from the contract.
    /// @param _guardian The address of the pause guardian to be removed.
    /// @dev Only the contract owner can call this function.
    function removePauseGuardian(address _guardian) external onlyOwner {
        PauseManager.removePauseGuardian(_guardian);
    }

    /// @notice Checks if an address is a pause guardian.
    /// @param guardian The address to be checked.
    /// @return A boolean indicating whether the address is a pause guardian (true) or not (false).
    function isPauseGuardian(address guardian) external view returns (bool) {
        return PauseManager.isPauseGuardian(guardian);
    }

    function _whenNotPaused() internal view {
        //TODO: use ipor standard error message
        require(uint256(StorageLib.getPaused().value) == 0, "Pausable: paused");
    }

    function _nonReentrant() internal view {
        require(
            uint256(StorageLib.getReentrancyStatus().value) != _ENTERED,
            //TODO: use ipor standard error message
            "ReentrancyGuard: reentrant call"
        );
    }

    function _enterReentrancy() internal {
        StorageLib.getReentrancyStatus().value = _ENTERED;
    }

    function _leaveReentrancy() internal {
        StorageLib.getReentrancyStatus().value = _NOT_ENTERED;
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        StorageLib.OwnerStorage storage ownerStorage = StorageLib.getOwner();
        ownerStorage.value = newOwner;
        emit OwnershipTransferred(newOwner);
    }

    function _pause() internal {
        StorageLib.getPaused().value = 1;
    }

    /// @dev Internal function to check if the sender is the contract owner.
    function _onlyOwner() internal view {
        require(
            address(StorageLib.getOwner().value) == msg.sender,
            //TODO: use one standard error message
            "Ownable: caller is not the owner"
        );
    }
}
