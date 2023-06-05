// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/IPowerTokenLens.sol";
import "../../contracts/interfaces/IPowerTokenInternal.sol";
import "../../contracts/tokens/PowerTokenInternal.sol";

contract PwTokenUnstakeTest is TestCommons {
    event UnstakeWithoutCooldownFeeChanged(uint256 newFee);
    event GovernanceTokenRemovedWithFee(
        address indexed account,
        uint256 pwTokenAmount,
        uint256 internalExchangeRate,
        uint256 fee
    );

    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
    }

    function testShouldNotBeAbleSetUnstakeWithoutCooldownFeeToValueBiggerThan1e18() external {
        // given
        address powerTokenAddress = _powerTokensSystem.powerToken();
        uint256 unstakeWithoutCooldownFeeBefore = IPowerTokenLens(_router).getPwTokenUnstakeFee();

        // when
        vm.prank(_powerTokensSystem.owner());
        vm.expectRevert(bytes(Errors.UNSTAKE_WITHOUT_COOLDOWN_FEE_IS_TO_HIGH));
        IPowerTokenInternal(powerTokenAddress).setUnstakeWithoutCooldownFee(1e18 + 1);

        // then
        uint256 unstakeWithoutCooldownFeeAfter = IPowerTokenLens(_router).getPwTokenUnstakeFee();

        assertEq(
            unstakeWithoutCooldownFeeBefore,
            unstakeWithoutCooldownFeeAfter,
            "unstakeWithoutCooldownFeeBefore != unstakeWithoutCooldownFeeAfter"
        );
    }

    function testShouldNotBeAbleUnstakeWhenAmountIsAero() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        IPowerTokenStakeService(_router).unstakeGovernanceTokenFromPowerToken(_userOne, 0);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        assertEq(
            iporTokenBalanceBefore,
            iporTokenBalanceAfter,
            "balance of user should not change"
        );
    }

    function testShouldBeAbleUnstake() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceBefore = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateBefore = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        // when
        vm.prank(_userOne);
        vm.expectEmit(true, true, true, true);
        emit GovernanceTokenRemovedWithFee(_userOne, 1_000e18, 1e18, 500e18);
        IPowerTokenStakeService(_router).unstakeGovernanceTokenFromPowerToken(_userOne, 1_000e18);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateAfter = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        assertEq(
            iporTokenBalanceBefore - 1_000e18,
            iporTokenBalanceAfter,
            "balance of user should decrease by 1_000e18"
        );

        assertEq(
            userErc20BalanceBefore + 500e18,
            userErc20BalanceAfter,
            "balance of user should increase by 1_000e18"
        );
        assertEq(exchangeRateBefore, exchangeRateAfter, "exchange rate should not change");
    }

    function testShouldBeAbleUnstakePartOfStakedBalance() external {
        // given
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceBefore = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateBefore = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();
        uint256 totalSupplyBefore = IPowerTokenLens(_router).totalSupplyOfPwToken();

        // when
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).unstakeGovernanceTokenFromPowerToken(_userOne, 500e18);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateAfter = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();
        uint256 totalSupplyAfter = IPowerTokenLens(_router).totalSupplyOfPwToken();

        assertEq(
            iporTokenBalanceBefore - 250e18,
            iporTokenBalanceAfter,
            "balance of user should decrease by 250e18"
        );
        assertEq(
            userErc20BalanceBefore + 250e18,
            userErc20BalanceAfter,
            "balance of user should increase by 250e18"
        );

        assertTrue(exchangeRateBefore < exchangeRateAfter, "exchange rate should increase");

        assertEq(
            totalSupplyBefore - 250e18,
            totalSupplyAfter,
            "total supply should decrease by 250e18"
        );
    }

    function testShouldNotBeAbleToUnstakeWhenUserDelegatedTokensToLiquidityMining() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1_000e18;

        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(lpTokens, amounts);

        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceBefore = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateBefore = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        // when
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        IPowerTokenStakeService(_router).unstakeGovernanceTokenFromPowerToken(_userOne, 1_000e18);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateAfter = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        assertEq(
            iporTokenBalanceBefore,
            iporTokenBalanceAfter,
            "balance of user should not change"
        );

        assertEq(
            userErc20BalanceBefore,
            userErc20BalanceAfter,
            "balance of user should not change"
        );

        assertEq(exchangeRateBefore, exchangeRateAfter, "exchange rate should not change");
    }

    function testShouldBeAbleToUnstakeTokensWhichIsNotDelegateWhenHeDelegatedTokensToLiquidityMining()
        external
    {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 300e18;

        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(lpTokens, amounts);
        vm.stopPrank();

        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceBefore = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateBefore = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        // when
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).unstakeGovernanceTokenFromPowerToken(_userOne, 500e18);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateAfter = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        assertEq(
            iporTokenBalanceBefore - 250e18,
            iporTokenBalanceAfter,
            "balance of user should decrease by 500e18"
        );

        assertEq(
            userErc20BalanceBefore + 250e18,
            userErc20BalanceAfter,
            "balance of user should increase by 500e18"
        );

        assertTrue(exchangeRateBefore < exchangeRateAfter, "exchange rate should increase");
    }

    function testShouldBeAbleToUnstakeTokensWhichIsNotDelegateWhenUnstakeWithoutCooldownFeeChange()
        external
    {
        // given
        address powerTokenAddress = _powerTokensSystem.powerToken();
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 300e18;
        address owner = _powerTokensSystem.owner();

        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(lpTokens, amounts);
        vm.stopPrank();

        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceBefore = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateBefore = IPowerTokenInternal(powerTokenAddress).calculateExchangeRate();
        uint256 unstakeWithoutCooldownFeeBefore = IPowerTokenLens(_router).getPwTokenUnstakeFee();

        // when
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit UnstakeWithoutCooldownFeeChanged(1e17);
        IPowerTokenInternal(powerTokenAddress).setUnstakeWithoutCooldownFee(1e17);
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).unstakeGovernanceTokenFromPowerToken(_userOne, 500e18);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceAfter = IERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateAfter = IPowerTokenInternal(powerTokenAddress).calculateExchangeRate();
        uint256 unstakeWithoutCooldownFeeAfter = IPowerTokenLens(_router).getPwTokenUnstakeFee();

        assertEq(
            iporTokenBalanceBefore - 450e18,
            iporTokenBalanceAfter,
            "balance of user should decrease by 450e18"
        );

        assertEq(
            userErc20BalanceBefore + 450e18,
            userErc20BalanceAfter,
            "balance of user should increase by 250e18"
        );

        assertTrue(exchangeRateBefore < exchangeRateAfter, "exchange rate should increase");
        assertEq(5e17, unstakeWithoutCooldownFeeBefore, "unstakeWithoutCooldownFee == 5e17");
        assertEq(1e17, unstakeWithoutCooldownFeeAfter, "unstakeWithoutCooldownFee == 1e17");
    }
}
