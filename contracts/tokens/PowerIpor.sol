// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "../interfaces/ILiquidityMiningInternal.sol";
import "../interfaces/IPowerIpor.sol";
import "./PowerIporInternal.sol";

///@title Smart contract responsible for managing Power Ipor Token.
/// @notice Power Ipor Token is retrieved when account stake Ipor Token.
/// Power Ipor smart contract allows you to stake, unstake Ipor Token, deletage, undelegate to LiquidityMining Power Ipor Token.
/// Interact with LiquidityMining smart contract.
contract PowerIpor is PowerIporInternal, IPowerIpor {
    function name() external pure override returns (string memory) {
        return "Power IPOR";
    }

    function symbol() external pure override returns (string memory) {
        return "pwIPOR";
    }

    function decimals() external pure override returns (uint8) {
        return 18;
    }

    function getContractId() external pure returns (bytes32) {
        return 0xbd22bf01cb7daed462db61de31bb111aabcdae27adc748450fb9a9ea1c419cce;
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

    function delegatedToLiquidityMiningBalanceOf(address account)
        external
        view
        override
        returns (uint256)
    {
        return _delegatedToLiquidityMiningBalance[account];
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
        require(iporTokenAmount != 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address iporTokenAddress = _iporToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(iporTokenAddress);

        IERC20Upgradeable(iporTokenAddress).transferFrom(msgSender, address(this), iporTokenAmount);

        uint256 baseAmount = IporMath.division(iporTokenAmount * Constants.D18, exchangeRate);

        _baseBalance[msgSender] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit Stake(msgSender, iporTokenAmount, exchangeRate, baseAmount);
    }

    function unstake(uint256 pwIporAmount) external override whenNotPaused nonReentrant {
        require(pwIporAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address iporTokenAddress = _iporToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(iporTokenAddress);
        uint256 availablePwIporAmount = _getAvailablePwIporAmount(msgSender, exchangeRate);

        require(
            availablePwIporAmount >= pwIporAmount,
            MiningErrors.ACC_AVAILABLE_POWER_IPOR_BALANCE_IS_TOO_LOW
        );

        uint256 baseAmountToUnstake = IporMath.division(pwIporAmount * Constants.D18, exchangeRate);

        require(
            _baseBalance[msgSender] >= baseAmountToUnstake,
            MiningErrors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        uint256 iporTokenAmountToTransfer = _calculateBaseAmountToPwIpor(
            _calculateAmountWithCooldownFeeSubtracted(baseAmountToUnstake),
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

    function delegateToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwIporAmounts
    ) external override whenNotPaused nonReentrant {
        uint256 pwIporAmountsLength = pwIporAmounts.length;
        require(lpTokens.length == pwIporAmountsLength, MiningErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwIporToDelegate;

        for (uint256 i; i != pwIporAmountsLength; ++i) {
            pwIporToDelegate += pwIporAmounts[i];
        }

        require(
            _getAvailablePwIporAmount(_msgSender(), _calculateInternalExchangeRate(_iporToken)) >=
                pwIporToDelegate,
            MiningErrors.ACC_AVAILABLE_POWER_IPOR_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[_msgSender()] += pwIporToDelegate;

        ILiquidityMiningInternal(_liquidityMining).delegatePwIpor(
            _msgSender(),
            lpTokens,
            pwIporAmounts
        );

        emit DelegateToLiquidityMining(_msgSender(), lpTokens, pwIporAmounts);
    }

    function delegateAndStakeToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwIporAmounts,
        uint256[] calldata lpTokenAmounts
    ) external override whenNotPaused nonReentrant {
        require(
            lpTokens.length == pwIporAmounts.length && lpTokens.length == lpTokenAmounts.length,
            MiningErrors.INPUT_ARRAYS_LENGTH_MISMATCH
        );

        uint256 pwIporToDelegate;

        uint256 pwIporAmountsLength = pwIporAmounts.length;
        for (uint256 i; i != pwIporAmountsLength; ++i) {
            pwIporToDelegate += pwIporAmounts[i];
        }

        require(
            _getAvailablePwIporAmount(_msgSender(), _calculateInternalExchangeRate(_iporToken)) >=
                pwIporToDelegate,
            MiningErrors.ACC_AVAILABLE_POWER_IPOR_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[_msgSender()] += pwIporToDelegate;

        ILiquidityMiningInternal(_liquidityMining).delegatePwIporAndStakeLpToken(
            _msgSender(),
            lpTokens,
            pwIporAmounts,
            lpTokenAmounts
        );

        emit DelegateToLiquidityMining(_msgSender(), lpTokens, pwIporAmounts);
    }

    function undelegateFromLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwIporAmounts
    ) external override whenNotPaused nonReentrant {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == pwIporAmounts.length, MiningErrors.INPUT_ARRAYS_LENGTH_MISMATCH);

        uint256 pwIporAmountToUndelegate;

        for (uint256 i; i != lpTokensLength; ++i) {
            require(pwIporAmounts[i] > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);
            pwIporAmountToUndelegate += pwIporAmounts[i];
        }

        address msgSender = _msgSender();

        require(
            _delegatedToLiquidityMiningBalance[msgSender] >= pwIporAmountToUndelegate,
            MiningErrors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW
        );

        ILiquidityMiningInternal(_liquidityMining).undelegatePwIpor(
            msgSender,
            lpTokens,
            pwIporAmounts
        );

        _delegatedToLiquidityMiningBalance[msgSender] -= pwIporAmountToUndelegate;

        emit UndelegateFromLiquidityMining(msgSender, lpTokens, pwIporAmounts);
    }

    function coolDown(uint256 pwIporAmount) external override whenNotPaused nonReentrant {
        require(pwIporAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address msgSender = _msgSender();

        uint256 availablePwIporAmount = _calculateBaseAmountToPwIpor(
            _baseBalance[msgSender],
            _calculateInternalExchangeRate(_iporToken)
        ) - _delegatedToLiquidityMiningBalance[msgSender];

        require(
            availablePwIporAmount >= pwIporAmount,
            MiningErrors.ACC_AVAILABLE_POWER_IPOR_BALANCE_IS_TOO_LOW
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

        PowerIporTypes.PwIporCoolDown memory accountCoolDown = _coolDowns[msgSender];

        require(block.timestamp >= accountCoolDown.endTimestamp, MiningErrors.COOL_DOWN_NOT_FINISH);
        require(accountCoolDown.pwIporAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address iporTokenAddress = _iporToken;

        uint256 exchangeRate = _calculateInternalExchangeRate(iporTokenAddress);
        uint256 baseAmountToUnstake = IporMath.division(
            accountCoolDown.pwIporAmount * Constants.D18,
            exchangeRate
        );

        require(
            _baseBalance[msgSender] >= baseAmountToUnstake,
            MiningErrors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        delete _coolDowns[msgSender];

        ///@dev We can transfer pwIporAmount because it is in relation 1:1 to Ipor Token
        IERC20Upgradeable(iporTokenAddress).transfer(msgSender, accountCoolDown.pwIporAmount);

        emit Redeem(msgSender, accountCoolDown.pwIporAmount);
    }
}
