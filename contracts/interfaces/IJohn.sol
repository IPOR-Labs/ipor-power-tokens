// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/JohnTypes.sol";

/// @title Interface for interaction with John.
/// John is responsible for distribution IPOR token rewards across accounts contributed in IPOR Protocol
/// by staking ipTokens and / or delegating Power Ipor Tokens to John. IpTokens can be staked directly to John,
/// Power Ipor Tokens account can get stake IPOR Tokens in PowerIpor smart contract.
interface IJohn {
    /// @notice Contract id. This is the keccak-256 hash of "io.ipor.John" subtracted by 1
    /// @return Returns id of contract
    function getContractId() external pure returns (bytes32);

    /// @notice Returns balance of staked ipTokens
    /// @param account account address
    /// @param ipToken address of ipToken (ipUSDT, ipUSDC, ipDAI etc.)
    /// @return balance of ipTokens staked by sender
    function balanceOf(address account, address ipToken) external view returns (uint256);

    /// @notice Returns balance of delegated Power Ipor Tokens for a given `account` and list of ipToken addresses.
    /// @param account address for which we want get information about balance of delegated Power Ipor Tokens
    /// @param ipTokens list of ipTokens addresses(ipTokens) for which we want fetch balances
    /// @return balances list of {JohnTypes.DelegatedPwIporBalance} structure, with information how much Power Ipor Token is delegated per ipToken address.
    function balanceOfDelegatedPwIpor(address account, address[] memory ipTokens)
        external
        view
        returns (JohnTypes.DelegatedPwIporBalance[] memory balances);

    /// @notice Gets account allocated rewards
    /// @param account address for which we want get information about balance of allocated power tokens
    /// @return allocatedPwTokens - amount of allocated rewards.
    function balanceOfAllocatedPwTokens(address account)
        external
        view
        returns (uint256 allocatedPwTokens);

    /// @notice Calculate accrued rewards from last rebalance saved in storage
    /// @param ipToken ipToken address
    /// @return accrued rewards from last rebalance saved in storage, represented in 18 decimals.
    function calculateAccruedRewards(address ipToken) external view returns (uint256);

    /// @notice Calculates account rewards based on current state of sender and global indicators.
    /// @dev Calculation not consider accrued values at current block
    /// @param account address for which we want get information about rewards
    /// @param ipToken address for which asset should calculate rewards
    /// @return Sender's rewards, represented in 18 decimals.
    function calculateAccountRewards(address account, address ipToken)
        external
        view
        returns (uint256);

    /// @notice Stakes ipToken amount into John.
    /// @param ipToken address for a specific asset (ipUSDT, ipUSDC, ipDAI, etc.)
    /// @param ipTokenAmount ipToken amount being staked, represented in 18 decimals
    function stake(address ipToken, uint256 ipTokenAmount) external;

    /// @notice Unstakes ipToken amount from John.
    /// @param ipToken address for a specific underlying asset (ipUSDT, ipUSDC, ipDAI, etc.)
    /// @param ipTokenAmount ipToken amount being unstaked, represented in 18 decimals
    function unstake(address ipToken, uint256 ipTokenAmount) external;

    /// @notice Unstakes ipToken amount from John and allocate rewards into storage.
    /// @param ipToken address for a specific underlying asset (ipUSDT, ipUSDC, ipDAI, etc.)
    /// @param ipTokenAmount ipToken amount being unstaked, represented in 18 decimals
    function unstakeAndAllocatePwTokens(address ipToken, uint256 ipTokenAmount) external;

    /// @notice method allowed to claim rewards per asset
    /// @param ipToken from which you want claim rewards
    function claim(address ipToken) external;

    /// @notice method allowed to claim allocated rewards
    function claimAllocatedPwTokens() external;

    /// @notice Emitted when account stake ipToken
    /// @param account account address in the context of which activities of staking ipTokens are performed
    /// @param ipToken address of ipToken which should be stake
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    event StakeIpTokens(address account, address ipToken, uint256 ipTokenAmount);

    /// @notice Emitted when account claim rewards
    /// @param account account address in the context of which activities of claiming are performed
    /// @param ipToken address of ipToken
    /// @param iporTokenAmount reward amount in Ipor Token, represented in 18 decimals
    event Claim(address account, address ipToken, uint256 iporTokenAmount);

    /// @notice Emitted when account claim allocated rewards
    /// @param account account address in the context of which activities of claiming are performed
    /// @param iporTokenAmount reward amount in Ipor Token, represented in 18 decimals
    event ClaimAllocatedTokens(address account, uint256 iporTokenAmount);
}
