// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "./types/PowerTokenTypes.sol";

/// @title The Interface for the interaction with the PowerToken - smart contract responsible
/// for managing Power Token (pwToken), Swapping Staked Token for Power Tokens, and
/// delegating Power Tokens to other components.
interface IPowerToken {
    /// @notice Gets the name of the Power Token
    /// @return Returns the name of the Power Token.
    function name() external pure returns (string memory);

    /// @notice Contract ID. The keccak-256 hash of "io.ipor.PowerToken" decreased by 1
    /// @return Returns the ID of the contract
    function getContractId() external pure returns (bytes32);

    /// @notice Gets the symbol of the Power Token.
    /// @return Returns the symbol of the Power Token.
    function symbol() external pure returns (string memory);

    /// @notice Returns the number of the decimals used by Power Token. By default it's 18 decimals.
    /// @return Returns the number of decimals: 18.
    function decimals() external pure returns (uint8);

    /// @notice Gets the total supply of the Power Token.
    /// @dev Value is calculated in runtime using baseTotalSupply and internal exchange rate.
    /// @return Total supply of Power tokens, represented with 18 decimals
    function totalSupply() external view returns (uint256);

    /// @notice Gets the balance of Power Tokens for a given account
    /// @param account account address for which the balance of Power Tokens is fetched
    /// @return Returns the amount of the Power Tokens owned by the `account`.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Gets the delegated balance of the Power Tokens for a given account.
    /// Tokens are delegated from PowerToken to LiquidityMining smart contract (reponsible for rewards distribution).
    /// @param account account address for which the balance of delegated Power Tokens is checked 
    /// @return  Returns the amount of the Power Tokens owned by the `account` and delegated to the LiquidityMining contracts.
    function delegatedToLiquidityMiningBalanceOf(address account) external view returns (uint256);

    /// @notice Gets the rate of the fee from the configuration. This fee is applied when the owner of Power Tokens wants to unstake them immediately.
    /// @dev Fee value represented in as a percentage with 18 decimals
    /// @return value, a percentage represented with 18 decimal
    function getUnstakeWithoutCooldownFee() external view returns (uint256);

    /// @notice Gets the state of the active cooldown for the sender.
    /// @dev If PowerTokenTypes.PowerTokenCoolDown contains only zeros it represents no active cool down.
    /// Struct containing information on when the cooldown end and what is the quantity of the Power Tokens locked.
    /// @param account account address that owns Power Tokens in the cooldown
    /// @return Object PowerTokenTypes.PowerTokenCoolDown represents active cool down
    function getActiveCoolDown(address account)
        external
        view
        returns (PowerTokenTypes.PwTokenCoolDown memory);

    /// @notice Stakes [Staked] Tokens and mints Power Tokens (pwToken).
    /// @param stakedTokenAmount Tokens that sender staked to mint the Power Tokens
    function stake(uint256 stakedTokenAmount) external;

    /// @notice Unstakes Staked Tokens in the amount specified.
    /// @dev If the sender unstake tokens immediately (without the cooldown), then fee is applied by the PowerToken smart contract. See: `UnstakeWithoutCooldownFee`.
    /// @param pwTokenAmount Power Tokens amount which will be unstake or a given sender
    function unstake(uint256 pwTokenAmount) external;

    /// @notice Delegates the Power Tokens to the LiquidityMining
    /// @param lpTokens - list of lpTokens to which Power Tokens are delegated
    /// @param pwTokenAmounts - list of the amounts of Power Tokens delegated to correspondng lpTokens
    function delegateToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external;

