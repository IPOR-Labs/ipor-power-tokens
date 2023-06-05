// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import "./StorageLib.sol";

library PauseManager {
    function addPauseGuardian(address _guardian) internal {
        mapping(address => uint256) storage pauseGuardians = StorageLib.getPauseGuardianStorage();
        pauseGuardians[_guardian] = 1;
        emit PauseGuardianAdded(_guardian);
    }

    function removePauseGuardian(address _guardian) internal {
        mapping(address => uint256) storage pauseGuardians = StorageLib.getPauseGuardianStorage();
        pauseGuardians[_guardian] = 0;
        emit PauseGuardianRemoved(_guardian);
    }

    function isPauseGuardian(address _guardian) internal view returns (bool) {
        mapping(address => uint256) storage pauseGuardians = StorageLib.getPauseGuardianStorage();
        return pauseGuardians[_guardian] == 1;
    }

    event PauseGuardianAdded(address indexed guardian);

    event PauseGuardianRemoved(address indexed guardian);
}
