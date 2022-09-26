// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/PowerIporTypes.sol";

/// @title Interface for interaction with PowerIpor - smart contract responsible
/// for managing Power Ipor Token (pwIpor), swap Ipor Token to Power Ipor tokens and
/// delegating Power Ipor tokens to John contracts.
interface IPowerIpor {
    /// @notice Gets name of the Power Ipor Token
    /// @return Returns the name of the Power Ipor token.
    function name() external pure returns (string memory);

    /// @notice Gets symbol of the Power Ipor token.
    /// @return Returns the symbol of the Power Ipor token.
    function symbol() external pure returns (string memory);

    /// @notice Returns the number of decimals used in Power Ipor token. By default it is 18 decimals.
    /// @return Returns the number of decimals 18.
    function decimals() external pure returns (uint8);

    /// @notice Gets total supply of Power Ipor Token.
    /// @dev Value is calculated in runtime using baseTotalSupply and internal exchange rate.
    /// @return Total supply of Power Ipor tokens, represented in 18 decimals
    function totalSupply() external view returns (uint256);

    /// @notice Gets balance of Power Ipor Token for a given account address
    /// @param account account address for which is checked balance of Power Ipor Tokens
    /// @return Returns the amount of Power Ipor tokens owned by `account`.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Gets delegated balance of Power Ipor Token for a given account address. 
	/// Token are delegated from PowerIpor to John smart contract (reponsible for rewards distribution).
    /// @param account account address for which is checked balance of delegated Power Ipor Tokens
    /// @return  Returns the amount of Power Ipor tokens owned by `account` and delegated to John contracts.
    function delegatedBalanceOf(address account) external view returns (uint256);

    /// @notice Gets configuration param the fee which is taken when sender want to unstake Ipor Token from PowerIpor in time when cooldown is active.
    /// @dev Fee value represented in as a percentage in 18 decimals
    /// @return value, a percentage of  in 18 decimal
    function getUnstakeWithoutCooldownFee() external view returns (uint256);

    /// @notice Gets state of active cool down for the sender.
    /// @dev If PowerIporTypes.PowerIporCoolDown contains only zeros it represents no active cool down.
    /// Struct contain information when cooldown is ended and how many Power Ipor Tokens are locked.
    /// @return Object PowerIporTypes.PowerIporCoolDown which represents active cool down, the moment of
    function getActiveCoolDown() external view returns (PowerIporTypes.PwIporCoolDown memory);

    /// @notice Stakes IPOR Tokens and receives Power Ipor tokens (pwIpor).
    /// @param iporTokenAmount IPOR tokens which sender want to stake to the PowerIpor smart contract
    function stake(uint256 iporTokenAmount) external;

    /// @notice Unstakes IPOR Tokens amount for a given Power Ipor Token amount.
    /// @dev If sender want to unstake without cooling down then additional fee is included predefined in PowerIpor smart contract `UnstakeWithoutCooldownFee`.
    /// @param pwIporAmount Power Ipor Tokens amount which will be unstake or a given sender
    function unstake(uint256 pwIporAmount) external;

    /// @notice Delegates Power Ipor Tokens to John
    /// @param ipTokens - list of ipTokens to which are associated in delegation Power Ipor Tokens
    /// @param pwIporAmounts - list of Power Ipor Token amount which are delegated in relation to given ipToken
    function delegateToJohn(address[] memory ipTokens, uint256[] memory pwIporAmounts) external;

    /// @notice Delegates Power Ipor Tokens and stakes ipTokens
    /// @param ipTokens - list of ipTokens to which sender delegates Power Ipor Tokens and stakes ipTokens
    /// @param pwIporAmounts - list of Power Ipor Token amount which sender delegates for a given ipToken
    /// @param ipTokenAmounts - list of ipToken amount which sender stakes in John for a given ipToken
    function delegateAndStakeToJohn(
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts,
        uint256[] memory ipTokenAmounts
    ) external;

