// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../mining/LiquidityMining.sol";
import "../tokens/PowerToken.sol";

contract LiquidityRewardsAgent {
    LiquidityMining private _liquidityMining;
    PowerToken private _powerToken;

    constructor(
        address powerToken,
        address liquidityMining,
        address lpToken,
        address stakedToken
    ) {
        _liquidityMining = LiquidityMining(liquidityMining);
        _powerToken = PowerToken(powerToken);
        IERC20(lpToken).approve(liquidityMining, Constants.MAX_VALUE);
        IERC20(stakedToken).approve(powerToken, Constants.MAX_VALUE);
    }

    //    interact with LiquidityMining

    function stakeLpToken(address lpToken, uint256 lpTokenAmount) external {
        _liquidityMining.stake(lpToken, lpTokenAmount);
    }

    function unstakeLpToken(address lpToken, uint256 lpTokenAmount) external {
        _liquidityMining.unstake(lpToken, lpTokenAmount);
    }

    function calculateAccountRewards(address lpToken) external view returns (uint256) {
        return _liquidityMining.calculateAccountRewards(address(this), lpToken);
    }

    function getAccountIndicators(address lpToken)
        external
        view
        returns (LiquidityMiningTypes.AccountRewardsIndicators memory)
    {
        return _liquidityMining.getAccountIndicators(address(this), lpToken);
    }

    function balanceOfDelegatedPwToken(address account, address[] memory requestLpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances)
    {
        balances = _liquidityMining.balanceOfDelegatedPwToken(account, requestLpTokens);
    }

    function balanceOf(address lpToken) external view returns (uint256) {
        return _liquidityMining.balanceOf(address(this), lpToken);
    }

    function claim(address lpToken) external {
        _liquidityMining.claim(lpToken);
    }

    function delegatedToLiquidityMiningBalanceOf(address account) external view returns (uint256) {
        return _powerToken.delegatedToLiquidityMiningBalanceOf(account);
    }

    function stakeStakedToken(uint256 pwTokenAmount) external {
        _powerToken.stake(pwTokenAmount);
    }

    function unstakePwToken(uint256 pwTokenAmount) external {
        _powerToken.unstake(pwTokenAmount);
    }

    function delegatePwToken(address[] calldata lpTokens, uint256[] calldata pwTokenAmounts)
        external
    {
        _powerToken.delegateToLiquidityMining(lpTokens, pwTokenAmounts);
    }

    function undelegatePwToken(address[] calldata lpTokens, uint256[] calldata pwTokenAmounts)
        external
    {
        _powerToken.undelegateFromLiquidityMining(lpTokens, pwTokenAmounts);
    }
}
