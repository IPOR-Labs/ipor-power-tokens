// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/math/MathOperation.sol";
import "../interfaces/types/PowerTokenTypes.sol";
import "../interfaces/IStakedToken.sol";
import "../security/MiningOwnableUpgradeable.sol";
import "../interfaces/IPowerTokenInternal.sol";
import "../interfaces/ILiquidityMining.sol";

abstract contract PowerTokenInternal is
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    MiningOwnableUpgradeable,
    IPowerTokenInternal
{
    /// @dev 14 days
    uint256 public constant COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;
    address public immutable ROUTER_ADDRESS;

    bytes32 internal constant _STAKED_TOKEN_ID =
        0xdba05ed67d0251facfcab8345f27ccd3e72b5a1da8cebfabbcccf4316e6d053c;
    bytes32 internal constant _LIQUIDITY_MINING_ID =
        0x9b1f3aa590476fc9aa58d44ad1419ab53d34c344bd5ed46b12e4af7d27c38e06;
    // @dev @deprecated
    address internal _liquidityMining;
    // @dev @deprecated use _STAKED_TOKEN_ADDRESS instead
    address internal _stakedToken;
    address internal immutable _STAKED_TOKEN_ADDRESS;
    address internal _pauseManager;

    /// @dev account address -> base amount, represented with 18 decimals
    mapping(address => uint256) internal _baseBalance;

    /// @dev balance of Power Token delegated to LiquidityMining, information per account, balance represented with 18 decimals
    mapping(address => uint256) internal _delegatedToLiquidityMiningBalance;
    // account address -> {endTimestamp, amount}
    mapping(address => PowerTokenTypes.PwTokenCooldown) internal _cooldowns;
    uint256 internal _baseTotalSupply;
    uint256 internal _unstakeWithoutCooldownFee;

    constructor(address routerAddress, address stakedTokenAddress) {
        require(routerAddress != address(0), Errors.WRONG_ADDRESS);
        require(stakedTokenAddress != address(0), Errors.WRONG_ADDRESS);
        require(
            IStakedToken(stakedTokenAddress).getContractId() == _STAKED_TOKEN_ID,
            Errors.WRONG_CONTRACT_ID
        );
        _STAKED_TOKEN_ADDRESS = stakedTokenAddress;
        ROUTER_ADDRESS = routerAddress;
    }

    modifier onlyPauseManager() {
        require(_msgSender() == _pauseManager, Errors.CALLER_NOT_PAUSE_MANAGER);
        _;
    }

    modifier onlyRouter() {
        require(_msgSender() == ROUTER_ADDRESS, Errors.CALLER_NOT_ROUTER);
        _;
    }

    function initialize() public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();

        _pauseManager = _msgSender();
        _unstakeWithoutCooldownFee = 1e17 * 5;
    }

    function getVersion() external pure override returns (uint256) {
        return 2_001;
    }

    function totalSupplyBase() external view override returns (uint256) {
        return _baseTotalSupply;
    }

    function calculateExchangeRate() external view override returns (uint256) {
        return _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS);
    }

    function getStakedToken() external view override returns (address) {
        return _STAKED_TOKEN_ADDRESS;
    }

    function getPauseManager() external view override returns (address) {
        return _pauseManager;
    }

    function setUnstakeWithoutCooldownFee(uint256 unstakeWithoutCooldownFee)
        external
        override
        onlyOwner
    {
        require(
            unstakeWithoutCooldownFee <= 1e18,
            Errors.UNSTAKE_WITHOUT_COOLDOWN_FEE_IS_TO_HIGH
        );
        uint256 oldValue = _unstakeWithoutCooldownFee;
        _unstakeWithoutCooldownFee = unstakeWithoutCooldownFee;
        emit UnstakeWithoutCooldownFeeChanged(_msgSender(), oldValue, unstakeWithoutCooldownFee);
    }

    function setPauseManager(address newPauseManagerAddr) external override onlyOwner {
        require(newPauseManagerAddr != address(0), Errors.WRONG_ADDRESS);
        address oldPauseManagerAddr = _pauseManager;
        _pauseManager = newPauseManagerAddr;
        emit PauseManagerChanged(_msgSender(), oldPauseManagerAddr, newPauseManagerAddr);
    }

    function pause() external override onlyPauseManager {
        _pause();
    }

    function unpause() external override onlyPauseManager {
        _unpause();
    }

    function grantAllowanceForRouter(address erc20Token) external override onlyOwner {
        require(erc20Token != address(0), Errors.WRONG_ADDRESS);

        IERC20(erc20Token).approve(ROUTER_ADDRESS, type(uint256).max);
        emit AllowanceGranted(_msgSender(), erc20Token);
    }

    function revokeAllowanceForRouter(address erc20Token) external override onlyOwner {
        require(erc20Token != address(0), Errors.WRONG_ADDRESS);

        IERC20(erc20Token).approve(ROUTER_ADDRESS, 0);
        emit AllowanceRevoked(erc20Token, ROUTER_ADDRESS);
    }

    function _calculateInternalExchangeRate(address stakedTokenAddress)
        internal
        view
        returns (uint256)
    {
        uint256 baseTotalSupply = _baseTotalSupply;

        if (baseTotalSupply == 0) {
            return 1e18;
        }

        uint256 balanceOfStakedToken = IERC20Upgradeable(stakedTokenAddress).balanceOf(
            address(this)
        );

        if (balanceOfStakedToken == 0) {
            return 1e18;
        }

        return MathOperation.division(balanceOfStakedToken * 1e18, baseTotalSupply);
    }

    function _calculateAmountWithCooldownFeeSubtracted(uint256 baseAmount)
        internal
        view
        returns (uint256)
    {
        return
            MathOperation.division((1e18 - _unstakeWithoutCooldownFee) * baseAmount, 1e18);
    }

    function _calculateBaseAmountToPwToken(uint256 baseAmount, uint256 exchangeRate)
        internal
        pure
        returns (uint256)
    {
        return MathOperation.division(baseAmount * exchangeRate, 1e18);
    }

    function _getAvailablePwTokenAmount(address account, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return
            _calculateBaseAmountToPwToken(_baseBalance[account], exchangeRate) -
            _delegatedToLiquidityMiningBalance[account] -
            _cooldowns[account].pwTokenAmount;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return
            _calculateBaseAmountToPwToken(
                _baseBalance[account],
                _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS)
            );
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
