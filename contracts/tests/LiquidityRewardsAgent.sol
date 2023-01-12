// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../mining/LiquidityMining.sol";
import "../tokens/PowerIpor.sol";

contract LiquidityRewardsAgent {
    LiquidityMining private _liquidityMining;
    PowerIpor private _powerIpor;

    constructor(
        address powerIpor,
        address liquidityMining,
        address lpToken,
        address iporToken
    ) {
        _liquidityMining = LiquidityMining(liquidityMining);
        _powerIpor = PowerIpor(powerIpor);
        IERC20(lpToken).approve(liquidityMining, Constants.MAX_VALUE);
        IERC20(iporToken).approve(powerIpor, Constants.MAX_VALUE);
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

    function balanceOfDelegatedPwIpor(address account, address[] memory requestLpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwIporBalance[] memory balances)
    {
        balances = _liquidityMining.balanceOfDelegatedPwIpor(account, requestLpTokens);
    }

    function balanceOf(address lpToken) external view returns (uint256) {
        return _liquidityMining.balanceOf(address(this), lpToken);
    }

    function claim(address lpToken) external {
        _liquidityMining.claim(lpToken);
    }

    function delegatedToLiquidityMiningBalanceOf(address account) external view returns (uint256) {
        return _powerIpor.delegatedToLiquidityMiningBalanceOf(account);
    }

    function stakeIporToken(uint256 iporTokenAmount) external {
        _powerIpor.stake(iporTokenAmount);
    }

    function unstakePwIpor(uint256 pwIporAmount) external {
        _powerIpor.unstake(pwIporAmount);
    }

    function delegatePwIpor(address[] calldata lpTokens, uint256[] calldata pwIporAmounts)
        external
    {
        _powerIpor.delegateToLiquidityMining(lpTokens, pwIporAmounts);
    }

    function undelegatePwIpor(address[] calldata lpTokens, uint256[] calldata pwIporAmounts)
        external
    {
        _powerIpor.undelegateFromLiquidityMining(lpTokens, pwIporAmounts);
    }
}
