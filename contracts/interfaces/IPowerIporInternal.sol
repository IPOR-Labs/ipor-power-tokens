// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "./types/PowerIporTypes.sol";

/// @title
interface IPowerIporInternal {
    /// @notice Returns current version of Power Ipor smart contract
    /// @return Current Power Ipor smart contract version
    function getVersion() external pure returns (uint256);

    /// @notice Gets total supply base amount
    /// @return total supply base amount, represented in 18 decimals
    function totalSupplyBase() external view returns (uint256);

    /// @notice Calculates internal exchange rate between Ipor Token and total supply of a base amount
    /// @return Current exchange rate between Ipor Token and the total supply of a base amount, represented in 18 decimals.
    function calculateExchangeRate() external view returns (uint256);

    /// @notice Method setup unstake fee
    /// @param unstakeWithoutCooldownFee percentage of fee, represented in 18 decimals.
    function setUnstakeWithoutCooldownFee(uint256 unstakeWithoutCooldownFee) external;

    /// @notice method allowed to transfer rewards from LiquidityMining contracts to balance of specific account
    /// @param account - address of user who received rewards
    /// @param iporTokenAmount - amount of rewards, represented in 18 decimals.
    function receiveRewardsFromLiquidityMining(address account, uint256 iporTokenAmount) external;

    /// @notice method returns actual address of liquidity rewards contract - the LiquidityMining
    function getLiquidityMining() external view returns (address);

    /// @notice method returns actual address of IPOR Token
    function getIporToken() external view returns (address);

    /// @notice Gets Pause Manager address
    /// @return Pause Manager's address
    function getPauseManager() external view returns (address);

    /// @notice method setup address of LiquidityMining
    /// @param liquidityMining - new address of LiquidityMining contract
    function setLiquidityMining(address liquidityMining) external;

    /// @notice Sets new Pause Manager address
    /// @param newPauseManagerAddr - new address of Pauyse Manager
    function setPauseManager(address newPauseManagerAddr) external;

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when user received rewards from liquidityMining contract
    /// @dev Receiving rewards not changes Internal Exchange Rate of Power Ipor Tokens in Power Ipor smart contract.
    /// @param account address
    /// @param iporTokenAmount of power token received from liquidityMining
    event ReceiveRewards(address account, uint256 iporTokenAmount);

    /// @notice Emitted when new fee for unstaking without cool down is setup.
    /// @param changedBy account address who change this configuration param
    /// @param oldFee old value of fee, represented in 18 decimals
    /// @param newFee new value of fee, represented in 18 decimals
    event UnstakeWithoutCooldownFeeChanged(
        address indexed changedBy,
        uint256 oldFee,
        uint256 newFee
    );

    /// @notice Emmited when PauseManager's address is changed by its owner.
    /// @param changedBy account address that has changed LiquidityMining's address
    /// @param oldLiquidityMining PauseManager's old address
    /// @param newLiquidityMining PauseManager's new address
    event LiquidityMiningChanged(
        address indexed changedBy,
        address indexed oldLiquidityMining,
        address indexed newLiquidityMining
    );

    /// @notice Emmited when PauseManager's address is changed by its owner.
    /// @param changedBy account address that has changed LiquidityMining's address
    /// @param oldPauseManager PauseManager's old address
    /// @param newPauseManager PauseManager's new address
    event PauseManagerChanged(
        address indexed changedBy,
        address indexed oldPauseManager,
        address indexed newPauseManager
    );
}
