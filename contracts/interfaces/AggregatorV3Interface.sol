// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

/// @title Chainlink Aggregator V3 Interface to USD ETH Oracle Price Feed.
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
