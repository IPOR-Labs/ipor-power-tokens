// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

library MiningErrors {
    string public constant IP_TOKEN_NOT_SUPPORTED = "IPOR_701";
    string public constant CALLER_NOT_PW_IPOR = "IPOR_702";
    string public constant CALLER_NOT_JOHN = "IPOR_703";
    string public constant CALLER_NOT_PAUSE_MANAGER = "IPOR_713";
    string public constant BASE_BALANCE_TOO_LOW = "IPOR_704";
    string public constant STAKED_BALANCE_TOO_LOW = "IPOR_705";
    string public constant DELEGATED_BALANCE_TOO_LOW = "IPOR_706";
    string public constant STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW = "IPOR_707";
    string public constant NO_REWARDS_TO_CLAIM = "IPOR_708";
    string public constant COOL_DOWN_NOT_FINISH = "IPOR_709";
    string public constant AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE = "IPOR_710";
    string public constant BLOCK_NUMBER_GREATER_OR_EQUAL_THAN_PREVIOUS_BLOCK_NUMBER = "IPOR_711";

    /// @notice Composite Multiplier indicator greater or equal than Account Composit Multiplier indicator
    string public constant COMPOSITE_MULTIPLIER_GTE_ACCOUNT_COMPOSITE_MULTIPLIER = "IPOR_712";
}
