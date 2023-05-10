// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../TestCommons.sol";
import "../PowerTokensSystem.sol";
import "../../contracts/interfaces/types/PowerTokenTypes.sol";
import "../../contracts/interfaces/ILiquidityMiningLens.sol";
import "../../contracts/interfaces/IPowerTokenLens.sol";
import "../../contracts/tokens/PowerTokenInternalV2.sol";

contract LiquidityMiningConfigurationTest is TestCommons {
    PowerTokensSystem internal _powerTokensSystem;

    function setUp() external {
        _powerTokensSystem = new PowerTokensSystem();
    }

    function testShouldDeployContractWithoutAssets() external {
        // given
        address[] memory lpTokewns = new address[](0);

        // when
        LiquidityMiningV2 implementation = new LiquidityMiningV2(_powerTokensSystem.dao());
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature(
                "initialize(address[],address,address)",
                lpTokewns,
                _powerTokensSystem.powerToken(),
                _powerTokensSystem.iporToken()
            )
        );

        // then

        assertTrue(address(proxy) != address(0), "Proxy address should not be zero");
    }

    function testShouldNotBeAbleToDeployContractWhenPowerTokenAddressIsZero() external {
        // given
        address[] memory lpTokewns = new address[](0);
        address powerToken = address(0x00);
        address iporToken = _powerTokensSystem.iporToken();

        // when
        LiquidityMiningV2 implementation = new LiquidityMiningV2(_powerTokensSystem.dao());
        vm.expectRevert(bytes(Errors.WRONG_ADDRESS));
        new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature(
                "initialize(address[],address,address)",
                lpTokewns,
                powerToken,
                iporToken
            )
        );
    }

    function testShouldNotBeAbleToDeployContractWhenAddressIsNotStakedToken() external {
        // given
        address[] memory lpTokewns = new address[](0);
        address powerToken = _powerTokensSystem.powerToken();
        address iporToken = _powerTokensSystem.powerToken();
        // not staked token

        // when
        LiquidityMiningV2 implementation = new LiquidityMiningV2(_powerTokensSystem.dao());
        vm.expectRevert(bytes(Errors.WRONG_CONTRACT_ID));
        new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature(
                "initialize(address[],address,address)",
                lpTokewns,
                powerToken,
                iporToken
            )
        );
    }

    function testShouldDeployContractWith3Assets() external {
        // given
        // when
        PowerTokensSystem powerTokensSystem = new PowerTokensSystem();
        address liquidityMining = powerTokensSystem.liquidityMining();

        // then

        assertTrue(
            LiquidityMiningInternalV2(liquidityMining).isLpTokenSupported(
                powerTokensSystem.lpDai()
            ),
            "should support lpDAI"
        );
        assertTrue(
            LiquidityMiningInternalV2(liquidityMining).isLpTokenSupported(
                powerTokensSystem.lpUsdc()
            ),
            "should support lpUSDC"
        );
        assertTrue(
            LiquidityMiningInternalV2(liquidityMining).isLpTokenSupported(
                powerTokensSystem.lpUsdt()
            ),
            "should support lpUSDT"
        );
    }

    function testShouldDeployContractWith1Assets() external {
        // given
        address[] memory lpTokewns = new address[](1);
        lpTokewns[0] = _powerTokensSystem.lpDai();

        // when
        LiquidityMiningV2 implementation = new LiquidityMiningV2(_powerTokensSystem.dao());
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature(
                "initialize(address[],address,address)",
                lpTokewns,
                _powerTokensSystem.powerToken(),
                _powerTokensSystem.iporToken()
            )
        );

        // then

        assertTrue(address(proxy) != address(0), "Proxy address should not be zero");
        assertTrue(
            LiquidityMiningInternalV2(address(proxy)).isLpTokenSupported(
                _powerTokensSystem.lpDai()
            ),
            "should support lpDAI"
        );
    }

    function testShouldBeAbleToAddNewAssetByOwner() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address dai = _powerTokensSystem.dai();

        bool isSupportedBefore = LiquidityMiningInternalV2(liquidityMining).isLpTokenSupported(dai);

        // when
        vm.prank(owner);
        LiquidityMiningInternalV2(liquidityMining).newSupportedLpToken(dai);

        // then
        bool isSupportedAfter = LiquidityMiningInternalV2(liquidityMining).isLpTokenSupported(dai);

        assertTrue(!isSupportedBefore, "should not support DAI before");
        assertTrue(isSupportedAfter, "should support DAI after");
    }

    function testShouldNotBeAbleToAddNewAssetByRandomUser() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address user = _getUserAddress(10);
        address dai = _powerTokensSystem.dai();

        bool isSupportedBefore = LiquidityMiningInternalV2(liquidityMining).isLpTokenSupported(dai);

        // when
        vm.prank(user);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        LiquidityMiningInternalV2(liquidityMining).newSupportedLpToken(dai);

        // then
        bool isSupportedAfter = LiquidityMiningInternalV2(liquidityMining).isLpTokenSupported(dai);

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

    function testShouldBeAbleToPauseContractWhenOwnerInitialDeployment() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(owner);
        LiquidityMiningInternalV2(liquidityMining).pause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(!isPausedBefore, "should not be paused before");
        assertTrue(isPausedAfter, "should be paused after");
    }

    function testShouldBeAbleToPauseContractWhenPauseManagerChanged() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address newPauseManager = _getUserAddress(10);

        vm.prank(owner);
        ILiquidityMiningInternalV2(liquidityMining).setPauseManager(newPauseManager);

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(newPauseManager);
        LiquidityMiningInternalV2(liquidityMining).pause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(!isPausedBefore, "should not be paused before");
        assertTrue(isPausedAfter, "should be paused after");
    }

    function testShouldNotBeAbleToPauseContractWhenInitialPauseManagerChanged() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address newPauseManager = _getUserAddress(10);

        vm.prank(owner);
        ILiquidityMiningInternalV2(liquidityMining).setPauseManager(newPauseManager);

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(owner);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        LiquidityMiningInternalV2(liquidityMining).pause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(!isPausedBefore, "should not be paused before");
        assertTrue(!isPausedAfter, "should not be paused after");
    }

    function testShouldBeAbleToUnpauseContractWhenOwnerInitialDeployment() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();

        vm.prank(owner);
        LiquidityMiningInternalV2(liquidityMining).pause();

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(owner);
        LiquidityMiningInternalV2(liquidityMining).unpause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(isPausedBefore, "should be paused before");
        assertTrue(!isPausedAfter, "should not be paused after");
    }

    function testShouldBeAbleToUnpauseContractWhenPauseManagerChanged() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address newPauseManager = _getUserAddress(10);
        vm.prank(owner);
        LiquidityMiningInternalV2(liquidityMining).pause();

        vm.prank(owner);
        ILiquidityMiningInternalV2(liquidityMining).setPauseManager(newPauseManager);

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(newPauseManager);
        LiquidityMiningInternalV2(liquidityMining).unpause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(isPausedBefore, "should be paused before");
        assertTrue(!isPausedAfter, "should not be paused after");
    }

    function testShouldNotBeAbleToUnpauseContractWhenNoOwner() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address user = _getUserAddress(10);

        vm.prank(owner);
        LiquidityMiningInternalV2(liquidityMining).pause();

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(user);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        LiquidityMiningInternalV2(liquidityMining).unpause();

        // then
        bool isPausedAfter = PausableUpgradeable(liquidityMining).paused();

        assertTrue(isPausedBefore, "should be paused before");
        assertTrue(isPausedAfter, "should be paused after");
    }

    function testShouldNotBeAbleToUnpauseContractWhenInitialPauseManagerChanged() external {
        // given
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address owner = _powerTokensSystem.owner();
        address newPauseManager = _getUserAddress(10);

        vm.prank(owner);
        LiquidityMiningInternalV2(liquidityMining).pause();

        bool isPausedBefore = PausableUpgradeable(liquidityMining).paused();

        // when
        vm.prank(owner);
        ILiquidityMiningInternalV2(liquidityMining).setPauseManager(newPauseManager);

        vm.prank(owner);
        vm.expectRevert(bytes(Errors.CALLER_NOT_PAUSE_MANAGER));
        LiquidityMiningInternalV2(liquidityMining).unpause();

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
        ).balanceOfDelegatedPwToken(userOne, lpTokens);

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
        updateLpToken[0].onBehalfOf = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMiningV2(liquidityMining).addLpTokens(updateLpToken);
    }

    function testShouldNotBeAbleToRemoveLpTokensWhenNotRouter() external {
        // given
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdateLpToken[](1);
        updateLpToken[0].lpToken = _powerTokensSystem.lpDai();
        updateLpToken[0].lpTokenAmount = 100;
        updateLpToken[0].onBehalfOf = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMiningV2(liquidityMining).removeLpTokens(updateLpToken);
    }

    function testShouldNotBeAbleToAddPwTokensWhenNotRouter() external {
        // given
        LiquidityMiningTypes.UpdatePwToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdatePwToken[](1);
        updateLpToken[0].lpToken = _powerTokensSystem.lpDai();
        updateLpToken[0].pwTokenAmount = 100;
        updateLpToken[0].onBehalfOf = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMiningV2(liquidityMining).addPwTokens(updateLpToken);
    }

    function testShouldNotBeAbleToRemovePwTokensWhenNotRouter() external {
        // given
        LiquidityMiningTypes.UpdatePwToken[]
            memory updateLpToken = new LiquidityMiningTypes.UpdatePwToken[](1);
        updateLpToken[0].lpToken = _powerTokensSystem.lpDai();
        updateLpToken[0].pwTokenAmount = 100;
        updateLpToken[0].onBehalfOf = address(this);

        address liquidityMining = _powerTokensSystem.liquidityMining();

        // when
        vm.expectRevert(bytes(Errors.CALLER_NOT_ROUTER));
        ILiquidityMiningV2(liquidityMining).removePwTokens(updateLpToken);
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
        LiquidityMiningInternalV2(liquidityMining).pause();

        vm.prank(userOne);
        IStakeService(router).stakeIporToken(userOne, 1_000e18);

        // when
        vm.prank(userOne);
        vm.expectRevert(bytes("Pausable: paused"));
        IFlowsService(router).delegate(lpTokens, pwTokenAmounts);
    }

    function testShouldNotBeAbleToDelegatePwTokenWhenLpTokenIsNotSupported() external {
        // given
        address[] memory lpTokens = new address[](1);
        lpTokens[0] = _powerTokensSystem.dai();
        uint256[] memory pwTokenAmounts = new uint256[](1);
        pwTokenAmounts[0] = 1_000e18;
        address router = _powerTokensSystem.router();
        address liquidityMining = _powerTokensSystem.liquidityMining();
        address userOne = _getUserAddress(10);
        address owner = _powerTokensSystem.owner();
        _powerTokensSystem.transferIporToken(userOne, 10_000e18);
        _powerTokensSystem.approveRouter(userOne);

        vm.prank(userOne);
        IStakeService(router).stakeIporToken(userOne, 1_000e18);

        // when
        vm.prank(userOne);
        vm.expectRevert(bytes(Errors.LP_TOKEN_NOT_SUPPORTED));
        IFlowsService(router).delegate(lpTokens, pwTokenAmounts);
    }
}