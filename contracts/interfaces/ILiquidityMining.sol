// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "./types/LiquidityMiningTypes.sol";

/// @title Interface for interaction with LiquidityMining.
/// LiquidityMining is responsible for distribution power token rewards across accounts contributed in Protocol
/// by staking lpTokens and / or delegating Power Tokens to LiquidityMining. LpTokens can be staked directly to LiquidityMining,
/// Power Tokens account can get stake Staked Tokens in PowerToken smart contract.
interface ILiquidityMining {
    /// @notice Contract id. This is the keccak-256 hash of "io.ipor.LiquidityMining" subtracted by 1
    /// @return Returns id of contract
    function getContractId() external pure returns (bytes32);

    /// @notice Returns balance of staked lpTokens
    /// @param account account address
    /// @param lpToken address of lpToken
    /// @return balance of lpTokens staked by sender
    function balanceOf(address account, address lpToken) external view returns (uint256);

    /// @notice Returns balance of delegated Power Tokens for a given `account` and list of lpToken addresses.
    /// @param account address for which we want get information about balance of delegated Power Tokens
    /// @param lpTokens list of lpTokens addresses(lpTokens) for which we want fetch balances
    /// @return balances list of {LiquidityMiningTypes.DelegatedPwTokenBalance} structure, with information how much Power Token is delegated per lpToken address.
    function balanceOfDelegatedPwToken(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances);

    /// @notice Gets account allocated rewards
    /// @param account address for which we want get information about balance of allocated power tokens
    /// @return allocatedPwTokens - amount of allocated rewards.
    function balanceOfAllocatedPwTokens(address account)
        external
        view
        returns (uint256 allocatedPwTokens);

    /// @notice Calculate accrued rewards from last rebalance saved in storage
    /// @param lpToken lpToken address
    /// @return accrued rewards from last rebalance saved in storage, represented in 18 decimals.
    function calculateAccruedRewards(address lpToken) external view returns (uint256);

    /// @notice Calculates account rewards based on current state of sender and global indicators.
    /// @dev Calculation not consider accrued values at current block
    /// @param account address for which we want get information about rewards
    /// @param lpToken address for which asset should calculate rewards
    /// @return Sender's rewards, represented in 18 decimals.
    function calculateAccountRewards(address account, address lpToken)
        external
        view
        returns (uint256);

    /// @notice Stakes lpToken amount into LiquidityMining.
    /// @param lpToken address for a specific asset
    /// @param lpTokenAmount lpToken amount being staked, represented in 18 decimals
    function stake(address lpToken, uint256 lpTokenAmount) external;

    /// @notice Unstakes lpToken amount from LiquidityMining.
    /// @param lpToken address for a specific underlying asset
    /// @param lpTokenAmount lpToken amount being unstaked, represented in 18 decimals
    function unstake(address lpToken, uint256 lpTokenAmount) external;

    /// @notice Unstakes lpToken amount from LiquidityMining and allocate rewards into storage.
    /// @param lpToken address for a specific underlying asset
    /// @param lpTokenAmount lpToken amount being unstaked, represented in 18 decimals
    function unstakeAndAllocatePwTokens(address lpToken, uint256 lpTokenAmount) external;

    /// @notice method allowed to claim rewards per asset
    /// @param lpToken from which you want claim rewards
    function claim(address lpToken) external;

    /// @notice method allowed to claim allocated rewards
    function claimAllocatedPwTokens() external;

    /// @notice Emitted when account stake lpToken
    /// @param account account address in the context of which activities of staking lpTokens are performed
    /// @param lpToken address of lpToken which should be stake
    /// @param lpTokenAmount of lpTokens to stake, represented in 18 decimals
    event LpTokensStaked(address account, address lpToken, uint256 lpTokenAmount);

    /// @notice Emitted when account claim rewards
    /// @param account account address in the context of which activities of claiming are performed
    /// @param lpToken address of lpToken
    /// @param rewardsAmount reward amount in pwToken, represented in 18 decimals
    event Claimed(address account, address lpToken, uint256 rewardsAmount);

    /// @notice Emitted when account claim allocated rewards
    /// @param account account address in the context of which activities of claiming are performed
    /// @param allocatedRewards reward amount in pwToken, represented in 18 decimals
    event AllocatedTokensClaimed(address account, uint256 allocatedRewards);
}
