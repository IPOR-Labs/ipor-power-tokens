// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "./types/PowerTokenTypes.sol";

/// @title PowerToken smart contract interface
interface IPowerTokenInternal {
    /// @notice Returns the current version of the PowerToken smart contract
    /// @return Current PowerToken smart contract version
    function getVersion() external pure returns (uint256);

    /// @notice Gets the total supply base amount
    /// @return total supply base amount, represented with 18 decimals
    function totalSupplyBase() external view returns (uint256);

    /// @notice Calculates the internal exchange rate between the Staked Token and total supply of a base amount
    /// @return Current exchange rate between the Staked Token and the total supply of a base amount, represented with 18 decimals.
    function calculateExchangeRate() external view returns (uint256);

    /// @notice Method for seting up the unstaking fee
    /// @param unstakeWithoutCooldownFee fee percentage, represented with 18 decimals.
    function setUnstakeWithoutCooldownFee(uint256 unstakeWithoutCooldownFee) external;

    /// @notice method returning address of the Staked Token
    function getGovernanceToken() external view returns (address);

    /// @notice Pauses the smart contract, it can only be executed by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses the smart contract, it can only be executed by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Method for granting allowance to the Router
    /// @param erc20Token address of the ERC20 token
    function grantAllowanceForRouter(address erc20Token) external;

    /// @notice Method for revoking allowance to the Router
    /// @param erc20Token address of the ERC20 token
    function revokeAllowanceForRouter(address erc20Token) external;

    /// @notice Gets the power token cool down time in seconds.
    /// @return uint256 cool down time in seconds
    function COOL_DOWN_IN_SECONDS() external view returns (uint256);

    /// @notice Adds a new pause guardian to the contract.
    /// @param guardians The addresses of the new pause guardians.
    /// @dev Only the contract owner can call this function.
    function addPauseGuardians(address[] calldata guardians) external;

    /// @notice Removes a pause guardian from the contract.
    /// @param guardians The addresses of the pause guardians to be removed.
    /// @dev Only the contract owner can call this function.
    function removePauseGuardians(address[] calldata guardians) external;

    /// @notice Checks if an address is a pause guardian.
    /// @param guardian The address to be checked.
    /// @return A boolean indicating whether the address is a pause guardian (true) or not (false).
    function isPauseGuardian(address guardian) external view returns (bool);

    /// @notice Emitted when the user receives rewards from the LiquidityMining
    /// @dev Receiving rewards does not change Internal Exchange Rate of Power Tokens in PowerToken smart contract.
    /// @param account address
    /// @param rewardsAmount amount of Power Tokens received from LiquidityMining
    event RewardsReceived(address account, uint256 rewardsAmount);

    /// @notice Emitted when the fee for immediate unstaking is modified.
    /// @param newFee new value of the fee, represented with 18 decimals
    event UnstakeWithoutCooldownFeeChanged(uint256 newFee);

    /// @notice Emmited when PauseManager's address had been changed by its owner.
    /// @param newLiquidityMining PauseManager's new address
    event LiquidityMiningChanged(address indexed newLiquidityMining);

    /// @notice Emmited when the PauseManager's address is changed by its owner.
    /// @param newPauseManager PauseManager's new address
    event PauseManagerChanged(address indexed newPauseManager);

    /// @notice Emitted when owner grants allowance for router
    /// @param erc20Token address of ERC20 token
    /// @param router address of router
    event AllowanceGranted(address indexed erc20Token, address indexed router);

    /// @notice Emitted when owner revokes allowance for router
    /// @param erc20Token address of ERC20 token
    /// @param router address of router
    event AllowanceRevoked(address indexed erc20Token, address indexed router);
}
