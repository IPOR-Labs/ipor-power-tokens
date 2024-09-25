// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "../interfaces/IWeETH.sol";
import "../interfaces/AggregatorV3Interface.sol";
import "../libraries/math/MathOperation.sol";

library CalculateWeightedLpTokenBalanceArbitrum {
    using SafeCast for int256;

    function _calculateWeightedLpTokenBalance(
        address lpToken_,
        uint256 lpTokenBalance_,
        address ethUsdOracle_,
        address lpwstEth_,
        address wstEthStEthExchangeRateOracle_
    ) public view returns (uint256) {
        if (lpToken_ != lpwstEth_) {
            return lpTokenBalance_;
        }

        // @dev returned value has 8 decimal, on arbitrum 0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612
        (, int256 answerEthUsd, , , ) = AggregatorV3Interface(ethUsdOracle_).latestRoundData();
        // @dev returned value has 18 decimal, on arbitrum 0xe59eba0d492ca53c6f46015eea00517f2707dc77, not avable on mainnet
        (, int256 answerWstEthStEth, , , ) = AggregatorV3Interface(wstEthStEthExchangeRateOracle_)
            .latestRoundData();

        return
            MathOperation.division(
                lpTokenBalance_ * answerEthUsd.toUint256() * answerWstEthStEth.toUint256(),
                1e26 // 18 + 8 + 18 - 26 = 18
            );
    }
}
