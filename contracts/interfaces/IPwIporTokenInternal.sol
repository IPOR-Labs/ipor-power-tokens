// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "./types/PwIporTokenTypes.sol";

/// @title
interface IPwIporTokenInternal {
    /// @notice Returns current version of Power Ipor Token
    /// @return Current Power Ipor Token version
    function getVersion() external pure returns (uint256);

    function totalSupplyBase() external view returns (uint256);

    /// @notice Calculated exchange rate between ipor Token and base value
    /// @return Current exchange rate between power token and the base value, represented in 18 decimals.
    function calculateExchangeRate() external view returns (uint256);

    /// @notice Method setup unstake fee
    /// @param withdrawalFee percent of fee, represented in 18 decimals.
    function setWithdrawalFee(uint256 withdrawalFee) external;

    /// @notice method allowed to transfer rewards from John contracts to balance of specific account
    /// @param account - address of user who received rewards
    /// @param iporTokenAmount - amount of rewards, represented in 18 decimals.
    function receiveRewards(address account, uint256 iporTokenAmount) external;

    /// @notice method return actual address of liquidity rewards contract
    function getJohn() external view returns (address);

    /// @notice method setup address of John
    /// @param john - new address of John contract
    function setJohn(address john) external;

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when user received rewards from john contract
    /// @param account address
    /// @param iporTokenAmount of power token received from john
    event ReceiveRewards(address account, uint256 iporTokenAmount);

    /// @notice Emitted when new Fee is setup.
    /// @param sender account address
    /// @param fee new value of fee, represented in 18 decimals
    event WithdrawalFee(address sender, uint256 fee);

    /// @notice Emmited when John's address is changed by its owner.
    /// @param changedBy account address that has changed John's address
    /// @param oldJohn John's old address
    /// @param newJohn John's new address
    event JohnChanged(address indexed changedBy, address indexed oldJohn, address indexed newJohn);
}
