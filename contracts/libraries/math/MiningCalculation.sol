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
        if (ipTokenAmount < Constants.D18) {
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
        uint256 newApu;
        if (apu < 0) {
            uint256 absApu = IporMath.division((-apu).toUint256(), Constants.D18);
            //   last unstake ipTokens we can have rounding error

            if (previousAggregatePowerUp < absApu && previousAggregatePowerUp + 10000 >= absApu) {
                return 0;
            }
            require(
                previousAggregatePowerUp >= absApu,
                MiningErrors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE
            );
            newApu = previousAggregatePowerUp - absApu;
        } else {
            newApu = previousAggregatePowerUp + IporMath.division(apu.toUint256(), Constants.D18);
        }

        if (newApu < 10000) {
            return 0;
        }
        return newApu;
    }

    function calculateAccruedRewards(
        uint256 blockNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 rewardsPerBlock,
        uint256 previousAccruedRewards
    ) internal view returns (uint256) {
        require(
            blockNumber >= lastRebalanceBlockNumber,
            MiningErrors.BLOCK_NUMBER_GREATER_OR_EQUAL_THAN_PREVIOUS_BLOCK_NUMBER
        );
        uint256 newRewards = (blockNumber - lastRebalanceBlockNumber) *
            rewardsPerBlock *
            Constants.D10;
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
    function compositeMultiplier(uint256 rewardsPerBlock, uint256 aggregatedPowerUp)
        internal
        view
        returns (uint256)
    {
        if (aggregatedPowerUp == 0) {
            return 0;
        }
        return
            IporMath.division(rewardsPerBlock * Constants.D18 * Constants.D19, aggregatedPowerUp);
    }

    /// @notice calculates account rewards represented in Ipor Tokens
    /// @param accountIpTokenAmount amount of ipToken for a given account
    /// @param accountPowerUp value of powerUp param for a given account
    /// @param compositeMultiplierCumulative value of param Composite Multiplier Cumulative global
    /// @param accountCompositeMultiplierCumulative value of param Composite Multiplier Cumulative for a given account
    /// @return rewards, amount of Ipor Tokens
    function calculateAccountRewards(
        uint256 accountIpTokenAmount,
        uint256 accountPowerUp,
        uint256 accountCompositeMultiplierCumulative,
        uint256 compositeMultiplierCumulative
    ) internal view returns (uint256) {
        require(
            compositeMultiplierCumulative >= accountCompositeMultiplierCumulative,
            MiningErrors.COMPOSITE_MULTIPLIER_GREATER_OR_EQUAL_THAN_ACCOUNT_COMPOSITE_MULTIPLIER
        );
        uint256 accountIporTokenRewards = accountIpTokenAmount *
            accountPowerUp *
            (compositeMultiplierCumulative - accountCompositeMultiplierCumulative);
        return IporMath.division(accountIporTokenRewards, Constants.D45);
    }

    function _toFixedPoint(uint256 number, uint256 decimals) private view returns (bytes16) {
        if (number % decimals > 0) {
            // when we calculate we lost this value in conversion
            number += 1;
        }
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        return fraction;
    }
}
