// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "abdk-libraries-solidity/ABDKMathQuad.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../errors/MiningErrors.sol";
import "../Constants.sol";
import "./IporMath.sol";

/// @title Library which contains core logic used in Liquidity Mining module.
library MiningCalculation {
    using SafeCast for uint256;
    using SafeCast for int256;

    /// @notice Calculases Power Up Indicator specific for one account.
    /// @param accountPwIporAmount account's Power Ipor Tokens amount
    /// @param accountIpTokenAmount account's IP Tokens Amount
    /// @param verticalShift preconfigured param, vertical shift used in equation which calculate account power up indicator
    /// @param horizontalShift preconfigured param, horizontal shift used in equation which calculate account power up indicator
    /// @return power up indicator for a given account
    function calculateAccountPowerUp(
        uint256 accountPwIporAmount,
        uint256 accountIpTokenAmount,
        bytes16 verticalShift,
        bytes16 horizontalShift
    ) internal pure returns (uint256) {
        if (accountIpTokenAmount < Constants.D18) {
            return 0;
        }

        bytes16 pwIporAmountQP = _toQuadruplePrecision(accountPwIporAmount, Constants.D18);
        bytes16 ipTokenAmountQP = _toQuadruplePrecision(accountIpTokenAmount, Constants.D18);

        bytes16 underLog = ABDKMathQuad.add(
            ABDKMathQuad.div(pwIporAmountQP, ipTokenAmountQP),
            horizontalShift
        );

        bytes16 result = ABDKMathQuad.add(verticalShift, ABDKMathQuad.log_2(underLog));
        bytes16 resultD18 = ABDKMathQuad.mul(result, ABDKMathQuad.fromUInt(Constants.D18));

        return ABDKMathQuad.toUInt(resultD18);
    }

    /// @notice Calculates aggreagated power up. Aggregate Power-up is a synthetic summary of all power-ups across all users.
    /// It's used to calculate individual rewards in relation to the rest of the pool.
    /// @param accountPowerUp power up indicator calculated for a given account
    /// @param accountIpTokenAmount IP Token amount for a given account
    /// @param previousAccountPowerUp previous power up indicator for a given account
    /// @param previousAccountIpTokenAmount previous IP Token amount for a given account
    /// @param previousAggregatedPowerUp previous aggregated power up indicator
    function calculateAggregatedPowerUp(
        uint256 accountPowerUp,
        uint256 accountIpTokenAmount,
        uint256 previousAccountPowerUp,
        uint256 previousAccountIpTokenAmount,
        uint256 previousAggregatedPowerUp
    ) internal pure returns (uint256) {
        int256 apu = accountPowerUp.toInt256() *
            accountIpTokenAmount.toInt256() -
            previousAccountPowerUp.toInt256() *
            previousAccountIpTokenAmount.toInt256();

        uint256 newApu;

        if (apu < 0) {
            uint256 absApu = IporMath.division((-apu).toUint256(), Constants.D18);

            /// @dev last unstake ipTokens we can have rounding error
            if (previousAggregatedPowerUp < absApu && previousAggregatedPowerUp + 10000 >= absApu) {
                return 0;
            }

            require(
                previousAggregatedPowerUp >= absApu,
                MiningErrors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE
            );

            newApu = previousAggregatedPowerUp - absApu;
        } else {
            newApu = previousAggregatedPowerUp + IporMath.division(apu.toUint256(), Constants.D18);
        }

        if (newApu < 10000) {
            return 0;
        }
        return newApu;
    }

    /// @notice Calculates rewards from last rebalancing including block number given as a param.
    /// @param blockNumber blok number for which is executed rewards calculation
    /// @param lastRebalanceBlockNumber blok number when last rewards rebalance was executed
    /// @param rewardsPerBlock configuration param describes how many Ipor Tokens are rewarded across all participants per one block, represendet in 8 decimals
    /// @param previousAccruedRewards number of previous cumulated/accrued rewards
    /// @return new accrued rewards, number of Ipor Tokens (or Power Ipor Tokens because are in relation 1:1 with Ipor Tokens) accrued for given above params
    function calculateAccruedRewards(
        uint256 blockNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 rewardsPerBlock,
        uint256 previousAccruedRewards
    ) internal pure returns (uint256) {
        require(
            blockNumber >= lastRebalanceBlockNumber,
            MiningErrors.BLOCK_NUMBER_LOWER_THAN_PREVIOUS_BLOCK_NUMBER
        );
        uint256 newRewards = (blockNumber - lastRebalanceBlockNumber) *
            rewardsPerBlock *
            Constants.D10;
        return previousAccruedRewards + newRewards;
    }

    /// @notice Calculates Composite Multiplier Indicator
    /// @param rewardsPerBlock config param, number of Ipor Tokens (or Power Ipor Tokens because in 1:1 relation with Ipor Tokens) rewardes across all participants in one block, represented in 8 decimals
    /// @param aggregatedPowerUp Aggregated Power Up indicator, represented in 18 decimals
    /// @return composite multiplier, value represented in 27 decimals
    function calculateCompositeMultiplier(uint256 rewardsPerBlock, uint256 aggregatedPowerUp)
        internal
        pure
        returns (uint256)
    {
        if (aggregatedPowerUp == 0) {
            return 0;
        }
        /// @dev decimals: 8 + 18 + 19 - 18 = 27
        return
            IporMath.division(rewardsPerBlock * Constants.D18 * Constants.D19, aggregatedPowerUp);
    }

    /// @notice calculates account rewards represented in Ipor Tokens
    /// @dev Account rewards can be also interpreted as a value in Power Ipor Tokens, because ration between Ipor Tokens and Power Ipor Tokens is 1:1.
    /// @param accountIpTokenAmount amount of ipToken for a given account
    /// @param accountPowerUp value of powerUp indicator for a given account
    /// @param accountCompMultiplierCumulativePrevBlock Account Composite Multiplier Cumulative for a Previous Block, value from last Account Indicator update of param Composite Multiplier Cumulative for a given account
    /// @param accruedCompMultiplierCumulativePrevBlock Accrued Composite Multiplier Cumulative for a Previous Block, accrued value (in a current block) of param Composite Multiplier Cumulative global
    /// @return rewards, amount of Ipor Tokens (or Power Ipor Tokens because are in 1:1 relation with Ipor Tokens), represented in 18 decimals
    function calculateAccountRewards(
        uint256 accountIpTokenAmount,
        uint256 accountPowerUp,
        uint256 accountCompMultiplierCumulativePrevBlock,
        uint256 accruedCompMultiplierCumulativePrevBlock
    ) internal pure returns (uint256) {
        require(
            accruedCompMultiplierCumulativePrevBlock >= accountCompMultiplierCumulativePrevBlock,
            MiningErrors.ACCOUNT_COMPOSITE_MULTIPLIER_GT_COMPOSITE_MULTIPLIER
        );

        uint256 accountIporTokenRewards = accountIpTokenAmount *
            accountPowerUp *
            (accruedCompMultiplierCumulativePrevBlock - accountCompMultiplierCumulativePrevBlock);

        /// @dev decimals: 18 + 18 + 27 - 45 =  18
        return IporMath.division(accountIporTokenRewards, Constants.D45);
    }

    /// @notice Calculates accrued Composite Multiplier Cumulative for a previous block
    /// @param currentBlockNumber Current block number
    /// @param globalIndBlockNumber Block number of last update of Global Indicators
    /// @param globalIndCompositeMultiplierInTheBlock Configuration param = Composite Multiplier for one block defined in Global Indicators
    /// @param globalIndCompositeMultiplierCumulativePrevBlock Compositne Multiplier Comulative for a previous block defined in Global Indicators structure.
    function calculateAccruedCompMultiplierCumulativePrevBlock(
        uint256 currentBlockNumber,
        uint256 globalIndBlockNumber,
        uint256 globalIndCompositeMultiplierInTheBlock,
        uint256 globalIndCompositeMultiplierCumulativePrevBlock
    ) internal pure returns (uint256) {
        return
            globalIndCompositeMultiplierCumulativePrevBlock +
            (currentBlockNumber - globalIndBlockNumber) *
            globalIndCompositeMultiplierInTheBlock;
    }

    /// @dev Quadruple precision, 128 bits
    function _toQuadruplePrecision(uint256 number, uint256 decimals)
        private
        pure
        returns (bytes16)
    {
        if (number % decimals > 0) {
            /// @dev when we calculate we lost this value in conversion
            number += 1;
        }
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        return fraction;
    }
}
