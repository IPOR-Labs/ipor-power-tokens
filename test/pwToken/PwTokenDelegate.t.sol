// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../TestCommons.sol";
import "../PowerTokensSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/IPowerTokenLens.sol";
import "../../contracts/tokens/PowerTokenInternalV2.sol";

contract PwTokenDelegateTest is TestCommons {
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

    function testShouldRevertTransactionWhenMismatchArrays() external {
        //given
        uint256[] memory amounts = new uint256[](2);
        address[] memory tokens = new address[](1);
        amounts[0] = 1e18;
        amounts[1] = 1e18;
        tokens[0] = _powerTokensSystem.dai();

        //when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.INPUT_ARRAYS_LENGTH_MISMATCH));
        IFlowsService(_router).delegate(tokens, amounts);
    }

    function testShouldRevertTransactionWhenInsufficientNumberOfTokensToDelegate() external {
        //given
        uint256[] memory amounts = new uint256[](1);
        address[] memory tokens = new address[](1);
        amounts[0] = 1_001e18;
        tokens[0] = _powerTokensSystem.dai();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        uint256 balancePwTokenBefore = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);

        //when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        IFlowsService(_router).delegate(tokens, amounts);

        //then
        uint256 balancePwTokenAfter = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);

        assertEq(balancePwTokenBefore, balancePwTokenAfter, "pw token balance should not change");
    }

    function testShouldRevertTransactionWhenInsufficientNumberOfTokensToDelegateTwoAssets()
        external
    {
        //given
        uint256[] memory amounts = new uint256[](2);
        address[] memory tokens = new address[](2);
        amounts[0] = 600e18;
        amounts[1] = 600e18;
        tokens[0] = _powerTokensSystem.dai();
        tokens[1] = _powerTokensSystem.usdc();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        uint256 balancePwTokenBefore = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);
        uint256 balanceOfDelegateBefore = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        //when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW));
        IFlowsService(_router).delegate(tokens, amounts);

        //then
        uint256 balancePwTokenAfter = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);
        uint256 balanceOfDelegateAfter = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        assertEq(balancePwTokenBefore, balancePwTokenAfter, "pw token balance should not change");
        assertEq(
            balanceOfDelegateBefore,
            balanceOfDelegateAfter,
            "delegate balance should not change"
        );
    }

    function testShouldBeAbleToDelegateIntoOneAssetWhenPassOneAsset() external {
        //  given
        uint256[] memory amounts = new uint256[](1);
        address[] memory tokens = new address[](1);
        amounts[0] = 500e18;
        tokens[0] = _powerTokensSystem.lpDai();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        uint256 balancePwTokenBefore = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);
        uint256 balanceOfDelegateBefore = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        //  when
        vm.prank(_userOne);
        IFlowsService(_router).delegate(tokens, amounts);

        //  then
        uint256 balancePwTokenAfter = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);
        uint256 balanceOfDelegateAfter = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        assertEq(balancePwTokenBefore, balancePwTokenAfter, "pw token balance should be the same");
        assertEq(
            balanceOfDelegateBefore + amounts[0],
            balanceOfDelegateAfter,
            "delegate balance should increase"
        );
    }

    function testShouldBeAbleToDelegateIntoTwoAssetWhenPassTwoAsset() external {
        // given
        uint256[] memory amounts = new uint256[](2);
        address[] memory tokens = new address[](2);
        amounts[0] = 400e18;
        amounts[1] = 400e18;
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();

        vm.prank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);

        uint256 balancePwTokenBefore = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);
        uint256 balanceOfDelegateBefore = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        // when
        vm.prank(_userOne);
        IFlowsService(_router).delegate(tokens, amounts);

        // then
        uint256 balancePwTokenAfter = IPowerTokenLens(_router).powerTokenBalanceOf(_userOne);
        uint256 balanceOfDelegateAfter = IPowerTokenLens(_router)
            .delegatedToLiquidityMiningBalanceOf(_userOne);

        assertEq(balancePwTokenBefore, balancePwTokenAfter, "pw token balance should be the same");
        assertEq(
            balanceOfDelegateBefore + amounts[0] + amounts[1],
            balanceOfDelegateAfter,
            "delegate balance should increase"
        );
    }
}
