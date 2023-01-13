// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

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

    /// @notice method allowing for claiming of the rewards
    /// @param account - address of user claiming rewards
    /// @param rewardsAmount - amount of rewards, represented with 18 decimals.
    function receiveRewardsFromLiquidityMining(address account, uint256 rewardsAmount) external;

    /// @notice method returning address of liquidity rewards contract - the LiquidityMining
    function getLiquidityMining() external view returns (address);

    /// @notice method returning address of the Staked Token
    function getStakedToken() external view returns (address);

    /// @notice Gets the Pause Manager's address
    /// @return Pause Manager's address
    function getPauseManager() external view returns (address);

    /// @notice method for setting up the address of LiquidityMining
    /// @param liquidityMining - the new address of the LiquidityMining contract
    function setLiquidityMining(address liquidityMining) external;

    /// @notice Sets the new Pause Manager address
    /// @param newPauseManagerAddr - new Pause Manager's address
    function setPauseManager(address newPauseManagerAddr) external;

    /// @notice Pauses the smart contract, it can only be executed by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses the smart contract, it can only be executed by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when the user receives rewards from the liquidityMining
    /// @dev Receiving rewards does not change Internal Exchange Rate of Power Tokens in PowerToken smart contract.
    /// @param account address
    /// @param rewardsAmount amount of Power Tokens received from liquidityMining
    event RewardsReceived(address account, uint256 rewardsAmount);

    /// @notice Emitted when the fee for immediate unstaking is modified.
    /// @param changedBy account address that changed the configuration
    /// @param oldFee old value of the fee, represented with 18 decimals
    /// @param newFee new value of the fee, represented with 18 decimals
    event UnstakeWithoutCooldownFeeChanged(
        address indexed changedBy,
        uint256 oldFee,
        uint256 newFee
    );

    /// @notice Emmited when PauseManager's address had been changed by its owner.
    /// @param changedBy account address that has changed the LiquidityMining's address
    /// @param oldLiquidityMining PauseManager's old address
    /// @param newLiquidityMining PauseManager's new address
    event LiquidityMiningChanged(
        address indexed changedBy,
        address indexed oldLiquidityMining,
        address indexed newLiquidityMining
    );

    /// @notice Emmited when the PauseManager's address is changed by its owner.
    /// @param changedBy account address that has changed the LiquidityMining's address
    /// @param oldPauseManager PauseManager's old address
    /// @param newPauseManager PauseManager's new address
    event PauseManagerChanged(
        address indexed changedBy,
        address indexed oldPauseManager,
        address indexed newPauseManager
    );
}
