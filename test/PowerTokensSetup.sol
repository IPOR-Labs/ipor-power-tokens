pragma solidity 0.8.17;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/mocks/tokens/MockStakedToken.sol";
import "../contracts/mocks/tokens/MockToken.sol";
import "../contracts/mocks/tokens/MockLpToken.sol";
import "../contracts/tokens/PowerToken.sol";
import "../contracts/mining/LiquidityMining.sol";

contract PowerTokensSetup is Test {
    MockStakedToken public stakedToken;
    MockToken public dai;
    MockToken public usdc;
    MockToken public usdt;
    MockLpToken public lpDai;
    MockLpToken public lpUsdc;
    MockLpToken public lpUsdt;

    PowerToken public powerToken;
    LiquidityMining public liquidityMining;

    address private _owner;

    constructor(address owner) {
        _owner = owner;
        stakedToken = _createStakedToken(owner);
        dai = _createDai();
        usdc = _createUsdc();
        usdt = _createUsdt();
        lpDai = _createLpDai();
        lpUsdc = _createLpUsdc();
        lpUsdt = _createLpUsdt();
        powerToken = _createPowerToken();
        liquidityMining = _createLiquidityMining();

        _setupPowerToken();
    }

    function _createStakedToken(address owner) internal returns (MockStakedToken) {
        return new MockStakedToken("IPOR Token", "IPOR", owner);
    }

    function _createDai() internal returns (MockToken) {
        vm.prank(_owner);
        return new MockToken("Mocked DAI", "DAI", 1_000_000_000e18, 18);
    }

    function _createUsdc() internal returns (MockToken) {
        vm.prank(_owner);
        return new MockToken("Mocked USDC", "USDC", 1_000_000_000e6, 6);
    }

    function _createUsdt() internal returns (MockToken) {
        vm.prank(_owner);
        return new MockToken("Mocked USDT", "USDT", 1_000_000_000e6, 6);
    }

    function _createLpDai() internal returns (MockLpToken) {
        vm.startPrank(_owner);
        MockLpToken lpToken = new MockLpToken("LP DAI", "lpDai", address(dai));
        lpToken.setJoseph(_owner);
        vm.stopPrank();
        return lpToken;
    }

    function _createLpUsdc() internal returns (MockLpToken) {
        vm.startPrank(_owner);
        MockLpToken lpToken = new MockLpToken("LP USDC", "lpUsdc", address(usdc));
        lpToken.setJoseph(_owner);
        vm.stopPrank();
        return lpToken;
    }

    function _createLpUsdt() internal returns (MockLpToken) {
        vm.startPrank(_owner);
        MockLpToken lpToken = new MockLpToken("LP USDT", "lpUsdt", address(usdt));
        lpToken.setJoseph(_owner);
        vm.stopPrank();
        return lpToken;
    }

    function _createPowerToken() internal returns (PowerToken) {
        PowerToken implementation = new PowerToken();

        vm.prank(_owner);
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature("initialize(address)", address(stakedToken))
        );
        return PowerToken(address(proxy));
    }

    function _createLiquidityMining() internal returns (LiquidityMining) {
        LiquidityMining implementation = new LiquidityMining();

        vm.prank(_owner);
        address[] memory lpTokewns = new address[](3);
        lpTokewns[0] = address(lpDai);
        lpTokewns[1] = address(lpUsdc);
        lpTokewns[2] = address(lpUsdt);
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSignature(
                "initialize(address[],address,address)",
                lpTokewns,
                address(powerToken),
                address(stakedToken)
            )
        );
        return LiquidityMining(address(proxy));
    }

    function _setupPowerToken() internal {
        vm.prank(_owner);
        powerToken.setLiquidityMining(address(liquidityMining));
    }
}
