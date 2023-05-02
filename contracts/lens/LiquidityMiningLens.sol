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

    function getLiquidityMiningContractId() external view returns (bytes32) {
        return ILiquidityMiningV2(LIQUIDITY_MINING).getContractId();
    }

    function liquidityMiningBalanceOf(address account, address lpToken)
        external
        view
        returns (uint256)
    {
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
        returns (LiquidityMiningTypes.AccruedRewardsResult[] memory result)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).calculateAccruedRewards(lpTokens);
    }

    function calculateAccountRewards(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.AccountRewardResult[] memory)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).calculateAccountRewards(account, lpTokens);
    }

    function getGlobalIndicators(address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.GlobalIndicatorsResult[] memory)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).getGlobalIndicators(lpTokens);
    }

    function getAccountIndicators(address account, address[] calldata lpTokens)
        external
        view
        returns (LiquidityMiningTypes.AccountIndicatorsResult[] memory)
    {
        return ILiquidityMiningV2(LIQUIDITY_MINING).getAccountIndicators(account, lpTokens);
    }
}
