// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import {AggregatorV3Interface} from "@power-tokens/contracts/interfaces/AggregatorV3Interface.sol";

contract MockEthUsdOracle is AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            110680464442257314522,
            166672000000,
            block.timestamp,
            block.timestamp,
            110680464442257314522
        );
    }
}
