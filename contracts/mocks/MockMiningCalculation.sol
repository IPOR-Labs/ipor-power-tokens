// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "../libraries/math/MiningCalculation.sol";

contract MockMiningCalculation {
    function calculateUserPowerUp(
        uint256 pwIporAmount,
        uint256 ipTokenAmount,
        uint256 verticalShift,
        uint256 horizontalShift
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAccountPowerUp(
                pwIporAmount,
                ipTokenAmount,
                verticalShift,
                horizontalShift
            );
    }

    function calculateAggregatePowerUp(
        uint256 userPowerUp,
        uint256 userIpTokenAmount,
        uint256 previousUserPowerUp,
        uint256 previousUserIpTokenAmount,
        uint256 previousAggregatePowerUp
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAggregatePowerUp(
                userPowerUp,
                userIpTokenAmount,
                previousUserPowerUp,
                previousUserIpTokenAmount,
                previousAggregatePowerUp
            );
    }

    function calculateAccruedRewards(
        uint256 blocNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 blockRewards,
        uint256 previousAccruedRewards
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAccruedRewards(
                blocNumber,
                lastRebalanceBlockNumber,
                blockRewards,
                previousAccruedRewards
            );
    }

    function compositeMultiplier(uint256 blockRewards, uint256 aggregatePowerUp)
        public
        view
        returns (uint256)
    {
        return MiningCalculation.compositeMultiplier(blockRewards, aggregatePowerUp);
    }

    function compositeMultiplierCumulative(
        uint256 lastRebalanseBlockNumber,
        uint256 blockNumber,
        uint256 previousCompositeMultiplierCumulative,
        uint256 previousCompositeMultiplier,
        uint256 compositeMultiplier
    ) public view returns (uint256) {
        return
            MiningCalculation.compositeMultiplierCumulative(
                lastRebalanseBlockNumber,
                blockNumber,
                previousCompositeMultiplierCumulative,
                previousCompositeMultiplier,
                compositeMultiplier
            );
    }

    function calculateUserRewards(
        uint256 userIpTokenAmount,
        uint256 userPowerUp,
        uint256 compositeMultiplier,
        uint256 userCompositeMultiplier
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAccountRewards(
                userIpTokenAmount,
                userPowerUp,
                compositeMultiplier,
                userCompositeMultiplier
            );
    }
}
