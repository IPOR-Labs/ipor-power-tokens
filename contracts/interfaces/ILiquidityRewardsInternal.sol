// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "./types/LiquidityRewardsTypes.sol";

/// @title
interface ILiquidityRewardsInternal {
    /// @notice fetch global params for ipAsset
    /// @param ipAsset address for which ipAsset should calculate rewards
    /// @return {LiquidityRewardsTypes.GlobalRewardsParams}
    function globalParams(address ipAsset)
        external
        view
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory);

    /// @notice fetch user params for ipAsset
    /// @param ipAsset address for which ipAsset should calculate rewards
    /// @return {LiquidityRewardsTypes.UserRewardsParams}
    function userParams(address ipAsset)
        external
        view
        returns (LiquidityRewardsTypes.UserRewardsParams memory);

    /// @notice method setup rewords per block
    /// @param ipAsset address for which one should setup rewords per block
    /// @param rewardsValue new value of rewards per block, represented in 8 decimals
    function setRewardsPerBlock(address ipAsset, uint32 rewardsValue) external;

    /// @notice method allowed to add new asset(ipToken)
    /// @param ipAsset address of ipToken
    function addAsset(address ipAsset) external;

    /// @notice method allowed to remove asset
    /// @param ipAsset address of ipToken
    function removeAsset(address ipAsset) external;

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
    /// @param user account address
    /// @param newRewardsPerBlock new value of rewards per block, represented in 8 decimals
    event RewardsPerBlockChanged(uint256 timestamp, address user, uint256 newRewardsPerBlock);

    /// @notice Emitted when user added new asset
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param asset address of ipToken
    event AssetAdded(uint256 timestamp, address user, address asset);

    /// @notice Emitted when user removed asset
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param asset address of ipToken
    event AssetRemoved(uint256 timestamp, address user, address asset);
}
