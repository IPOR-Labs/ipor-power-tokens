// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "./LiquidityRewardsAgent.sol";

contract LiquidityRewardsTestAction {
    //    interact with LiquidityRewards

    function stakeLpToken(
        address[] memory accounts,
        address lpToken,
        uint256[] memory lpTokenAmount
    ) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).stakeLpToken(lpToken, lpTokenAmount[i]);
        }
    }

    function unstakeLpToken(
        address[] memory accounts,
        address[] memory lpToken,
        uint256[] memory lpTokenAmount
    ) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).unstakeLpToken(lpToken[i], lpTokenAmount[i]);
        }
    }

    function calculateAccountRewards(address account, address lpToken)
        external
        view
        returns (uint256)
    {
        return LiquidityRewardsAgent(account).calculateAccountRewards(lpToken);
    }

    function balanceOfDelegatedPwIpor(address account, address[] memory requestLpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwIporBalance[] memory balances)
    {
        balances = LiquidityRewardsAgent(account).balanceOfDelegatedPwIpor(
            account,
            requestLpTokens
        );
    }

    function balanceOf(address account, address lpToken) external view returns (uint256) {
        return LiquidityRewardsAgent(account).balanceOf(lpToken);
    }

    function claim(address[] memory accounts, address lpToken) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).claim(lpToken);
        }
    }

    function delegatedToLiquidityMiningBalanceOf(address account) external view returns (uint256) {
        return LiquidityRewardsAgent(account).delegatedToLiquidityMiningBalanceOf(account);
    }

    function stakeIporToken(address[] memory accounts, uint256[] memory iporTokenAmounts) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).stakeIporToken(iporTokenAmounts[i]);
        }
    }

    function unstakePwIpor(address[] memory accounts, uint256[] memory iporTokenAmounts) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).unstakePwIpor(iporTokenAmounts[i]);
        }
    }

    function delegatePwIpor(
        address[] memory accounts,
        address[][] memory lpTokens,
        uint256[][] memory pwIporAmounts
    ) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).delegatePwIpor(lpTokens[i], pwIporAmounts[i]);
        }
    }

    function undelegatePwIpor(
        address[] calldata accounts,
        address[][] memory lpTokens,
        uint256[][] memory pwIporAmounts
    ) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).undelegatePwIpor(lpTokens[i], pwIporAmounts[i]);
        }
    }

    //  Test action

    function depositAndWithdrawIporTokensAndLpToken(
        address account,
        address[] memory lpTokens,
        uint256[] memory iporTokenAmounts,
        uint256[] memory lpTokenAmounts
    ) external {
        LiquidityRewardsAgent(account).delegatePwIpor(lpTokens, iporTokenAmounts);
        LiquidityRewardsAgent(account).stakeLpToken(lpTokens[0], lpTokenAmounts[0]);
        LiquidityRewardsAgent(account).undelegatePwIpor(lpTokens, iporTokenAmounts);
        LiquidityRewardsAgent(account).unstakeLpToken(lpTokens[0], lpTokenAmounts[0]);
    }

    function depositIporTokensAndLpToken(
        address account,
        address[] memory lpTokens,
        uint256[] memory iporTokenAmounts,
        uint256[] memory lpTokenAmounts
    ) external {
        LiquidityRewardsAgent(account).delegatePwIpor(lpTokens, iporTokenAmounts);
        LiquidityRewardsAgent(account).stakeLpToken(lpTokens[0], lpTokenAmounts[0]);
    }
}
