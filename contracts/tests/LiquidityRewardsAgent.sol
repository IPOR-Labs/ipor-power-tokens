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
        address ipToken,
        address iporToken
    ) {
        _liquidityMining = LiquidityMining(liquidityMining);
        _powerIpor = PowerIpor(powerIpor);
        IERC20(ipToken).approve(liquidityMining, Constants.MAX_VALUE);
        IERC20(iporToken).approve(powerIpor, Constants.MAX_VALUE);
    }

    //    interact with LiquidityMining

    function stakeIpToken(address ipToken, uint256 ipTokenAmount) external {
        _liquidityMining.stake(ipToken, ipTokenAmount);
    }

    function unstakeIpToken(address ipToken, uint256 ipTokenAmount) external {
        _liquidityMining.unstake(ipToken, ipTokenAmount);
    }

    function calculateAccountRewards(address ipToken) external view returns (uint256) {
        return _liquidityMining.calculateAccountRewards(address(this), ipToken);
    }

    function getAccountIndicators(address ipToken)
        external
        view
        returns (LiquidityMiningTypes.AccountRewardsIndicators memory)
    {
        return _liquidityMining.getAccountIndicators(address(this), ipToken);
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwIporBalance[] memory balances)
    {
        balances = _liquidityMining.balanceOfDelegatedPwIpor(account, requestIpTokens);
    }

    function balanceOf(address ipToken) external view returns (uint256) {
        return _liquidityMining.balanceOf(address(this), ipToken);
    }

    function claim(address ipToken) external {
        _liquidityMining.claim(ipToken);
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

    function delegatePwIpor(address[] calldata ipTokens, uint256[] calldata pwIporAmounts)
        external
    {
        _powerIpor.delegateToLiquidityMining(ipTokens, pwIporAmounts);
    }

    function undelegatePwIpor(address[] calldata ipTokens, uint256[] calldata pwIporAmounts)
        external
    {
        _powerIpor.undelegateFromLiquidityMining(ipTokens, pwIporAmounts);
    }
}
