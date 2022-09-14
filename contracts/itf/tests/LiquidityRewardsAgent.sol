// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "../../rewards/LiquidityRewards.sol";
import "../../tokens/PwIporToken.sol";

contract LiquidityRewardsAgent {
    LiquidityRewards private _liquidityRewards;
    PwIporToken private _pwToken;

    constructor(
        address pwToken,
        address liquidityRewards,
        address ipToken,
        address iporToken
    ) {
        _liquidityRewards = LiquidityRewards(liquidityRewards);
        _pwToken = PwIporToken(pwToken);
        IERC20(ipToken).approve(liquidityRewards, Constants.MAX_VALUE);
        IERC20(iporToken).approve(pwToken, Constants.MAX_VALUE);
    }

    //    interact with LiquidityRewards

    function stakeIpToken(address ipToken, uint256 ipTokenAmount) external {
        _liquidityRewards.stake(ipToken, ipTokenAmount);
    }

    function unstakeIpToken(address ipToken, uint256 ipTokenAmount) external {
        _liquidityRewards.unstake(ipToken, ipTokenAmount);
    }

    function accountRewards(address ipToken) external view returns (uint256) {
        return _liquidityRewards.accruedRewards(ipToken);
    }

    function accountParams(address ipToken)
        external
        view
        returns (LiquidityRewardsTypes.AccountRewardsParams memory)
    {
        return _liquidityRewards.accountParams(ipToken);
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        returns (LiquidityRewardsTypes.BalanceOfDelegatedPwIpor memory)
    {
        return _liquidityRewards.balanceOfDelegatedPwIpor(account, requestIpTokens);
    }

    function balanceOf(address ipToken) external view returns (uint256) {
        return _liquidityRewards.balanceOf(ipToken);
    }

    function claim(address ipToken) external {
        _liquidityRewards.claim(ipToken);
    }

    //    interact with pwToken

    function delegatedBalanceOf(address account) external view returns (uint256) {
        return _pwToken.delegatedBalanceOf(account);
    }

    function stakeIporToken(uint256 iporTokenAmount) external {
        _pwToken.stake(iporTokenAmount);
    }

    function unstakePwToken(uint256 pwTokenAmount) external {
        _pwToken.unstake(pwTokenAmount);
    }

    function delegateToRewards(address[] memory ipTokens, uint256[] memory pwIporAmounts) external {
        _pwToken.delegateToRewards(ipTokens, pwIporAmounts);
    }

    function withdrawFromDelegation(address ipToken, uint256 pwIporAmount) external {
        _pwToken.withdrawFromDelegation(ipToken, pwIporAmount);
    }
}
