// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "../../rewards/John.sol";
import "../../tokens/PwIporToken.sol";

contract LiquidityRewardsAgent {
    John private _john;
    PwIporToken private _pwToken;

    constructor(
        address pwToken,
        address john,
        address ipToken,
        address iporToken
    ) {
        _john = John(john);
        _pwToken = PwIporToken(pwToken);
        IERC20(ipToken).approve(john, Constants.MAX_VALUE);
        IERC20(iporToken).approve(pwToken, Constants.MAX_VALUE);
    }

    //    interact with John

    function stakeIpToken(address ipToken, uint256 ipTokenAmount) external {
        _john.stake(ipToken, ipTokenAmount);
    }

    function unstakeIpToken(address ipToken, uint256 ipTokenAmount) external {
        _john.unstake(ipToken, ipTokenAmount);
    }

    function calculateAccountRewards(address ipToken) external view returns (uint256) {
        return _john.calculateAccountRewards(ipToken);
    }

    function getAccountParams(address ipToken)
        external
        view
        returns (JohnTypes.AccountRewardsParams memory)
    {
        return _john.getAccountParams(ipToken);
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        returns (JohnTypes.BalanceOfDelegatedPwIpor memory)
    {
        return _john.balanceOfDelegatedPwIpor(account, requestIpTokens);
    }

    function balanceOf(address ipToken) external view returns (uint256) {
        return _john.balanceOf(ipToken);
    }

    function claim(address ipToken) external {
        _john.claim(ipToken);
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

    function delegatePwIpor(address[] memory ipTokens, uint256[] memory pwIporAmounts) external {
        _pwToken.delegateToJohn(ipTokens, pwIporAmounts);
    }

    function undelegatePwIpor(address ipToken, uint256 pwIporAmount) external {
        _pwToken.undelegateFromJohn(ipToken, pwIporAmount);
    }
}
