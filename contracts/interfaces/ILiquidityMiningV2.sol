// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "./types/LiquidityMiningTypes.sol";

/// @title The interface for interaction with the LiquidityMining.
/// LiquidityMining is responsible for the distribution of the Power Token rewards to accounts
/// staking lpTokens and / or delegating Power Tokens to LiquidityMining. LpTokens can be staked directly to the LiquidityMining,
/// Power Tokens are a staked version of the [Staked] Tokens minted by the PowerToken smart contract.
interface ILiquidityMiningV2 {
    /// @notice Contract ID. The keccak-256 hash of "io.ipor.LiquidityMining" decreased by 1
    /// @return Returns an ID of the contract
    function getContractId() external pure returns (bytes32);

    /// @notice Returns the balance of staked lpTokens
    /// @param account the account's address
    /// @param lpToken the address of lpToken
    /// @return balance of the lpTokens staked by the sender
    function balanceOf(address account, address lpToken) external view returns (uint256);

    /// @notice It returns the balance of delegated Power Tokens for a given `account` and the list of lpToken addresses.
    /// @param account address for which to fetch the information about balance of delegated Power Tokens
    /// @param lpTokens list of lpTokens addresses(lpTokens)
    /// @return balances list of {LiquidityMiningTypes.DelegatedPwTokenBalance} structure, with information how much Power Token is delegated per lpToken address.
    function balanceOfDelegatedPwToken(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances);

    function calculateAccruedRewards(address[] calldata lpTokens)
        external
        view
        returns (AccruedRewardsResult[] memory result);

    function calculateAccountRewards(address account, address[] calldata lpTokens)
        external
        view
        returns (AccountRewardResult[] memory);

    /// @notice method allowing to update the indicators per asset (lpToken).
    /// @param account of which we should update the indicators
    /// @param lpTokens of the staking pools to update the indicators
    function updateIndicators(address account, address[] calldata lpTokens) external;

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

    struct UpdateLpToken {
        address onBehalfOf;
        address lpToken;
        uint256 lpTokenAmount;
    }

    struct UpdatePwToken {
        address onBehalfOf;
        address lpToken;
        uint256 pwTokenAmount;
    }

    struct AccruedRewardsResult {
        address lpToken;
        uint256 rewardsAmount;
    }

    struct AccountRewardResult {
        address lpToken;
        uint256 rewardsAmount;
        uint256 allocatedPwTokens;
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

    function addPwTokens(UpdatePwToken[] memory updatePwToken) external;

    function removeLpTokens(UpdateLpToken[] memory updateLpToken) external;

    function removePwTokens(UpdatePwToken[] memory updatePwToken) external;

    function claim(address account, address[] calldata lpTokens)
        external
        returns (uint256 rewardsAmountToTransfer);

    function getGlobalIndicators(address[] calldata lpTokens)
        external
        view
        returns (GlobalIndicatorsResult[] memory);

    function getAccountIndicators(address account, address[] calldata lpTokens)
        external
        view
        returns (AccountIndicatorsResult[] memory);
}