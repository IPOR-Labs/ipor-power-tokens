// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "abdk-libraries-solidity/ABDKMathQuad.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../errors/MiningErrors.sol";
import "../Constants.sol";
import "./IporMath.sol";
import "hardhat/console.sol";

library MiningCalculation {
    using SafeCast for uint256;
    using SafeCast for int256;

    function calculateAccountPowerUp(
        uint256 pwIporAmount,
        uint256 ipTokenAmount,
        uint256 verticalShift,
        uint256 horizontalShift
    ) internal view returns (uint256) {
        if (ipTokenAmount == 0) {
            return 0;
        }
        bytes16 pwIporAmountFP = _toFixedPoint(pwIporAmount, Constants.D18);
        bytes16 ipTokenAmountFP = _toFixedPoint(ipTokenAmount, Constants.D18);
        bytes16 verticalSwitchFP = _toFixedPoint(verticalShift, Constants.D18);
        bytes16 horizontalSwitchFP = _toFixedPoint(horizontalShift, Constants.D18);

        bytes16 underLog = ABDKMathQuad.add(
            ABDKMathQuad.div(pwIporAmountFP, ipTokenAmountFP),
            horizontalSwitchFP
        );

        bytes16 result = ABDKMathQuad.add(verticalSwitchFP, ABDKMathQuad.log_2(underLog));
        bytes16 resultD18 = ABDKMathQuad.mul(result, ABDKMathQuad.fromUInt(Constants.D18));
        return ABDKMathQuad.toUInt(resultD18);
    }

    function calculateAggregatePowerUp(
        uint256 accountPowerUp,
        uint256 accountIpTokenAmount,
        uint256 previousAccountPowerUp,
        uint256 previousAccountIpTokenAmount,
        uint256 previousAggregatePowerUp
    ) internal view returns (uint256) {
        int256 apu = accountPowerUp.toInt256() *
            accountIpTokenAmount.toInt256() -
            previousAccountPowerUp.toInt256() *
            previousAccountIpTokenAmount.toInt256();

        if (apu < 0) {
            uint256 absApu = IporMath.division((-apu).toUint256(), Constants.D18);
            //   last unstake ipTokens we can have rounding error
            if (previousAggregatePowerUp < absApu && previousAggregatePowerUp + 100 >= absApu) {
                return 0;
            }
            require(
                previousAggregatePowerUp >= absApu,
                MiningErrors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE
            );
            return previousAggregatePowerUp - absApu;
        }
        return previousAggregatePowerUp + IporMath.division(apu.toUint256(), Constants.D18);
    }

    function calculateAccruedRewards(
        uint256 blocNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 blockRewards,
        uint256 previousAccruedRewards
    ) internal view returns (uint256) {
        require(
            blocNumber >= lastRebalanceBlockNumber,
            MiningErrors.BLOCK_NUMBER_GREATER_OR_EQUAL_THAN_PREVIOUS_BLOCK_NUMBER
        );
        uint256 newRewards = (blocNumber - lastRebalanceBlockNumber) * blockRewards * Constants.D10;
        return previousAccruedRewards + newRewards;
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
        if (aggregatePowerUp == 0) {
            return 0;
        }
        return IporMath.division(blockRewards * Constants.D18 * Constants.D19, aggregatePowerUp);
    }

    function calculateAccountRewards(
        uint256 accountIpTokenAmount,
        uint256 accountPowerUp,
        uint256 compositeMultiplierCumulative,
        uint256 accountCompositeMultiplierCumulative
    ) internal view returns (uint256) {
        require(
            compositeMultiplierCumulative >= accountCompositeMultiplierCumulative,
            MiningErrors.COMPOSITE_MULTIPLIER_GREATER_OR_EQUAL_THAN_ACCOUNT_COMPOSITE_MULTIPLIER
        );
        uint256 accountRewards = accountIpTokenAmount *
            accountPowerUp *
            (compositeMultiplierCumulative - accountCompositeMultiplierCumulative);
        return IporMath.division(accountRewards, Constants.D45);
    }

    function _toFixedPoint(uint256 number, uint256 decimals) internal view returns (bytes16) {
        if (number % decimals > 0) {
            //            when we calculate we lost this value in conversion
            number += 1;
        }
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        return fraction;
    }
}
