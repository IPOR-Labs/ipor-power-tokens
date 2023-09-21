// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import "./StorageLib.sol";

library PauseManager {
    function addPauseGuardians(address[] calldata guardians) internal {
        uint256 length = guardians.length;
        if (length == 0) {
            return;
        }
        mapping(address => uint256) storage pauseGuardians = StorageLib.getPauseGuardianStorage();
        for (uint256 i; i < length; ) {
            pauseGuardians[guardians[i]] = 1;
            unchecked {
                ++i;
            }
        }
        emit PauseGuardiansAdded(guardians);
    }

    function removePauseGuardians(address[] calldata guardians) internal {
        uint256 length = guardians.length;
        if (length == 0) {
            return;
        }
        mapping(address => uint256) storage pauseGuardians = StorageLib.getPauseGuardianStorage();

        for (uint256 i; i < length; ) {
            pauseGuardians[guardians[i]] = 0;
            unchecked {
                ++i;
            }
        }
        emit PauseGuardiansRemoved(guardians);
    }

    function isPauseGuardian(address _guardian) internal view returns (bool) {
        mapping(address => uint256) storage pauseGuardians = StorageLib.getPauseGuardianStorage();
        return pauseGuardians[_guardian] == 1;
    }

    event PauseGuardiansAdded(address[] indexed guardians);

    event PauseGuardiansRemoved(address[] indexed guardians);
}
