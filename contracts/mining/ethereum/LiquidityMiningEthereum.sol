// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "../LiquidityMining.sol";
import "./CalculateWeightedLpTokenBalanceEthereum.sol";

/// @title Smart contract responsible for distribution of Power Token rewards across accounts contributing to Liquidity Mining
/// by staking lpTokens and / or delegating Power Tokens.
contract LiquidityMiningEthereum is LiquidityMining {
    using SafeCast for int256;

    address internal immutable lpStEth;
    address internal immutable ethUsdOracle;
    address internal immutable lpWeEth;
    address internal immutable weEth;

    constructor(
        address routerAddress,
        address lpStEthInput,
        address ethUsdOracleInput,
        address lpWeEthInput,
        address weEthInput
    ) LiquidityMining(routerAddress) {
        lpStEth = lpStEthInput;
        ethUsdOracle = ethUsdOracleInput;
        lpWeEth = lpWeEthInput;
        weEth = weEthInput;
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
        return
            CalculateWeightedLpTokenBalanceEthereum._calculateWeightedLpTokenBalance({
                lpToken: lpToken,
                lpTokenBalance: lpTokenBalance,
                ethUsdOracle: ethUsdOracle,
                lpWeEth: lpWeEth,
                lpStEth: lpStEth,
                weEth: weEth
            });
    }

    function getConfiguration() external view returns (address, address, address, address) {
        return (lpStEth, ethUsdOracle, lpWeEth, weEth);
    }
}
