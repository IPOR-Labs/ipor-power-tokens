// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "./types/PwIporTokenTypes.sol";

/// @title Interface for interaction with PwIporToken - smart contract responsible
/// for managing Power Ipor token and Ipor Token and delegation to LiquidityRewards contracts.
interface IPwIporToken {
    /// @return  Returns the name of the token.
    function name() external pure returns (string memory);

    /// @return  Returns the symbol of the token, usually a shorter version of the
    function symbol() external pure returns (string memory);

    /// @return   Returns the number of decimals 18 used to get its user representation.
    function decimals() external pure returns (uint8);

    /// @notice Returns current version of Power Ipor Token
    /// @return Current Power Ipor Tokenr version
    function getVersion() external pure returns (uint256);

    /// @notice Returns withdrawal fee which it gets while unstake without cooling down
    /// @return Percent of fee in 18 decimal
    function withdrawalFee() external view returns (uint256);

    /// @notice Total supply of power tokens
    /// @return Total supply of power tokens in 18 decimals
    function totalSupply() external view returns (uint256);

    /// @notice State of active cool down for the user. If PwIporTokenTypes.PwCoolDown contains only zeros
    /// it represents no active cool down
    /// @return Object PwIporTokenTypes.PwCoolDown which represents active cool down
    function activeCoolDown() external view returns (PwIporTokenTypes.PwCoolDown memory);

    /// @param account address for which we want to know the balance of power tokens
    /// @return Returns the amount of power tokens owned by `account`.
    function balanceOf(address account) external view returns (uint256);

    /// @param account address for which we want to know the balance of delegated power tokens to rewards contract
    /// @return  Returns the amount of power tokens owned by `account` and delegated to LiquidityRewards contracts.
    function delegatedBalanceOf(address account) external view returns (uint256);

    /// @notice The method allowed to Stake IPOR Tokens and receive Power tokens.
    /// @param iporTokenAmount IPOR tokens which sender want to stake inside the PwIporToken
    function stake(uint256 iporTokenAmount) external;

    /// @notice The method allowed one to unstake IPOR Tokens, there is a fee if one wants to unstake without cooling down
    /// @param pwTokenAmount IPOR tokens which sender want to stake inside the PwIporToken
    function unstake(uint256 pwTokenAmount) external;

    /// @notice The method allowed to freeze power tokens before withdraw Ipor tokens to avoid fees
    /// @param pwTokenAmount power tokens which sender want to freeze
    function coolDown(uint256 pwTokenAmount) external;

    /// @notice The method allowed to cancel cool down
    function cancelCoolDown() external;

    /// @notice The method allowed to redeem the ipor token when cool down time finish
    function redeem() external;

    /// @notice The method allowed to delegate power token to rewards
    /// @param ipAssets - list of assets to which one want delegate tokens
    /// @param pwTokensAmounts - list of amount which one want delegate
    function delegateToRewards(address[] memory ipAssets, uint256[] memory pwTokensAmounts)
        external;

    /// @notice The method allowed to withdraw power tokens from delegation
    /// @param ipAsset - asset from which one want withdraw tokens
    /// @param pwTokenAmount - amount which one want withdraw
    function withdrawFromDelegation(address ipAsset, uint256 pwTokenAmount) external;

    /// @notice Emitted when user stake IPOR tokens
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param iporTokenAmount of ipor token which should be stake into contract
    /// @param exchangeRate which was used to calculate base amount
    /// @param newBaseTokens amount of new base value
    event Stake(
        uint256 timestamp,
        address account,
        uint256 iporTokenAmount,
        uint256 exchangeRate,
        uint256 newBaseTokens
    );

    /// @notice Emitted when user unstake IPOR tokens
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param iporTokenAmount of ipor token which was call to unstake
    /// @param exchangeRate which was used to calculate base amount
    /// @param fee value which was subtract from amount
    event Unstake(
        uint256 timestamp,
        address account,
        uint256 iporTokenAmount,
        uint256 exchangeRate,
        uint256 fee
    );

    /// @notice Emitted when user setup coolDown
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param pwTokenAmount of ipor token which was call to unstake
    /// @param finishTimestamp time when user will be able to redeem tokens without fee
    event CoolDown(
        uint256 timestamp,
        address account,
        uint256 pwTokenAmount,
        uint256 finishTimestamp
    );

    /// @notice Emitted when user redeem tokens after cool down
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param iporTokenAmount of ipor token was transferred to user
    event Redeem(uint256 timestamp, address account, uint256 iporTokenAmount);

    /// @notice Emitted when user received rewards from liquidityRewards contract
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param iporTokenAmount of power token received from liquidityRewards
    event ReceiveRewards(uint256 timestamp, address account, uint256 iporTokenAmount);

    /// @notice Emitted when user delegated tokens to liquidityRewards contract
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param assets list of asset to delegate power tokens
    /// @param amounts list of value how tokens should be delegated by asset
    event DelegateToReward(uint256 timestamp, address account, address[] assets, uint256[] amounts);

    /// @notice Emitted when user withdraw tokens from delegated
    /// @param timestamp moment when method was execute
    /// @param account address
    /// @param ipAsset list of asset to delegate power tokens
    /// @param pwTokenAmount list of value how tokens should be delegated by asset
    event WithdrawFromDelegation(
        uint256 timestamp,
        address account,
        address ipAsset,
        uint256 pwTokenAmount
    );
}
