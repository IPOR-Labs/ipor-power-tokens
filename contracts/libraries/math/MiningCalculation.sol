// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "abdk-libraries-solidity/ABDKMathQuad.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../errors/MiningErrors.sol";
import "../Constants.sol";
import "./IporMath.sol";
import "hardhat/console.sol";

library MiningCalculation {
    using SafeCast for uint256;
    using SafeCast for int256;

    function calculateUserPowerUp(
        uint256 pwToken,
        uint256 ipToken,
        uint256 verticalShift,
        uint256 horizontalShift
    ) internal view returns (uint256) {
        console.log("MiningCalculation->calculateUserPowerUp->pwToken: ", pwToken);
        console.log("MiningCalculation->calculateUserPowerUp->ipToken: ", ipToken);
        console.log("MiningCalculation->calculateUserPowerUp->verticalShift: ", verticalShift);
        console.log("MiningCalculation->calculateUserPowerUp->horizontalShift: ", horizontalShift);
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
        console.log("MiningCalculation->calculateAggregatePowerUp->userPowerUp: ", userPowerUp);
        console.log("MiningCalculation->calculateAggregatePowerUp->userIpToken: ", userIpToken);
        console.log(
            "MiningCalculation->calculateAggregatePowerUp->previousUserPowerUp: ",
            previousUserPowerUp
        );
        console.log(
            "MiningCalculation->calculateAggregatePowerUp->previousUserIpToken: ",
            previousUserIpToken
        );
        console.log(
            "MiningCalculation->calculateAggregatePowerUp->previousAggregatePowerUp: ",
            previousAggregatePowerUp
        );

        int256 apu = userPowerUp.toInt256() *
            userIpToken.toInt256() -
            previousUserPowerUp.toInt256() *
            previousUserIpToken.toInt256();

        if (apu < 0) {
            console.log("MiningCalculation->calculateAggregatePowerUp->apu: -", (-apu).toUint256());
            uint256 absApu = (-apu).toUint256();
            require(
                previousAggregatePowerUp >= absApu,
                MiningErrors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE
            );
            return previousAggregatePowerUp - IporMath.division(absApu, Constants.D18);
        }
        console.log("MiningCalculation->calculateAggregatePowerUp->apu: ", (apu).toUint256());

        return previousAggregatePowerUp + IporMath.division(apu.toUint256(), Constants.D18);
    }

    function calculateAccruedRewards(
        uint256 blocNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 blockRewords,
        uint256 previousAccruedRewards
    ) internal view returns (uint256) {
        require(
            blocNumber >= lastRebalanceBlockNumber,
            MiningErrors.BLOCK_NUMBER_GREATER_OR_EQUAL_THEN_PREVIOUS_BLOCK_NUMBER
        );
        uint256 newRewords = (blocNumber - lastRebalanceBlockNumber) * blockRewords * Constants.D10;
        return previousAccruedRewards + newRewords;
    }

    // returns value with 27 decimals
    function compositeMultiplierCumulative(
        uint256 lastRebalanseBlockNumber,
        uint256 blockNumber,
        uint256 previousCompositeMultiplierCumulative,
        uint256 previousCompositeMultiplier,
        uint256 compositeMultiplier
    ) internal view returns (uint256) {
        if (blockNumber == lastRebalanseBlockNumber) {
            return previousCompositeMultiplierCumulative;
        }
        return
            (blockNumber - lastRebalanseBlockNumber - 1) *
            previousCompositeMultiplier +
            previousCompositeMultiplierCumulative +
            compositeMultiplier;
    }

    // returns value with 27 decimals
    function compositeMultiplier(uint256 blockRewards, uint256 aggregatePowerUp)
        internal
        view
        returns (uint256)
    {
        console.log("MiningCalculation->compositeMultiplier->blockRewards: ", blockRewards);
        console.log("MiningCalculation->compositeMultiplier->aggregatePowerUp: ", aggregatePowerUp);
        if (aggregatePowerUp == 0) {
            return 0;
        }
        return IporMath.division(blockRewards * Constants.D18 * Constants.D19, aggregatePowerUp);
    }

    function calculateUserRewards(
        uint256 userIpTokens,
        uint256 userPowerUp,
        uint256 compositeMultiplier,
        uint256 compositeMultiplierCumulative
    ) internal view returns (uint256) {
        console.log("MiningCalculation->calculateUserRewards->userIpTokens: ", userIpTokens);
        console.log("MiningCalculation->calculateUserRewards->userPowerUp: ", userPowerUp);
        console.log(
            "MiningCalculation->calculateUserRewards->compositeMultiplier: ",
            compositeMultiplier
        );
        console.log(
            "MiningCalculation->calculateUserRewards->userCompositeMultiplier: ",
            compositeMultiplierCumulative
        );
        require(
            compositeMultiplier >= compositeMultiplierCumulative,
            MiningErrors.COMPOSITE_MULTIPLIER_GREATER_OR_EQUAL_THEN_USER_COMPOSITE_MULTIPLIER
        );
        uint256 userRewards = userIpTokens *
            userPowerUp *
            (compositeMultiplier - compositeMultiplierCumulative);
        return IporMath.division(userRewards, Constants.D45);
    }

    function _toFixedPoint(uint256 number, uint256 decimals) internal view returns (bytes16) {
        if (number % decimals > 0) {
            //            when we calculate we lost this value in conversion
            number += 1;
        }
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        bytes16 test4 = ABDKMathQuad.mul(fraction, ABDKMathQuad.fromUInt(Constants.D18));
        return fraction;
    }
}
