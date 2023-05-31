// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "../../contracts/interfaces/ILiquidityMining.sol";

contract StakeLpTokensTest is TestCommons {
    event LpTokenAdded(address onBehalfOf, address lpToken, uint256 lpTokenAmount);

    PowerTokensTestsSystem internal _powerTokensSystem;
    address[] internal _lpTokens;
    address internal _userOne;

    function setUp() public {
        _powerTokensSystem = new PowerTokensTestsSystem();
        address[] memory lpTokensTemp = new address[](3);
        lpTokensTemp[0] = _powerTokensSystem.lpDai();
        lpTokensTemp[1] = _powerTokensSystem.lpUsdc();
        lpTokensTemp[2] = _powerTokensSystem.lpUsdt();
        _lpTokens = lpTokensTemp;

        _userOne = _getUserAddress(10);
    }

    function testShouldNotBeAbleToStakeWhenInsufficientAllowanceOnLpToken()
        external
        parameterizedLpTokens(_lpTokens)
    {
        // GIVEN
        address router = _powerTokensSystem.router();
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _activeLpToken;
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 1_000e18;
        _powerTokensSystem.mintLpTokens(_activeLpToken, _userOne, 10_000e18);

        uint256 miningBalanceBefore = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );
        uint256 userBalanceBefore = ERC20(_activeLpToken).balanceOf(_userOne);

        // WHEN
        vm.expectRevert(bytes("ERC20: insufficient allowance"));
        vm.prank(_userOne);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(
            _userOne,
            stakedTokens,
            stakedAmounts
        );

        // THEN
        uint256 miningBalanceAfter = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );
        uint256 userBalanceAfter = ERC20(_activeLpToken).balanceOf(_userOne);

        assertEq(miningBalanceBefore, miningBalanceAfter);
        assertEq(userBalanceBefore, userBalanceAfter);
    }

    function testShouldBeAbleToStakeLpToken() external parameterizedLpTokens(_lpTokens) {
        // GIVEN
        uint256 mintAmount = 10_000e18;
        uint256 stakeAmount = 1_000e18;
        address router = _powerTokensSystem.router();
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _activeLpToken;
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = stakeAmount;

        _powerTokensSystem.mintLpTokens(_activeLpToken, _userOne, mintAmount);
        _powerTokensSystem.approveRouter(_userOne);

        uint256 miningBalanceBefore = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );
        uint256 userBalanceBefore = ERC20(_activeLpToken).balanceOf(_userOne);
        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsBefore = ILiquidityMiningLens(_powerTokensSystem.router())
                .getAccountIndicators(_userOne, stakedTokens);

        // WHEN

        vm.prank(_userOne);
        vm.expectEmit(true, true, true, true);
        emit LpTokenAdded(_userOne, _activeLpToken, stakeAmount);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(
            _userOne,
            stakedTokens,
            stakedAmounts
        );

        // THEN
        uint256 miningBalanceAfter = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );
        uint256 userBalanceAfter = ERC20(_activeLpToken).balanceOf(_userOne);
        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfter = ILiquidityMiningLens(_powerTokensSystem.router())
                .getAccountIndicators(_userOne, stakedTokens);

        assertEq(miningBalanceBefore + stakeAmount, miningBalanceAfter);
        assertEq(userBalanceBefore, userBalanceAfter + stakeAmount);
        assertEq(
            accountIndicatorsBefore[0].indicators.lpTokenBalance,
            0,
            "indicators.lpTokenBalance should be 0"
        );
        assertEq(
            accountIndicatorsAfter[0].indicators.lpTokenBalance,
            stakeAmount,
            " indicators.lpTokenBalance should be stakeAmount"
        );
    }

    function testShouldNotBeAbleToStakeWhenLpTokenIsDeactivated()
        external
        parameterizedLpTokens(_lpTokens)
    {
        // GIVEN
        uint256 miningBalanceBefore = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );
        uint256 mintAmount = 10_000e18;
        uint256 stakeAmount = 1_000e18;
        address router = _powerTokensSystem.router();
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _activeLpToken;
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = stakeAmount;
        _powerTokensSystem.mintLpTokens(_activeLpToken, _userOne, mintAmount);
        _powerTokensSystem.approveRouter(_userOne);
        address liquidityMining = _powerTokensSystem.liquidityMining();

        vm.prank(_powerTokensSystem.owner());
        ILiquidityMiningInternal(liquidityMining).phasingOutLpToken(_activeLpToken);

        // WHEN
        vm.expectRevert(bytes(Errors.LP_TOKEN_NOT_SUPPORTED));
        vm.prank(_userOne);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(
            _userOne,
            stakedTokens,
            stakedAmounts
        );

        // THEN
        uint256 miningBalanceAfter = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );

        assertEq(miningBalanceBefore, miningBalanceAfter, "miningBalance should not change");
    }

    function testShouldNotBeAbleToStakeWhenContractIsPause() external {
        // GIVEN
        _activeLpToken = _lpTokens[0];
        uint256 miningBalanceBefore = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );
        uint256 mintAmount = 10_000e18;
        uint256 stakeAmount = 1_000e18;
        address router = _powerTokensSystem.router();
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _activeLpToken;
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = stakeAmount;
        _powerTokensSystem.mintLpTokens(_activeLpToken, _userOne, mintAmount);
        _powerTokensSystem.approveRouter(_userOne);
        address liquidityMining = _powerTokensSystem.liquidityMining();

        vm.prank(_powerTokensSystem.owner());
        ILiquidityMiningInternal(liquidityMining).pause();

        // WHEN
        vm.expectRevert(bytes("Pausable: paused"));
        vm.prank(_userOne);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(
            _userOne,
            stakedTokens,
            stakedAmounts
        );

        // THEN
        uint256 miningBalanceAfter = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );

        assertEq(miningBalanceBefore, miningBalanceAfter, "miningBalance should not change");
    }

    function testShouldNotBeAbleToStakeWhenAmountIsZero() external {
        // GIVEN
        _activeLpToken = _lpTokens[0];
        uint256 miningBalanceBefore = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );
        uint256 mintAmount = 10_000e18;
        uint256 stakeAmount = 0;
        address router = _powerTokensSystem.router();
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _activeLpToken;
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = stakeAmount;
        _powerTokensSystem.mintLpTokens(_activeLpToken, _userOne, mintAmount);
        _powerTokensSystem.approveRouter(_userOne);

        // WHEN
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        vm.prank(_userOne);
        IPowerTokenStakeService(router).stakeLpTokensToLiquidityMining(
            _userOne,
            stakedTokens,
            stakedAmounts
        );

        // THEN
        uint256 miningBalanceAfter = ERC20(_activeLpToken).balanceOf(
            _powerTokensSystem.liquidityMining()
        );

        assertEq(miningBalanceBefore, miningBalanceAfter, "miningBalance should not change");
    }
}
