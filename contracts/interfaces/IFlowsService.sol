// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

interface IFlowsService {
    function claim(address[] calldata lpTokens) external;

    function updateIndicators(address account, address[] calldata lpTokens) external;

    function delegate(address[] calldata lpTokens, uint256[] calldata lpTokenAmounts) external;

    function undelegate(address[] calldata lpTokens, uint256[] calldata lpTokenAmounts) external;
}
