// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "./types/LiquidityMiningTypes.sol";
import "./ILiquidityMiningV2.sol";

interface ILiquidityMiningLens {
    /// @notice Contract ID. The keccak-256 hash of "io.ipor.LiquidityMining" decreased by 1
    /// @return Returns an ID of the contract
    function getContractId() external pure returns (bytes32);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Returns the balance of staked lpTokens
    /// @param account the account's address
    /// @param lpToken the address of lpToken
    /// @return balance of the lpTokens staked by the sender
    function balanceOf(address account, address lpToken) external view returns (uint256);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice It returns the balance of delegated Power Tokens for a given `account` and the list of lpToken addresses.
    /// @param account address for which to fetch the information about balance of delegated Power Tokens
    /// @param lpTokens list of lpTokens addresses(lpTokens)
    /// @return balances list of {LiquidityMiningTypes.DelegatedPwTokenBalance} structure, with information how much Power Token is delegated per lpToken address.
    function balanceOfDelegatedPwToken(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Calculates the accrued rewards since the last rebalancing.
    /// @param lpToken the lpToken address
    /// @return rewards accrued since the last rebalancing, represented with 18 decimals.
    function calculateAccruedRewards(address lpToken) external view returns (uint256);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Calculates account's rewards based on the current state of the sender and global indicators.
    /// @dev Calculation does not consider rewards accrued for the current block
    /// @param account address for which the rewards are calculated
    /// @param lpToken address for which the rewards are calculated
    /// @return Sender's rewards, represented with 18 decimals.
    function calculateAccountRewards(address account, address lpToken)
        external
        view
        returns (uint256);

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    // -----------------------------
    function getGlobalIndicators(address[] memory lpTokens)
        external
        view
        returns (ILiquidityMiningV2.GlobalIndicatorsResult[] memory);

    function getAccountIndicators(address account, address[] memory lpTokens)
        external
        view
        returns (ILiquidityMiningV2.AccountIndicatorsResult[] memory);
}
