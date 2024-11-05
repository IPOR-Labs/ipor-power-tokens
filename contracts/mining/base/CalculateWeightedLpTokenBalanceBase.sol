// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "../../interfaces/IWeETH.sol";
import "../../interfaces/AggregatorV3Interface.sol";
import "../../libraries/math/MathOperation.sol";

library CalculateWeightedLpTokenBalanceBase {
    using SafeCast for int256;

    function _calculateWeightedLpTokenBalance(
        address lpToken_,
        uint256 lpTokenBalance_,
        address ethUsdOracle_,
        address lpwstEth_,
        address wstEthEthOracle_
    ) public view returns (uint256) {
        if (lpToken_ != lpwstEth_) {
            return lpTokenBalance_;
        }

        // @dev returned value has 8 decimal, on base 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
        (, int256 answerEthUsd, , , ) = AggregatorV3Interface(ethUsdOracle_).latestRoundData();
        // @dev returned value has 18 decimal, on base 0x43a5C292A453A3bF3606fa856197f09D7B74251a, not avable on mainnet
        (, int256 answerWstEthEth, , , ) = AggregatorV3Interface(wstEthEthOracle_)
            .latestRoundData();

        return
            MathOperation.division(
                lpTokenBalance_ * answerEthUsd.toUint256() * answerWstEthEth.toUint256(),
                1e26 // 18 + 8 + 18 - 26 = 18
            );
    }
}
