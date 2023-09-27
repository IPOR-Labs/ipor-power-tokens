// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "./types/LiquidityMiningTypes.sol";

/// @title The interface for interaction with the LiquidityMining contract. Contains mainly technical methods or methods used by PowerToken smart contract.
interface ILiquidityMiningInternal {
    /// @notice Returns the current version of the LiquidityMining contract
    /// @return Current LiquidityMining (Liquidity Rewards) version
    function getVersion() external pure returns (uint256);

    /// @notice Checks if lpToken is supported by the liquidity mining module.
    /// @param lpToken lpToken address
    /// @return returns true if lpToken is supported by the LiquidityMining, false otherwise
    function isLpTokenSupported(address lpToken) external view returns (bool);

    /// @notice Sets the global configuration indicator - rewardsPerBlock for a given lpToken
    /// @param lpToken address for which to setup `rewards per block`
    /// @param pwTokenAmount amount of the `rewards per block`, denominated in Power Token, represented with 8 decimals
    function setRewardsPerBlock(address lpToken, uint32 pwTokenAmount) external;

    /// @notice Adds LiquidityMining's support for a new lpToken
    /// @dev Can only be executed by the Owner
    /// @param lpToken address of the lpToken
    function newSupportedLpToken(address lpToken) external;

    /// @notice Deprecation lpToken from the list of tokens supported by the LiquidityMining contract
    /// @dev Can be executed only by the Owner. Note! That when lpToken is removed, the rewards cannot be claimed. To restore claiming, run function {addLpToken()} and {setRewardsPerBlock()}
    /// @param lpToken address of the lpToken
    function phasingOutLpToken(address lpToken) external;

    /// @notice Pauses current smart contract, it can only be executed by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can only be executed by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Grants maximum allowance for a specified ERC20 token to the Router contract.
    /// @param erc20Token The address of the ERC20 token for which the allowance is granted.
    /// @dev This function grants maximum allowance (type(uint256).max) for the specified ERC20 token to the
    /// Router contract.
    /// @dev Reverts if the `erc20Token` address is zero.
    function grantAllowanceForRouter(address erc20Token) external;

    /// @notice Revokes the allowance for a specified ERC20 token from the Router contract.
    /// @param erc20Token The address of the ERC20 token for which the allowance is to be revoked.
    /// @dev This function revokes the allowance for the specified ERC20 token from the Router contract by setting the allowance to zero.
    /// @dev Reverts if the `erc20Token` address is zero.
    function revokeAllowanceForRouter(address erc20Token) external;

    /// @notice Adds a new pause guardian to the contract.
    /// @param guardians The addresses of the new pause guardians.
    /// @dev Only the contract owner can call this function.
    function addPauseGuardians(address[] calldata guardians) external;

    /// @notice Removes a pause guardian from the contract.
    /// @param guardians The addresses of the pause guardians to be removed.
    /// @dev Only the contract owner can call this function.
    function removePauseGuardians(address[] calldata guardians) external;

    /// @notice Checks if an address is a pause guardian.
    /// @param guardian The address to be checked.
    /// @return A boolean indicating whether the address is a pause guardian (true) or not (false).
    function isPauseGuardian(address guardian) external view returns (bool);

    /// @notice Emitted when the account unstakes lpTokens
    /// @param account account unstaking tokens
    /// @param lpToken address of lpToken being unstaked
    /// @param lpTokenAmount of lpTokens to unstake, represented with 18 decimals
    event LpTokensUnstaked(address account, address lpToken, uint256 lpTokenAmount);

    /// @notice Emitted when the LiquidityMining's Owner changes the `rewards per block`
    /// @param lpToken address of lpToken for which the `rewards per block` is changed
    /// @param newPwTokenAmount new value of `rewards per block`, denominated in Power Token, represented in 8 decimals
    event RewardsPerBlockChanged(address lpToken, uint256 newPwTokenAmount);

    /// @notice Emitted when the LiquidityMining's Owner adds support for lpToken
    /// @param account address of LiquidityMining's Owner
    /// @param lpToken address of newly supported lpToken
    event NewLpTokenSupported(address account, address lpToken);

    /// @notice Emitted when the LiquidityMining's Owner removes ssupport for lpToken
    /// @param account address of LiquidityMining's Owner
    /// @param lpToken address of dropped lpToken
    event LpTokenSupportRemoved(address account, address lpToken);

    /// @notice Emitted when the account delegates Power Tokens to the LiquidityMining
    /// @param account performing delegation
    /// @param lpToken address of lpToken to which Power Token are delegated
    /// @param pwTokenAmount amount of Power Tokens delegated, represented with 18 decimals
    event PwTokenDelegated(address account, address lpToken, uint256 pwTokenAmount);

    /// @notice Emitted when the account undelegates Power Tokens from the LiquidityMining
    /// @param account undelegating
    /// @param lpToken address of lpToken
    /// @param pwTokenAmount amount of Power Token undelegated, represented with 18 decimals
    event PwTokenUndelegated(address account, address lpToken, uint256 pwTokenAmount);

    /// @notice Emitted when the PauseManager's address is changed by its owner.
    /// @param newPauseManager PauseManager's new address
    event PauseManagerChanged(address indexed newPauseManager);

    /// @notice Emitted when owner grants allowance for router
    /// @param erc20Token address of ERC20 token
    /// @param router address of router
    event AllowanceGranted(address indexed erc20Token, address indexed router);

    /// @notice Emitted when owner revokes allowance for router
    /// @param erc20Token address of ERC20 token
    /// @param router address of router
    event AllowanceRevoked(address indexed erc20Token, address indexed router);
}
