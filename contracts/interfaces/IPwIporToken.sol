// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/// @title
interface IPwIporToken {
    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function getVersion() external pure returns (uint256);

    function stake(uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);

    function exchangeRate() external pure returns (uint256);

    function pause() external;

    function unpause() external;
}
