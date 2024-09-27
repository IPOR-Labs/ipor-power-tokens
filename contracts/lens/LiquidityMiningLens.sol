// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "../interfaces/types/LiquidityMiningTypes.sol";
import "../interfaces/ILiquidityMiningLens.sol";
import "../interfaces/ILiquidityMining.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/ContractValidator.sol";

/// @dev It is not recommended to use lens contract directly, should be used only through router (like IporProtocolRouter or PowerTokenRouter)
contract LiquidityMiningLens is ILiquidityMiningLens {
    using ContractValidator for address;
    address public immutable liquidityMining;

    constructor(address liquidityMiningInput) {
        liquidityMining = liquidityMiningInput.checkAddress();
    }

    function balanceOfLpTokensStakedInLiquidityMining(
        address account,
        address lpToken
    ) external view returns (uint256) {
        return ILiquidityMining(liquidityMining).balanceOf(account, lpToken);
    }

    function balanceOfPowerTokensDelegatedToLiquidityMining(
        address account,
        address[] memory lpTokens
    ) external view returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances) {
        return ILiquidityMining(liquidityMining).balanceOfDelegatedPwToken(account, lpTokens);
    }

    function getAccruedRewardsInLiquidityMining(
        address[] calldata lpTokens
    ) external view override returns (LiquidityMiningTypes.AccruedRewardsResult[] memory result) {
        return ILiquidityMining(liquidityMining).calculateAccruedRewards(lpTokens);
    }

    function getAccountRewardsInLiquidityMining(
        address account,
        address[] calldata lpTokens
    ) external view override returns (LiquidityMiningTypes.AccountRewardResult[] memory) {
        return ILiquidityMining(liquidityMining).calculateAccountRewards(account, lpTokens);
    }

    function getGlobalIndicatorsFromLiquidityMining(
        address[] memory lpTokens
    ) external view returns (LiquidityMiningTypes.GlobalIndicatorsResult[] memory) {
        return ILiquidityMining(liquidityMining).getGlobalIndicators(lpTokens);
    }

    function getAccountIndicatorsFromLiquidityMining(
        address account,
        address[] calldata lpTokens
    ) external view returns (LiquidityMiningTypes.AccountIndicatorsResult[] memory) {
        return ILiquidityMining(liquidityMining).getAccountIndicators(account, lpTokens);
    }
}
