// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../amm/spread/MiltonSpreadModel.sol";

contract MockBaseMiltonSpreadModel is MiltonSpreadModel {
    function testCalculateSpreadPremiumsPayFixed(
        int256 soap,
        IporTypes.AccruedIpor memory accruedIpor,
        uint256 liquidityPoolBalance,
        uint256 totalCollateralPayFixedBalance,
        uint256 totalCollateralReceiveFixedBalance
    ) public pure returns (int256 spreadPremiums) {
        IporTypes.MiltonBalancesMemory memory balance = IporTypes.MiltonBalancesMemory(
            totalCollateralPayFixedBalance,
            totalCollateralReceiveFixedBalance,
            liquidityPoolBalance,
            0
        );
        return _calculateSpreadPremiumsPayFixed(soap, accruedIpor, balance);
    }

    function testCalculateSpreadPremiumsRecFixed(
        int256 soap,
        IporTypes.AccruedIpor memory accruedIpor,
        uint256 liquidityPoolBalance,
        uint256 totalCollateralPayFixedBalance,
        uint256 totalCollateralReceiveFixedBalance
    ) public pure returns (int256 spreadPremiums) {
        IporTypes.MiltonBalancesMemory memory balance = IporTypes.MiltonBalancesMemory(
            totalCollateralPayFixedBalance,
            totalCollateralReceiveFixedBalance,
            liquidityPoolBalance,
            0
        );
        return _calculateSpreadPremiumsReceiveFixed(soap, accruedIpor, balance);
    }

    function testCalculateAdjustedUtilizationRate(
        uint256 utilizationRateLegWithSwap,
        uint256 utilizationRateLegWithoutSwap,
        uint256 lambda
    ) public pure returns (uint256) {
        return
            _calculateAdjustedUtilizationRate(
                utilizationRateLegWithSwap,
                utilizationRateLegWithoutSwap,
                lambda
            );
    }

    function testCalculateDemandComponentPayFixed(
        uint256 liquidityPoolBalance,
        uint256 totalCollateralPayFixedBalance,
        uint256 totalCollateralReceiveFixedBalance,
        int256 soapPayFixed
    ) public pure returns (uint256) {
        return
            _calculateDemandComponentPayFixed(
                liquidityPoolBalance,
                totalCollateralPayFixedBalance,
                totalCollateralReceiveFixedBalance,
                soapPayFixed
            );
    }

    function testCalculateAdjustedUtilizationRatePayFixed(
        uint256 liquidityPoolBalance,
        uint256 totalCollateralPayFixedBalance,
        uint256 totalCollateralReceiveFixedBalance,
        uint256 lambda
    ) public pure returns (uint256) {
        return
            _calculateAdjustedUtilizationRatePayFixed(
                liquidityPoolBalance,
                totalCollateralPayFixedBalance,
                totalCollateralReceiveFixedBalance,
                lambda
            );
    }

    function testCalculateDemandComponentRecFixed(
        uint256 liquidityPoolBalance,
        uint256 totalCollateralPayFixedBalance,
        uint256 totalCollateralReceiveFixedBalance,
        int256 soapRecFixed
    ) public pure returns (uint256) {
        return
            _calculateDemandComponentReceiveFixed(
                liquidityPoolBalance,
                totalCollateralPayFixedBalance,
                totalCollateralReceiveFixedBalance,
                soapRecFixed
            );
    }

    function testCalculateAdjustedUtilizationRateRecFixed(
        uint256 liquidityPoolBalance,
        uint256 totalCollateralPayFixedBalance,
        uint256 totalCollateralReceiveFixedBalance,
        uint256 lambda
    ) public pure returns (uint256) {
        return
            _calculateAdjustedUtilizationRateRecFixed(
                liquidityPoolBalance,
                totalCollateralPayFixedBalance,
                totalCollateralReceiveFixedBalance,
                lambda
            );
    }

    function testCalculateVolatilityAndMeanReversionPayFixed(
        uint256 emaVar,
        int256 diffIporIndexEma
    ) public pure returns (int256) {
        return _calculateVolatilityAndMeanReversionPayFixed(emaVar, diffIporIndexEma);
    }

    function testCalculateVolatilityAndMeanReversionReceiveFixed(
        uint256 emaVar,
        int256 diffIporIndexEma
    ) public pure returns (int256) {
        return _calculateVolatilityAndMeanReversionReceiveFixed(emaVar, diffIporIndexEma);
    }

    function testVolatilityAndMeanReversionPayFixedRegionOne(
        uint256 emaVar,
        int256 diffIporIndexEma
    ) public pure returns (int256) {
        return _volatilityAndMeanReversionPayFixedRegionOne(emaVar, diffIporIndexEma);
    }

    function testVolatilityAndMeanReversionReceiveFixedRegionOne(
        uint256 emaVar,
        int256 diffIporIndexEma
    ) public pure returns (int256) {
        return _volatilityAndMeanReversionReceiveFixedRegionOne(emaVar, diffIporIndexEma);
    }

    function testVolatilityAndMeanReversionPayFixedRegionTwo(
        uint256 emaVar,
        int256 diffIporIndexEma
    ) public pure returns (int256) {
        return _volatilityAndMeanReversionPayFixedRegionTwo(emaVar, diffIporIndexEma);
    }

    function testVolatilityAndMeanReversionReceiveFixedRegionTwo(
        uint256 emaVar,
        int256 diffIporIndexEma
    ) public pure returns (int256) {
        return _volatilityAndMeanReversionReceiveFixedRegionTwo(emaVar, diffIporIndexEma);
    }
}
