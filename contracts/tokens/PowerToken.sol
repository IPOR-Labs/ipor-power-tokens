// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/ILiquidityMiningInternal.sol";
import "../interfaces/IPowerToken.sol";
import "./PowerTokenInternal.sol";

///@title Smart contract responsible for managing Power Token.
/// @notice Power Token is retrieved when the account stakes [Staked] Token.
/// PowerToken smart contract allows staking, unstaking of [Staked] Token, delegating, undelegating of Power Token balance to LiquidityMining.
contract PowerToken is PowerTokenInternal, IPowerToken {
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
            Math.division(
                _baseTotalSupply * _calculateInternalExchangeRate(_stakedToken),
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

    function getActiveCooldown(address account)
        external
        view
        returns (PowerTokenTypes.PwTokenCooldown memory)
    {
        return _cooldowns[account];
    }

    function stake(uint256 stakedTokenAmount) external override whenNotPaused nonReentrant {
        require(stakedTokenAmount != 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);

        IERC20Upgradeable(stakedTokenAddress).transferFrom(
            msgSender,
            address(this),
            stakedTokenAmount
        );

        uint256 baseAmount = Math.division(stakedTokenAmount * Constants.D18, exchangeRate);

        _baseBalance[msgSender] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit Staked(msgSender, stakedTokenAmount, exchangeRate, baseAmount);
    }

    function unstake(uint256 pwTokenAmount) external override whenNotPaused nonReentrant {
        require(pwTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);
        uint256 availablePwTokenAmount = _getAvailablePwTokenAmount(msgSender, exchangeRate);

        require(
            availablePwTokenAmount >= pwTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        uint256 baseAmountToUnstake = Math.division(pwTokenAmount * Constants.D18, exchangeRate);

        require(
            _baseBalance[msgSender] >= baseAmountToUnstake,
            Errors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        uint256 stakedTokenAmountToTransfer = _calculateBaseAmountToPwToken(
            _calculateAmountWithCooldownFeeSubtracted(baseAmountToUnstake),
            exchangeRate
        );

        IERC20Upgradeable(stakedTokenAddress).transfer(msgSender, stakedTokenAmountToTransfer);

        emit Unstaked(
            msgSender,
            pwTokenAmount,
            exchangeRate,
            pwTokenAmount - stakedTokenAmountToTransfer
        );
    }

    function delegateToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external override whenNotPaused nonReentrant {
        uint256 pwTokenAmountsLength = pwTokenAmounts.length;
        require(lpTokens.length == pwTokenAmountsLength, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwTokenToDelegate;

        for (uint256 i; i != pwTokenAmountsLength; ++i) {
            pwTokenToDelegate += pwTokenAmounts[i];
        }

        require(
            _getAvailablePwTokenAmount(
                _msgSender(),
                _calculateInternalExchangeRate(_stakedToken)
            ) >= pwTokenToDelegate,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[_msgSender()] += pwTokenToDelegate;

        ILiquidityMiningInternal(_liquidityMining).delegatePwToken(
            _msgSender(),
            lpTokens,
            pwTokenAmounts
        );

        emit ToLiquidityMiningDelegated(_msgSender(), lpTokens, pwTokenAmounts);
    }

    function delegateAndStakeToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts,
        uint256[] calldata lpTokenAmounts
    ) external override whenNotPaused nonReentrant {
        require(
            lpTokens.length == pwTokenAmounts.length && lpTokens.length == lpTokenAmounts.length,
            Errors.INPUT_ARRAYS_LENGTH_MISMATCH
        );

        uint256 pwTokenToDelegate;

        uint256 pwTokenAmountsLength = pwTokenAmounts.length;
        for (uint256 i; i != pwTokenAmountsLength; ++i) {
            pwTokenToDelegate += pwTokenAmounts[i];
        }

        require(
            _getAvailablePwTokenAmount(
                _msgSender(),
                _calculateInternalExchangeRate(_stakedToken)
            ) >= pwTokenToDelegate,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[_msgSender()] += pwTokenToDelegate;

        ILiquidityMiningInternal(_liquidityMining).delegatePwTokenAndStakeLpToken(
            _msgSender(),
            lpTokens,
            pwTokenAmounts,
            lpTokenAmounts
        );

        emit ToLiquidityMiningDelegated(_msgSender(), lpTokens, pwTokenAmounts);
    }

    function undelegateFromLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external override whenNotPaused nonReentrant {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == pwTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);

        uint256 pwTokenAmountToUndelegate;

        for (uint256 i; i != lpTokensLength; ++i) {
            require(pwTokenAmounts[i] > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
            pwTokenAmountToUndelegate += pwTokenAmounts[i];
        }

        address msgSender = _msgSender();

        require(
            _delegatedToLiquidityMiningBalance[msgSender] >= pwTokenAmountToUndelegate,
            Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW
        );

        ILiquidityMiningInternal(_liquidityMining).undelegatePwToken(
            msgSender,
            lpTokens,
            pwTokenAmounts
        );

        _delegatedToLiquidityMiningBalance[msgSender] -= pwTokenAmountToUndelegate;

        emit FromLiquidityMiningUndelegated(msgSender, lpTokens, pwTokenAmounts);
    }

    function cooldown(uint256 pwTokenAmount) external override whenNotPaused nonReentrant {
        require(pwTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address msgSender = _msgSender();

        uint256 availablePwTokenAmount = _calculateBaseAmountToPwToken(
            _baseBalance[msgSender],
            _calculateInternalExchangeRate(_stakedToken)
        ) - _delegatedToLiquidityMiningBalance[msgSender];

        require(
            availablePwTokenAmount >= pwTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _cooldowns[msgSender] = PowerTokenTypes.PwTokenCooldown(
            block.timestamp + COOL_DOWN_IN_SECONDS,
            pwTokenAmount
        );
        emit CooldownChanged(msgSender, pwTokenAmount, block.timestamp + COOL_DOWN_IN_SECONDS);
    }

    function appendToCooldown(uint256 pwTokenAmount) external override whenNotPaused nonReentrant {
        require(pwTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
        address msgSender = _msgSender();
        uint256 timestamp = block.timestamp;

        PowerTokenTypes.PwTokenCooldown memory activeCooldown = _cooldowns[msgSender];

        require(activeCooldown.endTimestamp >= timestamp, Errors.ACC_COOLDOWN_IS_NOT_ACTIVE);

        uint256 availablePwTokenAmount = _calculateBaseAmountToPwToken(
            _baseBalance[msgSender],
            _calculateInternalExchangeRate(_stakedToken)
        ) -
            _delegatedToLiquidityMiningBalance[msgSender] -
            activeCooldown.pwTokenAmount;

        require(
            availablePwTokenAmount >= pwTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        uint256 newTokenAmount = activeCooldown.pwTokenAmount + pwTokenAmount;

        uint256 newCooldownEndTimestamp = Math.division(
            (activeCooldown.endTimestamp - timestamp) *
                activeCooldown.pwTokenAmount +
                pwTokenAmount *
                COOL_DOWN_IN_SECONDS,
            newTokenAmount
        ) + timestamp;

        _cooldowns[msgSender] = PowerTokenTypes.PwTokenCooldown(
            newCooldownEndTimestamp,
            newTokenAmount
        );

        emit CooldownChanged(msgSender, newTokenAmount, newCooldownEndTimestamp);
    }

    function cancelCooldown() external override whenNotPaused {
        delete _cooldowns[_msgSender()];
        emit CooldownChanged(_msgSender(), 0, 0);
    }

    function redeem() external override whenNotPaused nonReentrant {
        address msgSender = _msgSender();

        PowerTokenTypes.PwTokenCooldown memory accountCooldown = _cooldowns[msgSender];

        require(block.timestamp >= accountCooldown.endTimestamp, Errors.COOL_DOWN_NOT_FINISH);
        require(accountCooldown.pwTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);
        uint256 baseAmountToUnstake = Math.division(
            accountCooldown.pwTokenAmount * Constants.D18,
            exchangeRate
        );

        require(
            _baseBalance[msgSender] >= baseAmountToUnstake,
            Errors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        delete _cooldowns[msgSender];

        ///@dev We can transfer pwTokenAmount because it is in relation 1:1 to Staked Token
        IERC20Upgradeable(stakedTokenAddress).transfer(msgSender, accountCooldown.pwTokenAmount);

        emit Redeem(msgSender, accountCooldown.pwTokenAmount);
    }
}
