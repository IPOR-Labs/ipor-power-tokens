// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../interfaces/IJohnInternal.sol";
import "../interfaces/IPowerIpor.sol";
import "./PowerIporInternal.sol";

//TODO: remove at the end
import "hardhat/console.sol";

// TODO: Add tests for events
contract PowerIpor is PowerIporInternal, IPowerIpor {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function name() external pure override returns (string memory) {
        return "Power IPOR";
    }

    function symbol() external pure override returns (string memory) {
        return "pwIPOR";
    }

    function decimals() external pure override returns (uint8) {
        return 18;
    }

    function totalSupply() external view override returns (uint256) {
        return
            IporMath.division(
                _baseTotalSupply * _calculateInternalExchangeRate(_iporToken),
                Constants.D18
            );
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balanceOf(account);
    }

    function delegatedToJohnBalanceOf(address account) external view override returns (uint256) {
        return _delegatedToJohnBalance[account];
    }

    function getUnstakeWithoutCooldownFee() external view override returns (uint256) {
        return _unstakeWithoutCooldownFee;
    }

    function getActiveCoolDown(address account)
        external
        view
        returns (PowerIporTypes.PwIporCoolDown memory)
    {
        return _coolDowns[account];
    }

    function stake(uint256 iporTokenAmount) external override whenNotPaused nonReentrant {
        require(iporTokenAmount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address iporTokenAddress = _iporToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(iporTokenAddress);

        IERC20Upgradeable(iporTokenAddress).safeTransferFrom(
            msgSender,
            address(this),
            iporTokenAmount
        );

        uint256 baseAmount = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);

        _baseBalance[msgSender] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit Stake(msgSender, iporTokenAmount, exchangeRate, baseAmount);
    }

    function unstake(uint256 pwIporAmount) external override whenNotPaused nonReentrant {
        require(pwIporAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address iporTokenAddress = _iporToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(iporTokenAddress);
        uint256 availablePwIporAmount = _getAvailablePwIporAmount(msgSender, exchangeRate);

        require(
            availablePwIporAmount >= pwIporAmount,
            MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW
        );

        uint256 baseAmountToUnstake = IporMath.division(pwIporAmount * Constants.D18, exchangeRate);

        require(_baseBalance[msgSender] >= baseAmountToUnstake, MiningErrors.BASE_BALANCE_TOO_LOW);

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        uint256 iporTokenAmountToTransfer = _calculateBaseAmountToPwIpor(
            _calculateAmountWithoutFee(baseAmountToUnstake),
            exchangeRate
        );

        IERC20Upgradeable(iporTokenAddress).transfer(msgSender, iporTokenAmountToTransfer);

        emit Unstake(
            msgSender,
            pwIporAmount,
            exchangeRate,
            pwIporAmount - iporTokenAmountToTransfer
        );
    }

    function delegateToJohn(address[] memory ipTokens, uint256[] memory pwIporAmounts)
        external
        override
        whenNotPaused
        nonReentrant
    {
        require(ipTokens.length == pwIporAmounts.length, IporErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwIporToDelegate;
        for (uint256 i = 0; i != pwIporAmounts.length; i++) {
            pwIporToDelegate += pwIporAmounts[i];
        }

        require(
            _getAvailablePwIporAmount(_msgSender(), _calculateInternalExchangeRate(_iporToken)) >=
                pwIporToDelegate,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _delegatedToJohnBalance[_msgSender()] += pwIporToDelegate;
        IJohnInternal(_john).delegatePwIpor(_msgSender(), ipTokens, pwIporAmounts);

        emit DelegateToJohn(_msgSender(), ipTokens, pwIporAmounts);
    }

    function delegateAndStakeToJohn(
        address[] memory ipTokens,
        uint256[] memory pwIporAmounts,
        uint256[] memory ipTokenAmounts
    ) external override whenNotPaused nonReentrant {
        require(
            ipTokens.length == pwIporAmounts.length && ipTokens.length == ipTokenAmounts.length,
            IporErrors.INPUT_ARRAYS_LENGTH_MISMATCH
        );
        uint256 pwIporToDelegate;
        for (uint256 i = 0; i != pwIporAmounts.length; i++) {
            pwIporToDelegate += pwIporAmounts[i];
        }

        require(
            _getAvailablePwIporAmount(_msgSender(), _calculateInternalExchangeRate(_iporToken)) >=
                pwIporToDelegate,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _delegatedToJohnBalance[_msgSender()] += pwIporToDelegate;
        IJohnInternal(_john).delegatePwIporAndStakeIpToken(
            _msgSender(),
            ipTokens,
            pwIporAmounts,
            ipTokenAmounts
        );

        emit DelegateToJohn(_msgSender(), ipTokens, pwIporAmounts);
    }

    function undelegateFromJohn(address[] memory ipTokens, uint256[] memory pwIporAmounts)
        external
        override
        whenNotPaused
        nonReentrant
    {
        require(ipTokens.length == pwIporAmounts.length, IporErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwIporAmountToUndelegate;
        for (uint256 i; i != ipTokens.length; i++) {
            require(pwIporAmounts[i] != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
            pwIporAmountToUndelegate += pwIporAmounts[i];
        }

        require(
            _delegatedToJohnBalance[_msgSender()] >= pwIporAmountToUndelegate,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );

        IJohnInternal(_john).undelegatePwIpor(_msgSender(), ipTokens, pwIporAmounts);
        _delegatedToJohnBalance[_msgSender()] -= pwIporAmountToUndelegate;

        emit UndelegateFromJohn(_msgSender(), ipTokens, pwIporAmounts);
    }

    function coolDown(uint256 pwIporAmount) external override whenNotPaused {
        require(pwIporAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address msgSender = _msgSender();

        uint256 availablePwIporAmount = _calculateBaseAmountToPwIpor(
            _baseBalance[msgSender],
            _calculateInternalExchangeRate(_iporToken)
        ) - _delegatedToJohnBalance[msgSender];

        require(
            availablePwIporAmount >= pwIporAmount,
            MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW
        );

        _coolDowns[msgSender] = PowerIporTypes.PwIporCoolDown(
            block.timestamp + COOL_DOWN_IN_SECONDS,
            pwIporAmount
        );
        emit CoolDownChanged(msgSender, pwIporAmount, block.timestamp + COOL_DOWN_IN_SECONDS);
    }

    function cancelCoolDown() external override whenNotPaused {
        delete _coolDowns[_msgSender()];
        emit CoolDownChanged(_msgSender(), 0, 0);
    }

    function redeem() external override whenNotPaused nonReentrant {
        address msgSender = _msgSender();

        PowerIporTypes.PwIporCoolDown memory coolDown = _coolDowns[msgSender];

        require(block.timestamp >= coolDown.endTimestamp, MiningErrors.COOL_DOWN_NOT_FINISH);
        require(coolDown.pwIporAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address iporTokenAddress = _iporToken;

        uint256 exchangeRate = _calculateInternalExchangeRate(iporTokenAddress);
        uint256 baseAmountToUnstake = IporMath.division(
            coolDown.pwIporAmount * Constants.D18,
            exchangeRate
        );

        require(_baseBalance[msgSender] >= baseAmountToUnstake, MiningErrors.BASE_BALANCE_TOO_LOW);

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;
        delete _coolDowns[msgSender];

        IERC20Upgradeable(iporTokenAddress).transfer(msgSender, coolDown.pwIporAmount);

        emit Redeem(msgSender, coolDown.pwIporAmount);
    }
}
