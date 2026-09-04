// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../contracts/mining/ethereum/LiquidityMiningEthereum.sol";
import "../../contracts/interfaces/ILiquidityMiningInternal.sol";
import "../../contracts/interfaces/ILiquidityMiningLens.sol";
import "../../contracts/interfaces/IPowerTokenStakeService.sol";
import "../../contracts/libraries/errors/Errors.sol";

/// @notice IL-8156 / IL-8155 (Immunefi 2026-09-01): mainnet fork at the block where the victim's full ipDAI
/// unstake reverts with PT_711. Upgrades the live LiquidityMining proxy to this implementation, reconciles the
/// three legacy pools atomically (`upgradeToAndCall`) and proves the victim can withdraw all principal.
contract LiquidityMiningReconcileIL8156Test is Test {
    uint256 internal constant FORK_BLOCK = 25_881_574;

    address internal constant LM = 0xCC3Fc4C9Ba7f8b8aA433Bc586D390A70560FF366;
    address internal constant TIMELOCK_OWNER = 0xD92E9F039E4189c342b4067CC61f5d063960D248;
    address internal constant ROUTER = 0x16d104009964e694761C0bf09d7Be49B7E3C26fd;
    address internal constant VICTIM = 0xFA8a4aD4473CbE8A61552E4B05E58dB71050110c;

    address internal constant IP_DAI = 0x8537b194BFf354c4738E9F3C81d67E3371DaDAf8;
    address internal constant IP_USDC = 0x7c0e72f431FD69560D951e4C04A4de3657621a88;
    address internal constant IP_USDT = 0x9Bd2177027edEE300DC9F1fb88F24DB6e5e1edC6;

    /// @dev deficit = sum(round(powerUp_i * lpTokenBalance_i / 1e18)) - aggregatedPowerUp, measured at FORK_BLOCK
    /// with ipor-immunefi-reports/.../tools/apu_bisect.py (constant since block 16627821, see IL-8156)
    uint256 internal constant DELTA_DAI = 5_190_306_735_875_255_544_747;
    uint256 internal constant DELTA_USDC = 28_454_371_127_407_923_331_918;
    uint256 internal constant DELTA_USDT = 638_630_366_113_229_344_754;

    uint256 internal constant VICTIM_IP_DAI_BALANCE = 679_599_240_982_306_680_596;

    function setUp() public {
        vm.createSelectFork(vm.envString("ETHEREUM_PROVIDER_URL"), FORK_BLOCK);
    }

    /// @dev proves the regression test reaches the defective code: without the upgrade the call reverts PT_711
    function testShouldRevertPT711BeforeUpgrade() external {
        assertEq(ILiquidityMiningInternal(LM).getVersion(), 2_002, "live version");

        vm.prank(VICTIM);
        vm.expectRevert(bytes(Errors.AGGREGATE_POWER_UP_COULD_NOT_BE_NEGATIVE));
        IPowerTokenStakeService(ROUTER).unstakeLpTokensFromLiquidityMining(
            VICTIM,
            _one(IP_DAI),
            _oneAmount(VICTIM_IP_DAI_BALANCE)
        );
    }

    function testShouldUnstakeVictimFullBalanceAfterUpgradeAndReconcile() external {
        // given
        uint256[3] memory aggregatesBefore = _aggregates();
        uint256 victimIpDaiBefore = IERC20(IP_DAI).balanceOf(VICTIM);

        // when: upgrade + reconcile in one tx from the timelock (owner)
        _upgradeAndReconcile();

        // then: implementation swapped, reconcile applied, invariant restored on all three pools
        assertEq(ILiquidityMiningInternal(LM).getVersion(), 2_003, "version bumped");
        uint256[3] memory aggregatesAfter = _aggregates();
        assertEq(aggregatesAfter[0], aggregatesBefore[0] + DELTA_DAI, "ipDAI aggregate");
        assertEq(aggregatesAfter[1], aggregatesBefore[1] + DELTA_USDC, "ipUSDC aggregate");
        assertEq(aggregatesAfter[2], aggregatesBefore[2] + DELTA_USDT, "ipUSDT aggregate");
        assertEq(aggregatesAfter[0], _sumContributions(IP_DAI, _accountsDai()), "ipDAI invariant");
        assertEq(aggregatesAfter[1], _sumContributions(IP_USDC, _accountsUsdc()), "ipUSDC invariant");
        assertEq(aggregatesAfter[2], _sumContributions(IP_USDT, _accountsUsdt()), "ipUSDT invariant");

        // and: the victim's full unstake now succeeds
        vm.prank(VICTIM);
        IPowerTokenStakeService(ROUTER).unstakeLpTokensFromLiquidityMining(
            VICTIM,
            _one(IP_DAI),
            _oneAmount(VICTIM_IP_DAI_BALANCE)
        );

        assertEq(
            IERC20(IP_DAI).balanceOf(VICTIM) - victimIpDaiBefore,
            VICTIM_IP_DAI_BALANCE,
            "victim received all ipDAI principal"
        );
        assertEq(_account(VICTIM, IP_DAI).lpTokenBalance, 0, "victim lp balance zeroed");
        assertEq(
            _aggregate(IP_DAI),
            _sumContributions(IP_DAI, _accountsDai()),
            "ipDAI invariant still holds after the unstake"
        );
    }

    function testShouldUnstakeEveryActiveAccountInFullAfterUpgrade() external {
        // given
        _upgradeAndReconcile();

        // when / then: every active staker on the three legacy pools can exit in full
        _unstakeAll(IP_DAI, _accountsDai());
        _unstakeAll(IP_USDC, _accountsUsdc());
        _unstakeAll(IP_USDT, _accountsUsdt());

        assertEq(_aggregate(IP_DAI), 0, "ipDAI drained to 0");
        assertEq(_aggregate(IP_USDC), 0, "ipUSDC drained to 0");
        assertEq(_aggregate(IP_USDT), 0, "ipUSDT drained to 0");
    }

    function testShouldNotAllowSecondReconcile() external {
        _upgradeAndReconcile();

        vm.prank(TIMELOCK_OWNER);
        vm.expectRevert("Initializable: contract is already initialized");
        ILiquidityMiningInternal(LM).reconcileAggregatedPowerUp(_one(IP_DAI), _oneAmount(1));
    }

    // ---------------------------------------------------------------------
    // helpers
    // ---------------------------------------------------------------------

    function _upgradeAndReconcile() internal {
        (address lpStEth, address ethUsdOracle, address lpWeEth, address weEth) = LiquidityMiningEthereum(LM)
            .getConfiguration();
        address router = LiquidityMiningEthereum(LM).routerAddress();
        assertEq(router, ROUTER, "router wired into the live LM");

        LiquidityMiningEthereum implementation = new LiquidityMiningEthereum(
            router,
            lpStEth,
            ethUsdOracle,
            lpWeEth,
            weEth
        );

        address[] memory pools = new address[](3);
        pools[0] = IP_DAI;
        pools[1] = IP_USDC;
        pools[2] = IP_USDT;
        uint256[] memory deltas = new uint256[](3);
        deltas[0] = DELTA_DAI;
        deltas[1] = DELTA_USDC;
        deltas[2] = DELTA_USDT;

        vm.prank(TIMELOCK_OWNER);
        LiquidityMiningEthereum(LM).upgradeToAndCall(
            address(implementation),
            abi.encodeCall(ILiquidityMiningInternal.reconcileAggregatedPowerUp, (pools, deltas))
        );
    }

    function _unstakeAll(address pool, address[] memory accounts) internal {
        for (uint256 i; i < accounts.length; ++i) {
            uint256 staked = _account(accounts[i], pool).lpTokenBalance;
            if (staked == 0) continue;
            uint256 before = IERC20(pool).balanceOf(accounts[i]);
            vm.prank(accounts[i]);
            IPowerTokenStakeService(ROUTER).unstakeLpTokensFromLiquidityMining(
                accounts[i],
                _one(pool),
                _oneAmount(staked)
            );
            assertEq(IERC20(pool).balanceOf(accounts[i]) - before, staked, "full principal returned");
        }
    }

    function _aggregates() internal view returns (uint256[3] memory a) {
        a[0] = _aggregate(IP_DAI);
        a[1] = _aggregate(IP_USDC);
        a[2] = _aggregate(IP_USDT);
    }

    function _aggregate(address pool) internal view returns (uint256) {
        return
            ILiquidityMiningLens(ROUTER).getGlobalIndicatorsFromLiquidityMining(_one(pool))[0]
                .indicators
                .aggregatedPowerUp;
    }

    function _account(
        address account,
        address pool
    ) internal view returns (LiquidityMiningTypes.AccountRewardsIndicators memory) {
        return
            ILiquidityMiningLens(ROUTER).getAccountIndicatorsFromLiquidityMining(account, _one(pool))[0]
                .indicators;
    }

    function _sumContributions(address pool, address[] memory accounts) internal view returns (uint256 sum) {
        for (uint256 i; i < accounts.length; ++i) {
            LiquidityMiningTypes.AccountRewardsIndicators memory a = _account(accounts[i], pool);
            sum += (uint256(a.powerUp) * uint256(a.lpTokenBalance) + 5e17) / 1e18;
        }
    }

    function _one(address a) internal pure returns (address[] memory arr) {
        arr = new address[](1);
        arr[0] = a;
    }

    function _oneAmount(uint256 v) internal pure returns (uint256[] memory arr) {
        arr = new uint256[](1);
        arr[0] = v;
    }

    /// @dev accounts with a non-zero position on each pool at FORK_BLOCK (from apu_bisect.py)
    function _accountsDai() internal pure returns (address[] memory a) {
        a = new address[](12);
        a[0] = 0x172B64e148Ea2712EB4d3A649E7Ec6371aE9aE5c;
        a[1] = 0x37638583473dA092afb4cDA0226852793A8f929B;
        a[2] = 0x475cc2876e1FDB6462247275C3da8D29639c92D0;
        a[3] = 0x54dC6782d6fC5FC05f8486d365186FF25CC44BA7;
        a[4] = 0x62d51Fa08B15411D9429133aE5F224abf3867729;
        a[5] = 0x660Fb14ff18aB1197D4a65f7184a020FA78BbaD1;
        a[6] = 0x826e0BB2276271eFdF2a500597f37b94f6c153bA;
        a[7] = 0x997B1f297aCF5EFaD29E0c77a990b89e647eF5EF;
        a[8] = 0xA68CC3d71A63f16f908Bd4A7dC64Ff087d061134;
        a[9] = 0xb2A2c6aa214B7DD7bBCAE9B7d4Fc7F35800C34e0;
        a[10] = 0xd935E356ff5C69366975eC8a511E645ACE383De1;
        a[11] = 0xFA8a4aD4473CbE8A61552E4B05E58dB71050110c;
    }

    function _accountsUsdc() internal pure returns (address[] memory a) {
        a = new address[](49);
        a[0] = 0x0793f149EE392885F37033dc55e9f0DFFbb1BfEa;
        a[1] = 0x0CB5D3dC004b0c9E14D13ED9cC94c2fd219223Cb;
        a[2] = 0x16a8348DF50a76D43D00571E6cE50049ea2008f0;
        a[3] = 0x198E25EE2D88Ea6c5f750007bbb49a442C5F5210;
        a[4] = 0x19E284ff4701C93F0Cc20B4b42d99d977b76F612;
        a[5] = 0x22b908c2FeA7a1e6043FfcDBc77D660D4D326961;
        a[6] = 0x23A168451dC30d4Bc5ffC48a76548A1F5630a757;
        a[7] = 0x25bEda673690ecd0A8A64d35Ab228fC2E1C0048A;
        a[8] = 0x331fD302383438Ca79e1ab62F63eEC852D3EF9be;
        a[9] = 0x33C1071e2383C5a73c9FF0a1Bb679A95B5DA2dC0;
        a[10] = 0x3d35D17DEB3eB7614b6dCD97cAc94F9946f5fD32;
        a[11] = 0x3f3e0Ae84c4281c6eb38704a78A9088aA813EC3A;
        a[12] = 0x41477A57A8916237A8ff512bA3D9bF487D9cbb79;
        a[13] = 0x4AB88515Fd84289d8aaB1464753775e90695e944;
        a[14] = 0x4eB42444A471ED18beA4bD14b159bf45da24C740;
        a[15] = 0x55646aE85267f37CD719De515ac4df1bd441eDce;
        a[16] = 0x62d51Fa08B15411D9429133aE5F224abf3867729;
        a[17] = 0x6dc21467E2BbE9408c511db47234f46A9B58EbD1;
        a[18] = 0x744b71cBeE7b419562404b327ac7aE9ee01151cA;
        a[19] = 0x7671BF4EF7DD8B2cB162b4e780d3a3193CD0198f;
        a[20] = 0x776d4113cd053DC1B78Df6a679e993f6bAE64C4f;
        a[21] = 0x7ee9247b6199877F86703644c97784495549aC5E;
        a[22] = 0x826e0BB2276271eFdF2a500597f37b94f6c153bA;
        a[23] = 0x85536B6703C5daa7fED82a601e5600edB0d1D719;
        a[24] = 0x916AF1F7156E5aBeb49be7C13BffFE75baCc916b;
        a[25] = 0x938111E58981F105FbB810E7145601E694e71B0E;
        a[26] = 0x95b8D251F306D195E64811C03E503aD6Ac4E15Cc;
        a[27] = 0x9B79ADF6b0b1AE6d0B6b105a1F37CF178da2a7f9;
        a[28] = 0xabC32db1fe279335a18D886537AaDa08610DC3A0;
        a[29] = 0xb0Cb60e86Fb11a9Eb21FecC3264A85fE44Bf7B47;
        a[30] = 0xb4ffb0f4e1e79351a27890f651ad5E6696E037D1;
        a[31] = 0xb7b9FAD3cE7B370A473510D629a1716C59F752B7;
        a[32] = 0xc402F3B327689B869C485b54788111ee7F3ea4B6;
        a[33] = 0xC7afE1e1155960Dcf4858d089746aE05699F7dAb;
        a[34] = 0xc917Fb8F4eD85712Ac3D57a5a7239eB48A6c3113;
        a[35] = 0xD2D4867b8886C0cfC3DE5CcD5203EC66C6183764;
        a[36] = 0xD3BbF61FAB71B616f084b03747Fb3c40cCF885f6;
        a[37] = 0xD5bAdb69910242660691934FeaDB3aB782BD1A38;
        a[38] = 0xD712e1BF0090691CFbA1f74CE2d99edb8170EB5d;
        a[39] = 0xd935E356ff5C69366975eC8a511E645ACE383De1;
        a[40] = 0xDa5F734C3c9A7c0370F1412a87BA2524e996c399;
        a[41] = 0xDD653e90808818DD7104268828196c85Dd0cf1d1;
        a[42] = 0xddf1826313435D606235908568cD4a69d526ca0E;
        a[43] = 0xF59b324Cb65258DC52B5DB8ac4f991286603B7e1;
        a[44] = 0xF6bA6b87BE3aB63493e4530d26117DB0d3F35d5C;
        a[45] = 0xf9938356c9033204CcDF9e0CdD2D3FaEbb16202e;
        a[46] = 0xfE00888ff72E11B00437A13FF96965b44cBF7D47;
        a[47] = 0xFfb63aB37914E97397bDe0B1A92211182928b480;
        a[48] = 0xfFDfE6db1B1CE1BB22c2C5740D261837E0Ed3360;
    }

    function _accountsUsdt() internal pure returns (address[] memory a) {
        a = new address[](21);
        a[0] = 0x1040F2a15f33d18B5b32aAC9A46E879130a5D7d1;
        a[1] = 0x1E75811Bc2712AE8eF9398A85180e1B4337CBB84;
        a[2] = 0x331fD302383438Ca79e1ab62F63eEC852D3EF9be;
        a[3] = 0x3d35D17DEB3eB7614b6dCD97cAc94F9946f5fD32;
        a[4] = 0x475cc2876e1FDB6462247275C3da8D29639c92D0;
        a[5] = 0x481fF0C27B153EecE4f4a5B2B8D71475D728C577;
        a[6] = 0x511432a0Ca35EA7a3874290872333b8b719280FC;
        a[7] = 0x574b70b8ab89074408b6eC5AdE051036681AF1B4;
        a[8] = 0x589cdAab7cffAED13a0E17ef7544583632ADc2Da;
        a[9] = 0x62d51Fa08B15411D9429133aE5F224abf3867729;
        a[10] = 0x738390bB2EC2b545F97A4A7158c79C5Ae595228e;
        a[11] = 0x7C2e52291F855c0b460367c2edfa218a55326d5D;
        a[12] = 0x8B4adB37B84050f3958D1a605790D83dF3a26fc7;
        a[13] = 0xA8372742a2c771a1592BA6CB09448A32DB987529;
        a[14] = 0xACb6836C638c7C02cb1e545260991bacEE3D306e;
        a[15] = 0xbec2027DD208e21E8D25821506562aA658c0eBd0;
        a[16] = 0xDAa7D75716F98fFb7fe33127eb4E198eCdc191AC;
        a[17] = 0xdF04EF4f8160150819cCbB7a1960577D7621eAf0;
        a[18] = 0xEb417bE70529D525485A9C71cE428166be86E8D2;
        a[19] = 0xf323092E459eb1eAd466f491D4c5029AE8199455;
        a[20] = 0xf987907D260547b9E0D75E830D8075608A648AE1;
    }

}
