// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Interface of IporToken.
interface IIporToken is IERC20 {
    /**
     * @dev Contract id.
     * This is the keccak-256 hash of "io.ipor.IporToken" subtracted by 1
     */
    function getContractId() external pure returns (bytes32);
}