    /// @notice Undelegates Power Ipor Token from John
    /// @param ipToken - ipToken from which sender will undelegate Power Ipor Tokens
    /// @param pwIporAmount - amount of Power Ipor Tokens taken to undelegate from John
    function undelegateFromJohn(address ipToken, uint256 pwIporAmount) external;

    /// @notice Resets freeze of a given Power Ipor Token amount in the next 2 weeks.
    /// @dev Power Ipor Tokens in cool down state cannot be unstaked without fee,
    /// when time of cool down is elapsed then Power Ipor Tokens can be unstaked without fee.
    /// Unstake without coold down is configured in param `_unstakeWithoutCooldownFee`
    /// Power Ipor Tokens in cool down state allows sender to redeem Ipor Tokens in relation 1:1 to Power Ipor Tokens.
    /// @param pwIporAmount Power Ipor Token amount which sender wants to freeze
    function coolDown(uint256 pwIporAmount) external;

    /// @notice Cancel cool down.
    /// @dev When this method is executed then none of Power Ipor Tokens are in cool down state.
    function cancelCoolDown() external;

    /// @notice The method allowed to redeem the Ipor Token when cool down time finish.
    /// @dev Ipor Tokens are in relation 1:1 to Power Ipor Tokens
    /// @dev When sender execute `redeem` method then structure {PowerIporTypes.PwIporCoolDown} is cleared for a given sender in `_coolDowns` storage.
    function redeem() external;

    /// @notice Emitted when account stake IPOR tokens
    /// @param account account address who execute stake
    /// @param iporTokenAmount of Ipor Token amount which should be stake into Power Ipor contract
    /// @param internalExchangeRate internal exchange rate used to calculate base amount
    /// @param baseAmount calculated value based on iporTokenAmount and internalExchangeRate
    event Stake(
        address indexed account,
        uint256 iporTokenAmount,
        uint256 internalExchangeRate,
        uint256 baseAmount
    );

    /// @notice Emitted when account unstake IPOR tokens
    /// @param account address who execute unstake
    /// @param iporTokenAmount amount of Ipor Token which was unstaked
    /// @param internalExchangeRate which was used to calculate base amount
    /// @param fee value which was subtract from iporTokenAmount
    event Unstake(
        address indexed account,
        uint256 iporTokenAmount,
        uint256 internalExchangeRate,
        uint256 fee
    );

    /// @notice Emitted when sender delegates Power Ipor Tokens to John contract
    /// @param account address who delegates Power Ipor Tokens
    /// @param ipTokens list of token to delegate Power Ipor Tokens
    /// @param pwIporAmounts list of values how Power Ipor token amount should be distributed across ipTokens
    event DelegateToJohn(address indexed account, address[] ipTokens, uint256[] pwIporAmounts);

    /// @notice Emitted when sender undelegate Power Ipor Tokens from John
    /// @param account address who undelegates Power Ipor Tokens
    /// @param ipToken list of assets from Power Ipor Tokens are undelegated
    /// @param pwIporAmount list of values how Power Ipor token amounts should be undelegated from ipTokens
    event UndelegateFromJohn(address indexed account, address ipToken, uint256 pwIporAmount);

    /// @notice Emitted when sender setup coolDown
    /// @param changedBy account address that has changed CoolDown rules
    /// @param pwIporAmount amount of Ipor Token which was freeze to unstake
    /// @param endTimestamp time when user will be able to redeem tokens without fee
    event CoolDownChanged(address indexed changedBy, uint256 pwIporAmount, uint256 endTimestamp);

    /// @notice Emitted when sender redeem Ipor Tokens after cool down
    /// @param account address who executes redeem
    /// @param iporTokenAmount amount of Ipor Tokens was transferred to account from PowerIpor smart contract
    event Redeem(address indexed account, uint256 iporTokenAmount);
}
