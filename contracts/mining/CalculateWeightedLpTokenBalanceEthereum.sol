// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "../interfaces/IWeETH.sol";
import "../interfaces/AggregatorV3Interface.sol";
import "../libraries/math/MathOperation.sol";

library CalculateWeightedLpTokenBalanceEthereum {
    using SafeCast for int256;

    function _calculateWeightedLpTokenBalance(
        address lpToken,
        uint256 lpTokenBalance,
        address ethUsdOracle,
        address lpWeEth,
        address lpStEth,
        address weEth
    ) public view returns (uint256) {
        if (lpToken == lpStEth) {
            // @dev returned value has 8 decimal address on mainnet 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
            (, int256 answer, , , ) = AggregatorV3Interface(ethUsdOracle).latestRoundData();
            return MathOperation.division(lpTokenBalance * answer.toUint256(), 1e8);
        } else if (lpToken == lpWeEth) {
            uint256 eEthBalance = IWeETH(weEth).getEETHByWeETH(lpTokenBalance);
            // @dev returned value has 8 decimal address on mainnet 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
            (, int256 answer, , , ) = AggregatorV3Interface(ethUsdOracle).latestRoundData();
            return MathOperation.division(eEthBalance * answer.toUint256(), 1e8);
        }
        return lpTokenBalance;
    }
}
