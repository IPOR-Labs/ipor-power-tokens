// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

interface IMiningService {
    function claim(address[] lpTokens) external;

    // todo ClaimService
    // [x] - sequence diagrams
    // [ ] - implemented

    /// @notice method allowing to update the indicators per asset (lpToken).
    /// @param account of which we should update the indicators
    /// @param lpTokens of the staking pools to update the indicators
    function updateIndicators(address account, address[] calldata lpTokens) external;

    // todo MiningService
    // [x] - sequence diagrams
    // [ ] - implemented
}
