// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Interface of the Staked Token.
interface IGovernanceToken is IERC20 {
    /**
     * @dev Contract id.
     * The keccak-256 hash of "io.ipor.IporToken" decreased by 1
     */
    function getContractId() external pure returns (bytes32);
}
