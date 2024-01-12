// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "./LiquidityMining.sol";

/// @title Smart contract responsible for distribution of Power Token rewards across accounts contributing to Liquidity Mining
/// by staking lpTokens and / or delegating Power Tokens.
contract LiquidityMiningEthereum is LiquidityMining {
    using SafeCast for int256;

    address internal immutable lpStEth;
    address internal immutable ethUsdOracle;

    constructor(
        address routerAddress,
        address lpStEthInput,
        address ethUsdOracleInput
    ) LiquidityMining(routerAddress) {
        lpStEth = lpStEthInput;
        ethUsdOracle = ethUsdOracleInput;
        _disableInitializers();
    }

    /// @notice Calculates the weighted balance of PW tokens based on the provided LP token and delegated balance.
    /// @dev If the provided LP token is not `lpStEth`, it simply returns the `delegatedPwTokenBalance`.
    /// If it is `lpStEth`, it calculates the weighted balance using the current ETH to USD price.
    /// @param lpToken Address of the LP token.
    /// @param lpTokenBalance The balance of lp tokens.
    /// @return uint256 The weighted balance of PW tokens.
    function _calculateWeightedLpTokenBalance(
        address lpToken,
        uint256 lpTokenBalance
    ) internal view override returns (uint256) {
        if (lpToken != lpStEth) {
            return lpTokenBalance;
        }
        // @dev returned value has 8 decimal address on mainnet 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        (, int256 answer, , , ) = AggregatorV3Interface(ethUsdOracle).latestRoundData();
        return MathOperation.division(lpTokenBalance * answer.toUint256(), 1e8);
    }

    function getConfiguration() external view returns (address, address) {
        return (lpStEth, ethUsdOracle);
    }
}
