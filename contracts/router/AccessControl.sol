// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

contract AccessControl {
    address internal _owner;
    //    _paused = 1 means paused
    //    _paused = 0 means not paused
    uint256 internal _paused;

    uint256 internal constant _NOT_ENTERED = 1;
    uint256 internal constant _ENTERED = 2;
    uint256 internal _reentrancyStatus;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;

    function owner() external view returns (address) {
        return _owner;
    }

    function paused() external view returns (uint256) {
        return _paused;
    }

    function onlyOwner() internal view {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
    }

    function whenNotPaused() internal view {
        require(_paused == 0, "Pausable: paused");
    }

    function nonReentrant() internal view {
        require(_reentrancyStatus != _ENTERED, "ReentrancyGuard: reentrant call");
    }
}
