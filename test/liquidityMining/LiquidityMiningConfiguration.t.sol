// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../TestCommons.sol";
import "../PowerTokensTestsSystem.sol";
import "@power-tokens/contracts/interfaces/types/PowerTokenTypes.sol";
import "@power-tokens/contracts/interfaces/ILiquidityMiningLens.sol";
import "@power-tokens/contracts/interfaces/IPowerTokenLens.sol";
import "@power-tokens/contracts/tokens/PowerTokenInternal.sol";
import "../../contracts/interfaces/types/LiquidityMiningTypes.sol";
import "../../contracts/mining/LiquidityMiningInternal.sol";

contract LiquidityMiningConfigurationTest is TestCommons {
    event LpTokenSupportRemoved(address account, address lpToken);
    event NewLpTokenSupported(address account, address lpToken);
    event PauseGuardiansAdded(address[] indexed guardians);
    event PauseGuardiansRemoved(address[] indexed guardians);

    PowerTokensTestsSystem internal _powerTokensSystem;

    function setUp() external {
        _powerTokensSystem = new PowerTokensTestsSystem();
        address[] memory guardians = new address[](1);
        guardians[0] = _powerTokensSystem.owner();
        address lm = _powerTokensSystem.liquidityMining();

        vm.prank(_powerTokensSystem.owner());
        LiquidityMining(lm).addPauseGuardians(guardians);
    }

    function testShouldBeAbleToSet4NewPauseGuardians() external {
        // given
        address[] memory guardians = new address[](4);
        guardians[0] = _getUserAddress(10);
        guardians[1] = _getUserAddress(11);
        guardians[2] = _getUserAddress(12);
        guardians[3] = _getUserAddress(13);

        address lm = _powerTokensSystem.liquidityMining();
        bool userOneIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[3]);

        // when
        vm.prank(_powerTokensSystem.owner());
        vm.expectEmit(true, true, true, true);
        emit PauseGuardiansAdded(guardians);
        LiquidityMining(lm).addPauseGuardians(guardians);

        // then

        bool userOneIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[3]);

        assertFalse(userOneIsPauseGuardianBefore, "should not be pause guardian before");
        assertFalse(userTwoIsPauseGuardianBefore, "should not be pause guardian before");
        assertFalse(userThreeIsPauseGuardianBefore, "should not be pause guardian before");
        assertFalse(userFourIsPauseGuardianBefore, "should not be pause guardian before");

        assertTrue(userOneIsPauseGuardianAfter, "should be pause guardian after");
        assertTrue(userTwoIsPauseGuardianAfter, "should be pause guardian after");
        assertTrue(userThreeIsPauseGuardianAfter, "should be pause guardian after");
        assertTrue(userFourIsPauseGuardianAfter, "should be pause guardian after");
    }

    function testShoudBeAbleToRemove2UsersFromGuardians() external {
        // given
        address[] memory guardians = new address[](4);
        guardians[0] = _getUserAddress(10);
        guardians[1] = _getUserAddress(11);
        guardians[2] = _getUserAddress(12);
        guardians[3] = _getUserAddress(13);

        address lm = _powerTokensSystem.liquidityMining();

        vm.prank(_powerTokensSystem.owner());
        LiquidityMining(lm).addPauseGuardians(guardians);

        address[] memory guardiansToRemove = new address[](2);
        guardiansToRemove[0] = guardians[0];
        guardiansToRemove[1] = guardians[1];

        bool userOneIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianBefore = LiquidityMining(lm).isPauseGuardian(guardians[3]);

        // when
        vm.prank(_powerTokensSystem.owner());
        vm.expectEmit(true, true, true, true);
        emit PauseGuardiansRemoved(guardiansToRemove);
        LiquidityMining(lm).removePauseGuardians(guardiansToRemove);

        // then

        bool userOneIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[0]);
        bool userTwoIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[1]);
        bool userThreeIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[2]);
        bool userFourIsPauseGuardianAfter = LiquidityMining(lm).isPauseGuardian(guardians[3]);

        assertTrue(userOneIsPauseGuardianBefore, "should be pause guardian before");
        assertTrue(userTwoIsPauseGuardianBefore, "should be pause guardian before");
        assertTrue(userThreeIsPauseGuardianBefore, "should not be pause guardian before");
        assertTrue(userFourIsPauseGuardianBefore, "should not be pause guardian before");

        assertFalse(userOneIsPauseGuardianAfter, "should not be pause guardian after");
        assertFalse(userTwoIsPauseGuardianAfter, "should not be pause guardian after");
        assertTrue(userThreeIsPauseGuardianAfter, "should not be pause guardian after");
        assertTrue(userFourIsPauseGuardianAfter, "should not be pause guardian after");
    }

    function testShouldBeAbleToPauseWhenUserIsGuardian() external {
        // given
        address[] memory guardians = new address[](1);
        guardians[0] = _getUserAddress(10);

        address lm = _powerTokensSystem.liquidityMining();

        vm.prank(_powerTokensSystem.owner());
        LiquidityMining(lm).addPauseGuardians(guardians);

        bool isPausedBefore = PausableUpgradeable(lm).paused();

        // when
        vm.prank(guardians[0]);
        LiquidityMining(lm).pause();

        // then
        bool isPausedAfter = PausableUpgradeable(lm).paused();

        assertFalse(isPausedBefore, "should not be paused before");
        assertTrue(isPausedAfter, "should be paused after");
    }

    function testShouldNotBeAbleToPauseWhenRemovedFromGuardians() external {
        // given
        address[] memory guardians = new address[](1);
        guardians[0] = _getUserAddress(10);

        address lm = _powerTokensSystem.liquidityMining();

        vm.prank(_powerTokensSystem.owner());
        LiquidityMining(lm).addPauseGuardians(guardians);

        bool isPausedBefore = PausableUpgradeable(lm).paused();

        // when
        vm.prank(_powerTokensSystem.owner());
        LiquidityMining(lm).removePauseGuardians(guardians);

        vm.prank(guardians[0]);
        vm.expectRevert(bytes(Errors.CALLER_NOT_GUARDIAN));
        LiquidityMining(lm).pause();
    }

    function testShouldDeployContractWithoutAssets() external {
        // given
        address[] memory lpTokewns = new address[](0);

        // when
        LiquidityMiningEthereum implementation = new LiquidityMiningEthereum(
            _powerTokensSystem.dao(),
            _getUserAddress(123),
            _getUserAddress(123),
            _getUserAddress(123),
            _getUserAddress(123)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize(address[])", lpTokewns)
        );

        // then

        assertTrue(address(proxy) != address(0), "Proxy address should not be zero");
    }

    function testShouldDeployContractWith3Assets() external {
        // given
        // when
        PowerTokensTestsSystem powerTokensSystem = new PowerTokensTestsSystem();
        address liquidityMining = powerTokensSystem.liquidityMining();

        // then

        assertTrue(
            LiquidityMiningInternal(liquidityMining).isLpTokenSupported(powerTokensSystem.lpDai()),
            "should support lpDAI"
        );
        assertTrue(
            LiquidityMiningInternal(liquidityMining).isLpTokenSupported(powerTokensSystem.lpUsdc()),
            "should support lpUSDC"
        );
        assertTrue(
            LiquidityMiningInternal(liquidityMining).isLpTokenSupported(powerTokensSystem.lpUsdt()),
            "should support lpUSDT"
        );
    }

    function testShouldDeployContractWith1Assets() external {
        // given
        address[] memory lpTokewns = new address[](1);
        lpTokewns[0] = _powerTokensSystem.lpDai();

        // when
        LiquidityMiningEthereum implementation = new LiquidityMiningEthereum(
            _powerTokensSystem.dao(),
            _getUserAddress(123),
            _getUserAddress(123),
            _getUserAddress(123),
            _getUserAddress(123)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize(address[])", lpTokewns)
        );

        // then

        assertTrue(address(proxy) != address(0), "Proxy address should not be zero");
        assertTrue(
            LiquidityMiningInternal(address(proxy)).isLpTokenSupported(_powerTokensSystem.lpDai()),
            "should support lpDAI"
        );
    }

    function testShouldBeAbleToAddNewAssetByOwner() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address dai = _powerTokensSystem.dai();

        bool isSupportedBefore = LiquidityMiningInternal(liquidityMining).isLpTokenSupported(dai);

        // when
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit NewLpTokenSupported(owner, dai);
        LiquidityMiningInternal(liquidityMining).newSupportedLpToken(dai);

        // then
        bool isSupportedAfter = LiquidityMiningInternal(liquidityMining).isLpTokenSupported(dai);

        assertTrue(!isSupportedBefore, "should not support DAI before");
        assertTrue(isSupportedAfter, "should support DAI after");
    }

    function testShouldNotBeAbleToAddNewAssetByRandomUser() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address user = _getUserAddress(10);
        address dai = _powerTokensSystem.dai();

        bool isSupportedBefore = LiquidityMiningInternal(liquidityMining).isLpTokenSupported(dai);

        // when
        vm.prank(user);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        LiquidityMiningInternal(liquidityMining).newSupportedLpToken(dai);

        // then
        bool isSupportedAfter = LiquidityMiningInternal(liquidityMining).isLpTokenSupported(dai);

        assertTrue(!isSupportedBefore, "should not support DAI before");
        assertTrue(!isSupportedAfter, "should not support DAI after");
    }

    function testShouldBeAbleToTransferOwnership() external {
        // given
        address user = _getUserAddress(10);
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address ownerBefore = MiningOwnableUpgradeable(liquidityMining).owner();

        // when
        vm.prank(owner);
        MiningOwnableUpgradeable(liquidityMining).transferOwnership(user);

        vm.prank(user);
        MiningOwnableUpgradeable(liquidityMining).confirmTransferOwnership();

        // then
        address ownerAfter = MiningOwnableUpgradeable(liquidityMining).owner();

        assertTrue(ownerBefore == owner, "should be owner before");
        assertTrue(ownerAfter == user, "should be user after");
    }

    function testShouldNotBeAbleToTransferOwnershipWhenNotOwner() external {
        // given
        address user = _getUserAddress(10);
        address user2 = _getUserAddress(11);
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address ownerBefore = MiningOwnableUpgradeable(liquidityMining).owner();

        // when
        vm.prank(user2);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        MiningOwnableUpgradeable(liquidityMining).transferOwnership(user);

        // then
        address ownerAfter = MiningOwnableUpgradeable(liquidityMining).owner();

        assertTrue(ownerBefore == owner, "should be owner before");
        assertTrue(ownerAfter == owner, "should be owner after");
    }

    function testShouldBeAbleToPauseContractWhenPauseManagerChanged() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address[] memory guardians = new address[](1);
        guardians[0] = _getUserAddress(10);

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit PauseGuardiansAdded(guardians);
        ILiquidityMiningInternal(liquidityMining).addPauseGuardians(guardians);

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(guardians[0]);
        LiquidityMiningInternal(liquidityMining).pause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(!isPausedBefore, "should not be paused before");
        assertTrue(isPausedAfter, "should be paused after");
    }

    function testShouldNotBeAbleToUnpauseContractWhenNoOwner() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address user = _getUserAddress(10);

        vm.prank(owner);
        LiquidityMiningInternal(liquidityMining).pause();

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(user);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        LiquidityMiningInternal(liquidityMining).unpause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(isPausedBefore, "should be paused before");
        assertTrue(isPausedAfter, "should be paused after");
    }

    function testShouldHasZeroBalanceWhenContractWasDeployed() external {
        // given
        address router = _powerTokensSystem.router();
        address userOne = _getUserAddress(10);
        address lpDai = _powerTokensSystem.lpDai();
        address lpUsdc = _powerTokensSystem.lpUsdc();
        address lpUsdt = _powerTokensSystem.lpUsdt();
        address[] memory lpTokens = new address[](3);
        lpTokens[0] = lpDai;
        lpTokens[1] = lpUsdc;
        lpTokens[2] = lpUsdt;

        // when
        LiquidityMiningTypes.DelegatedPwTokenBalance[] memory balances = ILiquidityMiningLens(
            router
        ).balanceOfPowerTokensDelegatedToLiquidityMining(userOne, lpTokens);

        // then

        assertTrue(balances.length == 3, "should be 3");
        assertTrue(balances[0].pwTokenAmount == 0, "lpDai should be 0");
        assertTrue(balances[1].pwTokenAmount == 0, "lpUsdc should be 0");
        assertTrue(balances[2].pwTokenAmount == 0, "lpUsdt should be 0");
    }

    function testShouldNotBeAbleToAddLpTokensWhenNotRouter() external {
        // given
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdateLpToken[](1);
        updateLpToken[0].lpToken = _powerTokensSystem.lpDai();
        updateLpToken[0].lpTokenAmount = 100;
        updateLpToken[0].beneficiary = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMining(liquidityMining).addLpTokensInternal(updateLpToken);
    }

    function testShouldNotBeAbleToRemoveLpTokensWhenNotRouter() external {
        // given
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdateLpToken[](1);
        updateLpToken[0].lpToken = _powerTokensSystem.lpDai();
        updateLpToken[0].lpTokenAmount = 100;
        updateLpToken[0].beneficiary = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMining(liquidityMining).removeLpTokensInternal(updateLpToken);
    }

    function testShouldNotBeAbleToAddPwTokensWhenNotRouter() external {
        // given
        LiquidityMiningTypes.UpdatePwToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdatePwToken[](1);
        updateLpToken[0].lpToken = _powerTokensSystem.lpDai();
        updateLpToken[0].pwTokenAmount = 100;
        updateLpToken[0].beneficiary = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMining(liquidityMining).addPwTokensInternal(updateLpToken);
    }

    function testShouldNotBeAbleToRemovePwTokensWhenNotRouter() external {
        // given
        LiquidityMiningTypes.UpdatePwToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdatePwToken[](1);
        updateLpToken[0].lpToken = _powerTokensSystem.lpDai();
        updateLpToken[0].pwTokenAmount = 100;
        updateLpToken[0].beneficiary = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMining(liquidityMining).removePwTokensInternal(updateLpToken);
    }

    function testShouldNotBeAbleToDelegatePwTokenWhenContractIsPause() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();
        uint256[] memory pwTokenAmounts = new uint256[](1);
        pwTokenAmounts[0] = 1_000e18;
        address router = _powerTokensSystem.router();
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address userOne = _getUserAddress(10);
        address owner = _powerTokensSystem.owner();
        _powerTokensSystem.transferIporToken(userOne, 10_000e18);
        _powerTokensSystem.approveRouter(userOne);

        vm.prank(owner);
        LiquidityMiningInternal(liquidityMining).pause();

        vm.prank(userOne);
        IPowerTokenStakeService(router).stakeGovernanceTokenToPowerToken(userOne, 1_000e18);

        // when
        vm.prank(userOne);
        vm.expectRevert(bytes("Pausable: paused"));
        IPowerTokenFlowsService(router).delegatePwTokensToLiquidityMining(lpTokens, pwTokenAmounts);
    }

    function testShouldNotBeAbleToDelegatePwTokenWhenLpTokenIsNotSupported() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.dai();
        uint256[] memory pwTokenAmounts = new uint256[](1);
        pwTokenAmounts[0] = 1_000e18;
        address router = _powerTokensSystem.router();
        address userOne = _getUserAddress(10);
        _powerTokensSystem.transferIporToken(userOne, 10_000e18);
        _powerTokensSystem.approveRouter(userOne);

        vm.prank(userOne);
        IPowerTokenStakeService(router).stakeGovernanceTokenToPowerToken(userOne, 1_000e18);

        // when
        vm.prank(userOne);
        vm.expectRevert(bytes(Errors.LP_TOKEN_NOT_SUPPORTED));
        IPowerTokenFlowsService(router).delegatePwTokensToLiquidityMining(lpTokens, pwTokenAmounts);
    }

    function testShouldBeAbleToSetAccountPowerUpModifiers() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();

        LiquidityMiningTypes.PoolPowerUpModifier[]
            memory modifiers = new LiquidityMiningTypes.PoolPowerUpModifier[](1);
        modifiers[0].logBase = 3e10;
        modifiers[0].pwTokenModifier = 5e10;
        modifiers[0].vectorOfCurve = 2e9;

        (
            uint256 pwTokenModifierBefore,
            uint256 logBaseBefore,
            uint256 vectorOfCurveBefore
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        // when
        vm.prank(owner);
        LiquidityMiningInternal(liquidityMining).setPoolPowerUpModifiers(lpTokens, modifiers);

        // then
        (
            uint256 pwTokenModifierAfter,
            uint256 logBaseAfter,
            uint256 vectorOfCurveAfter
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        assertEq(pwTokenModifierBefore, 2e18, "should be 2e18 before");
        assertEq(logBaseBefore, 2e18, "should be 2e18 before");
        assertEq(vectorOfCurveBefore, 0, "should be 0 before");

        assertEq(pwTokenModifierAfter, 5e18, "should be 5e18 after");
        assertEq(logBaseAfter, 3e18, "should be 3e18 after");
        assertEq(vectorOfCurveAfter, 2e17, "should be 2e17 after");
    }

    function testShouldNotBeAbleToSetAccountPowerUpModifiersWhenNotOwner() external {
        // given
        address user = _getUserAddress(10);
        address liquidityMining = _powerTokensSystem.liquidityMining();

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();

        LiquidityMiningTypes.PoolPowerUpModifier[]
            memory modifiers = new LiquidityMiningTypes.PoolPowerUpModifier[](1);
        modifiers[0].logBase = 3e10;
        modifiers[0].pwTokenModifier = 5e10;
        modifiers[0].vectorOfCurve = 2e9;

        (
            uint256 pwTokenModifierBefore,
            uint256 logBaseBefore,
            uint256 vectorOfCurveBefore
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        // when
        vm.prank(user);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        LiquidityMiningInternal(liquidityMining).setPoolPowerUpModifiers(lpTokens, modifiers);

        // then
        (
            uint256 pwTokenModifierAfter,
            uint256 logBaseAfter,
            uint256 vectorOfCurveAfter
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        assertEq(pwTokenModifierBefore, 2e18, "should be 2e18 before");
        assertEq(logBaseBefore, 2e18, "should be 2e18 before");
        assertEq(vectorOfCurveBefore, 0, "should be 0 before");

        assertEq(pwTokenModifierAfter, 2e18, "should be 2e18 after");
        assertEq(logBaseAfter, 2e18, "should be 2e18 after");
        assertEq(vectorOfCurveAfter, 0, "should be 0 after");
    }

    function testShouldNotBeAbleToSetAccountPowerUpModifiersWhenMismatchArraysLength() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address[] memory lpTokens = new address[](2);
        lpTokens[0] = _powerTokensSystem.lpDai();
        lpTokens[1] = _powerTokensSystem.lpDai();

        LiquidityMiningTypes.PoolPowerUpModifier[]
            memory modifiers = new LiquidityMiningTypes.PoolPowerUpModifier[](1);
        modifiers[0].logBase = 3e10;
        modifiers[0].pwTokenModifier = 5e10;
        modifiers[0].vectorOfCurve = 2e9;

        (
            uint256 pwTokenModifierBefore,
            uint256 logBaseBefore,
            uint256 vectorOfCurveBefore
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.INPUT_ARRAYS_LENGTH_MISMATCH));
        LiquidityMiningInternal(liquidityMining).setPoolPowerUpModifiers(lpTokens, modifiers);

        // then
        (
            uint256 pwTokenModifierAfter,
            uint256 logBaseAfter,
            uint256 vectorOfCurveAfter
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        assertEq(pwTokenModifierBefore, 2e18, "should be 2e18 before");
        assertEq(logBaseBefore, 2e18, "should be 2e18 before");
        assertEq(vectorOfCurveBefore, 0, "should be 0 before");

        assertEq(pwTokenModifierAfter, 2e18, "should be 2e18 after");
        assertEq(logBaseAfter, 2e18, "should be 2e18 after");
        assertEq(vectorOfCurveAfter, 0, "should be 0 after");
    }

    function testShouldNotBeAbleToSetAccountPowerUpModifiersWhenLogBase0() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();

        LiquidityMiningTypes.PoolPowerUpModifier[]
            memory modifiers = new LiquidityMiningTypes.PoolPowerUpModifier[](1);
        modifiers[0].logBase = 0;
        modifiers[0].pwTokenModifier = 5e10;
        modifiers[0].vectorOfCurve = 2e9;

        (
            uint256 pwTokenModifierBefore,
            uint256 logBaseBefore,
            uint256 vectorOfCurveBefore
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.WRONG_VALUE));
        LiquidityMiningInternal(liquidityMining).setPoolPowerUpModifiers(lpTokens, modifiers);

        // then
        (
            uint256 pwTokenModifierAfter,
            uint256 logBaseAfter,
            uint256 vectorOfCurveAfter
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        assertEq(pwTokenModifierBefore, 2e18, "should be 2e18 before");
        assertEq(logBaseBefore, 2e18, "should be 2e18 before");
        assertEq(vectorOfCurveBefore, 0, "should be 0 before");

        assertEq(pwTokenModifierAfter, 2e18, "should be 2e18 after");
        assertEq(logBaseAfter, 2e18, "should be 2e18 after");
        assertEq(vectorOfCurveAfter, 0, "should be 0 after");
    }

    function testShouldNotBeAbleToSetAccountPowerUpModifiersWhenLogBase1() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();

        LiquidityMiningTypes.PoolPowerUpModifier[]
            memory modifiers = new LiquidityMiningTypes.PoolPowerUpModifier[](1);
        modifiers[0].logBase = 1e10;
        modifiers[0].pwTokenModifier = 5e10;
        modifiers[0].vectorOfCurve = 2e9;

        (
            uint256 pwTokenModifierBefore,
            uint256 logBaseBefore,
            uint256 vectorOfCurveBefore
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.WRONG_VALUE));
        LiquidityMiningInternal(liquidityMining).setPoolPowerUpModifiers(lpTokens, modifiers);

        // then
        (
            uint256 pwTokenModifierAfter,
            uint256 logBaseAfter,
            uint256 vectorOfCurveAfter
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        assertEq(pwTokenModifierBefore, 2e18, "should be 2e18 before");
        assertEq(logBaseBefore, 2e18, "should be 2e18 before");
        assertEq(vectorOfCurveBefore, 0, "should be 0 before");

        assertEq(pwTokenModifierAfter, 2e18, "should be 2e18 after");
        assertEq(logBaseAfter, 2e18, "should be 2e18 after");
        assertEq(vectorOfCurveAfter, 0, "should be 0 after");
    }

    function testShouldNotBeAbleToSetAccountPowerUpModifiersWhenPwTokenModifier0() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.lpDai();

        LiquidityMiningTypes.PoolPowerUpModifier[]
            memory modifiers = new LiquidityMiningTypes.PoolPowerUpModifier[](1);
        modifiers[0].logBase = 3e10;
        modifiers[0].pwTokenModifier = 0;
        modifiers[0].vectorOfCurve = 2e9;

        (
            uint256 pwTokenModifierBefore,
            uint256 logBaseBefore,
            uint256 vectorOfCurveBefore
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.VALUE_NOT_GREATER_THAN_ZERO));
        LiquidityMiningInternal(liquidityMining).setPoolPowerUpModifiers(lpTokens, modifiers);

        // then
        (
            uint256 pwTokenModifierAfter,
            uint256 logBaseAfter,
            uint256 vectorOfCurveAfter
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        assertEq(pwTokenModifierBefore, 2e18, "should be 2e18 before");
        assertEq(logBaseBefore, 2e18, "should be 2e18 before");
        assertEq(vectorOfCurveBefore, 0, "should be 0 before");

        assertEq(pwTokenModifierAfter, 2e18, "should be 2e18 after");
        assertEq(logBaseAfter, 2e18, "should be 2e18 after");
        assertEq(vectorOfCurveAfter, 0, "should be 0 after");
    }

    function testShouldNotBeAbleToSetAccountPowerUpModifiersWhenLpTokenZeroAddress0() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        address[] memory lpTokens = new address[](1);
        lpTokens[0] = address(0);

        LiquidityMiningTypes.PoolPowerUpModifier[]
            memory modifiers = new LiquidityMiningTypes.PoolPowerUpModifier[](1);
        modifiers[0].logBase = 3e10;
        modifiers[0].pwTokenModifier = 0;
        modifiers[0].vectorOfCurve = 2e9;

        (
            uint256 pwTokenModifierBefore,
            uint256 logBaseBefore,
            uint256 vectorOfCurveBefore
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.WRONG_ADDRESS));
        LiquidityMiningInternal(liquidityMining).setPoolPowerUpModifiers(lpTokens, modifiers);

        // then
        (
            uint256 pwTokenModifierAfter,
            uint256 logBaseAfter,
            uint256 vectorOfCurveAfter
        ) = LiquidityMiningInternal(liquidityMining).getPoolPowerUpModifiers(lpTokens[0]);

        assertEq(pwTokenModifierBefore, 2e18, "should be 2e18 before");
        assertEq(logBaseBefore, 2e18, "should be 2e18 before");
        assertEq(vectorOfCurveBefore, 0, "should be 0 before");

        assertEq(pwTokenModifierAfter, 2e18, "should be 2e18 after");
        assertEq(logBaseAfter, 2e18, "should be 2e18 after");
        assertEq(vectorOfCurveAfter, 0, "should be 0 after");
    }
}
