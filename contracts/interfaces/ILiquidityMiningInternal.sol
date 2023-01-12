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

    /// @notice Checks if lpToken is supported in liquidity mining module.
    /// @param lpToken lpToken address
    /// @return returns true if is supported by LiquidityMining, false otherwise
    function isLpTokenSupported(address lpToken) external view returns (bool);

    /// @notice Gets global indicators for given lpToken
    /// @param lpToken lpToken address
    /// @return {LiquidityMiningTypes.GlobalRewardsIndicators} structure with global indicators used in rewards calculation.
    function getGlobalIndicators(address lpToken)
        external
        view
        returns (LiquidityMiningTypes.GlobalRewardsIndicators memory);

    /// @notice Gets sender rewards indicators for a given lpToken
    /// @param account account address who want to get account indicators
    /// @param lpToken lpToken address
    /// @return {LiquidityMiningTypes.AccountRewardsIndicators} structure with sender rewards indicators used in rewards calculation.
    function getAccountIndicators(address account, address lpToken)
        external
        view
        returns (LiquidityMiningTypes.AccountRewardsIndicators memory);

    /// @notice Delegates Power Ipor Tokens from a given account to LiquidityMining smart contract.
    /// @param account account address who want to delegate its own Power Ipor Tokens to LiquidityMining
    /// @param lpTokens list of lpToken addresses to which delegated Power Ipor Tokens are transfered
    /// @param pwIporAmount list of Power Ipor amounts for which should be assigns to given lpTokens defined above, represented in 18 decimals
    function delegatePwIpor(
        address account,
        address[] calldata lpTokens,
        uint256[] calldata pwIporAmount
    ) external;

    /// @notice Delegates Power Ipor Tokens an stake lpTokens to LiquidityMining.
    /// @dev Power Ipor Token amounts can be equal zeros. IP Token amounts can be equal zeros.
    /// @param account account address who want to delegate its Power Ipor Tokens and stake lpTokens to LiquidityMining
    /// @param lpTokens list of lpToken addresses to which delegated Power Ipor Tokens are transfered
    /// @param pwIporAmounts list of Power Ipor Token amounts which should be assign to lpTokens defined above , represented in 18 decimals
    /// @param lpTokenAmounts list of lpToken amounts which should be stake to liquidityMining, represented in 18 decimals
    function delegatePwIporAndStakeLpToken(
        address account,
        address[] calldata lpTokens,
        uint256[] calldata pwIporAmounts,
        uint256[] calldata lpTokenAmounts
    ) external;

    /// @notice Undelegates Power Ipor Tokens from LiquidityMining
    /// @dev Power Ipor Token amounts can be equal zeros.
    /// @param account address which one undelegate Power Ipor Tokens
    /// @param lpTokens list of lpTokens from which you want to undelegate Power Ipor Tokens
    /// @param pwIporAmounts list of amounts of Power Ipor Tokens which will be undelegated, represented in 18 decimals
    function undelegatePwIpor(
        address account,
        address[] calldata lpTokens,
        uint256[] calldata pwIporAmounts
    ) external;

    /// @notice Sets global configuration indicator rewardsPerBlock for a given lpToken
    /// @param lpToken address for which one should setup rewards per block
    /// @param iporTokenAmount new value of rewards per block, Ipor token amount, represented in 8 decimals
    function setRewardsPerBlock(address lpToken, uint32 iporTokenAmount) external;

    /// @notice Adds new supported by LiquidityMining lpToken asset
    /// @dev Can be executed only by the Owner
    /// @param lpToken address of lpToken asset
    function addLpTokenAsset(address lpToken) external;

    /// @notice Remove lpToken asset from list of supported lpTokens in LiquidityMining smart contract
    /// @dev Can be executed only by the Owner. Notice! When Ip Token asset removed, then rewards cannot be claimed. To recover claiming execute method {addLpTokenAsset()} and {setRewardsPerBlock()}
    /// @param lpToken address of lpToken asset
    function removeLpTokenAsset(address lpToken) external;

    /// @notice Sets new Pause Manager address
    /// @param newPauseManagerAddr - new address of Pauyse Manager
    function setPauseManager(address newPauseManagerAddr) external;

    /// @notice Pauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Paused} event.
    function pause() external;

    /// @notice Unpauses current smart contract, it can be executed only by the Owner
    /// @dev Emits {Unpaused}.
    function unpause() external;

    /// @notice Emitted when account unstake lpTokens
    /// @param account account address in the context of which activities of unstaking lpTokens are performed
    /// @param lpToken address of lpToken which should be stake
    /// @param lpTokenAmount of lpTokens to stake, represented in 18 decimals
    event UnstakeLpTokens(address account, address lpToken, uint256 lpTokenAmount);

    /// @notice Emitted when LiquidityMining's Owner change rewards per block, the number of Ipor tokens per block.
    /// @param changedBy address of account who execute changes
    /// @param oldIporTokenAmount old value of rewards per block, Ipor token amount, represented in 8 decimals
    /// @param newIporTokenAmount new value of rewards per block, Ipor token amount, represented in 8 decimals
    event RewardsPerBlockChanged(
        address indexed changedBy,
        uint256 oldIporTokenAmount,
        uint256 newIporTokenAmount
    );

    /// @notice Emitted when LiquidityMining's Owner add new lpToken asset which is going to be supported by LiquidityMining
    /// @param account address of current LiquidityMining's Owner
    /// @param lpToken address of lpToken
    event LpTokenAdded(address account, address lpToken);

    /// @notice Emitted when LiquidityMining's Owner remove lpToken asset which is going to be not supported by LiquidityMining
    /// @param account address of current LiquidityMining's Owner
    /// @param lpToken address of lpToken
    event LpTokenRemoved(address account, address lpToken);

    /// @notice Emitted when account delegates Power Ipor Tokens to LiquidityMining
    /// @param account account address in the context of which activities of delegation are performed
    /// @param lpToken address of lpToken for which Power Ipor Token are delegated
    /// @param pwIporAmount amount of Power Ipor Tokens delegated to LiquidityMining, represented in 18 decimals
    event DelegatePwIpor(address account, address lpToken, uint256 pwIporAmount);

    /// @notice Emitted when account delegates Power Ipor Tokens and stake lpTokens to the LiquidityMining
    /// @param account account address in the context of which activities of delegation and staking are performed
    /// @param lpToken address of lpToken which should be unstake
    /// @param pwIporAmount of Power Ipor Token to delegate, represented in 18 decimals
    /// @param lpTokenAmount of lpTokens to stake, represented in 18 decimals
    event DelegatePwIporAndStakeLpToken(
        address account,
        address lpToken,
        uint256 pwIporAmount,
        uint256 lpTokenAmount
    );

    /// @notice Emitted when account undelegate Power Ipor Tokens from LiquidityMining contract
    /// @param account account address in the context of which activities of undelegation are performed
    /// @param lpToken address of lpToken
    /// @param pwIporAmount amount of Power Ipor Token which was undelegated, represented in 18 decimals
    event UndelegatePwIpor(address account, address lpToken, uint256 pwIporAmount);

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
