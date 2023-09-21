// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

/// @title Storage IDs associated with the IPOR Protocol Router.
library StorageLib {
    uint256 constant STORAGE_SLOT_BASE = 1_000_000;

    // append only
    enum StorageId {
        /// @dev The address of the contract owner.
        Owner,
        AppointedOwner,
        Paused,
        PauseGuardians,
        ReentrancyStatus
    }

    struct OwnerStorage {
        address value;
    }

    struct AppointedOwnerStorage {
        address appointedOwner;
    }

    struct PausedStorage {
        uint256 value;
    }

    struct ReentrancyStatusStorage {
        uint256 value;
    }

    function getOwner() internal pure returns (OwnerStorage storage owner) {
        uint256 slot = _getStorageSlot(StorageId.Owner);
        assembly {
            owner.slot := slot
        }
    }

    function getAppointedOwner()
        internal
        pure
        returns (AppointedOwnerStorage storage appointedOwner)
    {
        uint256 slot = _getStorageSlot(StorageId.AppointedOwner);
        assembly {
            appointedOwner.slot := slot
        }
    }

    function getPaused() internal pure returns (PausedStorage storage paused) {
        uint256 slot = _getStorageSlot(StorageId.Paused);
        assembly {
            paused.slot := slot
        }
    }

    function getPauseGuardianStorage()
        internal
        pure
        returns (mapping(address => uint256) storage store)
    {
        uint256 slot = _getStorageSlot(StorageId.PauseGuardians);
        assembly {
            store.slot := slot
        }
    }

    function getReentrancyStatus() internal pure returns (ReentrancyStatusStorage storage status) {
        uint256 slot = _getStorageSlot(StorageId.ReentrancyStatus);
        assembly {
            status.slot := slot
        }
    }

    function _getStorageSlot(StorageId storageId) private pure returns (uint256 slot) {
        return uint256(storageId) + STORAGE_SLOT_BASE;
    }
}
