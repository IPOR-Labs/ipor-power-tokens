// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "./LiquidityMining.sol";
import "../interfaces/AggregatorV3Interface.sol";
import "./CalculateWeightedLpTokenBalanceArbitrum.sol";

/// @title Smart contract responsible for distribution of Power Token rewards across accounts contributing to Liquidity Mining
/// by staking lpTokens and / or delegating Power Tokens.
contract LiquidityMiningArbitrum is LiquidityMining {
    using SafeCast for int256;

    address internal immutable ethUsdOracle;
    address internal immutable wstEthStEthExchangeRateOracle;
    address internal immutable lpwstEth;

    constructor(
        address routerAddress,
        address ethUsdOracleInput,
        address wstEthStEthExchangeRateOracleInput,
        address lpwstEthInput
    ) LiquidityMining(routerAddress) {
        ethUsdOracle = ethUsdOracleInput;
        wstEthStEthExchangeRateOracle = wstEthStEthExchangeRateOracleInput;
        lpwstEth = lpwstEthInput;
        _disableInitializers();
    }

    /// @notice Calculates the weighted balance of LP tokens based on the provided LP token and delegated balance.
    /// @param lpTokenBalance The balance of lp tokens.
    /// @return uint256 The weighted balance of PW tokens.
    function _calculateWeightedLpTokenBalance(
        address lpToken,
        uint256 lpTokenBalance
    ) internal view override returns (uint256) {
        return
            CalculateWeightedLpTokenBalanceArbitrum._calculateWeightedLpTokenBalance({
                lpToken_: lpToken,
                lpTokenBalance_: lpTokenBalance,
                ethUsdOracle_: ethUsdOracle,
                lpwstEth_: lpwstEth,
                wstEthStEthExchangeRateOracle_: wstEthStEthExchangeRateOracle
            });
    }

    function getConfiguration() external view returns (address, address) {
        return (ethUsdOracle, wstEthStEthExchangeRateOracle);
    }
}
