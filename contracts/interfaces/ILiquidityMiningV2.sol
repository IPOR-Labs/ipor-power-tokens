// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "./types/LiquidityMiningTypes.sol";
import "../mining/LiquidityMiningV2.sol";

/// @title The interface for interaction with the LiquidityMining.
/// LiquidityMining is responsible for the distribution of the Power Token rewards to accounts
/// staking lpTokens and / or delegating Power Tokens to LiquidityMining. LpTokens can be staked directly to the LiquidityMining,
/// Power Tokens are a staked version of the [Staked] Tokens minted by the PowerToken smart contract.
interface ILiquidityMiningV2 {
    /// @notice Contract ID. The keccak-256 hash of "io.ipor.LiquidityMining" decreased by 1
    /// @return Returns an ID of the contract
    function getContractId() external pure returns (bytes32);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Returns the balance of staked lpTokens
    /// @param account the account's address
    /// @param lpToken the address of lpToken
    /// @return balance of the lpTokens staked by the sender
    function balanceOf(address account, address lpToken) external view returns (uint256);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice It returns the balance of delegated Power Tokens for a given `account` and the list of lpToken addresses.
    /// @param account address for which to fetch the information about balance of delegated Power Tokens
    /// @param lpTokens list of lpTokens addresses(lpTokens)
    /// @return balances list of {LiquidityMiningTypes.DelegatedPwTokenBalance} structure, with information how much Power Token is delegated per lpToken address.
    function balanceOfDelegatedPwToken(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Gets the account's allocated rewards
    /// @param account The address for which to fetch information about balance of allocated Power Tokens
    /// @return allocatedPwTokens - The amount of the allocated rewards.
    function balanceOfAllocatedPwTokens(address account)
        external
        view
        returns (uint256 allocatedPwTokens);

    // todo removed

    /// @notice Calculates the accrued rewards since the last rebalancing.
    /// @param lpToken the lpToken address
    /// @return rewards accrued since the last rebalancing, represented with 18 decimals.
    function calculateAccruedRewards(address lpToken) external view returns (uint256);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Calculates account's rewards based on the current state of the sender and global indicators.
    /// @dev Calculation does not consider rewards accrued for the current block
    /// @param account address for which the rewards are calculated
    /// @param lpToken address for which the rewards are calculated
    /// @return Sender's rewards, represented with 18 decimals.
    function calculateAccountRewards(address account, address lpToken)
        external
        view
        returns (uint256);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Stakes the lpToken amount into the LiquidityMining.
    /// @param lpToken address of the lpToken
    /// @param lpTokenAmount lpToken amount being staked, represented with 18 decimals
    function stake(address lpToken, uint256 lpTokenAmount) external;

    // todo StakeService
    // [x] - sequence diagrams
    // [ ] - implemented

    /// @notice Unstakes the lpToken amount from the LiquidityMining.
    /// @param lpToken address of the underlying asset
    /// @param lpTokenAmount lpToken amount being unstaked, represented with 18 decimals
    function unstake(address lpToken, uint256 lpTokenAmount) external;

    // todo StakeService
    // [x] - sequence diagrams
    // [ ] - implemented

    /// @notice Unstakes the lpToken amount from LiquidityMining and allocates the rewards into storage.
    /// This function can be used in the situation, when the are not enough rewards to cover claim and where
    /// regular unstake of lpTokens would not be possible.
    /// @param lpToken address of the underlying asset
    /// @param lpTokenAmount lpToken amount being unstaked, represented with 18 decimals
    function unstakeAndAllocatePwTokens(address lpToken, uint256 lpTokenAmount) external;

    // todo removed

    /// @notice method allowing to claim the rewards per asset (lpToken)
    /// @param lpToken of the staking pool from which to claim the rewards
    function claim(address lpToken) external;

    // todo ClaimService
    // [x] - sequence diagrams
    // [ ] - implemented

    /// @notice method allowed to claim the allocated rewards
    function claimAllocatedPwTokens() external;

    // todo removed

    /// @notice method allowing to update the indicators per asset (lpToken).
    /// @param account of which we should update the indicators
    /// @param lpTokens of the staking pools to update the indicators
    function updateIndicators(address account, address[] calldata lpTokens) external;

    // todo MiningService
    // [x] - sequence diagrams
    // [ ] - implemented

    /// @notice Emitted when the account stakes the lpTokens
    /// @param account Account's address in the context of which the activities of staking of lpTokens are performed
    /// @param lpToken address of lpToken being staked
    /// @param lpTokenAmount of lpTokens to stake, represented with 18 decimals
    event LpTokensStaked(address account, address lpToken, uint256 lpTokenAmount);

    /// @notice Emitted when the account claims the rewards
    /// @param account Account's address in the context of which activities of claiming are performed
    /// @param lpToken The address of the lpToken
    /// @param rewardsAmount Reward amount denominated in pwToken, represented with 18 decimals
    event Claimed(address account, address lpToken, uint256 rewardsAmount);

    /// @notice Emitted when the account claims the allocated rewards
    /// @param account Account address in the context of which activities of claiming are performed
    /// @param allocatedRewards Reward amount denominated in pwToken, represented in 18 decimals
    event AllocatedTokensClaimed(address account, uint256 allocatedRewards);

    /// @notice Emitted when update was triggered for the account on the lpToken
    /// @param account Account address to which the update was triggered
    /// @param lpToken lpToken address to which the update was triggered
    event IndicatorsUpdated(address account, address lpToken);

    //    ----------------------------------------------
    //    New implementation
    //    ----------------------------------------------
    struct UpdateLpToken {
        address onBehalfOf;
        address lpToken;
        uint256 lpTokenAmount;
    }

    struct AccountIndicatorsResult {
        address lpToken;
        LiquidityMiningTypes.AccountRewardsIndicators indicators;
    }

    struct GlobalIndicatorsResult {
        address lpToken;
        LiquidityMiningTypes.GlobalRewardsIndicators indicators;
    }

    function addLpTokens(UpdateLpToken[] memory updateLpToken) external;

    function removeLpTokens(UpdateLpToken[] memory updateLpToken) external;

    function claim(address[] lpTokens) external returns (uint256 rewardsAmountToTransfer);

    function getGlobalIndicators(address[] calldata lpTokens)
        external
        view
        returns (GlobalIndicatorsResult[] memory);

    function getAccountIndicators(address account, address[] calldata lpTokens)
        external
        view
        returns (AccountIndicatorsResult[] memory);
}
