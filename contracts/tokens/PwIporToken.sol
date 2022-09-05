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
import "../interfaces/ILiquidityRewards.sol";
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

    address private _iporToken;
    address private _liquidityRewards;
    // user address -> amount 18 decimals
    mapping(address => uint256) private _baseBalance;
    // user address -> amount 18 decimals
    mapping(address => uint256) private _delegatedBalance;
    // user address -> {coolDownFinish, amount
    mapping(address => PwIporTokenTypes.PwCoolDown) _coolDowns;
    uint256 private _baseTotalSupply;
    uint256 private _withdrawalFee;
    // 2 weeks
    uint256 public constant COOL_DOWN_SECONDS = 2 * 7 * 24 * 60 * 60;

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

    modifier onlyLiquidityRewards() {
        require(_msgSender() == _liquidityRewards, MiningErrors.CALLER_NOT_LIQUIDITY_REWARDS);
        _;
    }

    function name() external pure override returns (string memory) {
        return "Power IPOR";
    }

    function symbol() external pure override returns (string memory) {
        return "PwIPOR";
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

    function setWithdrawalFee(uint256 withdrawalFee) external override onlyOwner {
        _withdrawalFee = withdrawalFee;
        emit WithdrawalFee(block.timestamp, _msgSender(), withdrawalFee);
    }

    function setLiquidityRewardsAddress(address liquidityRewards)
        external
        override
        onlyOwner
        whenNotPaused
    {
        require(liquidityRewards != address(0), IporErrors.WRONG_ADDRESS);
        _liquidityRewards = liquidityRewards;
        emit LiquidityRewardsAddressChanged(block.timestamp, _msgSender(), liquidityRewards);
    }

    function stake(uint256 amount) external override whenNotPaused {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 exchangeRate = _exchangeRate();

        IERC20Upgradeable(_iporToken).safeTransferFrom(_msgSender(), address(this), amount);

        uint256 newBaseTokens = IporMath.division(amount * Constants.D18, exchangeRate);

        _baseBalance[_msgSender()] += newBaseTokens;
        _baseTotalSupply += newBaseTokens;

        emit Stake(block.timestamp, _msgSender(), amount, exchangeRate, newBaseTokens);
    }

    function unstake(uint256 amount) external override whenNotPaused {
        require(amount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 exchangeRate = _exchangeRate();
        uint256 undelegatedPwTokens = _availablePwTokens(_msgSender(), exchangeRate);
        require(undelegatedPwTokens >= amount, MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW);

        uint256 baseAmountToUnstake = IporMath.division(amount * Constants.D18, exchangeRate);
        require(
            _baseBalance[_msgSender()] >= baseAmountToUnstake,
            MiningErrors.BASE_BALANCE_TOO_LOW
        );
        _baseBalance[_msgSender()] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        console.log("PwIporToken->unstake-> amount", amount);
        console.log(
            "PwIporToken->unstake-> IporToken balance this",
            IERC20Upgradeable(_iporToken).balanceOf(address(this))
        );
        uint256 amountToTransfer = _baseAmountToPwToken(
            _amountWithoutFee(baseAmountToUnstake),
            exchangeRate
        );
        IERC20Upgradeable(_iporToken).transfer(_msgSender(), amountToTransfer);
        emit Unstake(
            block.timestamp,
            _msgSender(),
            amount,
            exchangeRate,
            amount - amountToTransfer
        );
    }

    function coolDown(uint256 amount) external override whenNotPaused {
        require(amount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 availablePwTokens = _baseAmountToPwToken(
            _baseBalance[_msgSender()],
            _exchangeRate()
        ) - _delegatedBalance[_msgSender()];

        require(availablePwTokens >= amount, MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW);

        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(
            block.timestamp + COOL_DOWN_SECONDS,
            amount
        );
        emit CoolDown(block.timestamp, _msgSender(), amount, block.timestamp + COOL_DOWN_SECONDS);
    }

    function cancelCoolDown() external override whenNotPaused {
        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(0, 0);
        emit CoolDown(block.timestamp, _msgSender(), 0, 0);
    }

    function redeem() external override whenNotPaused {
        PwIporTokenTypes.PwCoolDown memory coolDown = _coolDowns[_msgSender()];
        require(block.timestamp >= coolDown.coolDownFinish, MiningErrors.COOL_DOWN_NOT_FINISH);

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
        IERC20Upgradeable(_iporToken).transfer(
            _msgSender(),
            _baseAmountToPwToken(coolDown.amount, exchangeRate)
        );
        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(0, 0);

        emit Redeem(block.timestamp, _msgSender(), coolDown.amount);
    }

    function receiveRewords(address user, uint256 amount)
        external
        override
        whenNotPaused
        onlyLiquidityRewards
    {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        IERC20Upgradeable(_iporToken).safeTransferFrom(_msgSender(), address(this), amount);

        uint256 newBaseTokens = IporMath.division(amount * Constants.D18, _exchangeRate());
        _baseBalance[user] += newBaseTokens;
        _baseTotalSupply += newBaseTokens;

        emit ReceiveRewords(block.timestamp, user, amount);
    }

    function delegateToRewards(address[] memory assets, uint256[] memory amounts)
        external
        override
        whenNotPaused
    {
        require(assets.length == amounts.length, IporErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwIporToDelegate;
        for (uint256 i = 0; i != amounts.length; i++) {
            pwIporToDelegate += amounts[i];
        }

        require(
            _availablePwTokens(_msgSender(), _exchangeRate()) >= pwIporToDelegate,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _delegatedBalance[_msgSender()] += pwIporToDelegate;
        ILiquidityRewards(_liquidityRewards).delegatePwIpor(_msgSender(), assets, amounts);

        emit DelegateToReward(block.timestamp, _msgSender(), assets, amounts);
    }

    function withdrawFromDelegation(address asset, uint256 amount) external whenNotPaused {
        require(amount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(_delegatedBalance[_msgSender()] >= amount, MiningErrors.DELEGATED_BALANCE_TOO_LOW);

        ILiquidityRewards(_liquidityRewards).withdrawFromDelegation(_msgSender(), asset, amount);
        _delegatedBalance[_msgSender()] -= amount;

        emit WithdrawFromDelegation(block.timestamp, _msgSender(), asset, amount);
    }

    function pause() external override onlyOwner {
        _pause();
    }

    function unpause() external override onlyOwner {
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
