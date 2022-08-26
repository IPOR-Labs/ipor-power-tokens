// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../security/IporOwnableUpgradeable.sol";
import "../interfaces/IPwIporToken.sol";
import "../interfaces/ILiquidityRewards.sol";
import "../interfaces/types/PwIporTokenTypes.sol";
import "../libraries/errors/IporErrors.sol";
import "../libraries/errors/MiningErrors.sol";
import "../libraries/Constants.sol";
import "../libraries/math/IporMath.sol";
//TODO: remove at the end

import "hardhat/console.sol";

contract PwIporToken is
    Initializable,
    PausableUpgradeable,
    UUPSUpgradeable,
    IporOwnableUpgradeable,
    IPwIporToken
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address private _iporToken;
    address private _liquidityRewards;
    mapping(address => uint256) private _baseBalance;
    //    balance in pwTokens
    mapping(address => uint256) private _delegatedBalance;

    //    usserAddres
    mapping(address => PwIporTokenTypes.PwCoolDown) _coolDowns;

    uint256 private _baseTotalSupply;

    uint256 private _withdrawalFee;
    uint256 public constant COOL_DOWN_SECONDS = 2 * 7 * 24 * 60 * 60;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier onlyLiquidityRewards() {
        require(_msgSender() == _liquidityRewards, MiningErrors.CALLER_NOT_LIQUIDITY_REWARDS);
        _;
    }

    function initialize(address iporToken) public initializer {
        __Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        require(iporToken != address(0), IporErrors.WRONG_ADDRESS);
        _iporToken = iporToken;
        _withdrawalFee = Constants.D17 * 5;
    }

    function name() external pure returns (string memory) {
        return "Power IPOR";
    }

    function symbol() external pure returns (string memory) {
        return "PwIPOR";
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }

    function getVersion() external pure returns (uint256) {
        return 1;
    }

    function withdrawalFee() external view returns (uint256) {
        return _withdrawalFee;
    }

    function setWithdrawalFee(uint256 withdrawalFee) external onlyOwner {
        _withdrawalFee = withdrawalFee;
        // TODO: ADD Event
    }

    function totalSupply() external view returns (uint256) {
        return IporMath.division(_baseTotalSupply * _exchangeRate(), Constants.D18);
    }

    function totalSupplyBase() external view returns (uint256) {
        return _baseTotalSupply;
    }

    function setLiquidityRewardsAddress(address liquidityRewards) external onlyOwner whenNotPaused {
        require(liquidityRewards != address(0), IporErrors.WRONG_ADDRESS);
        _liquidityRewards = liquidityRewards;
    }

    function stake(uint256 amount) external whenNotPaused {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        uint256 oldUserBalance = _baseBalance[_msgSender()];
        uint256 oldTotalSupply = _baseTotalSupply;
        uint256 exchangeRate = _exchangeRate();
        IERC20Upgradeable(_iporToken).safeTransferFrom(_msgSender(), address(this), amount);
        uint256 newBaseTokens = IporMath.division(amount * Constants.D18, exchangeRate);
        _baseBalance[_msgSender()] = oldUserBalance + newBaseTokens;
        _baseTotalSupply = oldTotalSupply + newBaseTokens;
        // TODO: ADD Event
    }

    function unstake(uint256 amount) external whenNotPaused {
        require(amount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        uint256 exchangeRate = _exchangeRate();
        uint256 balanceOfPwTokens = _balanceOf(_msgSender());
        //        This should not be negative
        uint256 undelegatedPwTokens = _availablePwTokens(_msgSender(), exchangeRate);
        require(undelegatedPwTokens >= amount, MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW);

        uint256 baseAmountToUnstake = IporMath.division(amount * Constants.D18, exchangeRate);
        uint256 baseBalance = _baseBalance[_msgSender()];
        require(baseBalance >= baseAmountToUnstake, MiningErrors.BASE_BALANCE_TOO_LOW);
        _baseBalance[_msgSender()] = baseBalance - baseAmountToUnstake;

        _baseTotalSupply -= baseAmountToUnstake;

        console.log("PwIporToken->unstake-> amount", amount);
        console.log("PwIporToken->unstake-> baseBalance", baseBalance);
        console.log("PwIporToken->unstake-> balanceOfPwTokens", balanceOfPwTokens);
        console.log(
            "PwIporToken->unstake-> IporToken balance this",
            IERC20Upgradeable(_iporToken).balanceOf(address(this))
        );
        IERC20Upgradeable(_iporToken).transfer(
            _msgSender(),
            _baseAmountToPwToken(_amountWithoutFee(baseAmountToUnstake), exchangeRate)
        );
        // TODO: ADD Event
    }

    function coolDown(uint256 amount) external whenNotPaused {
        require(amount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        uint256 exchangeRate = _exchangeRate();
        uint256 availablePwTokens = _baseAmountToPwToken(_baseBalance[_msgSender()], exchangeRate) -
            _delegatedBalance[_msgSender()];
        require(availablePwTokens >= amount, MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW);

        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(
            block.timestamp + COOL_DOWN_SECONDS,
            amount
        );
    }

    function cancelCoolDown() external whenNotPaused {
        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(0, 0);
    }

    function redeem() external whenNotPaused {
        PwIporTokenTypes.PwCoolDown memory coolDown = _coolDowns[_msgSender()];
        require(block.timestamp >= coolDown.coolDownFinish, MiningErrors.COOL_DOWN_NOT_FINISH);
        uint256 exchangeRate = _exchangeRate();
        uint256 amount = coolDown.amount;

        uint256 baseAmountToUnstake = IporMath.division(amount * Constants.D18, exchangeRate);
        uint256 baseBalance = _baseBalance[_msgSender()];
        require(baseBalance >= baseAmountToUnstake, MiningErrors.BASE_BALANCE_TOO_LOW);
        _baseBalance[_msgSender()] = baseBalance - baseAmountToUnstake;

        _baseTotalSupply -= baseAmountToUnstake;
        IERC20Upgradeable(_iporToken).transfer(
            _msgSender(),
            _baseAmountToPwToken(amount, exchangeRate)
        );
        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(0, 0);
        // TODO: ADD Event
    }

    function activeCoolDown() external view returns (PwIporTokenTypes.PwCoolDown memory) {
        return _coolDowns[_msgSender()];
    }

    function receiveRewords(address user, uint256 amount)
        external
        whenNotPaused
        onlyLiquidityRewards
    {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        uint256 oldUserBalance = _baseBalance[user];
        uint256 oldTotalSupply = _baseTotalSupply;
        uint256 exchangeRate = _exchangeRate();
        console.log("PwIporToken->receiveRewords->_msgSender(): ", _msgSender());
        console.log("PwIporToken->receiveRewords->amount: ", amount);
        console.log(
            "PwIporToken->receiveRewords->balanceOf(): ",
            IERC20Upgradeable(_iporToken).balanceOf(_msgSender())
        );
        IERC20Upgradeable(_iporToken).safeTransferFrom(_msgSender(), address(this), amount);
        uint256 newBaseTokens = IporMath.division(amount * Constants.D18, exchangeRate);
        _baseBalance[user] = oldUserBalance + newBaseTokens;
        _baseTotalSupply = oldTotalSupply + newBaseTokens;
        // TODO: ADD Event
    }

    function delegateToRewards(address[] memory assets, uint256[] memory amounts)
        external
        whenNotPaused
    {
        require(assets.length == amounts.length, IporErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwIporToDelegate;
        for (uint256 i = 0; i != amounts.length; i++) {
            pwIporToDelegate += amounts[i];
        }

        uint256 availablePwTokenToDelegate = _availablePwTokens(_msgSender(), _exchangeRate());

        require(
            availablePwTokenToDelegate >= pwIporToDelegate,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );
        _delegatedBalance[_msgSender()] += pwIporToDelegate;
        ILiquidityRewards(_liquidityRewards).delegatePwIpor(_msgSender(), assets, amounts);

        // TODO: ADD Event
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balanceOf(account);
    }

    function delegatedBalanceOf(address account) external view returns (uint256) {
        return _delegatedBalance[account];
    }

    function exchangeRate() external view returns (uint256) {
        return _exchangeRate();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _exchangeRate() internal view returns (uint256) {
        uint256 totalSupply = _baseTotalSupply;
        if (totalSupply == 0) {
            return Constants.D18;
        }
        uint256 balanceOfIporToken = IERC20Upgradeable(_iporToken).balanceOf(address(this));
        if (balanceOfIporToken == 0) {
            return Constants.D18;
        }
        return IporMath.division(balanceOfIporToken * Constants.D18, totalSupply);
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

    function _availablePwTokens(address user, uint256 exchangeRate)
        internal
        view
        returns (uint256)
    {
        return
            _baseAmountToPwToken(_baseBalance[user], exchangeRate) -
            _delegatedBalance[user] -
            _coolDowns[user].amount;
    }

    //solhint-disable no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
