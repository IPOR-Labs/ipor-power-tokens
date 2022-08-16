// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "abdk-libraries-solidity/ABDKMathQuad.sol";
import "../errors/MiningErrors.sol";
import "../Constants.sol";
import "./IporMath.sol";
import "hardhat/console.sol";

library MiningCalculation {
    function calculateUserPowerUp(
        uint256 pwToken,
        uint256 ipToken,
        uint256 verticalShift,
        uint256 horizontalShift
    ) internal view returns (uint256) {
        if (ipToken == 0) {
            return 0;
        }
        bytes16 pwTokenFP = _toFixedPoint(pwToken, Constants.D18);
        bytes16 ipTokenFP = _toFixedPoint(ipToken, Constants.D18);
        bytes16 verticalSwitchFP = _toFixedPoint(verticalShift, Constants.D18);
        bytes16 horizontalSwitchFP = _toFixedPoint(horizontalShift, Constants.D18);

        bytes16 underLog = ABDKMathQuad.add(
            ABDKMathQuad.div(pwTokenFP, ipTokenFP),
            horizontalSwitchFP
        );

        bytes16 result = ABDKMathQuad.add(verticalSwitchFP, ABDKMathQuad.log_2(underLog));
        bytes16 resultD18 = ABDKMathQuad.mul(result, ABDKMathQuad.fromUInt(Constants.D18));
        return ABDKMathQuad.toUInt(resultD18);
    }

    function calculateAggregatePowerUp(
        uint256 userPowerUp,
        uint256 userIpToken,
        uint256 previousUserPowerUp,
        uint256 previousUserIpToken,
        uint256 previousAggregatePowerUp
    ) internal view returns (uint256) {
        uint256 apu = userPowerUp * userIpToken - previousUserPowerUp * previousUserIpToken;
        return previousAggregatePowerUp + IporMath.division(apu, Constants.D18);
    }

    function calculateAccruedRewards(
        uint256 blocNumber,
        uint256 lastRebalancingBlockNumber,
        uint256 blockRewords,
        uint256 previousAccruedRewards
    ) internal view returns (uint256) {
        require(
            blocNumber >= lastRebalancingBlockNumber,
            MiningErrors.BLOCK_NUMBER_GREATER_OR_EQUAL_THEN_PREVIOUS_BLOCK_NUMBER
        );
        uint256 newRewords = (blocNumber - lastRebalancingBlockNumber) * blockRewords;
        return previousAccruedRewards + IporMath.division(newRewords, Constants.D18);
    }

    //    TODO: what if in one block we change  blockRewards and calculate calculateUserCompositeMultiplier ??
    function calculateUserCompositeMultiplier(
        uint256 compositeMultiplier,
        uint256 blockRewards,
        uint256 aggregatePowerUp
    ) internal view returns (uint256) {
        uint256 rewards = blockRewards * aggregatePowerUp;
        return compositeMultiplier - IporMath.division(rewards, Constants.D18);
    }

    function calculateCompositeMultiplier(
        uint256 previousCompositeMultiplier,
        uint256 aggregateRewards,
        uint256 aggregatePowerUp
    ) internal view returns (uint256) {
        if (aggregatePowerUp == 0) {
            return previousCompositeMultiplier;
        }
        return
            previousCompositeMultiplier +
            IporMath.division(aggregateRewards * Constants.D18, aggregatePowerUp);
    }

    function calculateUserRewards(
        uint256 userIpTokens,
        uint256 userPowerUp,
        uint256 compositeMultiplier,
        uint256 userCompositeMultiplier
    ) internal view returns (uint256) {
        require(
            compositeMultiplier >= userCompositeMultiplier,
            COMPOSITE_MULTIPLIER_GREATER_OR_EQUAL_THEN_USER_COMPOSITE_MULTIPLIER
        );
        uint256 userRewards = userIpTokens *
            userPowerUp *
            (compositeMultiplier - userCompositeMultiplier);
        return IporMath.division(userRewards, Constants.D54);
    }

    //  On fraction we lost 0.00000000000000001
    function _toFixedPoint(uint256 number, uint256 decimals) internal view returns (bytes16) {
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        console.log("number: ", number);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        bytes16 test4 = ABDKMathQuad.mul(fraction, ABDKMathQuad.fromUInt(Constants.D18));
        console.log("fraction: ", ABDKMathQuad.toUInt(test4));
        return fraction;
    }
}
