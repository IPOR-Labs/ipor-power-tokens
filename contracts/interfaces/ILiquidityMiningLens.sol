// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "./types/LiquidityMiningTypes.sol";
import "./ILiquidityMiningV2.sol";

interface ILiquidityMiningLens {
    /// @notice Contract ID. The keccak-256 hash of "io.ipor.LiquidityMining" decreased by 1
    /// @return Returns an ID of the contract
    function getContractId() external view returns (bytes32);

    /// @notice Returns the balance of staked lpTokens
    /// @param account the account's address
    /// @param lpToken the address of lpToken
    /// @return balance of the lpTokens staked by the sender
    function balanceOf(address account, address lpToken) external view returns (uint256);

    /// @notice It returns the balance of delegated Power Tokens for a given `account` and the list of lpToken addresses.
    /// @param account address for which to fetch the information about balance of delegated Power Tokens
    /// @param lpTokens list of lpTokens addresses(lpTokens)
    /// @return balances list of {LiquidityMiningTypes.DelegatedPwTokenBalance} structure, with information how much Power Token is delegated per lpToken address.
    function balanceOfDelegatedPwToken(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances);

    function calculateAccruedRewards(address[] calldata lpTokens)
        external
        view
        returns (LiquidityMiningTypes.AccruedRewardsResult[] memory result);

    function calculateAccountRewards(address account, address[] calldata lpTokens)
        external
        view
        returns (LiquidityMiningTypes.AccountRewardResult[] memory);

    function getGlobalIndicators(address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.GlobalIndicatorsResult[] memory);

    function getAccountIndicators(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.AccountIndicatorsResult[] memory);
}
