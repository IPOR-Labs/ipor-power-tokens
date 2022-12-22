// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "./types/LiquidityMiningTypes.sol";

/// @title Interface to interact with LiquidityMining smart contract. Mainly technical methods or methods used by PowerIpor smart contract.
interface ILiquidityMiningInternal {
    /// @notice Returns current version of LiquidityMining (Liquidity Rewards) contract
    /// @return Current LiquidityMining (Liquidity Rewards) version
    function getVersion() external pure returns (uint256);

    /// @notice Gets Pause Manager address
    /// @return Pause Manager's address
    function getPauseManager() external view returns (address);

    /// @notice Checks if ipToken is supported in liquidity mining module.
    /// @param ipToken ipToken address
    /// @return returns true if is supported by LiquidityMining, false otherwise
    function isIpTokenSupported(address ipToken) external view returns (bool);

    /// @notice Gets global indicators for given ipToken
    /// @param ipToken ipToken address
    /// @return {LiquidityMiningTypes.GlobalRewardsIndicators} structure with global indicators used in rewards calculation.
    function getGlobalIndicators(address ipToken)
        external
        view
        returns (LiquidityMiningTypes.GlobalRewardsIndicators memory);

    /// @notice Gets sender rewards indicators for a given ipToken
    /// @param account account address who want to get account indicators
    /// @param ipToken ipToken address
    /// @return {LiquidityMiningTypes.AccountRewardsIndicators} structure with sender rewards indicators used in rewards calculation.
    function getAccountIndicators(address account, address ipToken)
        external
        view
        returns (LiquidityMiningTypes.AccountRewardsIndicators memory);

    /// @notice Delegates Power Ipor Tokens from a given account to LiquidityMining smart contract.
    /// @param account account address who want to delegate its own Power Ipor Tokens to LiquidityMining
    /// @param ipTokens list of ipToken addresses to which delegated Power Ipor Tokens are transfered
    /// @param pwIporAmount list of Power Ipor amounts for which should be assigns to given ipTokens defined above, represented in 18 decimals
    function delegatePwIpor(
        address account,
        address[] calldata ipTokens,
        uint256[] calldata pwIporAmount
    ) external;

    /// @notice Delegates Power Ipor Tokens an stake ipTokens to LiquidityMining.
    /// @dev Power Ipor Token amounts can be equal zeros. IP Token amounts can be equal zeros.
    /// @param account account address who want to delegate its Power Ipor Tokens and stake ipTokens to LiquidityMining
    /// @param ipTokens list of ipToken addresses to which delegated Power Ipor Tokens are transfered
    /// @param pwIporAmounts list of Power Ipor Token amounts which should be assign to ipTokens defined above , represented in 18 decimals
    /// @param ipTokenAmounts list of ipToken amounts which should be stake to liquidityMining, represented in 18 decimals
    function delegatePwIporAndStakeIpToken(
        address account,
        address[] calldata ipTokens,
        uint256[] calldata pwIporAmounts,
        uint256[] calldata ipTokenAmounts
    ) external;

    /// @notice Undelegates Power Ipor Tokens from LiquidityMining
    /// @dev Power Ipor Token amounts can be equal zeros.
    /// @param account address which one undelegate Power Ipor Tokens
    /// @param ipTokens list of ipTokens from which you want to undelegate Power Ipor Tokens
    /// @param pwIporAmounts list of amounts of Power Ipor Tokens which will be undelegated, represented in 18 decimals
    function undelegatePwIpor(
        address account,
        address[] calldata ipTokens,
        uint256[] calldata pwIporAmounts
    ) external;

    /// @notice Sets global configuration indicator rewardsPerBlock for a given ipToken
    /// @param ipToken address for which one should setup rewards per block
    /// @param iporTokenAmount new value of rewards per block, Ipor token amount, represented in 8 decimals
    function setRewardsPerBlock(address ipToken, uint32 iporTokenAmount) external;

