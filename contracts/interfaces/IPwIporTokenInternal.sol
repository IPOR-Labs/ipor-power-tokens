// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "./types/PwIporTokenTypes.sol";

/// @title
interface IPwIporTokenInternal {
    function totalSupplyBase() external view returns (uint256);

    /// @notice Calculated exchange rate between ipor Token and base value
    /// @return Current exchange rate between power token and the base value, represented in 18 decimals.
    function exchangeRate() external view returns (uint256);

    /// @notice Method setup unstake fee
    /// @param withdrawalFee percent of fee, represented in 18 decimals.
    function setWithdrawalFee(uint256 withdrawalFee) external;

    /// @notice method setup address of LiquidityRewards
    /// @param liquidityRewards - new address of LiquidityRewards contract
    function setLiquidityRewardsAddress(address liquidityRewards) external;

    /// @notice method allowed to transfer rewords from LiquidityRewards contracts to balance of user
    /// @param user - address of user who received rewords
    /// @param amount - amount of rewords, represented in 18 decimals.
    function receiveRewords(address user, uint256 amount) external;

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when new Fee is setup.
    /// @param timestamp moment when set new fee
    /// @param sender account address
    /// @param fee new value of fee, represented in 18 decimals
    event WithdrawalFee(uint256 timestamp, address sender, uint256 fee);

    /// @notice Emitted when new LiquidityRewardsAddress is setup
    /// @param timestamp moment when set new fee
    /// @param sender account address
    /// @param newLiquidityRewardsAddress address of rewards address
    event LiquidityRewardsAddressChanged(
        uint256 timestamp,
        address sender,
        address newLiquidityRewardsAddress
    );
}
