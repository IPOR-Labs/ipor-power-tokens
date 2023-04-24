// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "abdk-libraries-solidity/ABDKMathQuad.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../errors/Errors.sol";
import "../Constants.sol";
import "./Math.sol";

/// @title Library containing the core logic used in the Liquidity Mining module.
library MiningCalculation {
    bytes16 constant N0_00 = 0x00000000000000000000000000000000;
    bytes16 constant N0_01 = 0x3ff847ae147ae147b74da9ca30cfea4b; //0.01
    bytes16 constant N0_02 = 0x3ff947ae147ae147b2b11255bc3eff63; // 0.02
    bytes16 constant N0_03 = 0x3ff9eb851eb851eb89bb4fc6601609a0; // 0.03
    bytes16 constant N0_04 = 0x3ffa47ae147ae147b062c69b81f689ee; // 0.04
    bytes16 constant N0_05 = 0x3ffa9999999999999be7e553d3e20f0d; // 0.05

    bytes16 constant SLOPE_1 = 0x40024000000000000000000000000000; //   10.0
    bytes16 constant BASE_1 = 0x3ffc9999999999999a2d2c88282bb6f6; //    0.2

    bytes16 constant SLOPE_2 = 0x40010000000000000000000000000000; //   4.0
    bytes16 constant BASE_2 = 0x3ffd0a3d70a3d70a3dba6d4e51867f52; //    0.26

    bytes16 constant SLOPE_3 = 0x40008000000000000000000000000000; //   3.0
    bytes16 constant BASE_3 = 0x3ffd1eb851eb851eb89bb4fc6601609a; //    0.28

    bytes16 constant SLOPE_4 = 0x40000000000000000000000000000000; //   2.0
    bytes16 constant BASE_4 = 0x3ffd3d70a3d70a3d70eda08184b9b285; //    0.31

    bytes16 constant SLOPE_5 = 0x3fff0000000000000000000000000000; //   2.0
    bytes16 constant BASE_5 = 0x3ffd66666666666666b02fddadaf7514; //    0.31

    using SafeCast for uint256;
    using SafeCast for int256;

    /// @notice Calculases the Power-up indicator for a given account.
    /// @param accountPwTokenAmount account's Power Tokens amount
    /// @param accountLpTokenAmount account's lpTokens amount
    /// @param verticalShift preconfigured param, vertical shift used in equation calculating the account's power-up
    /// @param horizontalShift preconfigured param, horizontal shift used in equation calculating account's power-up
    /// @return power-up indicator of a given account
    function calculateAccountPowerUp(
        uint256 accountPwTokenAmount,
        uint256 accountLpTokenAmount,
        bytes16 verticalShift,
        bytes16 horizontalShift
    ) internal pure returns (uint256) {
        if (accountLpTokenAmount < Constants.D18) {
            return 0;
        }

        bytes16 accountPwTokenAmountQP = _toQuadruplePrecision(accountPwTokenAmount, Constants.D18);
        bytes16 lpTokenAmountQP = _toQuadruplePrecision(accountLpTokenAmount, Constants.D18);
        bytes16 ratio = ABDKMathQuad.div(accountPwTokenAmountQP, lpTokenAmountQP);

        bytes16 result;
        if (ABDKMathQuad.cmp(N0_05, ratio) >= 0) {
            result = accountPowerUpStepFunction(ratio);
        } else {
            bytes16 pwTokenAmountWithModifierQP = ABDKMathQuad.mul(
                _getPwTokenModifier(),
                accountPwTokenAmountQP
            );

            bytes16 underLog = ABDKMathQuad.add(
                ABDKMathQuad.div(pwTokenAmountWithModifierQP, lpTokenAmountQP),
                horizontalShift
            );

            result = ABDKMathQuad.add(verticalShift, ABDKMathQuad.log_2(underLog));
        }
        bytes16 resultD18 = ABDKMathQuad.mul(result, ABDKMathQuad.fromUInt(Constants.D18));

        return ABDKMathQuad.toUInt(resultD18);
    }

    /// @notice Calculates the aggreagated power-up. Aggregate power-up is a synthetic summary of all power-ups across all users.
    /// It's used to calculate the individual rewards in relation to the rest of the pool.
    /// @param accountPowerUp power up indicator is calculated for a given account
    /// @param accountLpTokenAmount lpToken amount for a given account
    /// @param previousAccountPowerUp previous power-up indicator for a given account
    /// @param previousAccountLpTokenAmount previous lpToken amount for a given account
    /// @param previousAggregatedPowerUp previous aggregated power-up indicator
    function calculateAggregatedPowerUp(
        uint256 accountPowerUp,
        uint256 accountLpTokenAmount,
        uint256 previousAccountPowerUp,
        uint256 previousAccountLpTokenAmount,
        uint256 previousAggregatedPowerUp
    ) internal pure returns (uint256) {
        int256 apu = accountPowerUp.toInt256() *
            accountLpTokenAmount.toInt256() -
            previousAccountPowerUp.toInt256() *
            previousAccountLpTokenAmount.toInt256();

        uint256 newApu;

        if (apu < 0) {
            uint256 absApu = Math.division((-apu).toUint256(), Constants.D18);

            /// @dev the last unstaking of lpTokens can experience a rounding error
            if (previousAggregatedPowerUp < absApu && previousAggregatedPowerUp + 10000 >= absApu) {
                return 0;
            }

            require(
                previousAggregatedPowerUp >= absApu,
                Errors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE
            );

            newApu = previousAggregatedPowerUp - absApu;
        } else {
            newApu = previousAggregatedPowerUp + Math.division(apu.toUint256(), Constants.D18);
        }

        if (newApu < 10000) {
            return 0;
        }
        return newApu;
    }

    /// @notice Calculates the rewards from last rebalancing including block number given as a param.
    /// @param blockNumber block number for which the rewards calculation is executed
    /// @param lastRebalanceBlockNumber block number when last rewards rebalance was executed
    /// @param rewardsPerBlock configuration param describing how many pwTokens are rewarded across all participants per one block, represendet with 8 decimals
    /// @param previousAccruedRewards number of previously cumulated/accrued rewards
    /// @return new accrued rewards, amount of Power Tokens accrued for given params
    function calculateAccruedRewards(
        uint256 blockNumber,
        uint256 lastRebalanceBlockNumber,
        uint256 rewardsPerBlock,
        uint256 previousAccruedRewards
    ) internal pure returns (uint256) {
        require(
            blockNumber >= lastRebalanceBlockNumber,
            Errors.BLOCK_NUMBER_LOWER_THAN_PREVIOUS_BLOCK_NUMBER
        );
        uint256 newRewards = (blockNumber - lastRebalanceBlockNumber) *
            rewardsPerBlock *
            Constants.D10;
        return previousAccruedRewards + newRewards;
    }

    /// @notice Calculates the Composite Multiplier Indicator
    /// @param rewardsPerBlock config param, number of Power Token rewardes across all participants in one block, represented with 8 decimals
    /// @param aggregatedPowerUp Aggregated Power-up indicator, represented with 18 decimals
    /// @return composite multiplier, value represented with 27 decimals
    function calculateCompositeMultiplier(uint256 rewardsPerBlock, uint256 aggregatedPowerUp)
        internal
        pure
        returns (uint256)
    {
        if (aggregatedPowerUp == 0) {
            return 0;
        }
        /// @dev decimals: 8 + 18 + 19 - 18 = 27
        return Math.division(rewardsPerBlock * Constants.D18 * Constants.D19, aggregatedPowerUp);
    }

    /// @notice calculates the account's rewards issued in pwTokens
    /// @param accountLpTokenAmount amount of lpTokens for a given account
    /// @param accountPowerUp value of power-up indicator for a given account
    /// @param accountCompMultiplierCumulativePrevBlock Account Composite Multiplier Cumulative for the Previous Block, value from last Account Indicator update of param Composite Multiplier Cumulative for a given account
    /// @param accruedCompMultiplierCumulativePrevBlock Accrued Composite Multiplier Cumulative for the Previous Block, accrued value (in a current block) of param Composite Multiplier Cumulative global
    /// @return rewards, amount of Staked Tokens (or Power Tokens because are in 1:1 relation with Staked Tokens), represented with 18 decimals
    function calculateAccountRewards(
        uint256 accountLpTokenAmount,
        uint256 accountPowerUp,
        uint256 accountCompMultiplierCumulativePrevBlock,
        uint256 accruedCompMultiplierCumulativePrevBlock
    ) internal pure returns (uint256) {
        require(
            accruedCompMultiplierCumulativePrevBlock >= accountCompMultiplierCumulativePrevBlock,
            Errors.ACCOUNT_COMPOSITE_MULTIPLIER_GT_COMPOSITE_MULTIPLIER
        );

        uint256 accountStakedTokenRewards = accountLpTokenAmount *
            accountPowerUp *
            (accruedCompMultiplierCumulativePrevBlock - accountCompMultiplierCumulativePrevBlock);

        /// @dev decimals: 18 + 18 + 27 - 45 =  18
        return Math.division(accountStakedTokenRewards, Constants.D45);
    }

    /// @notice Calculates the accrued Composite Multiplier Cumulative for the previous block
    /// @param currentBlockNumber Current block number
    /// @param globalIndBlockNumber Block number of the last update of the Global Indicators
    /// @param globalIndCompositeMultiplierInTheBlock Configuration param - Composite Multiplier for one block defined in Global Indicators
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

    function accountPowerUpStepFunction(bytes16 ratio) internal pure returns (bytes16) {
        if (ABDKMathQuad.cmp(N0_01, ratio) > 0) {
            return ABDKMathQuad.add(BASE_1, ABDKMathQuad.mul(SLOPE_1, ratio));
        } else if (ABDKMathQuad.cmp(N0_02, ratio) > 0) {
            return ABDKMathQuad.add(BASE_2, ABDKMathQuad.mul(SLOPE_2, ratio));
        } else if (ABDKMathQuad.cmp(N0_03, ratio) > 0) {
            return ABDKMathQuad.add(BASE_3, ABDKMathQuad.mul(SLOPE_3, ratio));
        } else if (ABDKMathQuad.cmp(N0_04, ratio) > 0) {
            return ABDKMathQuad.add(BASE_4, ABDKMathQuad.mul(SLOPE_4, ratio));
        } else {
            return ABDKMathQuad.add(BASE_5, ABDKMathQuad.mul(SLOPE_5, ratio));
        }
    }

    /// @dev Quadruple precision, 128 bits
    function _toQuadruplePrecision(uint256 number, uint256 decimals)
        private
        pure
        returns (bytes16)
    {
        if (number % decimals > 0) {
            /// @dev during calculation this value is lost in the conversion
            number += 1;
        }
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        return fraction;
    }

    /// @dev Quadruple precision, 128 bits
    function _getPwTokenModifier() private pure returns (bytes16) {
        return ABDKMathQuad.fromUInt(2);
    }
}
