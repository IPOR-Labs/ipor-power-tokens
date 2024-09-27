// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "@power-tokens/contracts/interfaces/types/PowerTokenTypes.sol";
import "@power-tokens/contracts/interfaces/ILiquidityMiningLens.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenLens.sol";
import "@power-tokens/contracts/tokens/PowerTokenInternal.sol";

contract PwTokenUndelegateTest is TestCommons {
    event Claimed(address account, address[] lpTokens, uint256 rewardsAmount);

    PowerTokensTestsSystem internal _powerTokensSystem;
    address internal _router;
    address _userOne;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        _router = _powerTokensSystem.router();
        _userOne = _getUserAddress(1);
        _powerTokensSystem.makeAllApprovals(_userOne);
        _powerTokensSystem.transferIporToken(_userOne, 10_000e18);
        address miningAddress = _powerTokensSystem.liquidityMining();
        address lpDai = _powerTokensSystem.lpDai();
        address lpUsdc = _powerTokensSystem.lpUsdc();
        address lpUsdt = _powerTokensSystem.lpUsdt();
        address iporToken = _powerTokensSystem.iporToken();

        address[] memory lpTokens = new address[](3);
        lpTokens[0] = lpDai;
        lpTokens[1] = lpUsdc;
        lpTokens[2] = lpUsdt;
        uint32[] memory rewards = new uint32[](3);
        rewards[0] = 1e8;
        rewards[1] = 1e8;
        rewards[2] = 1e8;

        vm.startPrank(_powerTokensSystem.owner());
        ILiquidityMiningInternal(miningAddress).setRewardsPerBlock(lpTokens, rewards);
        vm.stopPrank();
        vm.prank(_powerTokensSystem.dao());
        ERC20(iporToken).transfer(miningAddress, 10_000e18);

        _powerTokensSystem.mintLpTokens(lpDai, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(lpUsdc, _userOne, 10_000e18);
        _powerTokensSystem.mintLpTokens(lpUsdt, _userOne, 10_000e18);
    }

    function testShouldNotClaimWhenNoStakeLpTokens() external {
        // given
        address[] memory tokens = new address[](3);
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();
        tokens[2] = _powerTokensSystem.lpUsdt();

        //  when
        vm.prank(_userOne);
        vm.expectRevert(bytes(Errors.NO_REWARDS_TO_CLAIM));
        IPowerTokenFlowsService(_router).claimRewardsFromLiquidityMining(tokens);
    }

    function testShouldClaimRewardsWhen100BlocksWereMint() external {
        // given
        address[] memory tokens = new address[](3);
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();
        tokens[2] = _powerTokensSystem.lpUsdt();
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1_000e18;
        amounts[1] = 1_000e18;
        amounts[2] = 1_000e18;

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(_userOne, tokens, amounts);

        uint256 blockNumber = block.number;
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).getAccountRewardsInLiquidityMining(_userOne, tokens);
        uint256 pwTokensBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        vm.roll(blockNumber + 100);

        // when
        vm.prank(_userOne);
        vm.expectEmit(true, true, true, true);
        emit Claimed(_userOne, tokens, 300e18);
        IPowerTokenFlowsService(_router).claimRewardsFromLiquidityMining(tokens);

        // then
        uint256 pwTokensAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfterClaim = ILiquidityMiningLens(
            _router
        ).getAccountRewardsInLiquidityMining(_userOne, tokens);

        assertEq(rewardsBefore[0].rewardsAmount, 0, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");
        assertEq(rewardsAfterClaim[0].rewardsAmount, 0, "rewardsAfterClaim - rewardsAmount");
        assertEq(
            rewardsAfterClaim[0].allocatedPwTokens,
            0,
            "rewardsAfterClaim - allocatedPwTokens"
        );

        assertEq(rewardsBefore[1].rewardsAmount, 0, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[1].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");
        assertEq(rewardsAfterClaim[1].rewardsAmount, 0, "rewardsAfterClaim - rewardsAmount");
        assertEq(
            rewardsAfterClaim[1].allocatedPwTokens,
            0,
            "rewardsAfterClaim - allocatedPwTokens"
        );

        assertEq(rewardsBefore[2].rewardsAmount, 0, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[2].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");
        assertEq(rewardsAfterClaim[2].rewardsAmount, 0, "rewardsAfterClaim - rewardsAmount");

        assertEq(
            rewardsAfterClaim[2].allocatedPwTokens,
            0,
            "rewardsAfterClaim - allocatedPwTokens"
        );

        assertEq(pwTokensBefore, 0, "pwTokensBefore");
        assertEq(pwTokensAfter, 300e18, "pwTokensAfter");
    }

    function testShouldGet100RewardsWhenFirstStake01LpTokensAndAfter1LpTokens200BlocksMint()
        external
    {
        // given
        address[] memory tokens = new address[](3);
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();
        tokens[2] = _powerTokensSystem.lpUsdt();
        uint256[] memory amountsFirst = new uint256[](3);
        amountsFirst[0] = 1e17;
        amountsFirst[1] = 1e17;
        amountsFirst[2] = 1e17;
        uint256[] memory amountsSecond = new uint256[](3);
        amountsSecond[0] = 1e18;
        amountsSecond[1] = 1e18;
        amountsSecond[2] = 1e18;

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            tokens,
            amountsFirst
        );

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).getAccountRewardsInLiquidityMining(_userOne, tokens);
        uint256 pwTokensBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);

        vm.roll(block.number + 100);

        // when
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            tokens,
            amountsSecond
        );

        vm.roll(block.number + 100);

        vm.prank(_userOne);
        IPowerTokenFlowsService(_router).claimRewardsFromLiquidityMining(tokens);

        // then
        uint256 pwTokensAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfterClaim = ILiquidityMiningLens(
            _router
        ).getAccountRewardsInLiquidityMining(_userOne, tokens);

        assertEq(rewardsBefore[0].rewardsAmount, 0, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");
        assertEq(rewardsAfterClaim[0].rewardsAmount, 0, "rewardsAfterClaim - rewardsAmount");
        assertEq(
            rewardsAfterClaim[0].allocatedPwTokens,
            0,
            "rewardsAfterClaim - allocatedPwTokens"
        );

        assertEq(rewardsBefore[1].rewardsAmount, 0, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[1].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");
        assertEq(rewardsAfterClaim[1].rewardsAmount, 0, "rewardsAfterClaim - rewardsAmount");
        assertEq(
            rewardsAfterClaim[1].allocatedPwTokens,
            0,
            "rewardsAfterClaim - allocatedPwTokens"
        );

        assertEq(rewardsBefore[2].rewardsAmount, 0, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[2].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");
        assertEq(rewardsAfterClaim[2].rewardsAmount, 0, "rewardsAfterClaim - rewardsAmount");

        assertEq(
            rewardsAfterClaim[2].allocatedPwTokens,
            0,
            "rewardsAfterClaim - allocatedPwTokens"
        );

        assertEq(pwTokensBefore, 0, "pwTokensBefore");
        assertEq(pwTokensAfter, 300e18, "pwTokensAfter");
    }

    function testShouldCountProperTransferRewardsWhenOneUserStakeLpTokensTwice() external {
        // given
        address[] memory tokens = new address[](3);
        tokens[0] = _powerTokensSystem.lpDai();
        tokens[1] = _powerTokensSystem.lpUsdc();
        tokens[2] = _powerTokensSystem.lpUsdt();
        uint256[] memory amountsFirst = new uint256[](3);
        amountsFirst[0] = 1_000e18;
        amountsFirst[1] = 1_000e18;
        amountsFirst[2] = 1_000e18;

        // when

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            tokens,
            amountsFirst
        );

        vm.roll(block.number + 100);
        LiquidityMiningTypes.AccountRewardResult[]
            memory rewardsAfter100Blocks = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, tokens);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            tokens,
            amountsFirst
        );

        vm.roll(block.number + 100);
        LiquidityMiningTypes.AccountRewardResult[]
            memory rewardsAfter200Blocks = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, tokens);

        // then

        assertEq(
            rewardsAfter100Blocks[0].rewardsAmount,
            100e18,
            "rewardsAfter100Blocks - rewardsAmount"
        );
        assertEq(
            rewardsAfter100Blocks[0].allocatedPwTokens,
            0,
            "rewardsAfter100Blocks - allocatedPwTokens"
        );
        assertEq(
            rewardsAfter200Blocks[0].rewardsAmount,
            100e18,
            "rewardsAfter200Blocks - rewardsAmount"
        );
        assertEq(
            rewardsAfter200Blocks[0].allocatedPwTokens,
            300e18,
            "rewardsAfter200Blocks - allocatedPwTokens"
        );

        assertEq(
            rewardsAfter100Blocks[1].rewardsAmount,
            100e18,
            "rewardsAfter100Blocks - rewardsAmount"
        );
        assertEq(
            rewardsAfter100Blocks[1].allocatedPwTokens,
            0,
            "rewardsAfter100Blocks - allocatedPwTokens"
        );
        assertEq(
            rewardsAfter200Blocks[1].rewardsAmount,
            100e18,
            "rewardsAfter200Blocks - rewardsAmount"
        );
        assertEq(
            rewardsAfter200Blocks[1].allocatedPwTokens,
            300e18,
            "rewardsAfter200Blocks - allocatedPwTokens"
        );
        assertEq(
            rewardsAfter100Blocks[2].rewardsAmount,
            100e18,
            "rewardsAfter100Blocks - rewardsAmount"
        );
        assertEq(
            rewardsAfter100Blocks[2].allocatedPwTokens,
            0,
            "rewardsAfter100Blocks - allocatedPwTokens"
        );
        assertEq(
            rewardsAfter200Blocks[2].rewardsAmount,
            100e18,
            "rewardsAfter200Blocks - rewardsAmount"
        );
        assertEq(
            rewardsAfter200Blocks[2].allocatedPwTokens,
            300e18,
            "rewardsAfter200Blocks - allocatedPwTokens"
        );
    }

    function testShouldCountProperRewardsWhenOneUserDelegatePwTokenTwice() external {
        // given
        address[] memory tokens = new address[](1);
        tokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory amountsLpTokens = new uint256[](1);
        amountsLpTokens[0] = 1_000e18;
        uint256[] memory amountsPwTokens = new uint256[](1);
        amountsPwTokens[0] = 400e18;

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            tokens,
            amountsLpTokens
        );

        vm.roll(block.number + 100);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).getAccountRewardsInLiquidityMining(_userOne, tokens);

        vm.prank(_userOne);
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);

        // when
        vm.prank(_userOne);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(tokens, amountsPwTokens);

        vm.roll(block.number + 100);
        LiquidityMiningTypes.AccountRewardResult[]
            memory rewardsAfterFirstDelegate = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, tokens);

        vm.prank(_userOne);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(tokens, amountsPwTokens);

        // then
        LiquidityMiningTypes.AccountRewardResult[]
            memory rewardsAfterSecondDelegate = ILiquidityMiningLens(_router)
                .getAccountRewardsInLiquidityMining(_userOne, tokens);

        assertEq(rewardsBefore[0].rewardsAmount, 100e18, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");

        assertEq(
            rewardsAfterFirstDelegate[0].rewardsAmount,
            100e18,
            "rewardsAfterFirstDelegate - rewardsAmount"
        );
        assertEq(
            rewardsAfterFirstDelegate[0].allocatedPwTokens,
            100e18,
            "rewardsAfterFirstDelegate - allocatedPwTokens"
        );

        assertEq(
            rewardsAfterSecondDelegate[0].rewardsAmount,
            0,
            "rewardsAfterSecondDelegate - rewardsAmount"
        );
        assertEq(
            rewardsAfterSecondDelegate[0].allocatedPwTokens,
            200e18,
            "rewardsAfterSecondDelegate - allocatedPwTokens"
        );
    }

    function testShouldCountProperRewardsWhenOneUserStakePwTokenTwiceAndLpAssetWasRemoved()
        external
    {
        // given
        address[] memory tokens = new address[](1);
        tokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory amountsLpTokens = new uint256[](1);
        amountsLpTokens[0] = 1_000e18;
        uint256[] memory amountsPwTokens = new uint256[](1);
        amountsPwTokens[0] = 400e18;

        vm.startPrank(_userOne);
        IPowerTokenStakeService(_router).stakeLpTokensToLiquidityMining(
            _userOne,
            tokens,
            amountsLpTokens
        );
        IPowerTokenStakeService(_router).stakeGovernanceTokenToPowerToken(_userOne, 1_000e18);
        vm.stopPrank();

        vm.roll(block.number + 100);
        LiquidityMiningTypes.AccountRewardResult[] memory rewardsBefore = ILiquidityMiningLens(
            _router
        ).getAccountRewardsInLiquidityMining(_userOne, tokens);

        vm.prank(_userOne);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(tokens, amountsPwTokens);
        vm.roll(block.number + 100);

        // when
        vm.prank(_userOne);
        IPowerTokenStakeService(_router).unstakeLpTokensFromLiquidityMining(
            _userOne,
            tokens,
            amountsLpTokens
        );

        vm.roll(block.number + 100);

        vm.prank(_userOne);
        IPowerTokenFlowsService(_router).delegatePwTokensToLiquidityMining(tokens, amountsPwTokens);

        LiquidityMiningTypes.AccountRewardResult[] memory rewardsAfter = ILiquidityMiningLens(
            _router
        ).getAccountRewardsInLiquidityMining(_userOne, tokens);

        // then
        assertEq(rewardsBefore[0].rewardsAmount, 100e18, "rewardsBefore - rewardsAmount");
        assertEq(rewardsBefore[0].allocatedPwTokens, 0, "rewardsBefore - allocatedPwTokens");

        assertEq(rewardsAfter[0].rewardsAmount, 0, "rewardsAfter - rewardsAmount");
        assertEq(rewardsAfter[0].allocatedPwTokens, 200e18, "rewardsAfter - allocatedPwTokens");
    }
}
