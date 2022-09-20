// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "../interfaces/IJohnInternal.sol";
import "../interfaces/IPwIporToken.sol";
import "./PwIporTokenInternal.sol";

//TODO: remove at the end
import "hardhat/console.sol";

// TODO: Add tests for events
contract PwIporToken is PwIporTokenInternal, IPwIporToken {
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
            IporMath.division(_baseTotalSupply * _calculateExchangeRate(_iporToken), Constants.D18);
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balanceOf(account);
    }

    function delegatedBalanceOf(address account) external view override returns (uint256) {
        return _delegatedBalance[account];
    }

    function getWithdrawFee() external view override returns (uint256) {
        return _withdrawFee;
    }

    function activeCoolDown() external view returns (PwIporTokenTypes.PwCoolDown memory) {
        return _coolDowns[_msgSender()];
    }

    function stake(uint256 iporTokenAmount) external override whenNotPaused nonReentrant {
        require(iporTokenAmount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        address iporTokenAddress = _iporToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateExchangeRate(iporTokenAddress);

        IERC20Upgradeable(iporTokenAddress).safeTransferFrom(
            msgSender,
            address(this),
            iporTokenAmount
        );

        uint256 newBaseTokens = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);

        _baseBalance[msgSender] += newBaseTokens;
        _baseTotalSupply += newBaseTokens;

        emit Stake(msgSender, iporTokenAmount, exchangeRate, newBaseTokens);
    }

    function unstake(uint256 pwTokenAmount) external override whenNotPaused nonReentrant {
        require(pwTokenAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        address iporTokenAddress = _iporToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateExchangeRate(iporTokenAddress);
        uint256 undelegatedPwTokens = _availablePwTokens(msgSender, exchangeRate);

        require(
            undelegatedPwTokens >= pwTokenAmount,
            MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW
        );

        uint256 baseAmountToUnstake = IporMath.division(
            pwTokenAmount * Constants.D18,
            exchangeRate
        );

        require(_baseBalance[msgSender] >= baseAmountToUnstake, MiningErrors.BASE_BALANCE_TOO_LOW);

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        uint256 amountToTransfer = _baseAmountToPwToken(
            _amountWithoutFee(baseAmountToUnstake),
            exchangeRate
        );
        IERC20Upgradeable(iporTokenAddress).transfer(msgSender, amountToTransfer);
        emit Unstake(msgSender, pwTokenAmount, exchangeRate, pwTokenAmount - amountToTransfer);
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
            _availablePwTokens(_msgSender(), _calculateExchangeRate(_iporToken)) >=
                pwIporToDelegate,
            MiningErrors.STAKED_BALANCE_TOO_LOW
        );

        _delegatedBalance[_msgSender()] += pwIporToDelegate;
        IJohnInternal(_john).delegatePwIpor(_msgSender(), ipTokens, pwIporAmounts);

        emit DelegateToJohn(_msgSender(), ipTokens, pwIporAmounts);
    }

    function undelegateFromJohn(address ipToken, uint256 pwIporAmount)
        external
        whenNotPaused
        nonReentrant
    {
        require(pwIporAmount != 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        require(
            _delegatedBalance[_msgSender()] >= pwIporAmount,
            MiningErrors.DELEGATED_BALANCE_TOO_LOW
        );

        IJohnInternal(_john).undelegatePwIpor(_msgSender(), ipToken, pwIporAmount);
        _delegatedBalance[_msgSender()] -= pwIporAmount;

        emit UndelegatePwIpor(_msgSender(), ipToken, pwIporAmount);
    }

    function coolDown(uint256 pwIporAmount) external override whenNotPaused {
        require(pwIporAmount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        address msgSender = _msgSender();

        uint256 availablePwTokens = _baseAmountToPwToken(
            _baseBalance[msgSender],
            _calculateExchangeRate(_iporToken)
        ) - _delegatedBalance[msgSender];

        require(
            availablePwTokens >= pwIporAmount,
            MiningErrors.STAKE_AND_UNDELEGATED_BALANCE_TOO_LOW
        );

        _coolDowns[msgSender] = PwIporTokenTypes.PwCoolDown(
            block.timestamp + COOL_DOWN_IN_SECONDS,
            pwIporAmount
        );
        emit CoolDown(msgSender, pwIporAmount, block.timestamp + COOL_DOWN_IN_SECONDS);
    }

    function cancelCoolDown() external override whenNotPaused {
        _coolDowns[_msgSender()] = PwIporTokenTypes.PwCoolDown(0, 0);
        emit CoolDown(_msgSender(), 0, 0);
    }

    function redeem() external override whenNotPaused nonReentrant {
        address msgSender = _msgSender();
        PwIporTokenTypes.PwCoolDown memory coolDown = _coolDowns[msgSender];
        require(block.timestamp >= coolDown.coolDownFinish, MiningErrors.COOL_DOWN_NOT_FINISH);
        require(coolDown.amount > 0, IporErrors.VALUE_NOT_GREATER_THAN_ZERO);
        address iporTokenAddress = _iporToken;

        uint256 exchangeRate = _calculateExchangeRate(iporTokenAddress);
        uint256 baseAmountToUnstake = IporMath.division(
            coolDown.amount * Constants.D18,
            exchangeRate
        );

        require(_baseBalance[msgSender] >= baseAmountToUnstake, MiningErrors.BASE_BALANCE_TOO_LOW);

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;
        _coolDowns[msgSender] = PwIporTokenTypes.PwCoolDown(0, 0);

        IERC20Upgradeable(iporTokenAddress).transfer(msgSender, coolDown.amount);

        emit Redeem(msgSender, coolDown.amount);
    }
}
