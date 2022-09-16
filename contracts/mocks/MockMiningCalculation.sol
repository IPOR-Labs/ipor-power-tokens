// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "../libraries/math/MiningCalculation.sol";

contract MockMiningCalculation {
    function calculateUserPowerUp(
        uint256 pwToken,
        uint256 ipToken,
        uint256 verticalShift,
        uint256 horizontalShift
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAccountPowerUp(
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
        uint256 userIpTokens,
        uint256 userPowerUp,
        uint256 compositeMultiplier,
        uint256 userCompositeMultiplier
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAccountRewards(
                userIpTokens,
                userPowerUp,
                compositeMultiplier,
                userCompositeMultiplier
            );
    }
}
