// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/PowerIporTypes.sol";

/// @title Interface for interaction with PowerIpor - smart contract responsible
/// for managing Power Ipor Token (pwIpor), swap Ipor Token to Power Ipor tokens and
/// delegating Power Ipor tokens to John contracts.
interface IPowerIpor {
    /// @notice Name of the pwIpor token
    /// @return Returns the name of the pwIpor token.
    function name() external pure returns (string memory);

    /// @notice Symbol of the pwIpor token.
    /// @return Returns the symbol of the token.
    function symbol() external pure returns (string memory);

    /// @notice Returns the number of decimals used in pwIpor token. By default it is 18 decimals.
    /// @return Returns the number of decimals 18 used to get its user representation.
    function decimals() external pure returns (uint8);

    /// @notice Gets total supply of pwIpor token.
    /// @dev Value is calculated in runtime using baseTotalSupply and internal exchange rate.
    /// @return Total supply of pwIpor tokens, represented in 18 decimals
    function totalSupply() external view returns (uint256);

    /// @notice Gets balance of pwIpor token for a given account address
    /// @param account account address for which is checked balance of pwIpor tokens
    /// @return Returns the amount of pwIpor tokens owned by `account`.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Gets delegated balance of pwIpor token for a given account address. Token are delegated from PowerIpor to John smart contract (reponsible for rewards distribution).
    /// @param account account address for which is checked balance of delegated pwIpor tokens
    /// @return  Returns the amount of pwIpor tokens owned by `account` and delegated to John contracts.
    function delegatedBalanceOf(address account) external view returns (uint256);

    /// @notice Gets configuration param the fee which is taken when account want to unstake Ipor token from PowerIpor in time when cooldown is active.
    /// @dev Fee value represented in as a percentage in 18 decimals
    /// @return value, a percentage of  in 18 decimal
    function getUnstakeWithoutCooldownFee() external view returns (uint256);

    /// @notice Gets state of active cool down for the account.
    /// @dev If PowerIporTypes.PowerIporCoolDown contains only zeros it represents no active cool down.
    /// Struct contain information when cooldown is ended and how many pwIpor tokens are locked.
    /// @return Object PowerIporTypes.PowerIporCoolDown which represents active cool down, the moment of
    function getActiveCoolDown() external view returns (PowerIporTypes.PwIporCoolDown memory);

    /// @notice Stakes IPOR Tokens and receive Power Ipor tokens (pwIpor).
    /// @param iporTokenAmount IPOR tokens which sender want to stake to the PowerIpor smart contract
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
    /// @param ipToken - ipToken from which one want withdraw tokens
    /// @param pwIporAmount - amount which one want withdraw
    function undelegateFromJohn(address ipToken, uint256 pwIporAmount) external;

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

    /// @notice Emitted when user delegated tokens to John contract
    /// @param account address
    /// @param ipTokens list of token to delegate power tokens
    /// @param pwIporAmounts list of value how tokens should be delegated by asset
    event DelegateToJohn(address account, address[] ipTokens, uint256[] pwIporAmounts);

    /// @notice Emitted when user withdraw tokens from delegated
    /// @param account address
    /// @param ipToken list of asset to delegate power tokens
    /// @param pwIporAmount list of value how tokens should be delegated by asset
    event UndelegateFromJohn(address account, address ipToken, uint256 pwIporAmount);

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
