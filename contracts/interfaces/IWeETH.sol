// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

interface IWeETH {
    /// @notice Fetches the amount of eEth respective to the amount of weEth sent in
    /// @param _weETHAmount amount sent in
    /// @return The total amount for the number of shares sent in
    function getEETHByWeETH(uint256 _weETHAmount) external view returns (uint256);
}
