// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "../libraries/math/MiningCalculation.sol";

contract MockMiningCalculation {
    function calculateUserPowerUp(
        uint256 pwToken,
        uint256 ipToken,
        uint256 verticalShift,
        uint256 horizontalShift
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateUserPowerUp(
                pwToken,
                ipToken,
                verticalShift,
                horizontalShift
            );
    }

    function calculateAggregatePowerUp(
        uint256 userPowerUp,
        uint256 userIpToken,
        uint256 previousUserPowerUp,
        uint256 previousUserIpToken,
        uint256 previousAggregatePowerUp
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAggregatePowerUp(
                userPowerUp,
                userIpToken,
                previousUserPowerUp,
                previousUserIpToken,
                previousAggregatePowerUp
            );
    }

    function calculateAccruedRewards(
        uint256 blocNumber,
        uint256 lastRebalancingBlockNumber,
        uint256 blockRewords,
        uint256 previousAccruedRewards
    ) internal view returns (uint256) {
        return
            MiningCalculation.calculateAccruedRewards(
                blocNumber,
                lastRebalancingBlockNumber,
                blockRewords,
                previousAccruedRewards
            );
    }

    function calculateUserCompositeMultiplier(
        uint256 compositeMultiplier,
        uint256 blockRewards,
        uint256 aggregatePowerUp
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateUserCompositeMultiplier(
                compositeMultiplier,
                blockRewards,
                aggregatePowerUp
            );
    }

    function calculateCompositeMultiplier(
        uint256 previousCompositeMultiplier,
        uint256 aggregateRewards,
        uint256 aggregatePowerUp
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateCompositeMultiplier(
                previousCompositeMultiplier,
                aggregateRewards,
                aggregatePowerUp
            );
    }

    function calculateUserRewards(
        uint256 userIpTokens,
        uint256 userPowerUp,
        uint256 compositeMultiplier,
        uint256 userCompositeMultiplier
    ) internal view returns (uint256) {
        return
            MiningCalculation.calculateUserRewards(
                userIpTokens,
                userPowerUp,
                compositeMultiplier,
                userCompositeMultiplier
            );
    }
}
