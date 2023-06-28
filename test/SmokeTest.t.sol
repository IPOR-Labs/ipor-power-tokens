// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.20;

import "./TestCommons.sol";
import "./PowerTokensTestsSystem.sol";

contract SmokeTest is TestCommons {
    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address internal _userOne;

    function setUp() public {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(10);

        _powerTokensSystem.mintLpTokens(_powerTokensSystem.lpDai(), _userOne, 10_000e18);
        _powerTokensSystem.approveRouter(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
    }

    function testBalanceOf() public {
        // GIVEN
        address[] memory governanceTokens = new address[](1);
        governanceTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 1_000e18;

        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            governanceTokens,
            stakedAmounts
        );

        // WHEN
        uint256 balance = ILiquidityMiningLens(_router).balanceOfLpTokensStakedInLiquidityMining(
            _userOne,
            _powerTokensSystem.lpDai()
        );
        vm.stopPrank();
        assertEq(balance, 1_000e18);
    }

    function testBalanceOfDelegatedPwToken() public {
        // GIVEN
        address[] memory governanceTokens = new address[](1);
        governanceTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 500e18;

        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(
            governanceTokens,
            stakedAmounts
        );

        // WHEN
        LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances = ILiquidityMiningLens(
            _router
        ).balanceOfPowerTokensDelegatedToLiquidityMining(_userOne, governanceTokens);
        vm.stopPrank();

        // THEN
        assertEq(balances[0].pwTokenAmount, 500e18);
    }

    function testCalculateAccruedRewards() public {
        // GIVEN
        address[] memory governanceTokens = new address[](1);
        governanceTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 1_000e18;
        _powerTokensSystem.setRewardsPerBlock(_powerTokensSystem.lpDai(), 1e8);
        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            governanceTokens,
            stakedAmounts
        );

        vm.roll(block.number + 100);

        // WHEN

        LiquidityMiningTypes.AccruedRewardsResult[] memory result = ILiquidityMiningLens(_router)
            .getAccruedRewardsInLiquidityMining(governanceTokens);
        vm.stopPrank();

        // THEN
        assertEq(result[0].rewardsAmount, 100e18);
    }

    function testCalculateAccountRewards() public {
        // GIVEN
        address[] memory governanceTokens = new address[](1);
        governanceTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 1_000e18;
        _powerTokensSystem.setRewardsPerBlock(_powerTokensSystem.lpDai(), 1e8);
        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            governanceTokens,
            stakedAmounts
        );

        vm.roll(block.number + 100);

        // WHEN

        LiquidityMiningTypes.AccountRewardResult[] memory result = ILiquidityMiningLens(_router)
            .getAccountRewardsInLiquidityMining(_userOne, governanceTokens);
        vm.stopPrank();

        // THEN
        assertEq(result[0].rewardsAmount, 100e18);
    }
}
