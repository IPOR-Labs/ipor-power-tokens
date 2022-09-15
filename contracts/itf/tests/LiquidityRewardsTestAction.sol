// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "./LiquidityRewardsAgent.sol";

contract LiquidityRewardsTestAction {
    //    interact with LiquidityRewards

    function stakeIpToken(
        address[] memory accounts,
        address ipToken,
        uint256[] memory ipTokenAmount
    ) external {
        for (uint256 i = 0; i != accounts.length; i++) {
            LiquidityRewardsAgent(accounts[i]).stakeIpToken(ipToken, ipTokenAmount[i]);
        }
    }

    function unstakeIpToken(
        address[] memory accounts,
        address[] memory ipToken,
        uint256[] memory ipTokenAmount
    ) external {
        for (uint256 i = 0; i != accounts.length; i++) {
            LiquidityRewardsAgent(accounts[i]).unstakeIpToken(ipToken[i], ipTokenAmount[i]);
        }
    }

    function accountRewards(address account, address ipToken) external view returns (uint256) {
        return LiquidityRewardsAgent(account).accountRewards(ipToken);
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestIpTokens)
        external
        view
        returns (JohnTypes.BalanceOfDelegatedPwIpor memory)
    {
        return LiquidityRewardsAgent(account).balanceOfDelegatedPwIpor(account, requestIpTokens);
    }

    function balanceOf(address account, address ipToken) external view returns (uint256) {
        return LiquidityRewardsAgent(account).balanceOf(ipToken);
    }

    function claim(address[] memory accounts, address ipToken) external {
        for (uint256 i = 0; i != accounts.length; i++) {
            LiquidityRewardsAgent(accounts[i]).claim(ipToken);
        }
    }

    //    interact with pwToken

    function delegatedBalanceOf(address account) external view returns (uint256) {
        return LiquidityRewardsAgent(account).delegatedBalanceOf(account);
    }

    function stakeIporToken(address[] memory accounts, uint256[] memory iporTokenAmounts) external {
        for (uint256 i = 0; i != accounts.length; i++) {
            LiquidityRewardsAgent(accounts[i]).stakeIporToken(iporTokenAmounts[i]);
        }
    }

    function unstakePwToken(address[] memory accounts, uint256[] memory iporTokenAmounts) external {
        for (uint256 i = 0; i != accounts.length; i++) {
            LiquidityRewardsAgent(accounts[i]).unstakePwToken(iporTokenAmounts[i]);
        }
    }

    function delegateToRewards(
        address[] memory accounts,
        address[][] memory ipTokens,
        uint256[][] memory pwIporAmounts
    ) external {
        for (uint256 i = 0; i != accounts.length; i++) {
            LiquidityRewardsAgent(accounts[i]).delegateToRewards(ipTokens[i], pwIporAmounts[i]);
        }
    }

    function withdrawFromDelegation(
        address[] memory accounts,
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts
    ) external {
        for (uint256 i = 0; i != accounts.length; i++) {
            LiquidityRewardsAgent(accounts[i]).withdrawFromDelegation(
                ipTokens[i],
                pwIporAmounts[i]
            );
        }
    }

    //  Test action

    function depositAndWithdrawIporTokensAndIpToken(
        address account,
        address[] memory ipTokens,
        uint256[] memory iporAmounts,
        uint256[] memory ipTokenAmounts
    ) external {
        LiquidityRewardsAgent(account).delegateToRewards(ipTokens, iporAmounts);
        LiquidityRewardsAgent(account).stakeIpToken(ipTokens[0], ipTokenAmounts[0]);
        LiquidityRewardsAgent(account).withdrawFromDelegation(ipTokens[0], iporAmounts[0]);
        LiquidityRewardsAgent(account).unstakeIpToken(ipTokens[0], ipTokenAmounts[0]);
    }

    function depositIporTokensAndIpToken(
        address account,
        address[] memory ipTokens,
        uint256[] memory iporAmounts,
        uint256[] memory ipTokenAmounts
    ) external {
        LiquidityRewardsAgent(account).delegateToRewards(ipTokens, iporAmounts);
        LiquidityRewardsAgent(account).stakeIpToken(ipTokens[0], ipTokenAmounts[0]);
    }
}
