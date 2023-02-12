// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "../PowerTokensSetup.sol";
import "../TestCommons.sol";
import "../../contracts/tokens/PowerToken.sol";
import "../../contracts/mining/LiquidityMining.sol";
import "../../contracts/interfaces/types/LiquidityMiningTypes.sol";
import "../../contracts/mocks/tokens/MockLpToken.sol";
import "../../contracts/mocks/tokens/MockStakedToken.sol";

contract LiquidityMiningUpgradesTest is TestCommons {
    uint256 internal constant _USER_IP_TOKEN_AMOUNT = 1000000000000000000000;
    uint256 internal constant _USER_IPOR_TOKEN_AMOUNT = 100000000000000000000;

    address internal _admin = 0xD92E9F039E4189c342b4067CC61f5d063960D248;
    address internal _operationalWallet = 0xB7bE82790d40258Fd028BEeF2f2007DC044F3459;
    address internal _IPOR = 0x1e4746dC744503b53b4A082cB3607B169a289090;
    address internal _josephProxyDAI = 0x086d4daab14741b195deE65aFF050ba184B65045;
    address internal _powerTokenProxy = 0xD72915B95c37ae1B16B926f85ad61ccA6395409F;
    address internal _liquidityMiningProxy = 0xCC3Fc4C9Ba7f8b8aA433Bc586D390A70560FF366;
    address internal _ipUSDT = 0x9Bd2177027edEE300DC9F1fb88F24DB6e5e1edC6;
    address internal _ipUSDC = 0x7c0e72f431FD69560D951e4C04A4de3657621a88;
    address internal _ipDAI = 0x8537b194BFf354c4738E9F3C81d67E3371DaDAf8;

    address internal _me = 0x950F6ab01d31e88d5f19D71E40408C2e28FBc586;

    PowerToken internal _powerToken;
    LiquidityMining internal _liquidityMining;

    address internal _userOne;
    address internal _userTwo;
    address internal _userThree;

    function setUp() public {
        _userOne = _getUserAddress(1);
        _userTwo = _getUserAddress(2);
        _userThree = _getUserAddress(3);

        _powerToken = PowerToken(_powerTokenProxy);
        _liquidityMining = LiquidityMining(_liquidityMiningProxy);

        vm.startPrank(_josephProxyDAI);
        MockLpToken(_ipDAI).mint(_userOne, _USER_IP_TOKEN_AMOUNT);
        MockLpToken(_ipDAI).mint(_userTwo, _USER_IP_TOKEN_AMOUNT);
        MockLpToken(_ipDAI).mint(_userThree, _USER_IP_TOKEN_AMOUNT);
        vm.stopPrank();

        vm.startPrank(_operationalWallet);
        MockStakedToken(_IPOR).transfer(_userOne, _USER_IPOR_TOKEN_AMOUNT);
        MockStakedToken(_IPOR).transfer(_userTwo, _USER_IPOR_TOKEN_AMOUNT);
        MockStakedToken(_IPOR).transfer(_userThree, _USER_IPOR_TOKEN_AMOUNT);
        vm.stopPrank();

        vm.startPrank(_userOne);
        MockLpToken(_ipDAI).approve(_liquidityMiningProxy, _USER_IP_TOKEN_AMOUNT);
        MockLpToken(_IPOR).approve(_powerTokenProxy, _USER_IPOR_TOKEN_AMOUNT);
        vm.stopPrank();

        vm.startPrank(_userTwo);
        MockLpToken(_ipDAI).approve(_liquidityMiningProxy, _USER_IP_TOKEN_AMOUNT);
        MockLpToken(_IPOR).approve(_powerTokenProxy, _USER_IPOR_TOKEN_AMOUNT);
        vm.stopPrank();

        vm.startPrank(_userThree);
        MockLpToken(_ipDAI).approve(_liquidityMiningProxy, _USER_IP_TOKEN_AMOUNT);
        MockLpToken(_IPOR).approve(_powerTokenProxy, _USER_IPOR_TOKEN_AMOUNT);
        vm.stopPrank();
    }

    function testUpgradeChangeCurve() public {
        if (_liquidityMining.getVersion() == 1) {
            // given
            address[] memory lpTokens = new address[](1);
            lpTokens[0] = _ipDAI;

            uint256[] memory pwTokenAmounts = new uint256[](1);
            pwTokenAmounts[0] = _USER_IPOR_TOKEN_AMOUNT;

            vm.startPrank(_userOne);
            _powerToken.stake(_USER_IPOR_TOKEN_AMOUNT);
            _powerToken.delegateToLiquidityMining(lpTokens, pwTokenAmounts);
            _liquidityMining.stake(_ipDAI, _USER_IP_TOKEN_AMOUNT);
            vm.stopPrank();

            vm.roll(block.number + 1000);

            uint256 userOneRewardsBefore = _liquidityMining.calculateAccountRewards(
                _userOne,
                _ipDAI
            );
            uint256 userTwoRewardsBefore = _liquidityMining.calculateAccountRewards(
                _userTwo,
                _ipDAI
            );

            LiquidityMining newImplementation = new LiquidityMining();

            uint256 userOnePwTokenAmountBefore = _powerToken.balanceOf(_userOne);
            uint256 userTwoPwTokenAmountBefore = _powerToken.balanceOf(_userTwo);

            //when
            vm.prank(_admin);
            _liquidityMining.upgradeTo(address(newImplementation));

            vm.startPrank(_userTwo);
            _powerToken.stake(_USER_IPOR_TOKEN_AMOUNT);
            _powerToken.delegateToLiquidityMining(lpTokens, pwTokenAmounts);
            _liquidityMining.stake(_ipDAI, _USER_IP_TOKEN_AMOUNT);
            vm.stopPrank();

            vm.roll(block.number + 1000);

            uint256 userOneRewardsAfter = _liquidityMining.calculateAccountRewards(
                _userOne,
                _ipDAI
            );

            uint256 userTwoRewardsAfter = _liquidityMining.calculateAccountRewards(
                _userTwo,
                _ipDAI
            );

            vm.prank(_userOne);
            _liquidityMining.unstake(_ipDAI, _USER_IP_TOKEN_AMOUNT);

            vm.prank(_userTwo);
            _liquidityMining.unstake(_ipDAI, _USER_IP_TOKEN_AMOUNT);

            uint256 userOnePwTokenAmountAfter = _powerToken.balanceOf(_userOne);

            uint256 userTwoPwTokenAmountAfter = _powerToken.balanceOf(_userTwo);

            //then
            assertGt(userOnePwTokenAmountAfter, userOnePwTokenAmountBefore);
            assertGt(userTwoPwTokenAmountAfter, userTwoPwTokenAmountBefore);

            assertGt(userOneRewardsAfter, userOneRewardsBefore);
            assertGt(userTwoRewardsAfter, userTwoRewardsBefore);
        }
    }
}
