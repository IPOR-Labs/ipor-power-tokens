// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "abdk-libraries-solidity/ABDKMathQuad.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

import "../errors/Errors.sol";
import "./MathOperation.sol";

struct AccountPowerUpData {
    /// @dev  value with 18 decimals,
    uint256 accountPwTokenAmount;
    /// @dev  value with 18 decimals,
    uint256 accountLpTokenAmount;
    /// @dev value in format of ABDKMathQuad
    bytes16 verticalShift;
    /// @dev value in format of ABDKMathQuad
    bytes16 horizontalShift;
    /// @dev  value with 18 decimals,
    uint256 logBase;
    /// @dev  value with 18 decimals,
    uint256 pwTokenModifier;
    /// @dev  value with 18 decimals,
    uint256 vectorOfCurve;
}

/// @title Library containing the core logic used in the Liquidity Mining module.
library MiningCalculationAccountPowerUp {
    using SafeCast for uint256;
    using SafeCast for int256;

    uint256 constant SLOPE_1 = 5; //   5.0
    uint256 constant BASE_1 = 2e17; //    0.2

    uint256 constant SLOPE_2 = 2; //   2.0
    uint256 constant BASE_2 = 26e16; //    0.26

    uint256 constant SLOPE_3 = 15e17; //   1.5
    uint256 constant BASE_3 = 28e16; //    0.28

    uint256 constant SLOPE_4 = 1; //   1.0
    uint256 constant BASE_4 = 31e16; //    0.31

    uint256 constant SLOPE_5 = 5e17; //   0.5
    uint256 constant BASE_5 = 35e16; //    0.35

    function calculateAccountPowerUp(
        AccountPowerUpData memory data_
    ) external pure returns (uint256) {
        if (data_.accountLpTokenAmount < 1e18) {
            return 0;
        }

        bytes16 accountPwTokenAmountQP = _toQuadruplePrecision(data_.accountPwTokenAmount, 1e18);
        bytes16 lpTokenAmountQP = _toQuadruplePrecision(data_.accountLpTokenAmount, 1e18);
        bytes16 ratio = ABDKMathQuad.div(accountPwTokenAmountQP, lpTokenAmountQP);

        bytes16 result;
        if (ABDKMathQuad.cmp(_toQuadruplePrecision(1e18, 10e18), ratio) >= 0) {
            result = accountPowerUpStepFunction(ratio);
            bytes16 resultD18 = ABDKMathQuad.mul(result, ABDKMathQuad.fromUInt(1e18));
            return ABDKMathQuad.toUInt(resultD18) + data_.vectorOfCurve;
        } else {
            bytes16 pwTokenAmountWithModifierQP = ABDKMathQuad.mul(
                _toQuadruplePrecision(data_.pwTokenModifier, 1e18),
                accountPwTokenAmountQP
            );

            bytes16 underLog = ABDKMathQuad.add(
                ABDKMathQuad.div(pwTokenAmountWithModifierQP, lpTokenAmountQP),
                data_.horizontalShift
            );

            result = ABDKMathQuad.add(
                data_.verticalShift,
                _log(_toQuadruplePrecision(data_.logBase, 1e18), underLog)
            );
            bytes16 resultD18 = ABDKMathQuad.mul(result, ABDKMathQuad.fromUInt(1e18));

            /// @dev The number 222392421336447926 is the value by which we want to lower the default function values. This value can never be negative.
            return ABDKMathQuad.toUInt(resultD18) - 222392421336447926;
        }
    }

    function accountPowerUpStepFunction(bytes16 ratio) internal pure returns (bytes16) {
        if (ABDKMathQuad.cmp(_toQuadruplePrecision(2, 100), ratio) > 0) {
            return
                ABDKMathQuad.add(
                    _toQuadruplePrecision(BASE_1, 1e18),
                    ABDKMathQuad.mul(ABDKMathQuad.fromUInt(SLOPE_1), ratio)
                );
        } else if (ABDKMathQuad.cmp(_toQuadruplePrecision(4, 100), ratio) > 0) {
            return
                ABDKMathQuad.add(
                    _toQuadruplePrecision(BASE_2, 1e18),
                    ABDKMathQuad.mul(ABDKMathQuad.fromUInt(SLOPE_2), ratio)
                );
        } else if (ABDKMathQuad.cmp(_toQuadruplePrecision(6, 100), ratio) > 0) {
            return
                ABDKMathQuad.add(
                    _toQuadruplePrecision(BASE_3, 1e18),
                    ABDKMathQuad.mul(_toQuadruplePrecision(SLOPE_3, 1e18), ratio)
                );
        } else if (ABDKMathQuad.cmp(_toQuadruplePrecision(8, 100), ratio) > 0) {
            return
                ABDKMathQuad.add(
                    _toQuadruplePrecision(BASE_4, 1e18),
                    ABDKMathQuad.mul(ABDKMathQuad.fromUInt(SLOPE_4), ratio)
                );
        } else {
            return
                ABDKMathQuad.add(
                    _toQuadruplePrecision(BASE_5, 1e18),
                    ABDKMathQuad.mul(_toQuadruplePrecision(SLOPE_5, 1e18), ratio)
                );
        }
    }

    /// @dev log_a(b) = log_2(b) / log_2(a)
    function _log(bytes16 a, bytes16 b) private pure returns (bytes16) {
        if (ABDKMathQuad.eq(a, ABDKMathQuad.fromUInt(2))) {
            return ABDKMathQuad.log_2(b);
        }
        return ABDKMathQuad.div(ABDKMathQuad.log_2(b), ABDKMathQuad.log_2(a));
    }

    /// @dev Quadruple precision, 128 bits
    function _toQuadruplePrecision(
        uint256 number,
        uint256 decimals
    ) private pure returns (bytes16) {
        if (number % decimals > 0) {
            /// @dev during calculation this value is lost in the conversion
            number += 1;
        }
        bytes16 nominator = ABDKMathQuad.fromUInt(number);
        bytes16 denominator = ABDKMathQuad.fromUInt(decimals);
        bytes16 fraction = ABDKMathQuad.div(nominator, denominator);
        return fraction;
    }
}
