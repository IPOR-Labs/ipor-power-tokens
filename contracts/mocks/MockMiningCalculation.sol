// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../libraries/math/MiningCalculation.sol";

contract MockMiningCalculation {
    function calculateAccountPowerUp(
        uint256 pwTokenAmount,
        uint256 lpTokenAmount,
        bytes16 verticalShift,
        bytes16 horizontalShift
    ) public pure returns (uint256) {
        return
            MiningCalculation.calculateAccountPowerUp(
                pwTokenAmount,
                lpTokenAmount,
                verticalShift,
                horizontalShift
            );
    }

    function calculateAggregatedPowerUp(
        uint256 userPowerUp,
        uint256 userLpTokenAmount,
        uint256 previousUserPowerUp,
        uint256 previousUserLpTokenAmount,
        uint256 previousAggregatedPowerUp
    ) public pure returns (uint256) {
        return
            MiningCalculation.calculateAggregatedPowerUp(
                userPowerUp,
                userLpTokenAmount,
                previousUserPowerUp,
                previousUserLpTokenAmount,
                previousAggregatedPowerUp
            );
    }

    function calculateAccruedRewards(
        uint256 blocNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 rewardsPerBlock,
        uint256 previousAccruedRewards
    ) public pure returns (uint256) {
        return
            MiningCalculation.calculateAccruedRewards(
                blocNumber,
                lastRebalanceBlockNumber,
                rewardsPerBlock,
                previousAccruedRewards
            );
    }

    function calculateCompositeMultiplier(uint256 rewardsPerBlock, uint256 aggregatedPowerUp)
        public
        pure
        returns (uint256)
    {
        return MiningCalculation.calculateCompositeMultiplier(rewardsPerBlock, aggregatedPowerUp);
    }

    function calculateAccountRewards(
        uint256 accountLpTokenAmount,
        uint256 accountPowerUp,
        uint256 accountCompositeMultiplier,
        uint256 compositeMultiplier
    ) public pure returns (uint256) {
        return
            MiningCalculation.calculateAccountRewards(
                accountLpTokenAmount,
                accountPowerUp,
                accountCompositeMultiplier,
                compositeMultiplier
            );
    }

    function accountPowerUpStepFunction(bytes16 ratio) external pure returns (bytes16) {
        return MiningCalculation.accountPowerUpStepFunction(ratio);
    }
}
