// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "@power-tokens/contracts/interfaces/types/PowerTokenTypes.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenLens.sol";
import "@power-tokens/contracts/tokens/PowerTokenInternal.sol";

contract PwTokenStakeTest is TestCommons {
    event GovernanceTokenAdded(
        address indexed account,
        uint256 governanceTokenAmount,
        uint256 internalExchangeRate,
        uint256 baseAmount
    );

    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;
    address _userTwo;
    address _userThree;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _userTwo = _getUserAddress(2);
        _userThree = _getUserAddress(3);

        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.makeAllApprovals(_userTwo);
        _powerTokensSystem.makeAllApprovals(_userThree);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
        _powerTokensSystem.transferIporToken(_userTwo, 10_000e18);
        _powerTokensSystem.transferIporToken(_userThree, 10_000e18);
    }

    function testShouldNotBeAbleStakeWhenAmountIsZero() external {
        // given
        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 0);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        assertEq(
            iporTokenBalanceBefore,
            iporTokenBalanceAfter,
            "ipor token balance should not change"
        );
    }

    function testShouldBeAbleStake() external {
        // given
        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceBefore = ERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectEmit(true, true, true, true);
        emit GovernanceTokenAdded(_userOne, 10_000e18, 1e18, 10_000e18);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 10_000e18);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceAfter = ERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        assertEq(
            iporTokenBalanceBefore + 10_000e18,
            iporTokenBalanceAfter,
            "ipor token balance should increase"
        );

        assertEq(
            userErc20BalanceBefore - 10_000e18,
            userErc20BalanceAfter,
            "user erc20 balance should decrease"
        );
    }

    function testShouldExchangeRateIncreaseWhenTransferGovernanceTokenToPowerTokenAddress()
        external
    {
        // given

        address iporTokenAddress = _powerTokensSystem.iporToken();
        address powerTokenAddress = _powerTokensSystem.powerToken();
        uint256 iporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceBefore = ERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        uint256 exchangeRateBefore = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        // when
        vm.prank(_userOne);
        ERC20(iporTokenAddress).transfer(powerTokenAddress, 1_000e18);

        // then
        uint256 iporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userErc20BalanceAfter = ERC20(_powerTokensSystem.iporToken()).balanceOf(_userOne);
        uint256 exchangeRateAfter = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        assertEq(
            iporTokenBalanceBefore + 2_000e18,
            iporTokenBalanceAfter,
            "ipor token balance should increase"
        );

        assertEq(
            userErc20BalanceBefore - 2_000e18,
            userErc20BalanceAfter,
            "user erc20 balance should decrease"
        );

        assertTrue(exchangeRateBefore < exchangeRateAfter, "exchange rate should increase");
    }

    function testShouldIncreaseBalanceOfUsersWhenExchangeRateIncrease() external {
        // given
        address iporTokenAddress = _powerTokensSystem.iporToken();
        address powerTokenAddress = _powerTokensSystem.powerToken();

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        uint256 iporTokenUserOneBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        vm.prank(_userTwo);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userTwo, 1_000e18);

        uint256 iporTokenUserTwoBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userTwo);

        uint256 userOneErc20BalanceBefore = ERC20(_powerTokensSystem.iporToken()).balanceOf(
            _userOne
        );
        uint256 userTwoErc20BalanceBefore = ERC20(_powerTokensSystem.iporToken()).balanceOf(
            _userTwo
        );
        uint256 exchangeRateBefore = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        // when
        vm.prank(_userThree);
        ERC20(iporTokenAddress).transfer(powerTokenAddress, 2_000e18);

        // then

        uint256 iporTokenUserOneBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 iporTokenUserTwoBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userTwo);
        uint256 userOneErc20BalanceAfter = ERC20(_powerTokensSystem.iporToken()).balanceOf(
            _userOne
        );
        uint256 userTwoErc20BalanceAfter = ERC20(_powerTokensSystem.iporToken()).balanceOf(
            _userTwo
        );
        uint256 exchangeRateAfter = IPowerTokenInternal(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        assertEq(
            iporTokenUserOneBalanceBefore + 1_000e18,
            iporTokenUserOneBalanceAfter,
            "ipor token balance should increase"
        );

        assertEq(
            iporTokenUserTwoBalanceBefore + 1_000e18,
            iporTokenUserTwoBalanceAfter,
            "ipor token balance should increase"
        );

        assertEq(
            userOneErc20BalanceBefore,
            userOneErc20BalanceAfter,
            "user erc20 balance should not change"
        );

        assertEq(
            userTwoErc20BalanceBefore,
            userTwoErc20BalanceAfter,
            "user erc20 balance should not change"
        );

        assertTrue(exchangeRateBefore < exchangeRateAfter, "exchange rate should increase");
    }

    function testShouldIncreaseBalanceOfUserOneAndNoIncreaseUserTwoWhenExchangeRateIncreaseBeforeUserTwoStake()
        external
    {
        // given
        address iporTokenAddress = _powerTokensSystem.iporToken();
        address powerTokenAddress = _powerTokensSystem.powerToken();

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        uint256 iporTokenUserOneBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        // when
        vm.prank(_userThree);
        ERC20(iporTokenAddress).transfer(powerTokenAddress, 1_000e18);
        vm.prank(_userTwo);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userTwo, 1_000e18);

        // then
        uint256 iporTokenUserOneBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 iporTokenUserTwoBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userTwo);

        assertEq(
            iporTokenUserOneBalanceBefore + 1_000e18,
            iporTokenUserOneBalanceAfter,
            "ipor token balance should increase"
        );

        assertEq(iporTokenUserTwoBalanceAfter, 1_000e18, "ipor token balance should not change");
    }
}
