// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "./types/LiquidityMiningTypes.sol";

/// @title The interface for interaction with the LiquidityMining contract. Contains mainly technical methods or methods used by PowerToken smart contract.
interface ILiquidityMiningInternalV2 {
    /// @notice Returns the current version of the LiquidityMining contract
    /// @return Current LiquidityMining (Liquidity Rewards) version
    function getVersion() external pure returns (uint256);

    // todo Lens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Gets the Pause Manager's address
    /// @return Pause Manager's address
    function getPauseManager() external view returns (address);

    // todo Lens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Checks if lpToken is supported by the liquidity mining module.
    /// @param lpToken lpToken address
    /// @return returns true if lpToken is supported by the LiquidityMining, false otherwise
    function isLpTokenSupported(address lpToken) external view returns (bool);

    // todo Lens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Sets the global configuration indicator - rewardsPerBlock for a given lpToken
    /// @param lpToken address for which to setup `rewards per block`
    /// @param pwTokenAmount amount of the `rewards per block`, denominated in Power Token, represented with 8 decimals
    function setRewardsPerBlock(address lpToken, uint32 pwTokenAmount) external;

    // todo GovernanceService
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Adds LiquidityMining's support for a new lpToken
    /// @dev Can only be executed by the Owner
    /// @param lpToken address of the lpToken
    function newSupportedLpToken(address lpToken) external;

    // todo GovernanceService
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Deprecation lpToken from the list of tokens supported by the LiquidityMining contract
    /// @dev Can be executed only by the Owner. Note! That when lpToken is removed, the rewards cannot be claimed. To restore claiming, run function {addLpToken()} and {setRewardsPerBlock()}
    /// @param lpToken address of the lpToken
    function phasingOutLpToken(address lpToken) external;

    // todo GovernanceService
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Sets the new Pause Manager address
    /// @param newPauseManagerAddr - new address of Pause Manager
    function setPauseManager(address newPauseManagerAddr) external;

    // todo GovernanceService
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Pauses current smart contract, it can only be executed by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    // todo GovernanceService
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Unpauses current smart contract, it can only be executed by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    // todo GovernanceService
    // [ ] - sequence diagrams
    // [ ] - implemented

    function grantAllowanceForRouter(address router, address erc20Token) external;

    function revokeAllowanceForRouter(address router, address erc20Token) external;

    /// @notice Emitted when the account unstakes lpTokens
    /// @param account account unstaking tokens
    /// @param lpToken address of lpToken being unstaked
    /// @param lpTokenAmount of lpTokens to unstake, represented with 18 decimals
    event LpTokensUnstaked(address account, address lpToken, uint256 lpTokenAmount);

    /// @notice Emitted when the LiquidityMining's Owner changes the `rewards per block`
    /// @param changedBy address of account executing changes
    /// @param oldPwTokenAmount old value of `rewards per block`, denominated in Power Token, represented in 8 decimals
    /// @param newPwTokenAmount new value of `rewards per block`, denominated in Power Token, represented in 8 decimals
    event RewardsPerBlockChanged(
        address indexed changedBy,
        uint256 oldPwTokenAmount,
        uint256 newPwTokenAmount
    );

    /// @notice Emitted when the LiquidityMining's Owner adds support for lpToken
    /// @param account address of LiquidityMining's Owner
    /// @param lpToken address of newly supported lpToken
    event LpTokenAdded(address account, address lpToken);

    /// @notice Emitted when the LiquidityMining's Owner removes ssupport for lpToken
    /// @param account address of LiquidityMining's Owner
    /// @param lpToken address of dropped lpToken
    event LpTokenRemoved(address account, address lpToken);

    /// @notice Emitted when the account delegates Power Tokens to the LiquidityMining
    /// @param account performing delegation
    /// @param lpToken address of lpToken to which Power Token are delegated
    /// @param pwTokenAmount amount of Power Tokens delegated, represented with 18 decimals
    event PwTokenDelegated(address account, address lpToken, uint256 pwTokenAmount);

    /// @notice Emitted when the account delegates Power Tokens and stakes lpTokens to the LiquidityMining
    /// @param account account delegating Power Tokens and staking lpTokens
    /// @param lpToken address of lpToken staked
    /// @param pwTokenAmount of Power Token delegated, represented with 18 decimals
    /// @param lpTokenAmount of lpTokens to stake, represented with 18 decimals
    event PwTokenDelegatedAndLpTokenStaked(
        address account,
        address lpToken,
        uint256 pwTokenAmount,
        uint256 lpTokenAmount
    );

    /// @notice Emitted when the account undelegates Power Tokens from the LiquidityMining
    /// @param account undelegating
    /// @param lpToken address of lpToken
    /// @param pwTokenAmount amount of Power Token undelegated, represented with 18 decimals
    event PwTokenUndelegated(address account, address lpToken, uint256 pwTokenAmount);

    /// @notice Emitted when the PauseManager's address is changed by its owner.
    /// @param changedBy account address that has changed LiquidityMining's address
    /// @param oldPauseManager PauseManager's old address
    /// @param newPauseManager PauseManager's new address
    event PauseManagerChanged(
        address indexed changedBy,
        address indexed oldPauseManager,
        address indexed newPauseManager
    );
}