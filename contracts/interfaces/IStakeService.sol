// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

interface IStakeService {
    function stakeLpTokens(
        address onBehalfOf,
        address[] calldata lpTokens,
        uint256[] calldata lpTokenAmounts
    ) external;

    function unstakeLpTokens(address[] calldata lpTokens, uint256[] calldata lpTokenAmounts)
        external;

    function stakeProtocolToken(address onBehalfOf, uint256 iporTokenAmount) external;

    function unstakeProtocolToken(address transferTo, uint256 iporTokenAmount) external;

    function cooldown(uint256 pwTokenAmount) external;

    function cancelCooldown() external;

    function redeem() external;
}
