// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "./types/PowerTokenTypes.sol";

/// @title Interface for interaction with PowerToken - smart contract responsible
/// for managing Power Token (pwToken), swap Staked Token to Power Tokens and
/// delegating Power tokens to LiquidityMining contracts.
interface IPowerToken {
    /// @notice Gets name of the Power Token
    /// @return Returns the name of the Power token.
    function name() external pure returns (string memory);

    /// @notice Contract id. This is the keccak-256 hash of "io.ipor.PowerToken" subtracted by 1
    /// @return Returns id of contract
    function getContractId() external pure returns (bytes32);

    /// @notice Gets symbol of the Power token.
    /// @return Returns the symbol of the Power token.
    function symbol() external pure returns (string memory);

    /// @notice Returns the number of decimals used in Power token. By default it is 18 decimals.
    /// @return Returns the number of decimals 18.
    function decimals() external pure returns (uint8);

    /// @notice Gets total supply of Power Token.
    /// @dev Value is calculated in runtime using baseTotalSupply and internal exchange rate.
    /// @return Total supply of Power tokens, represented in 18 decimals
    function totalSupply() external view returns (uint256);

    /// @notice Gets balance of Power Token for a given account address
    /// @param account account address for which is checked balance of Power Tokens
    /// @return Returns the amount of Power tokens owned by `account`.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Gets delegated balance of Power Token for a given account address.
    /// Token are delegated from PowerToken to LiquidityMining smart contract (reponsible for rewards distribution).
    /// @param account account address for which is checked balance of delegated Power Tokens
    /// @return  Returns the amount of Power tokens owned by `account` and delegated to LiquidityMining contracts.
    function delegatedToLiquidityMiningBalanceOf(address account) external view returns (uint256);

    /// @notice Gets configuration param the fee which is taken when sender want to unstake Staked Token from PowerToken in time when cooldown is active.
    /// @dev Fee value represented in as a percentage in 18 decimals
    /// @return value, a percentage of  in 18 decimal
    function getUnstakeWithoutCooldownFee() external view returns (uint256);

    /// @notice Gets state of active cool down for the sender.
    /// @dev If PowerTokenTypes.PowerTokenCooldown contains only zeros it represents no active cool down.
    /// Struct contain information when cooldown is ended and how many Power Tokens are locked.
    /// @param account account address which cooldown should be returned
    /// @return Object PowerTokenTypes.PowerTokenCooldown which represents active cool down, the moment of
    function getActiveCooldown(address account)
        external
        view
        returns (PowerTokenTypes.PwTokenCooldown memory);

    /// @notice Stakes Staked Tokens and receives Power tokens (pwToken).
    /// @param stakedTokenAmount Staked tokens which sender want to stake to the PowerToken smart contract
    function stake(uint256 stakedTokenAmount) external;

    /// @notice Unstakes Staked Tokens amount for a given Power Token amount.
    /// @dev If sender want to unstake without cooling down then additional fee is included predefined in PowerToken smart contract `UnstakeWithoutCooldownFee`.
    /// @param pwTokenAmount Power Tokens amount which will be unstake or a given sender
    function unstake(uint256 pwTokenAmount) external;

    /// @notice Delegates Power Tokens to LiquidityMining
    /// @param lpTokens - list of lpTokens to which are associated in delegation Power Tokens
    /// @param pwTokenAmounts - list of Power Token amount which are delegated in relation to given lpToken
    function delegateToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external;

