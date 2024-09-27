// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../libraries/errors/Errors.sol";

contract MiningOwnableUpgradeable is OwnableUpgradeable {
    address private _appointedOwner;

    event AppointedToTransferOwnership(address indexed appointedOwner);

    modifier onlyAppointedOwner() {
        require(_appointedOwner == msg.sender, Errors.SENDER_NOT_APPOINTED_OWNER);
        _;
    }

    function transferOwnership(address appointedOwner) public override onlyOwner {
        require(appointedOwner != address(0), Errors.WRONG_ADDRESS);
        _appointedOwner = appointedOwner;
        emit AppointedToTransferOwnership(appointedOwner);
    }

    function confirmTransferOwnership() public onlyAppointedOwner {
        _appointedOwner = address(0);
        _transferOwnership(msg.sender);
    }

    function renounceOwnership() public virtual override onlyOwner {
        _transferOwnership(address(0));
        _appointedOwner = address(0);
    }
}
