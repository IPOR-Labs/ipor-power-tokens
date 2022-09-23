// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/PowerIporTypes.sol";

/// @title Interface for interaction with PowerIpor - smart contract responsible
/// for managing Power Ipor token and Ipor Token and delegation to John contracts.
interface IPowerIpor {
    /// @return Returns the name of the token.
    function name() external pure returns (string memory);

    /// @return Returns the symbol of the token.
    function symbol() external pure returns (string memory);

    /// @return Returns the number of decimals 18 used to get its user representation.
    function decimals() external pure returns (uint8);

    /// @notice Total supply of power tokens
    /// @return Total supply of power tokens in 18 decimals
    function totalSupply() external view returns (uint256);

    /// @param account address for which we want to know the balance of power tokens
    /// @return Returns the amount of power tokens owned by `account`.
    function balanceOf(address account) external view returns (uint256);

    /// @param account address for which we want to know the balance of delegated power tokens to rewards contract
    /// @return  Returns the amount of power tokens owned by `account` and delegated to John contracts.
    function delegatedBalanceOf(address account) external view returns (uint256);

    /// @notice Returns withdrawal fee which it gets while unstake without cooling down
    /// @return Percent of fee in 18 decimal
    function getWithdrawFee() external view returns (uint256);

    /// @notice State of active cool down for the user. If PowerIporTypes.PowerIporCoolDown contains only zeros
    /// it represents no active cool down
    /// @return Object PowerIporTypes.PowerIporCoolDown which represents active cool down
    function activeCoolDown() external view returns (PowerIporTypes.PwIporCoolDown memory);

    /// @notice The method allowed to Stake IPOR Tokens and receive Power tokens.
    /// @param iporTokenAmount IPOR tokens which sender want to stake inside the PowerIpor
    function stake(uint256 iporTokenAmount) external;

    /// @notice The method allowed one to unstake IPOR Tokens, there is a fee if one wants to unstake without cooling down
    /// @param pwIporAmount pwIopr tokens amount which account want to unstake
    function unstake(uint256 pwIporAmount) external;

    /// @notice The method allowed to delegate power token to rewards
    /// @param ipTokens - list of ipTokens to which one want delegate tokens
    /// @param pwIporAmounts - list of pwIpor token amount which account want delegate
    function delegateToJohn(address[] memory ipTokens, uint256[] memory pwIporAmounts) external;

    /// @notice The method allowed to delegate power token to rewards
    /// @param ipTokens - list of ipTokens to which one want delegate tokens
    /// @param pwIporAmounts - list of pwIpor token amount which account want delegate
    /// @param ipTokenAmounts - list of ipToken amount which account want stake in john
    function delegateAndStakeToJohn(
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts,
        uint256[] memory ipTokenAmounts
    ) external;

    /// @notice The method allowed to withdraw power tokens from delegation
    /// @param ipTokens - ipToken from which one want withdraw tokens
    /// @param pwIporAmounts - amount which one want withdraw
    function undelegateFromJohn(address[] memory ipTokens, uint256[] memory pwIporAmounts) external;

    /// @notice The method allowed to freeze power tokens before withdraw Ipor tokens to avoid fees
    /// @param pwIporAmount pwIpor token amount which sender want to freeze
    function coolDown(uint256 pwIporAmount) external;

    /// @notice The method allowed to cancel cool down
    function cancelCoolDown() external;

    /// @notice The method allowed to redeem the ipor token when cool down time finish
    function redeem() external;

    /// @notice Emitted when user stake IPOR tokens
    /// @param account address
    /// @param iporTokenAmount of ipor token which should be stake into contract
    /// @param exchangeRate which was used to calculate base amount
    /// @param newBaseTokens amount of new base value
    event Stake(
        address account,
        uint256 iporTokenAmount,
        uint256 exchangeRate,
        uint256 newBaseTokens
    );

    /// @notice Emitted when user unstake IPOR tokens
    /// @param account address
    /// @param iporTokenAmount of ipor token which was call to unstake
    /// @param exchangeRate which was used to calculate base amount
    /// @param fee value which was subtract from amount
    event Unstake(address account, uint256 iporTokenAmount, uint256 exchangeRate, uint256 fee);

    /// @notice Emitted when user delegated tokens to john contract
    /// @param account address
    /// @param ipTokens list of token to delegate power tokens
    /// @param amounts list of value how tokens should be delegated by asset
    event DelegateToJohn(address account, address[] ipTokens, uint256[] amounts);

    /// @notice Emitted when user withdraw tokens from delegated
    /// @param account address
    /// @param ipTokens list of asset to delegate power tokens
    /// @param pwIporAmounts list of value how tokens should be undelegate by ipToken
    event UndelegateFromJohn(address account, address[] ipTokens, uint256[] pwIporAmounts);

    /// @notice Emitted when user setup coolDown
    /// @param account address
    /// @param pwIporAmount of ipor token which was call to unstake
    /// @param endTimestamp time when user will be able to redeem tokens without fee
    event CoolDown(address account, uint256 pwIporAmount, uint256 endTimestamp);

    /// @notice Emitted when user redeem tokens after cool down
    /// @param account address
    /// @param iporTokenAmount of ipor token was transferred to user
    event Redeem(address account, uint256 iporTokenAmount);
}