    /// @notice Delegates Power Tokens and stakes lpTokens
    /// @dev Power Token amounts can equal zero. lpToken amounts can qual zero.
    /// @param lpTokens - list of lpTokens to which the sender delegates Power Tokens
    /// @param pwTokenAmounts - list of the amounts of Power Tokens delegated to correspondng lpTokens
    /// @param lpTokenAmounts - list of staked lpToken amounts
    function delegateAndStakeToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts,
        uint256[] calldata lpTokenAmounts
    ) external;

    /// @notice Undelegates the Power Tokens from the LiquidityMining
    /// @dev Power Token amounts have to be higher than zero, otherwise transaction is reverted.
    /// @param lpTokens - list of the lpToken from which Power Tokens are undelegated
    /// @param pwTokenAmounts - list of the undelegated amounts of the Power Tokens
    function undelegateFromLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external;

    /// @notice Resets the colldown of Power Tokens to the set duration of 2 weeks.
    /// @dev Power Tokens in cooldown cannot be unstaked without fee,
    /// when the cooldown is elapsed then Power Tokens can be unstaked without fee.
    /// Fee for immediate unstaking (without cooldown) is configured in param `_unstakeWithoutCooldownFee`
    /// Power Tokens can be redeemed for Staked Tokens in relation of 1:1.
    /// @param pwTokenAmount Power Token amount to be set in the cooldown
    function coolDown(uint256 pwTokenAmount) external;

    /// @notice Cancel the cooldown.
    /// @dev When this method is executed, all Power Tokens are released.
    function cancelCoolDown() external;

    /// @notice The method allowing redemption of Power Tokens for the Staked Token after cooldown has passed.
    /// @dev Power Tokens are redeemable for Staked tokens at 1:1 ratio. 
    /// @dev When the sender executes `redeem` method then the structure {PowerTokenTypes.PwTokenCoolDown} is cleared for a given sender in `_coolDowns` storage.
    function redeem() external;

    /// @notice Emitted when the account stakes [Staked] Tokens
    /// @param account account address that executed the staking
    /// @param stakedTokenAmount of Staked Token amount being staked into PowerToken contract
    /// @param internalExchangeRate internal exchange rate used to calculate the base amount
    /// @param baseAmount value calculated based on the stakedTokenAmount and the internalExchangeRate
    event Staked(
        address indexed account,
        uint256 stakedTokenAmount,
        uint256 internalExchangeRate,
        uint256 baseAmount
    );

    /// @notice Emitted when the account unstakes the Power Tokens
    /// @param account address tjat executed the unstaking
    /// @param pwTokenAmount amount of Power Tokens that were unstaked
    /// @param internalExchangeRate which was used to calculate the base amount
    /// @param fee amount subtracted from the pwTokenAmount
    event Unstaked(
        address indexed account,
        uint256 pwTokenAmount,
        uint256 internalExchangeRate,
        uint256 fee
    );

    /// @notice Emitted when the sender delegates the Power Tokens to the LiquidityMining contract
    /// @param account address delegating the Power Tokens
    /// @param lpTokens list of the tokens representing staking pools
    /// @param pwTokenAmounts amounts of Power Tokens delegated to respective lpTokens
    event ToLiquidityMiningDelegated(
        address indexed account,
        address[] lpTokens,
        uint256[] pwTokenAmounts
    );

    /// @notice Emitted when the sender undelegates Power Tokens from the LiquidityMining
    /// @param account address undelegating Power Tokens
    /// @param lpTokens list of the tokens representing staking pools
    /// @param pwTokenAmounts amounts of Power Tokens undelegated form respective lpTokens
    event FromLiquidityMiningUndelegated(
        address indexed account,
        address[] lpTokens,
        uint256[] pwTokenAmounts
    );

    /// @notice Emitted when the sender sets the cooldown on Power Tokens
    /// @param changedBy account address that has changed the cooldown rules
    /// @param pwTokenAmount amount of pwToken in cooldown
    /// @param endTimestamp end time of the cooldown
    event CoolDownChanged(address indexed changedBy, uint256 pwTokenAmount, uint256 endTimestamp);

    /// @notice Emitted when the sender redeems the pwTokens after the cooldown
    /// @param account address that executed the redeem function
    /// @param pwTokenAmount amount of the pwTokens that was transferred to the Power Token owner's address
    event Redeem(address indexed account, uint256 pwTokenAmount);
}
