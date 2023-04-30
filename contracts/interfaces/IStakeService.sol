// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

interface IStakeService {
    /// @notice Stakes the lpToken amount into the LiquidityMining.
    /// @param onBehalfOf account address staking the lpToken
    /// @param lpTokens addresses of the lpToken
    /// @param lpTokenAmounts for lpTokens staked, represented with 18 decimals
    function stakeLpTokens(
        address onBehalfOf,
        address[] calldata lpTokens,
        uint256[] calldata lpTokenAmounts
    ) external;

    // todo StakeService
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Unstakes the lpToken amount from the LiquidityMining.
    /// @param lpToken address of the underlying asset
    /// @param lpTokenAmount lpToken amount being unstaked, represented with 18 decimals
    function unstake(address lpToken, uint256 lpTokenAmount) external;

    // todo StakeService
    // [ ] - sequence diagrams
    // [ ] - implemented
}
