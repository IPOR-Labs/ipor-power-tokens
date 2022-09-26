// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/JohnTypes.sol";

/// @title Interface to interact with John smart contract. Mainly technical methods or methods used by PowerIpor smart contract.
interface IJohnInternal {
    /// @notice Returns current version of John (Liquidity Rewards) contract
    /// @return Current John (Liquidity Rewards) version
    function getVersion() external pure returns (uint256);

    /// @notice Checks if ipToken is supported in liquidity mining module.
    /// @param ipToken ipToken address
    /// @return returns true if is supported by John, false otherwise
    function isIpTokenSupported(address ipToken) external view returns (bool);

    /// @notice Gets global indicators for given ipToken
    /// @param ipToken ipToken address
    /// @return {JohnTypes.GlobalRewardsIndicators} structure with global indicators used in rewards calculation.
    function getGlobalIndicators(address ipToken)
        external
        view
        returns (JohnTypes.GlobalRewardsIndicators memory);

    /// @notice Gets sender rewards indicators for a given ipToken
    /// @param ipToken ipToken address
    /// @return {JohnTypes.AccountRewardsIndicators} structure with sender rewards indicators used in rewards calculation.
    function getAccountIndicators(address ipToken)
        external
        view
        returns (JohnTypes.AccountRewardsIndicators memory);

    /// @notice Delegates Power Ipor Tokens from a given account to John smart contract.
    /// @param account account address who want to delegate its own Power Ipor Tokens to John
    /// @param ipTokens list of ipToken addresses to which delegated Power Ipor Tokens are transfered
    /// @param pwIporAmount list of Power Ipor amounts for which should be assigns to given ipTokens defined above, represented in 18 decimals
    function delegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmount
    ) external;

    /// @notice Delegates Power Ipor Tokens an stake ipTokens to John.
    /// @param account account address who want to delegate its Power Ipor Tokens and stake ipTokens to John
    /// @param ipTokens list of ipToken addresses to which delegated Power Ipor Tokens are transfered
    /// @param pwIporAmounts list of Power Ipor Token amounts which should be assign to ipTokens defined above , represented in 18 decimals
    /// @param ipTokenAmounts list of ipToken amounts which should be stake to john, represented in 18 decimals
    function delegatePwIporAndStakeIpToken(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts,
        uint256[] memory ipTokenAmounts
    ) external;

    /// @notice Undelegates Power Ipor Tokens from John
    /// @param account address which one undelegate Power Ipor Tokens
    /// @param ipTokens list of ipTokens from which you want to undelegate Power Ipor Tokens
    /// @param pwIporAmounts list of amounts of Power Ipor Tokens which will be undelegated, represented in 18 decimals
    function undelegatePwIpor(
        address account,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts
    ) external;

    /// @notice Sets global configuration indicator rewardsPerBlock for a given ipToken
    /// @param ipToken address for which one should setup rewards per block
    /// @param iporTokenAmount new value of rewards per block, Ipor token amount, represented in 8 decimals
    function setRewardsPerBlock(address ipToken, uint32 iporTokenAmount) external;

    /// @notice Adds new supported by John ipToken asset
    /// @dev Can be executed only by the Owner
    /// @param ipToken address of ipToken asset
    function addIpTokenAsset(address ipToken) external;

    /// @notice Remove ipToken asset from list of supported ipTokens in John smart contract
    /// @dev Can be executed only by the Owner
    /// @param ipToken address of ipToken asset
    function removeIpTokenAsset(address ipToken) external;

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when John's Owner change rewards per block, the number of Ipor tokens per block.
    /// @param changedBy address of account who execute changes
    /// @param oldIporTokenAmount old value of rewards per block, Ipor token amount, represented in 8 decimals
    /// @param newIporTokenAmount new value of rewards per block, Ipor token amount, represented in 8 decimals
    event RewardsPerBlockChanged(
        address indexed changedBy,
        uint256 oldIporTokenAmount,
        uint256 newIporTokenAmount
    );

    /// @notice Emitted when John's Owner add new ipToken asset which is going to be supported by John
    /// @param account address of current John's Owner
    /// @param ipToken address of ipToken
    event IpTokenAdded(address account, address ipToken);

    /// @notice Emitted when John's Owner remove ipToken asset which is going to be not supported by John
    /// @param account address of current John's Owner
    /// @param ipToken address of ipToken
    event IpTokenRemoved(address account, address ipToken);

    /// @notice Emitted when account delegates Power Ipor Tokens to John
    /// @param account account address in the context of which activities of delegation are performed
    /// @param ipToken address of ipToken for which Power Ipor Token are delegated
    /// @param ipTokenAmount amount of ipTokens delegated to John, represented in 18 decimals
    event DelegatePwIpor(address account, address ipToken, uint256 ipTokenAmount);

    /// @notice Emitted when account delegates Power Ipor Tokens and stake ipTokens to the John
    /// @param account account address in the context of which activities of delegation and staking are performed
    /// @param ipToken address of ipToken which should be unstake
    /// @param pwIporAmount of Power Ipor Token to delegate, represented in 18 decimals
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    event DelegatePwIporAndStakeIpToken(
        address account,
        address ipToken,
        uint256 pwIporAmount,
        uint256 ipTokenAmount
    );

    /// @notice Emitted when account undelegate Power Ipor Tokens from John contract
    /// @param account account address in the context of which activities of undelegation are performed
    /// @param ipToken address of ipToken
    /// @param ipTokenAmount amount of Power Ipor Token which was undelegated, represented in 18 decimals
    event UndelegatePwIpor(address account, address ipToken, uint256 ipTokenAmount);
}
