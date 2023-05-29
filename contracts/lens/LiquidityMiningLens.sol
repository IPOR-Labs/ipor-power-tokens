// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/types/LiquidityMiningTypes.sol";
import "../interfaces/ILiquidityMiningLens.sol";
import "../interfaces/ILiquidityMining.sol";
import "../libraries/errors/Errors.sol";

contract LiquidityMiningLens is ILiquidityMiningLens {
    address public immutable LIQUIDITY_MINING;

    constructor(address liquidityMining) {
        require(
            liquidityMining != address(0),
            string.concat(Errors.WRONG_ADDRESS, " liquidityMining")
        );
        LIQUIDITY_MINING = liquidityMining;
    }

    function getLiquidityMiningContractId() external view returns (bytes32) {
        return ILiquidityMining(LIQUIDITY_MINING).getContractId();
    }

    function liquidityMiningBalanceOf(address account, address lpToken)
        external
        view
        returns (uint256)
    {
        return ILiquidityMining(LIQUIDITY_MINING).balanceOf(account, lpToken);
    }

    function balanceOfDelegatedPwToken(address account, address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances)
    {
        return ILiquidityMining(LIQUIDITY_MINING).balanceOfDelegatedPwToken(account, lpTokens);
    }

    function calculateAccruedRewards(address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.AccruedRewardsResult[] memory result)
    {
        return ILiquidityMining(LIQUIDITY_MINING).calculateAccruedRewards(lpTokens);
    }

    function calculateAccountRewards(address account, address[] calldata lpTokens)
        external
        view
        override
        returns (LiquidityMiningTypes.AccountRewardResult[] memory)
    {
        return ILiquidityMining(LIQUIDITY_MINING).calculateAccountRewards(account, lpTokens);
    }

    function getGlobalIndicators(address[] memory lpTokens)
        external
        view
        returns (LiquidityMiningTypes.GlobalIndicatorsResult[] memory)
    {
        return ILiquidityMining(LIQUIDITY_MINING).getGlobalIndicators(lpTokens);
    }

    function getAccountIndicators(address account, address[] calldata lpTokens)
        external
        view
        returns (LiquidityMiningTypes.AccountIndicatorsResult[] memory)
    {
        return ILiquidityMining(LIQUIDITY_MINING).getAccountIndicators(account, lpTokens);
    }
}
