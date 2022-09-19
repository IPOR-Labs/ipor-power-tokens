// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/JohnTypes.sol";

/// @title
interface IJohnInternal {
    /// @notice Returns current version of John (Liquidity Rewards) contract
    /// @return Current John (Liquidity Rewards) version
    function getVersion() external pure returns (uint256);

    /// @notice fetch global params for ipToken
    /// @param ipToken address for which ipToken should calculate rewards
    /// @return {JohnTypes.GlobalRewardsParams}
    function globalParams(address ipToken)
        external
        view
        returns (JohnTypes.GlobalRewardsParams memory);

    /// @notice fetch user params for ipToken
    /// @param ipToken address for which ipToken should calculate rewards
    /// @return {JohnTypes.AccountRewardsParams}
    function accountParams(address ipToken)
        external
        view
        returns (JohnTypes.AccountRewardsParams memory);

    /// @notice method setup rewards per block
    /// @param ipToken address for which one should setup rewards per block
    /// @param rewardsValue new value of rewards per block, represented in 8 decimals
    function setRewardsPerBlock(address ipToken, uint32 rewardsValue) external;

    /// @notice method allowed to add new token(ipToken)
    /// @param ipToken address of ipToken
    function addIpToken(address ipToken) external;

    /// @notice method allowed to remove token
    /// @param ipToken address of ipToken
    function removeIpToken(address ipToken) external;

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

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    //    -------------------------------------------
    //    Events

    /// @notice Emitted when Owner change rewards per block
    /// @param timestamp moment when method was execute
    /// @param account account address
    /// @param newRewardsPerBlock new value of rewards per block, represented in 8 decimals
    event RewardsPerBlockChanged(uint256 timestamp, address account, uint256 newRewardsPerBlock);

    /// @notice Emitted when user added new token
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param ipToken address of ipToken
    event IpTokenAdded(uint256 timestamp, address account, address ipToken);

    /// @notice Emitted when user removed token
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param ipToken address of ipToken
    event IpTokenRemoved(uint256 timestamp, address account, address ipToken);

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
}
