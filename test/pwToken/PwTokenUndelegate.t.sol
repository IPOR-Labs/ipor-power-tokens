// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../TestCommons.sol";
import "../PowerTokensSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/IPowerTokenLens.sol";
import "../../contracts/tokens/PowerTokenInternalV2.sol";

contract PwTokenUndelegateTest is TestCommons {
    PowerTokensSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;

    function setUp() external {
        _powerTokensSystem = new PowerTokensSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
    }

    function testShouldRevertTransactionWhenUndelegateZero() external {
        //  given
        uint256[] memory amounts = new uint256[](1);
        address[] memory tokens = new address[](1);
        amounts[0] = 0;
        tokens[0] = _powerTokensSystem.lpDai();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        //  when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        IFlowsService(_router).undelegate(tokens, amounts);
    }

    function testShouldRevertTransactionWhenNoDelegateTokens() external {
        //  given
        uint256[] memory amounts = new uint256[](1);
        address[] memory tokens = new address[](1);
        amounts[0] = 1_000e18;
        tokens[0] = _powerTokensSystem.lpDai();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        //  when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW));
        IFlowsService(_router).undelegate(tokens, amounts);
    }

    function testShouldRevertTransactionWhenDelegateAmountIsLessThenUndelegateAmount() external {
        //  given
        uint256[] memory amounts = new uint256[](1);
        address[] memory tokens = new address[](1);
        amounts[0] = 500e18;
        tokens[0] = _powerTokensSystem.lpDai();

        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(tokens, amounts);
        vm.stopPrank();

        uint256 balanseOfDelegateBefore = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        //  when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW));
        amounts[0] += 1;
        IFlowsService(_router).undelegate(tokens, amounts);

        //  then
        uint256 balanseOfDelegateAfter = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        assertEq(
            balanseOfDelegateBefore,
            balanseOfDelegateAfter,
            "Delegate balance should not change"
        );
    }

    function testShouldRevertTransactionWhenDelegatedPwTokenAmountIsLessThanDelegatedAmountTwoAsset()
        external
    {
        // given
        uint256[] memory amounts = new uint256[](2);
        address[] memory tokens = new address[](2);
        amounts[0] = 500e18;
        amounts[1] = 500e18;
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();

        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(tokens, amounts);
        vm.stopPrank();

        uint256 balanseOfDelegateBefore = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        // when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW));
        amounts[0] += 1;
        IFlowsService(_router).undelegate(tokens, amounts);

        // then
        uint256 balanseOfDelegateAfter = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        assertEq(
            balanseOfDelegateBefore,
            balanseOfDelegateAfter,
            "Delegate balance should not change"
        );
    }

    function testShouldRevertTransactionWhenMismatchArrayLengthCase1() external {
        //  given
        uint256[] memory amounts = new uint256[](2);
        address[] memory tokens = new address[](1);
        amounts[0] = 500e18;
        amounts[1] = 500e18;
        tokens[0] = _powerTokensSystem.lpDai();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        //  when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.INPUT_ARRAYS_LENGTH_MISMATCH));
        IFlowsService(_router).delegate(tokens, amounts);
    }

    function testShouldRevertTransactionWhenMismatchArrayLengthCase2() external {
        //  given
        uint256[] memory amounts = new uint256[](1);
        address[] memory tokens = new address[](2);
        amounts[0] = 500e18;
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        //  when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.INPUT_ARRAYS_LENGTH_MISMATCH));
        IFlowsService(_router).delegate(tokens, amounts);
    }

    function testShouldUndelegateWhen2Asset() external {
        //  given
        uint256[] memory amounts = new uint256[](2);
        address[] memory tokens = new address[](2);
        amounts[0] = 500e18;
        amounts[1] = 500e18;
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();

        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(tokens, amounts);
        vm.stopPrank();

        uint256 balanseOfDelegateBefore = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);
        uint256 exchangeRateBefore = IPowerTokenInternalV2(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        //  when
        vm.prank(_userOne);
        IFlowsService(_router).undelegate(tokens, amounts);

        //  then
        uint256 balanseOfDelegateAfter = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        uint256 exchangeRateAfter = IPowerTokenInternalV2(_powerTokensSystem.powerToken())
            .calculateExchangeRate();

        assertEq(
            balanseOfDelegateBefore - amounts[0] - amounts[1],
            balanseOfDelegateAfter,
            "Delegate balance should decrease"
        );

        assertEq(exchangeRateBefore, exchangeRateAfter, "Exchange rate should not change");
    }
}
