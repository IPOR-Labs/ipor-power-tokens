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

    /// @notice Calculate user rewards
    /// @param ipToken address for which asset should calculate rewards
    /// @return Current user rewards, represented in 18 decimals.
    function userRewards(address ipToken) external view returns (uint256);

    /// @notice Calculate accrued rewards
    /// @param ipToken address for which asset should calculate rewards
    /// @return accrued rewards, represented in 18 decimals.
    function accruedRewards(address ipToken) external view returns (uint256);

    /// @notice fetch rewards per block for asset
    /// @param ipToken address for which asset should fetch constant
    function rewardsPerBlock(address ipToken) external view returns (uint32);

    /// @notice fetch balance of power tokens related to asset(ipToken)
    /// @param account address for which we want get balance
    /// @param requestIpTokens list of ipTokens addresses(ipTokens) for which we want fetch balances
    /// @return {LiquidityRewardsTypes.BalanceOfDelegatedPwIpor}
    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        returns (LiquidityRewardsTypes.BalanceOfDelegatedPwIpor memory);

    /// @notice check if asset is supported
    /// @param ipToken address of ipToken to check
    /// @return true if is supported, false otherwise
    function isAssetSupported(address ipToken) external view returns (bool);

    /// @notice check balance of staked ipTokens
    /// @param ipToken address of ipToken
    /// @return balance of ipToken stake
    function balanceOf(address ipToken) external view returns (uint256);

    //    -------------------------------------------
    //    write
    /// @notice method allowed to stake ipTokens into rewards contract
    /// @param ipToken address of ipToken which should be stake
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    function stake(address ipToken, uint256 ipTokenAmount) external;

    /// @notice method allowed to unstake ipTokens from rewards contract
    /// @param ipToken address of ipToken which should be stake
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    function unstake(address ipToken, uint256 ipTokenAmount) external;

    /// @notice method allowed to delegate power token to rewards contract
    /// @param account address which one delegate power tokens
    /// @param ipTokens to which power tokens should be delegated
    /// @param pwTokenAmounts which should be assigns to assets , represented in 18 decimals
    function delegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwTokenAmounts
    ) external;

    /// @notice method allowed to withdraw power token from rewards contract
    /// @param account address which one delegate power tokens
    /// @param ipToken from which you want to withdraw tokens
    /// @param pwTokenAmount to withdraw, represented in 18 decimals
    function withdrawFromDelegation(
        address account,
        address ipToken,
        uint256 pwTokenAmount
    ) external;

    /// @notice method allowed to claim rewards per asset
    /// @param ipToken from which you want claim rewards
    function claim(address ipToken) external;

    //    -------------------------------------------
    //    Events

    /// @notice Emitted when user stake ipToken
    /// @param timestamp moment when method was execute
    /// @param account account address
    /// @param ipToken address of ipToken which should be stake
    /// @param account of ipTokens to stake, represented in 18 decimals
    event StakeIpTokens(uint256 timestamp, address account, address ipToken, uint256 amount);

    /// @notice Emitted when user unstake ipTokens
    /// @param timestamp moment when method was execute
    /// @param account account address
    /// @param ipToken address of ipToken which should be stake
    /// @param amount of ipTokens to stake, represented in 18 decimals
    event UnstakeIpTokens(uint256 timestamp, address account, address ipToken, uint256 amount);

    /// @notice Emitted when user delegate power token to rewards contract
    /// @param timestamp moment when method was execute
    /// @param account account address
    /// @param ipToken address of ipToken which should be unstake
    /// @param amount of ipTokens to unstake, represented in 18 decimals
    event AddPwIporToBalance(uint256 timestamp, address account, address ipToken, uint256 amount);

    /// @notice Emitted when user withdraw power token from rewards contract
    /// @param timestamp moment when method was execute
    /// @param account account address
    /// @param ipToken address of ipToken
    /// @param amount of power token to withdraw, represented in 18 decimals
    event WithdrawFromDelegation(
        uint256 timestamp,
        address account,
        address ipToken,
        uint256 amount
    );

    /// @notice Emitted when user claim rewards
    /// @param timestamp moment when method was execute
    /// @param account account address
    /// @param ipToken address of ipToken
    /// @param rewards amount, represented in 18 decimals
    event Claim(uint256 timestamp, address account, address ipToken, uint256 rewards);
}
