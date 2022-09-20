// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/JohnTypes.sol";

/// @title
interface IJohnInternal {
    /// @notice Returns current version of John (Liquidity Rewards) contract
    /// @return Current John (Liquidity Rewards) version
    function getVersion() external pure returns (uint256);

    /// @notice check if ipToken is supported
    /// @param ipToken address of ipToken to check
    /// @return true if is supported, false otherwise
    function isIpTokenSupported(address ipToken) external view returns (bool);

    /// @notice fetch global params for ipToken
    /// @param ipToken address for which ipToken should calculate rewards
    /// @return {JohnTypes.GlobalRewardsParams}
    function getGlobalParams(address ipToken)
        external
        view
        returns (JohnTypes.GlobalRewardsParams memory);

    /// @notice fetch user params for ipToken
    /// @param ipToken address for which ipToken should calculate rewards
    /// @return {JohnTypes.AccountRewardsParams}
    function getAccountParams(address ipToken)
        external
        view
        returns (JohnTypes.AccountRewardsParams memory);

    /// @notice method allowed to delegate power token to rewards contract
    /// @param account address which one delegate power tokens
    /// @param ipTokens to which power tokens should be delegated
    /// @param pwIporAmount which should be assigns to assets , represented in 18 decimals
    function delegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmount
    ) external;

    /// @notice method allowed to withdraw power token from rewards contract
    /// @param account address which one delegate power tokens
    /// @param ipToken from which you want to withdraw tokens
    /// @param pwIporAmount to withdraw, represented in 18 decimals
    function undelegatePwIpor(
        address account,
        address ipToken,
        uint256 pwIporAmount
    ) external;

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

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when Owner change rewards per block
    /// @param account account address
    /// @param newRewardsPerBlock new value of rewards per block, represented in 8 decimals
    event RewardsPerBlockChanged(address account, uint256 newRewardsPerBlock);

    /// @notice Emitted when user added new token
    /// @param account address
    /// @param ipToken address of ipToken
    event IpTokenAdded(address account, address ipToken);

    /// @notice Emitted when user removed token
    /// @param account address
    /// @param ipToken address of ipToken
    event IpTokenRemoved(address account, address ipToken);

    /// @notice Emitted when user delegate power token to rewards contract
    /// @param account account address
    /// @param ipToken address of ipToken which should be unstake
    /// @param ipTokenAmount of ipTokens to unstake, represented in 18 decimals
    event DelegatePwIpor(address account, address ipToken, uint256 ipTokenAmount);

    /// @notice Emitted when user undelegate power token from John contract
    /// @param account account address
    /// @param ipToken address of ipToken
    /// @param ipTokenAmount of power token to withdraw, represented in 18 decimals
    event UndelegatePwIpor(address account, address ipToken, uint256 ipTokenAmount);
}
