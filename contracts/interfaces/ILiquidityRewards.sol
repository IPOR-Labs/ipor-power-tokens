// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "./types/LiquidityRewardsTypes.sol";

/// @title
interface ILiquidityRewards {
    //    ----------------------------------------------
    //    Read
    /// @notice Returns current version of Liquidity Rewards contract
    /// @return Current Liquidity Rewards version
    function getVersion() external pure returns (uint256);

    /// @notice Calculate user rewords
    /// @param asset address for which asset should calculate rewards
    /// @return Current user rewards, represented in 18 decimals.
    function userRewards(address asset) external view returns (uint256);

    /// @notice Calculate accrued rewords
    /// @param asset address for which asset should calculate rewards
    /// @return accrued rewards, represented in 18 decimals.
    function accruedRewards(address asset) external view returns (uint256);

    /// @notice fetch global params for asset
    /// @param asset address for which asset should calculate rewards
    /// @return {LiquidityRewardsTypes.GlobalRewardsParams}
    function globalParams(address asset)
        external
        view
        returns (LiquidityRewardsTypes.GlobalRewardsParams memory);

    /// @notice fetch user params for asset
    /// @param asset address for which asset should calculate rewards
    /// @return {LiquidityRewardsTypes.UserRewardsParams}
    function userParams(address asset)
        external
        view
        returns (LiquidityRewardsTypes.UserRewardsParams memory);

    /// @notice fetch rewords per block for asset
    /// @param asset address for which asset should fetch constant
    function rewardsPerBlock(address asset) external view returns (uint32);

    /// @notice fetch balance of power tokens related to asset(ipToken)
    /// @param user address for which we want get balance
    /// @param requestAssets list of assets addresses(ipTokens) for which we want fetch balances
    /// @return {LiquidityRewardsTypes.BalanceOfDelegatedPwIpor}
    function balanceOfDelegatedPwIpor(address user, address[] memory requestAssets)
        external
        view
        returns (LiquidityRewardsTypes.BalanceOfDelegatedPwIpor memory);

    /// @notice check if asset is supported
    /// @param asset address of ipToken to check
    /// @return true if is supported, false otherwise
    function isAssetSupported(address asset) external view returns (bool);

    /// @notice check balance of staked ipTokens
    /// @param asset address of ipToken
    /// @return balance of ipToken stake
    function balanceOf(address asset) external view returns (uint256);

    //    -------------------------------------------
    //    write
    /// @notice method setup rewords per block
    /// @param asset address for which one should setup rewords per block
    /// @param rewardsValue new value of rewards per block
    function setRewardsPerBlock(address asset, uint32 rewardsValue) external;

    //    -------------------------------------------
    //    Events

    /// @notice Emitted when user change rewards per block
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param newRewardsPerBlock new value of rewards per block, represented in 8 decimals.
    event RewardsPerBlockChanged(uint256 timestamp, address user, uint256 newRewardsPerBlock);

    //

    function stake(address asset, uint256 amount) external;

    function delegatePwIpor(
        address user,
        address[] memory assets,
        uint256[] memory amounts
    ) external;

    function withdrawFromDelegation(
        address user,
        address asset,
        uint256 amount
    ) external;

    function addAsset(address asset) external;

    function removeAsset(address asset) external;

    function pause() external;

    function unpause() external;
}
