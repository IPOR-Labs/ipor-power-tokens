// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.17;

import "../interfaces/ILiquidityMiningInternal.sol";
import "../interfaces/IPowerToken.sol";
import "./PowerTokenInternal.sol";

///@title Smart contract responsible for managing Power Token.
/// @notice Power Token is retrieved when account stake Staked Token.
/// PowerToken smart contract allows you to stake, unstake Staked Token, deletage, undelegate to LiquidityMining Power Token.
/// Interact with LiquidityMining smart contract.
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
            PowerTokenMath.division(
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

    function getActiveCoolDown(address account)
        external
        view
        returns (PowerTokenTypes.PwTokenCoolDown memory)
    {
        return _coolDowns[account];
    }

    function stake(uint256 stakedTokenAmount) external override whenNotPaused nonReentrant {
        require(stakedTokenAmount != 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);

        IERC20Upgradeable(stakedTokenAddress).transferFrom(
            msgSender,
            address(this),
            stakedTokenAmount
        );

        uint256 baseAmount = PowerTokenMath.division(
            stakedTokenAmount * Constants.D18,
            exchangeRate
        );

        _baseBalance[msgSender] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit Stake(msgSender, stakedTokenAmount, exchangeRate, baseAmount);
    }

    function unstake(uint256 pwTokenAmount) external override whenNotPaused nonReentrant {
        require(pwTokenAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;
        address msgSender = _msgSender();

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);
        uint256 availablePwTokenAmount = _getAvailablePwTokenAmount(msgSender, exchangeRate);

        require(
            availablePwTokenAmount >= pwTokenAmount,
            MiningErrors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        uint256 baseAmountToUnstake = PowerTokenMath.division(
            pwTokenAmount * Constants.D18,
            exchangeRate
        );

        require(
            _baseBalance[msgSender] >= baseAmountToUnstake,
            MiningErrors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        uint256 stakedTokenAmountToTransfer = _calculateBaseAmountToPwToken(
            _calculateAmountWithCooldownFeeSubtracted(baseAmountToUnstake),
            exchangeRate
        );

        IERC20Upgradeable(stakedTokenAddress).transfer(msgSender, stakedTokenAmountToTransfer);

        emit Unstake(
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
        require(lpTokens.length == pwTokenAmountsLength, MiningErrors.INPUT_ARRAYS_LENGTH_MISMATCH);
        uint256 pwTokenToDelegate;

        for (uint256 i; i != pwTokenAmountsLength; ++i) {
            pwTokenToDelegate += pwTokenAmounts[i];
        }

        require(
            _getAvailablePwTokenAmount(
                _msgSender(),
                _calculateInternalExchangeRate(_stakedToken)
            ) >= pwTokenToDelegate,
            MiningErrors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[_msgSender()] += pwTokenToDelegate;

        ILiquidityMiningInternal(_liquidityMining).delegatePwToken(
            _msgSender(),
            lpTokens,
            pwTokenAmounts
        );

        emit DelegateToLiquidityMining(_msgSender(), lpTokens, pwTokenAmounts);
    }

    function delegateAndStakeToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts,
        uint256[] calldata lpTokenAmounts
    ) external override whenNotPaused nonReentrant {
        require(
            lpTokens.length == pwTokenAmounts.length && lpTokens.length == lpTokenAmounts.length,
            MiningErrors.INPUT_ARRAYS_LENGTH_MISMATCH
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
            MiningErrors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[_msgSender()] += pwTokenToDelegate;

        ILiquidityMiningInternal(_liquidityMining).delegatePwTokenAndStakeLpToken(
            _msgSender(),
            lpTokens,
            pwTokenAmounts,
            lpTokenAmounts
        );

        emit DelegateToLiquidityMining(_msgSender(), lpTokens, pwTokenAmounts);
    }

    function undelegateFromLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external override whenNotPaused nonReentrant {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == pwTokenAmounts.length, MiningErrors.INPUT_ARRAYS_LENGTH_MISMATCH);

        uint256 pwTokenAmountToUndelegate;

        for (uint256 i; i != lpTokensLength; ++i) {
            require(pwTokenAmounts[i] > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);
            pwTokenAmountToUndelegate += pwTokenAmounts[i];
        }

        address msgSender = _msgSender();

        require(
            _delegatedToLiquidityMiningBalance[msgSender] >= pwTokenAmountToUndelegate,
            MiningErrors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW
        );

        ILiquidityMiningInternal(_liquidityMining).undelegatePwToken(
            msgSender,
            lpTokens,
            pwTokenAmounts
        );

        _delegatedToLiquidityMiningBalance[msgSender] -= pwTokenAmountToUndelegate;

        emit UndelegateFromLiquidityMining(msgSender, lpTokens, pwTokenAmounts);
    }

    function coolDown(uint256 pwTokenAmount) external override whenNotPaused nonReentrant {
        require(pwTokenAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address msgSender = _msgSender();

        uint256 availablePwTokenAmount = _calculateBaseAmountToPwToken(
            _baseBalance[msgSender],
            _calculateInternalExchangeRate(_stakedToken)
        ) - _delegatedToLiquidityMiningBalance[msgSender];

        require(
            availablePwTokenAmount >= pwTokenAmount,
            MiningErrors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _coolDowns[msgSender] = PowerTokenTypes.PwTokenCoolDown(
            block.timestamp + COOL_DOWN_IN_SECONDS,
            pwTokenAmount
        );
        emit CoolDownChanged(msgSender, pwTokenAmount, block.timestamp + COOL_DOWN_IN_SECONDS);
    }

    function cancelCoolDown() external override whenNotPaused {
        delete _coolDowns[_msgSender()];
        emit CoolDownChanged(_msgSender(), 0, 0);
    }

    function redeem() external override whenNotPaused nonReentrant {
        address msgSender = _msgSender();

        PowerTokenTypes.PwTokenCoolDown memory accountCoolDown = _coolDowns[msgSender];

        require(block.timestamp >= accountCoolDown.endTimestamp, MiningErrors.COOL_DOWN_NOT_FINISH);
        require(accountCoolDown.pwTokenAmount > 0, MiningErrors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);
        uint256 baseAmountToUnstake = PowerTokenMath.division(
            accountCoolDown.pwTokenAmount * Constants.D18,
            exchangeRate
        );

        require(
            _baseBalance[msgSender] >= baseAmountToUnstake,
            MiningErrors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[msgSender] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        delete _coolDowns[msgSender];

        ///@dev We can transfer pwTokenAmount because it is in relation 1:1 to Staked Token
        IERC20Upgradeable(stakedTokenAddress).transfer(msgSender, accountCoolDown.pwTokenAmount);

        emit Redeem(msgSender, accountCoolDown.pwTokenAmount);
    }
}
