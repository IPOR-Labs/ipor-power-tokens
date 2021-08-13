// SPDX-License-Identifier: agpl-3.0
pragma solidity >=0.8.4 <0.9.0;

import "./types/DataTypes.sol";
import "./Constants.sol";

library AmmMath {

    //@notice Division with rounding up on last position, x, and y is with MILTON_DECIMALS_FACTOR
    function division(uint256 x, uint256 y) public pure returns (uint256 z) {
        z = (x + (y / 2)) / y;
    }

    function calculateIbtQuantity(uint256 notionalAmount, uint256 ibtPrice) public pure returns (uint256){
        return division(notionalAmount * Constants.MILTON_DECIMALS_FACTOR, ibtPrice);
    }

    function calculateDerivativeAmount(
        uint256 totalAmount,
        uint8 leverage,
        uint256 liquidationDepositFeeAmount,
        uint256 iporPublicationFeeAmount,
        uint256 openingFeePercentage
    ) internal pure returns (DataTypes.IporDerivativeAmount memory) {
        uint256 openingFeeAmount = division(
            (totalAmount - liquidationDepositFeeAmount - iporPublicationFeeAmount) * openingFeePercentage,
            Constants.MILTON_DECIMALS_FACTOR
        );
        uint256 depositAmount = totalAmount - liquidationDepositFeeAmount - iporPublicationFeeAmount - openingFeeAmount;
        return DataTypes.IporDerivativeAmount(
            depositAmount,
            leverage * depositAmount,
            openingFeeAmount
        );
    }
}