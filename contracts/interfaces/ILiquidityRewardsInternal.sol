// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "./types/LiquidityRewardsTypes.sol";

/// @title
interface ILiquidityRewardsInternal {
    /// @notice fetch global params for ipAsset
    /// @param ipToken address for which ipAsset should calculate rewards
    /// @return {LiquidityRewardsTypes.GlobalRewardsParams}
    function globalParams(address ipToken)
        external
        view
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory);

    /// @notice fetch user params for ipAsset
    /// @param ipToken address for which ipAsset should calculate rewards
    /// @return {LiquidityRewardsTypes.AccountRewardsParams}
    function accountParams(address ipToken)
        external
        view
        returns (LiquidityRewardsTypes.AccountRewardsParams memory);

    /// @notice method setup rewards per block
    /// @param ipToken address for which one should setup rewards per block
    /// @param rewardsValue new value of rewards per block, represented in 8 decimals
    function setRewardsPerBlock(address ipToken, uint32 rewardsValue) external;

    /// @notice method allowed to add new asset(ipToken)
    /// @param ipToken address of ipToken
    function addAsset(address ipToken) external;

    /// @notice method allowed to remove asset
    /// @param ipToken address of ipToken
    function removeAsset(address ipToken) external;

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    //    -------------------------------------------
    //    Events

    /// @notice Emitted when user change rewards per block
    /// @param timestamp moment when method was execute
    /// @param account account address
    /// @param newRewardsPerBlock new value of rewards per block, represented in 8 decimals
    event RewardsPerBlockChanged(uint256 timestamp, address account, uint256 newRewardsPerBlock);

    /// @notice Emitted when user added new asset
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param ipToken address of ipToken
    event AssetAdded(uint256 timestamp, address account, address ipToken);

    /// @notice Emitted when user removed asset
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param ipToken address of ipToken
    event AssetRemoved(uint256 timestamp, address account, address ipToken);
}
