// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "./TestCommons.sol";
import "./PowerTokensSystem.sol";

contract SmokeTest is TestCommons {
    PowerTokensSystem internal _powerTokensSystem;
    address internal _router;
    address internal _userOne;

    function setUp() public {
        _powerTokensSystem = new PowerTokensSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(10);

        _powerTokensSystem.mintLpTokens(_powerTokensSystem.lpDai(), _userOne, 10_000e18);
        _powerTokensSystem.approveRouter(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
    }

    function testGetContractId() public {
        bytes32 id = ILiquidityMiningLens(_router).getLiquidityMiningContractId();
        assertEq(id, 0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06);
    }

    function testBalanceOf() public {
        // GIVEN
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 1_000e18;

        vm.startPrank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, stakedTokens, stakedAmounts);

        // WHEN
        uint256 balance = ILiquidityMiningLens(_router).liquidityMiningBalanceOf(
            _userOne,
            _powerTokensSystem.lpDai()
        );
        vm.stopPrank();
        assertEq(balance, 1_000e18);
    }

    function testBalanceOfDelegatedPwToken() public {
        // GIVEN
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 500e18;

        vm.startPrank(_userOne);
        IStakeService(_router).stakeIporToken(_userOne, 1_000e18);
        IFlowsService(_router).delegate(stakedTokens, stakedAmounts);

        // WHEN
        LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances = ILiquidityMiningLens(
            _router
        ).balanceOfDelegatedPwToken(_userOne, stakedTokens);
        vm.stopPrank();

        // THEN
        assertEq(balances[0].pwTokenAmount, 500e18);
    }

    function testCalculateAccruedRewards() public {
        // GIVEN
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 1_000e18;
        _powerTokensSystem.setRewardsPerBlock(_powerTokensSystem.lpDai(), 1e8);
        vm.startPrank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, stakedTokens, stakedAmounts);

        vm.roll(block.number + 100);

        // WHEN

        LiquidityMiningTypes.AccruedRewardsResult[] memory result = ILiquidityMiningLens(_router)
            .calculateAccruedRewards(stakedTokens);
        vm.stopPrank();

        // THEN
        assertEq(result[0].rewardsAmount, 100e18);
    }

    function testCalculateAccountRewards() public {
        // GIVEN
        address[] memory stakedTokens = new address[](1);
        stakedTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 1_000e18;
        _powerTokensSystem.setRewardsPerBlock(_powerTokensSystem.lpDai(), 1e8);
        vm.startPrank(_userOne);
        IStakeService(_router).stakeLpTokens(_userOne, stakedTokens, stakedAmounts);

        vm.roll(block.number + 100);

        // WHEN

        LiquidityMiningTypes.AccountRewardResult[] memory result = ILiquidityMiningLens(_router)
            .calculateAccountRewards(_userOne, stakedTokens);
        vm.stopPrank();

        // THEN
        assertEq(result[0].rewardsAmount, 100e18);
    }
}
