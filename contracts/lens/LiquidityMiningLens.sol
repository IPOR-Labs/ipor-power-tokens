// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/types/LiquidityMiningTypes.sol";
import "../interfaces/ILiquidityMiningLens.sol";
import "../interfaces/ILiquidityMiningV2.sol";

contract LiquidityMiningLens is ILiquidityMiningLens {
    address public immutable LIQUIDITY_MINING;

    constructor(address liquidityMining) {
        LIQUIDITY_MINING = liquidityMining;
    }

    function getContractId() external view returns (bytes32) {
        return ILiquidityMiningV2(LIQUIDITY_MINING).getContractId();
    }

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    /// @notice Returns the balance of staked lpTokens
    /// @param account the account's address
    /// @param lpToken the address of lpToken
    /// @return balance of the lpTokens staked by the sender
    function balanceOf(address account, address lpToken) external view returns (uint256) {
        return ILiquidityMiningV2(LIQUIDITY_MINING).balanceOf(account, lpToken);
    }

    /// @notice It returns the balance of delegated Power Tokens for a given `account` and the list of lpToken addresses.
    /// @param account address for which to fetch the information about balance of delegated Power Tokens
    /// @param lpTokens list of lpTokens addresses(lpTokens)
    /// @return balances list of {LiquidityMiningTypes.DelegatedPwTokenBalance} structure, with information how much Power Token is delegated per lpToken address.
    function balanceOfDelegatedPwToken(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).balanceOfDelegatedPwToken(account, lpTokens);
    }

    function calculateAccruedRewards(address[] calldata lpTokens)
        external
        view
        override
        returns (ILiquidityMiningV2.AccruedRewardsResult[] memory result)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).calculateAccruedRewards(lpTokens);
    }

    function calculateAccountRewards(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (ILiquidityMiningV2.AccountRewardResult[] memory)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).calculateAccountRewards(account, lpTokens);
    }

    // todo LiquidityMiningLens
    // [ ] - sequence diagrams
    // [ ] - implemented

    //--------------------
    function getGlobalIndicators(address[] memory lpTokens)
        external
        view
        returns (ILiquidityMiningV2.GlobalIndicatorsResult[] memory)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).getGlobalIndicators(lpTokens);
    }

    function getAccountIndicators(address account, address[] calldata lpTokens)
        external
        view
        returns (ILiquidityMiningV2.AccountIndicatorsResult[] memory)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).getAccountIndicators(account, lpTokens);
    }
}
