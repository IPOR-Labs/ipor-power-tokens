// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

library MiningErrors {
    /// @notice Error appeared when  IP Token address is not supported
    /// @dev List of supported LpTokens are in field {LiquidityMining._lpTokens}
    string public constant IP_TOKEN_NOT_SUPPORTED = "PT_701";
    /// @notice Error appeared when caller / msgSender is not a PowerToken smart contract
    string public constant CALLER_NOT_POWER_TOKEN = "PT_702";
    /// @notice Error appeared when caller / msgSender is not a LiquidityMining smart contract
    string public constant CALLER_NOT_LIQUIDITY_MINING = "PT_703";
    /// @notice Error appeared when caller / msgSender is not a Pause Manager address.
    /// @dev Pause Manager can be defined by smart contract's Onwer
    string public constant CALLER_NOT_PAUSE_MANAGER = "PT_704";
    /// @notice Error appeared when account's base balance is too low
    string public constant ACCOUNT_BASE_BALANCE_IS_TOO_LOW = "PT_705";
    /// @notice Error appeared when account's lp token balance is too low
    string public constant ACCOUNT_IP_TOKEN_BALANCE_IS_TOO_LOW = "PT_706";
    /// @notice Error appeared when account's delegated balance is too low
    string public constant ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW = "PT_707";
    /// @notice Error appeared when account's available Power Token balance is too low
    string public constant ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW = "PT_708";
    /// @notice Error appeared when account doesn't have rewards (Staked Tokens / Power Tokens) to claim
    string public constant NO_REWARDS_TO_CLAIM = "PT_709";
    /// @notice Error appeared when cool down is not finished.
    string public constant COOL_DOWN_NOT_FINISH = "PT_710";
    /// @notice Error appeared when aggregate power up indicator during calculation going to be negative.
    string public constant AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE = "PT_711";
    /// @notice Error appeared when block number used in function is lower than previous block number store in liquidity mining indicators.
    string public constant BLOCK_NUMBER_LOWER_THAN_PREVIOUS_BLOCK_NUMBER = "PT_712";
    /// @notice Account Composite Multiplier indicator greater or equal than Composit Multiplier indicator, but should be less or equal
    string public constant ACCOUNT_COMPOSITE_MULTIPLIER_GT_COMPOSITE_MULTIPLIER = "PT_713";
    /// @notice The fee for unstacked stakedTokens should be number between (0, 1e18)
    string public constant UNSTAKE_WITHOUT_COOLDOWN_FEE_IS_TO_HIGH = "PT_714";
    /// @notice General problem, address is wrong
    string public constant WRONG_ADDRESS = "PT_715";
    /// @notice General problem, contract is wrong
    string public constant WRONG_CONTRACT_ID = "PT_716";
    /// @notice Value not greater than zero
    string public constant VALUE_NOT_GREATER_THAN_ZERO = "PT_717";
    /// @notice Appeared when input of two arrays length mismatch
    string public constant INPUT_ARRAYS_LENGTH_MISMATCH = "PT_718";
    /// @notice msg.sender is not an appointed owner, so cannot confirm his appointment to be an owner of a specific smart contract
    string public constant SENDER_NOT_APPOINTED_OWNER = "PT_719";
}
