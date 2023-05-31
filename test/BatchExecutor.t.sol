// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "./TestCommons.sol";
import "./PowerTokensTestsSystem.sol";

contract BatchExecutorTest is TestCommons {
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

    function testShouldStakeIporTokensWhenStakeForTwoUsers() external {
        // given
        bytes memory calldataUserTwo = abi.encodeWithSignature(
            "stakeGovernanceTokenToPowerToken(address,uint256)",
            _userTwo,
            2_000e18
        );
        bytes memory calldataUserThree = abi.encodeWithSignature(
            "stakeGovernanceTokenToPowerToken(address,uint256)",
            _userThree,
            3_000e18
        );

        bytes[] memory requestData = new bytes[](2);
        requestData[0] = calldataUserTwo;
        requestData[1] = calldataUserThree;

        uint256 userOneIporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userTwoIporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(_userTwo);
        uint256 userThreeIporTokenBalanceBefore = IPowerTokenLens(_router).balanceOfPwToken(
            _userThree
        );

        // when
        vm.prank(_userOne);
        PowerTokenRouter(_router).batchExecutor(requestData);
        // then
        uint256 userOneIporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userOne);
        uint256 userTwoIporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(_userTwo);
        uint256 userThreeIporTokenBalanceAfter = IPowerTokenLens(_router).balanceOfPwToken(
            _userThree
        );

        assertEq(
            userOneIporTokenBalanceBefore,
            userOneIporTokenBalanceAfter,
            "ipor token balance should not change"
        );
        assertEq(userOneIporTokenBalanceBefore, 0, "ipor token balance of userOne should be 0");
        assertEq(userTwoIporTokenBalanceBefore, 0, "ipor token balance of userTwo should be 0");
        assertEq(userThreeIporTokenBalanceBefore, 0, "ipor token balance of userThree should be 0");
        assertEq(
            userTwoIporTokenBalanceAfter,
            2_000e18,
            "ipor token balance of userTwo should be 2_000e18"
        );
        assertEq(
            userThreeIporTokenBalanceAfter,
            3_000e18,
            "ipor token balance of userThree should be 3_000e18"
        );
    }

    function testShouldStakeIporTokenLpTokensDelegate() external {
        bytes memory stakeIpor = abi.encodeWithSignature(
            "stakeGovernanceTokenToPowerToken(address,uint256)",
            _userOne,
            3_000e18
        );

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory stakedAmounts = new uint256[](1);
        stakedAmounts[0] = 2_000e18;
        _powerTokensSystem.mintLpTokens(_powerTokensSystem.lpDai(), _userOne, 10_000e18);

        bytes memory stakeLpTokens = abi.encodeWithSignature(
            "stakeLpTokensToLiquidityMining(address,address[],uint256[])",
            _userOne,
            lpTokens,
            stakedAmounts
        );

        bytes memory delegate = abi.encodeWithSignature(
            "delegatePwTokensToLiquidityMining(address[],uint256[])",
            lpTokens,
            stakedAmounts
        );

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsBefore = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        bytes[] memory requestData = new bytes[](3);
        requestData[0] = stakeIpor;
        requestData[1] = stakeLpTokens;
        requestData[2] = delegate;

        // when
        vm.prank(_userOne);
        PowerTokenRouter(_router).batchExecutor(requestData);

        // then

        LiquidityMiningTypes.AccountIndicatorsResult[]
            memory accountIndicatorsAfter = ILiquidityMiningLens(_router).getAccountIndicators(
                _userOne,
                lpTokens
            );

        assertEq(
            accountIndicatorsBefore[0].indicators.lpTokenBalance,
            0,
            "staked lpTokenBalance should be 0"
        );

        assertEq(
            accountIndicatorsBefore[0].indicators.lpTokenBalance,
            0,
            "delegatedPwTokenBalance should be 0"
        );

        assertEq(
            accountIndicatorsAfter[0].indicators.lpTokenBalance,
            2_000e18,
            "staked lpTokenBalance should be 2_000e18"
        );

        assertEq(
            accountIndicatorsAfter[0].indicators.delegatedPwTokenBalance,
            2_000e18,
            "delegatedPwTokenBalance should be 2_000e18"
        );
    }
}
