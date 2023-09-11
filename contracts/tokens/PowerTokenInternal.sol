// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interfaces/types/PowerTokenTypes.sol";
import "../interfaces/IGovernanceToken.sol";
import "../interfaces/IPowerTokenInternal.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/IProxyImplementation.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/math/MathOperation.sol";
import "../libraries/ContractValidator.sol";
import "../security/MiningOwnableUpgradeable.sol";
import "../security/PauseManager.sol";

abstract contract PowerTokenInternal is
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    MiningOwnableUpgradeable,
    IPowerTokenInternal,
    IProxyImplementation
{
    using ContractValidator for address;

    bytes32 internal constant _GOVERNANCE_TOKEN_ID =
        0xdba05ed67d0251facfcab8345f27ccd3e72b5a1da8cebfabbcccf4316e6d053c;

    /// @dev 14 days
    uint256 public constant COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;

    address public immutable routerAddress;
    address internal immutable _governanceToken;

    // @dev @deprecated
    address internal _liquidityMiningDeprecated;
    // @dev @deprecated use _STAKED_TOKEN_ADDRESS instead
    address internal _governanceTokenDeprecated;
    // @deprecated field is deprecated
    address internal _pauseManagerDeprecated;

    /// @dev account address -> base amount, represented with 18 decimals
    mapping(address => uint256) internal _baseBalance;

    /// @dev balance of Power Token delegated to LiquidityMining, information per account, balance represented with 18 decimals
    mapping(address => uint256) internal _delegatedToLiquidityMiningBalance;

    // account address -> {endTimestamp, amount}
    mapping(address => PowerTokenTypes.PwTokenCooldown) internal _cooldowns;

    uint256 internal _baseTotalSupply;
    uint256 internal _unstakeWithoutCooldownFee;

    constructor(address routerAddressInput, address governanceTokenInput) {
        _governanceToken = governanceTokenInput.checkAddress();
        routerAddress = routerAddressInput.checkAddress();
        require(
            IGovernanceToken(governanceTokenInput).getContractId() == _GOVERNANCE_TOKEN_ID,
            Errors.WRONG_CONTRACT_ID
        );
    }

    /// @dev Throws an error if called by any account other than the pause guardian.
    modifier onlyPauseGuardian() {
        require(PauseManager.isPauseGuardian(msg.sender), Errors.CALLER_NOT_GUARDIAN);
        _;
    }

    modifier onlyRouter() {
        require(msg.sender == routerAddress, Errors.CALLER_NOT_ROUTER);
        _;
    }

    function initialize() public initializer {
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __UUPSUpgradeable_init_unchained();

        _unstakeWithoutCooldownFee = 1e17 * 5;
    }

    function getVersion() external pure override returns (uint256) {
        return 2_001;
    }

    function totalSupplyBase() external view override returns (uint256) {
        return _baseTotalSupply;
    }

    function calculateExchangeRate() external view override returns (uint256) {
        return _calculateInternalExchangeRate();
    }

    function getGovernanceToken() external view override returns (address) {
        return _governanceToken;
    }

    function setUnstakeWithoutCooldownFee(
        uint256 unstakeWithoutCooldownFee
    ) external override onlyOwner {
        require(unstakeWithoutCooldownFee <= 1e18, Errors.UNSTAKE_WITHOUT_COOLDOWN_FEE_IS_TO_HIGH);
        _unstakeWithoutCooldownFee = unstakeWithoutCooldownFee;
        emit UnstakeWithoutCooldownFeeChanged(unstakeWithoutCooldownFee);
    }

    function pause() external override onlyPauseGuardian {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function grantAllowanceForRouter(address erc20Token) external override onlyOwner {
        require(erc20Token != address(0), Errors.WRONG_ADDRESS);

        IERC20(erc20Token).approve(routerAddress, type(uint256).max);
        emit AllowanceGranted(msg.sender, erc20Token);
    }

    function revokeAllowanceForRouter(address erc20Token) external override onlyOwner {
        require(erc20Token != address(0), Errors.WRONG_ADDRESS);

        IERC20(erc20Token).approve(routerAddress, 0);
        emit AllowanceRevoked(erc20Token, routerAddress);
    }

    function getImplementation() external view override returns (address) {
        return StorageSlotUpgradeable.getAddressSlot(_IMPLEMENTATION_SLOT).value;
    }

    function addPauseGuardians(address[] calldata guardians) external onlyOwner {
        PauseManager.addPauseGuardians(guardians);
    }

    function removePauseGuardians(address[] calldata guardians) external onlyOwner {
        PauseManager.removePauseGuardians(guardians);
    }

    function isPauseGuardian(address guardian) external view returns (bool) {
        return PauseManager.isPauseGuardian(guardian);
    }

    function _calculateInternalExchangeRate() internal view returns (uint256) {
        uint256 baseTotalSupply = _baseTotalSupply;

        if (baseTotalSupply == 0) {
            return 1e18;
        }

        uint256 balanceOfGovernanceToken = IERC20Upgradeable(_governanceToken).balanceOf(
            address(this)
        );

        if (balanceOfGovernanceToken == 0) {
            return 1e18;
        }

        return MathOperation.division(balanceOfGovernanceToken * 1e18, baseTotalSupply);
    }

    function _calculateAmountWithCooldownFeeSubtracted(
        uint256 baseAmount
    ) internal view returns (uint256) {
        return MathOperation.division((1e18 - _unstakeWithoutCooldownFee) * baseAmount, 1e18);
    }

    function _calculateBaseAmountToPwToken(
        uint256 baseAmount,
        uint256 exchangeRate
    ) internal pure returns (uint256) {
        return MathOperation.division(baseAmount * exchangeRate, 1e18);
    }

    function _getAvailablePwTokenAmount(
        address account,
        uint256 exchangeRate
    ) internal view returns (uint256) {
        return
            _calculateBaseAmountToPwToken(_baseBalance[account], exchangeRate) -
            _delegatedToLiquidityMiningBalance[account] -
            _cooldowns[account].pwTokenAmount;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return
            _calculateBaseAmountToPwToken(_baseBalance[account], _calculateInternalExchangeRate());
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