    /// @notice Adds new supported by LiquidityMining ipToken asset
    /// @dev Can be executed only by the Owner
    /// @param ipToken address of ipToken asset
    function addIpTokenAsset(address ipToken) external;

    /// @notice Remove ipToken asset from list of supported ipTokens in LiquidityMining smart contract
    /// @dev Can be executed only by the Owner. Notice! When Ip Token asset removed, then rewards cannot be claimed. To recover claiming execute method {addIpTokenAsset()} and {setRewardsPerBlock()}
    /// @param ipToken address of ipToken asset
    function removeIpTokenAsset(address ipToken) external;

    /// @notice Sets new Pause Manager address
    /// @param newPauseManagerAddr - new address of Pauyse Manager
    function setPauseManager(address newPauseManagerAddr) external;

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when account unstake ipTokens
    /// @param account account address in the context of which activities of unstaking ipTokens are performed
    /// @param ipToken address of ipToken which should be stake
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    event UnstakeIpTokens(address account, address ipToken, uint256 ipTokenAmount);

    /// @notice Emitted when LiquidityMining's Owner change rewards per block, the number of Ipor tokens per block.
    /// @param changedBy address of account who execute changes
    /// @param oldIporTokenAmount old value of rewards per block, Ipor token amount, represented in 8 decimals
    /// @param newIporTokenAmount new value of rewards per block, Ipor token amount, represented in 8 decimals
    event RewardsPerBlockChanged(
        address indexed changedBy,
        uint256 oldIporTokenAmount,
        uint256 newIporTokenAmount
    );

    /// @notice Emitted when LiquidityMining's Owner add new ipToken asset which is going to be supported by LiquidityMining
    /// @param account address of current LiquidityMining's Owner
    /// @param ipToken address of ipToken
    event IpTokenAdded(address account, address ipToken);

    /// @notice Emitted when LiquidityMining's Owner remove ipToken asset which is going to be not supported by LiquidityMining
    /// @param account address of current LiquidityMining's Owner
    /// @param ipToken address of ipToken
    event IpTokenRemoved(address account, address ipToken);

    /// @notice Emitted when account delegates Power Ipor Tokens to LiquidityMining
    /// @param account account address in the context of which activities of delegation are performed
    /// @param ipToken address of ipToken for which Power Ipor Token are delegated
    /// @param pwIporAmount amount of Power Ipor Tokens delegated to LiquidityMining, represented in 18 decimals
    event DelegatePwIpor(address account, address ipToken, uint256 pwIporAmount);

    /// @notice Emitted when account delegates Power Ipor Tokens and stake ipTokens to the LiquidityMining
    /// @param account account address in the context of which activities of delegation and staking are performed
    /// @param ipToken address of ipToken which should be unstake
    /// @param pwIporAmount of Power Ipor Token to delegate, represented in 18 decimals
    /// @param ipTokenAmount of ipTokens to stake, represented in 18 decimals
    event DelegatePwIporAndStakeIpToken(
        address account,
        address ipToken,
        uint256 pwIporAmount,
        uint256 ipTokenAmount
    );

    /// @notice Emitted when account undelegate Power Ipor Tokens from LiquidityMining contract
    /// @param account account address in the context of which activities of undelegation are performed
    /// @param ipToken address of ipToken
    /// @param pwIporAmount amount of Power Ipor Token which was undelegated, represented in 18 decimals
    event UndelegatePwIpor(address account, address ipToken, uint256 pwIporAmount);

    /// @notice Emitted when PauseManager's address is changed by its owner.
    /// @param changedBy account address that has changed LiquidityMining's address
    /// @param oldPauseManager PauseManager's old address
    /// @param newPauseManager PauseManager's new address
    event PauseManagerChanged(
        address indexed changedBy,
        address indexed oldPauseManager,
        address indexed newPauseManager
    );
}