// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/IMiningService.sol";
import "../interfaces/ILiquidityMiningV2.sol";
import "../libraries/errors/Errors.sol";

contract MiningService is IMiningService {
    address public immutable liquidityMining;
    address public immutable powerToken;
    address public immutable stakedToken;

    constructor(address liquidityMiningAddress, address stakedTokenAddress) {
        liquidityMining = liquidityMiningAddress;
        stakedToken = stakedTokenAddress;
    }

    function claim(address[] lpTokens) external {
        require(lpTokens.length > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 rewardsAmountToTransfer = ILiquidityMiningV2(liquidityMining).claim(lpTokens);

        require(rewardsAmountToTransfer > 0, Errors.NO_REWARDS_TO_CLAIM);
        // todo: transfer rewards to powerToken
        //        IERC20(stakedToken).transfer(msg.sender, rewardsAmountToTransfer);
    }

    function updateIndicators(address account, address[] calldata lpTokens) external {}
}