    /// @notice Delegates Power Tokens and stakes lpTokens
    /// @dev Power Token amounts can be equal zeros. IP Token amounts can be equal zeros.
    /// @param lpTokens - list of lpTokens to which sender delegates Power Tokens and stakes lpTokens
    /// @param pwTokenAmounts - list of Power Token amount which sender delegates for a given lpToken
    /// @param lpTokenAmounts - list of lpToken amount which sender stakes in LiquidityMining for a given lpToken
    function delegateAndStakeToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts,
        uint256[] calldata lpTokenAmounts
    ) external;

    /// @notice Undelegates Power Token from LiquidityMining
    /// @dev Power Token amounts have to be higher than zero, in other case transaction is rejected.
    /// @param lpTokens - list of lpToken from which sender will undelegate Power Tokens
    /// @param pwTokenAmounts - list of amounts of Power Tokens taken to undelegate from LiquidityMining
    function undelegateFromLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external;

    /// @notice Resets freeze of a given Power Token amount in the next 2 weeks.
    /// @dev Power Tokens in cool down state cannot be unstaked without fee,
    /// when time of cool down is elapsed then Power Tokens can be unstaked without fee.
    /// Unstake without coold down is configured in param `_unstakeWithoutCooldownFee`
    /// Power Tokens in cool down state allows sender to redeem Staked Tokens in relation 1:1 to Power Tokens.
    /// @param pwTokenAmount Power Token amount which sender wants to freeze
    function cooldown(uint256 pwTokenAmount) external;

    /// @notice Cancel cool down.
    /// @dev When this method is executed then none of Power Tokens are in cool down state.
    function cancelCooldown() external;

    /// @notice The method allowed to redeem the Staked Token when cool down time finish.
    /// @dev Staked Tokens are in relation 1:1 to Power Tokens
    /// @dev When sender execute `redeem` method then structure {PowerTokenTypes.PwTokenCooldown} is cleared for a given sender in `_cooldowns` storage.
    function redeem() external;

    /// @notice Emitted when account stake Staked tokens
    /// @param account account address who execute stake
    /// @param stakedTokenAmount of Staked Token amount which should be stake into PowerToken contract
    /// @param internalExchangeRate internal exchange rate used to calculate base amount
    /// @param baseAmount calculated value based on stakedTokenAmount and internalExchangeRate
    event Staked(
        address indexed account,
        uint256 stakedTokenAmount,
        uint256 internalExchangeRate,
        uint256 baseAmount
    );

    /// @notice Emitted when account unstake Staked tokens
    /// @param account address who execute unstake
    /// @param pwTokenAmount amount of Staked Token which was unstaked
    /// @param internalExchangeRate which was used to calculate base amount
    /// @param fee value which was subtract from pwTokenAmount
    event Unstaked(
        address indexed account,
        uint256 pwTokenAmount,
        uint256 internalExchangeRate,
        uint256 fee
    );

    /// @notice Emitted when sender delegates Power Tokens to LiquidityMining contract
    /// @param account address who delegates Power Tokens
    /// @param lpTokens list of token to delegate Power Tokens
    /// @param pwTokenAmounts list of values how Power token amount should be distributed across lpTokens
    event ToLiquidityMiningDelegated(
        address indexed account,
        address[] lpTokens,
        uint256[] pwTokenAmounts
    );

    /// @notice Emitted when sender undelegate Power Tokens from LiquidityMining
    /// @param account address who undelegates Power Tokens
    /// @param lpTokens list of assets from Power Tokens are undelegated
    /// @param pwTokenAmounts list of values how Power token amounts should be undelegated from lpTokens
    event FromLiquidityMiningUndelegated(
        address indexed account,
        address[] lpTokens,
        uint256[] pwTokenAmounts
    );

    /// @notice Emitted when sender setup cooldown
    /// @param changedBy account address that has changed Cooldown rules
    /// @param pwTokenAmount amount of pwToken which was freeze to unstake
    /// @param endTimestamp time when user will be able to redeem tokens without fee
    event CooldownChanged(address indexed changedBy, uint256 pwTokenAmount, uint256 endTimestamp);

    /// @notice Emitted when sender redeem pwTokens after cool down
    /// @param account address who executes redeem
    /// @param pwTokenAmount amount of pwTokens was transferred to account from PowerToken smart contract
    event Redeem(address indexed account, uint256 pwTokenAmount);
}
