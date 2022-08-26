// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "./types/PwIporTokenTypes.sol";

/// @title
interface IPwIporToken {
    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function getVersion() external pure returns (uint256);

    function withdrawalFee() external view returns (uint256);

    function setWithdrawalFee(uint256 withdrawalFee) external;

    function stake(uint256 amount) external;

    function unstake(uint256 amount) external;

    function coolDown(uint256 amount) external;

    function cancelCoolDown() external;

    function redeem() external;

    function activeCoolDown() external view returns (PwIporTokenTypes.PwCoolDown memory);

    function receiveRewords(address user, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);

    function totalSupplyBase() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function exchangeRate() external view returns (uint256);

    function pause() external;

    function unpause() external;
}
