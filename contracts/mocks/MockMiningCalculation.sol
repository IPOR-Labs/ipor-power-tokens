// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "../libraries/math/MiningCalculation.sol";

contract MockMiningCalculation {
    function calculateAccountPowerUp(
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

    function calculateAggregatedPowerUp(
        uint256 userPowerUp,
        uint256 userIpTokenAmount,
        uint256 previousUserPowerUp,
        uint256 previousUserIpTokenAmount,
        uint256 previousAggregatedPowerUp
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAggregatedPowerUp(
                userPowerUp,
                userIpTokenAmount,
                previousUserPowerUp,
                previousUserIpTokenAmount,
                previousAggregatedPowerUp
            );
    }

    function calculateAccruedRewards(
        uint256 blocNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 rewardsPerBlock,
        uint256 previousAccruedRewards
    ) public view returns (uint256) {
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
        view
        returns (uint256)
    {
        return MiningCalculation.calculateCompositeMultiplier(rewardsPerBlock, aggregatedPowerUp);
    }

    function calculateAccountRewards(
        uint256 accountIpTokenAmount,
        uint256 accountPowerUp,
        uint256 accountCompositeMultiplier,
        uint256 compositeMultiplier
    ) public view returns (uint256) {
        return
            MiningCalculation.calculateAccountRewards(
                accountIpTokenAmount,
                accountPowerUp,
                accountCompositeMultiplier,
                compositeMultiplier
            );
    }
}
