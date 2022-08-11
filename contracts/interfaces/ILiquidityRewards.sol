// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/// @title
interface ILiquidityRewards {
    function getVersion() external pure returns (uint256);

    function stake(address asset, uint256 amount) external;

    function delegatePwIpor(address[] memory assets, uint256[] memory amounts) external;

    function isAssetSupported(address asset) external view returns (bool);

    function addAsset(address asset) external;

    function removeAsset(address asset) external;

    function balanceOf(address asset) external view returns (uint256);

    function pause() external;

    function unpause() external;
}
