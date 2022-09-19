// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/JohnTypes.sol";

/// @title
interface IJohn {
    /// @notice check balance of staked ipTokens
    /// @param ipToken address of ipToken
    /// @return balance of ipToken stake
    function balanceOf(address ipToken) external view returns (uint256);

    /// @notice fetch balance of power tokens related to token(ipToken)
    /// @param account address for which we want get balance
    /// @param ipTokens list of ipTokens addresses(ipTokens) for which we want fetch balances
    /// @return {JohnTypes.BalanceOfDelegatedPwIpor}
    function balanceOfDelegatedPwIpor(address account, address[] memory ipTokens)
        external
        view
        returns (JohnTypes.BalanceOfDelegatedPwIpor memory);

    /// @notice fetch rewards per block for asset
    /// @param ipToken address for which asset should fetch constant
    function getRewardsPerBlock(address ipToken) external view returns (uint32);

    /// @notice Calculate accrued rewards
    /// @param ipToken address for which asset should calculate rewards
    /// @return accrued rewards, represented in 18 decimals.
    function calculateAccruedRewards(address ipToken) external view returns (uint256);

    /// @notice Calculate account rewards
    /// @param ipToken address for which asset should calculate rewards
    /// @return Current account rewards, represented in 18 decimals.
    function calculateAccountRewards(address ipToken) external view returns (uint256);

    /// @notice method allowed to stake ipTokens into rewards contract
    /// @param ipToken address of ipToken which should be stake
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    function stake(address ipToken, uint256 ipTokenAmount) external;

    /// @notice method allowed to unstake ipTokens from rewards contract
    /// @param ipToken address of ipToken which should be stake
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    function unstake(address ipToken, uint256 ipTokenAmount) external;

    /// @notice method allowed to claim rewards per asset
    /// @param ipToken from which you want claim rewards
    function claim(address ipToken) external;

    /// @notice Emitted when user stake ipToken
    /// @param account account address
    /// @param ipToken address of ipToken which should be stake
    /// @param account of ipTokens to stake, represented in 18 decimals
    event StakeIpTokens(address account, address ipToken, uint256 amount);

    /// @notice Emitted when user unstake ipTokens
    /// @param account account address
    /// @param ipToken address of ipToken which should be stake
    /// @param amount of ipTokens to stake, represented in 18 decimals
    event UnstakeIpTokens(address account, address ipToken, uint256 amount);

    /// @notice Emitted when user claim rewards
    /// @param account account address
    /// @param ipToken address of ipToken
    /// @param rewards amount, represented in 18 decimals
    event Claim(address account, address ipToken, uint256 rewards);
}
