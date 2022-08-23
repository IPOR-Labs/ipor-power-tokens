// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

library MiningErrors {
    string public constant STAKED_BALANCE_TOO_LOW = "IPOR_700";
    string public constant CALLER_NOT_PW_IPOR = "IPOR_701";
    string public constant ASSET_NOT_SUPPORTED = "IPOR_702";
    string public constant BLOCK_NUMBER_GREATER_OR_EQUAL_THEN_PREVIOUS_BLOCK_NUMBER = "IPOR_703";
    string public constant COMPOSITE_MULTIPLIER_GREATER_OR_EQUAL_THEN_USER_COMPOSITE_MULTIPLIER =
        "IPOR_704";
    string public constant AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE = "IPOR_705";
}
