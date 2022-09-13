// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../interfaces/IPwIporTokenInternal.sol";
import "../interfaces/IPwIporToken.sol";
import "../interfaces/IJohn.sol";
import "../interfaces/types/PwIporTokenTypes.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/Constants.sol";
import "../libraries/math/IporMath.sol";
//TODO: remove at the end
import "hardhat/console.sol";

// TODO: Add tests for events
contract PwIporToken is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IporOwnableUpgradeable,
    IPwIporTokenInternal,
    IPwIporToken
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // 2 weeks
    uint256 public constant COOL_DOWN_IN_SECONDS = 2 * 7 * 24 * 60 * 60;

    address private _john;
    address private _iporToken;
    // account address -> amount 18 decimals
    mapping(address => uint256) private _baseBalance;
    // account address -> amount 18 decimals
    mapping(address => uint256) private _delegatedBalance;
    // account address -> {coolDownFinish, amount}
    mapping(address => PwIporTokenTypes.PwCoolDown) private _coolDowns;
    uint256 private _baseTotalSupply;
    uint256 private _withdrawalFee;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address iporToken) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);
        _iporToken = iporToken;
        _withdrawalFee = Constants.D17 * 5;
    }

    modifier onlyJohn() {
        require(_msgSender() == _john, MiningErrors.CALLER_NOT_JOHN);
        _;
    }

    function name() external pure override returns (string memory) {
        return "Power IPOR";
    }

    function symbol() external pure override returns (string memory) {
        return "pwIPOR";
    }

    function decimals() external pure override returns (uint8) {
        return 18;
    }

    function getVersion() external pure override returns (uint256) {
        return 1;
    }

    function withdrawalFee() external view override returns (uint256) {
        return _withdrawalFee;
    }

    function totalSupply() external view override returns (uint256) {
        return IporMath.division(_baseTotalSupply * _exchangeRate(), Constants.D18);
    }

    function totalSupplyBase() external view override returns (uint256) {
        return _baseTotalSupply;
    }

    function activeCoolDown() external view returns (PwIporTokenTypes.PwCoolDown memory) {
        return _coolDowns[_msgSender()];
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balanceOf(account);
    }

    function exchangeRate() external view override returns (uint256) {
        return _exchangeRate();
    }

    function delegatedBalanceOf(address account) external view override returns (uint256) {
        return _delegatedBalance[account];
    }

    function getJohn() external view override returns (address) {
        return _john;
    }

    function setWithdrawalFee(uint256 withdrawalFee) external override onlyOwner {
        _withdrawalFee = withdrawalFee;
        emit WithdrawalFee(block.timestamp, _msgSender(), withdrawalFee);
    }

    function setJohn(address john) external override onlyOwner whenNotPaused {
        require(john != address(0), IporErrors.WRONG_ADDRESS);
        _john = john;
        emit JohnAddressChanged(block.timestamp, _msgSender(), john);
    }

    function stake(uint256 iporTokenAmount) external override whenNotPaused {
        require(iporTokenAmount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 exchangeRate = _exchangeRate();

        IERC20Upgradeable(_iporToken).safeTransferFrom(
            _msgSender(),
            address(this),
            iporTokenAmount
        );

        uint256 newBaseTokens = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);

        _baseBalance[_msgSender()] += newBaseTokens;
        _baseTotalSupply += newBaseTokens;

        emit Stake(block.timestamp, _msgSender(), iporTokenAmount, exchangeRate, newBaseTokens);
    }

    function unstake(uint256 pwTokenAmount) external override whenNotPaused {
        require(pwTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 exchangeRate = _exchangeRate();
        uint256 undelegatedPwTokens = _availablePwTokens(_msgSender(), exchangeRate);
        require(
            undelegatedPwTokens >= pwTokenAmount,
            MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW
        );

        uint256 baseAmountToUnstake = IporMath.division(
            pwTokenAmount * Constants.D18,
            exchangeRate
        );
        require(
            _baseBalance[_msgSender()] >= baseAmountToUnstake,
            MiningErrors.BASE_BALANCE_TOO_LOW
        );
        _baseBalance[_msgSender()] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        uint256 amountToTransfer = _baseAmountToPwToken(
            _amountWithoutFee(baseAmountToUnstake),
            exchangeRate
        );
        IERC20Upgradeable(_iporToken).transfer(_msgSender(), amountToTransfer);
        emit Unstake(
            block.timestamp,
            _msgSender(),
            pwTokenAmount,
            exchangeRate,
            pwTokenAmount - amountToTransfer
        );
    }

    function coolDown(uint256 pwIporAmount) external override whenNotPaused {
        require(pwIporAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 availablePwTokens = _baseAmountToPwToken(
            _baseBalance[_msgSender()],
            _exchangeRate()
        ) - _delegatedBalance[_msgSender()];

        require(
            availablePwTokens >= pwIporAmount,
            MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW
        );

        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(
            block.timestamp + COOL_DOWN_IN_SECONDS,
            pwIporAmount
        );
        emit CoolDown(
            block.timestamp,
            _msgSender(),
            pwIporAmount,
            block.timestamp + COOL_DOWN_IN_SECONDS
        );
    }

    function cancelCoolDown() external override whenNotPaused {
        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(0, 0);
        emit CoolDown(block.timestamp, _msgSender(), 0, 0);
    }

    function redeem() external override whenNotPaused {
        PwIporTokenTypes.PwCoolDown memory coolDown = _coolDowns[_msgSender()];
        require(block.timestamp >= coolDown.coolDownFinish, MiningErrors.COOL_DOWN_NOT_FINISH);
        require(coolDown.amount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 exchangeRate = _exchangeRate();
        uint256 baseAmountToUnstake = IporMath.division(
            coolDown.amount * Constants.D18,
            exchangeRate
        );

        require(
            _baseBalance[_msgSender()] >= baseAmountToUnstake,
            MiningErrors.BASE_BALANCE_TOO_LOW
        );

        _baseBalance[_msgSender()] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;
        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(0, 0);

        IERC20Upgradeable(_iporToken).transfer(_msgSender(), coolDown.amount);

        emit Redeem(block.timestamp, _msgSender(), coolDown.amount);
    }

    function receiveRewards(address account, uint256 iporTokenAmount)
        external
        override
        whenNotPaused
        onlyJohn
    {
        // We need this value before transfer tokens
        uint256 exchangeRate = _exchangeRate();
        require(iporTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        IERC20Upgradeable(_iporToken).safeTransferFrom(
            _msgSender(),
            address(this),
            iporTokenAmount
        );

        uint256 newBaseTokens = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);
        _baseBalance[account] += newBaseTokens;
        _baseTotalSupply += newBaseTokens;

        emit ReceiveRewards(block.timestamp, account, iporTokenAmount);
    }

    function delegateToRewards(address[] memory ipTokens, uint256[] memory pwIporAmounts)
        external
        override
        whenNotPaused
    {
        require(ipTokens.length == pwIporAmounts.length, IporErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwIporToDelegate;
        for (uint256 i = 0; i != pwIporAmounts.length; i++) {
            pwIporToDelegate += pwIporAmounts[i];
        }

        require(
            _availablePwTokens(_msgSender(), _exchangeRate()) >= pwIporToDelegate,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _delegatedBalance[_msgSender()] += pwIporToDelegate;
        IJohn(_john).delegatePwIpor(_msgSender(), ipTokens, pwIporAmounts);

        emit DelegateToReward(block.timestamp, _msgSender(), ipTokens, pwIporAmounts);
    }

    function withdrawFromDelegation(address ipToken, uint256 pwIporAmount) external whenNotPaused {
        require(pwIporAmount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(
            _delegatedBalance[_msgSender()] >= pwIporAmount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );

        IJohn(_john).withdrawFromDelegation(_msgSender(), ipToken, pwIporAmount);
        _delegatedBalance[_msgSender()] -= pwIporAmount;

        emit WithdrawFromDelegation(block.timestamp, _msgSender(), ipToken, pwIporAmount);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
        _unpause();
    }

    function _exchangeRate() internal view returns (uint256) {
        uint256 baseTotalSupply = _baseTotalSupply;
        if (baseTotalSupply == 0) {
            return Constants.D18;
        }
        uint256 balanceOfIporToken = IERC20Upgradeable(_iporToken).balanceOf(address(this));
        if (balanceOfIporToken == 0) {
            return Constants.D18;
        }
        return IporMath.division(balanceOfIporToken * Constants.D18, baseTotalSupply);
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return _baseAmountToPwToken(_baseBalance[account], _exchangeRate());
    }

    function _amountWithoutFee(uint256 baseAmount) internal view returns (uint256) {
        return IporMath.division((Constants.D18 - _withdrawalFee) * baseAmount, Constants.D18);
    }

    function _baseAmountToPwToken(uint256 baseAmount, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return IporMath.division(baseAmount * exchangeRate, Constants.D18);
    }

    function _availablePwTokens(address account, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return
            _baseAmountToPwToken(_baseBalance[account], exchangeRate) -
            _delegatedBalance[account] -
            _coolDowns[account].amount;
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
