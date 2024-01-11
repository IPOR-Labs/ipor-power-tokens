// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "./LiquidityMining.sol";
import "../libraries/ContractValidator.sol";
import "forge-std/Test.sol";

/// @title Smart contract responsible for distribution of Power Token rewards across accounts contributing to Liquidity Mining
/// by staking lpTokens and / or delegating Power Tokens.
contract LiquidityMiningArbitrum is LiquidityMining {
    using SafeCast for uint256;
    using SafeCast for int256;
    using ContractValidator for address;

    address public immutable lpWstEth;
    address public immutable ethUsdOracle;
    address public immutable wstEthStEthOracle;

    constructor(
        address routerAddress,
        address lpWstEthInput,
        address ethUsdOracleInput,
        address wstEthStEthOracleInput
    ) LiquidityMining(routerAddress) {
        lpWstEth = lpWstEthInput.checkAddress();
        ethUsdOracle = ethUsdOracleInput.checkAddress();
        wstEthStEthOracle = wstEthStEthOracleInput.checkAddress();
        _disableInitializers();
    }

    /// @notice Calculates the weighted balance of LP tokens based on the provided LP token and delegated balance.
    /// @param lpToken Address of the LP token.
    /// @param lpTokenBalance The balance of lp tokens.
    /// @return uint256 The weighted balance of PW tokens.
    function _calculateWeightedLpTokenBalance(
        address lpToken,
        uint256 lpTokenBalance
    ) internal view override returns (uint256) {
        // @dev returned value has 8 decimal, on arbitrum 0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612
        (, int256 answerEthUsd, , , ) = AggregatorV3Interface(ethUsdOracle).latestRoundData();
        // @dev returned value has 18 decimal, on arbitrum 0xe59eba0d492ca53c6f46015eea00517f2707dc77, not avable on mainnet
        (, int256 answerWstEthStEth, , , ) = AggregatorV3Interface(wstEthStEthOracle)
            .latestRoundData();

        return
            MathOperation.division(
                lpTokenBalance * answerEthUsd.toUint256() * answerWstEthStEth.toUint256(),
                1e26 // 18 + 8 + 18 - 26 = 18
            );
    }
}
