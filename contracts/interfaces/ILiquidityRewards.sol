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
    /// @notice method allowed to stake ipTokens into rewards contract
    /// @param asset address of ipToken which should be stake
    /// @param amount of ipTokens to stake, represented in 18 decimals
    function stake(address asset, uint256 amount) external;

    /// @notice method allowed to unstake ipTokens from rewards contract
    /// @param asset address of ipToken which should be stake
    /// @param amount of ipTokens to stake, represented in 18 decimals
    function unstake(address asset, uint256 amount) external;

    /// @notice method allowed to delegate power token to rewards contract
    /// @param user address which one delegate power tokens
    /// @param assets to which power tokens should be delegated
    /// @param amounts which should be assigns to assets , represented in 18 decimals
    function delegatePwIpor(
        address user,
        address[] memory assets,
        uint256[] memory amounts
    ) external;

    /// @notice method allowed to withdraw power token from rewards contract
    /// @param user address which one delegate power tokens
    /// @param asset from which you want to withdraw tokens
    /// @param amount to withdraw, represented in 18 decimals
    function withdrawFromDelegation(
        address user,
        address asset,
        uint256 amount
    ) external;

    /// @notice method allowed to claim rewords per asset
    /// @param asset from which you want claim rewords
    function claim(address asset) external;

    //    -------------------------------------------
    //    Events

    /// @notice Emitted when user stake ipToken
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param asset address of ipToken which should be stake
    /// @param amount of ipTokens to stake, represented in 18 decimals
    event StakeIpTokens(uint256 timestamp, address user, address asset, uint256 amount);

    /// @notice Emitted when user unstake ipTokens
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param asset address of ipToken which should be stake
    /// @param amount of ipTokens to stake, represented in 18 decimals
    event UnstakeIpTokens(uint256 timestamp, address user, address asset, uint256 amount);

    /// @notice Emitted when user delegate power token to rewards contract
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param asset address of ipToken which should be unstake
    /// @param amount of ipTokens to unstake, represented in 18 decimals
    event AddPwIporToBalance(uint256 timestamp, address user, address asset, uint256 amount);

    /// @notice Emitted when user withdraw power token from rewards contract
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param asset address of ipToken
    /// @param amount of power token to withdraw, represented in 18 decimals
    event WithdrawFromDelegation(uint256 timestamp, address user, address asset, uint256 amount);

    /// @notice Emitted when user claim rewards
    /// @param timestamp moment when method was execute
    /// @param user account address
    /// @param asset address of ipToken
    /// @param rewards amount, represented in 18 decimals
    event Claim(uint256 timestamp, address user, address asset, uint256 rewards);
}
