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

    function balanceOfDelegatedPwToken(address account, address[] memory requestLpTokens)
        external
        view
        returns (LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances)
    {
        balances = LiquidityRewardsAgent(account).balanceOfDelegatedPwToken(
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

    function unstakePwToken(address[] memory accounts, uint256[] memory iporTokenAmounts) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).unstakePwToken(iporTokenAmounts[i]);
        }
    }

    function delegatePwToken(
        address[] memory accounts,
        address[][] memory lpTokens,
        uint256[][] memory pwTokenAmounts
    ) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).delegatePwToken(lpTokens[i], pwTokenAmounts[i]);
        }
    }

    function undelegatePwToken(
        address[] calldata accounts,
        address[][] memory lpTokens,
        uint256[][] memory pwTokenAmounts
    ) external {
        for (uint256 i; i != accounts.length; ++i) {
            LiquidityRewardsAgent(accounts[i]).undelegatePwToken(lpTokens[i], pwTokenAmounts[i]);
        }
    }

    //  Test action

    function depositAndWithdrawIporTokensAndLpToken(
        address account,
        address[] memory lpTokens,
        uint256[] memory iporTokenAmounts,
        uint256[] memory lpTokenAmounts
    ) external {
        LiquidityRewardsAgent(account).delegatePwToken(lpTokens, iporTokenAmounts);
        LiquidityRewardsAgent(account).stakeLpToken(lpTokens[0], lpTokenAmounts[0]);
        LiquidityRewardsAgent(account).undelegatePwToken(lpTokens, iporTokenAmounts);
        LiquidityRewardsAgent(account).unstakeLpToken(lpTokens[0], lpTokenAmounts[0]);
    }

    function depositIporTokensAndLpToken(
        address account,
        address[] memory lpTokens,
        uint256[] memory iporTokenAmounts,
        uint256[] memory lpTokenAmounts
    ) external {
        LiquidityRewardsAgent(account).delegatePwToken(lpTokens, iporTokenAmounts);
        LiquidityRewardsAgent(account).stakeLpToken(lpTokens[0], lpTokenAmounts[0]);
    }
}
