// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

library MiningErrors {
    /// @notice Error appeared when  IP Token address is not supported
    /// @dev List of supported IpTokens are in field {John._ipTokens}
    string public constant IP_TOKEN_NOT_SUPPORTED = "IPOR_701";
    /// @notice Error appeared when caller / msgSender is not a Power Ipor smart contract
    string public constant CALLER_NOT_POWER_IPOR = "IPOR_702";
    /// @notice Error appeared when caller / msgSender is not a John smart contract
    string public constant CALLER_NOT_JOHN = "IPOR_703";
    /// @notice Error appeared when caller / msgSender is not a Pause Manager address.
    /// @dev Pause Manager can be defined by smart contract's Onwer
    string public constant CALLER_NOT_PAUSE_MANAGER = "IPOR_704";
    /// @notice Error appeared when account's base balance is too low
    string public constant ACCOUNT_BASE_BALANCE_IS_TOO_LOW = "IPOR_705";
    /// @notice Error appeared when account's ip token balance is too low
    string public constant ACCOUNT_IP_TOKEN_BALANCE_IS_TOO_LOW = "IPOR_706";
    /// @notice Error appeared when account's delegated balance is too low
    string public constant ACC_DELEGATED_TO_JOHN_BALANCE_IS_TOO_LOW = "IPOR_707";
    /// @notice Error appeared when account's available Power Ipor Token balance is too low
    string public constant ACC_AVAILABLE_POWER_IPOR_BALANCE_IS_TOO_LOW = "IPOR_708";
    /// @notice Error appeared when account doesn't have rewards (Ipor Tokens / Power Ipor Tokens) to claim
    string public constant NO_REWARDS_TO_CLAIM = "IPOR_709";
    /// @notice Error appeared when cool down is not finished.
    string public constant COOL_DOWN_NOT_FINISH = "IPOR_710";
    /// @notice Error appeared when aggregate power up indicator during calculation going to be negative.
    string public constant AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE = "IPOR_711";
    /// @notice Error appeared when block number used in function is lower than previous block number store in liquidity mining indicators.
    string public constant BLOCK_NUMBER_LOWER_THAN_PREVIOUS_BLOCK_NUMBER = "IPOR_712";
    /// @notice Account Composite Multiplier indicator greater or equal than Composit Multiplier indicator, but should be less or equal
    string public constant ACCOUNT_COMPOSITE_MULTIPLIER_GT_COMPOSITE_MULTIPLIER = "IPOR_713";
}
