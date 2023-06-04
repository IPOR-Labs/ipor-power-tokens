// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/ILiquidityMiningInternal.sol";
import "../interfaces/IPowerToken.sol";
import "./PowerTokenInternal.sol";

///@title Smart contract responsible for managing Power Token.
/// @notice Power Token is retrieved when the account stakes [Staked] Token.
/// PowerToken smart contract allows staking, unstaking of [Staked] Token, delegating, undelegating of Power Token balance to LiquidityMining.
contract PowerToken is PowerTokenInternal, IPowerToken {
    constructor(
        address routerAddress,
        address stakedTokenAddress
    ) PowerTokenInternal(routerAddress, stakedTokenAddress) {
        _disableInitializers();
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

    function getContractId() external pure returns (bytes32) {
        return 0xbd22bf01cb7daed462db61de31bb111aabcdae27adc748450fb9a9ea1c419cce;
    }

    function totalSupply() external view override returns (uint256) {
        return
            MathOperation.division(
                _baseTotalSupply * _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS),
                1e18
            );
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balanceOf(account);
    }

    function delegatedToLiquidityMiningBalanceOf(
        address account
    ) external view override returns (uint256) {
        return _delegatedToLiquidityMiningBalance[account];
    }

    function getUnstakeWithoutCooldownFee() external view override returns (uint256) {
        return _unstakeWithoutCooldownFee;
    }

    function getActiveCooldown(
        address account
    ) external view returns (PowerTokenTypes.PwTokenCooldown memory) {
        return _cooldowns[account];
    }

    function cooldown(
        address account,
        uint256 pwTokenAmount
    ) external override whenNotPaused onlyRouter {
        uint256 availablePwTokenAmount = _calculateBaseAmountToPwToken(
            _baseBalance[account],
            _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS)
        ) - _delegatedToLiquidityMiningBalance[account];

        require(
            availablePwTokenAmount >= pwTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _cooldowns[account] = PowerTokenTypes.PwTokenCooldown(
            block.timestamp + COOL_DOWN_IN_SECONDS,
            pwTokenAmount
        );
        emit CooldownChanged(pwTokenAmount, block.timestamp + COOL_DOWN_IN_SECONDS);
    }

    function cancelCooldown(address account) external override whenNotPaused onlyRouter {
        delete _cooldowns[account];
        emit CooldownChanged(0, 0);
    }

    function redeem(
        address account
    ) external override whenNotPaused onlyRouter returns (uint256 transferAmount) {
        PowerTokenTypes.PwTokenCooldown memory accountCooldown = _cooldowns[account];
        transferAmount = accountCooldown.pwTokenAmount;
        require(block.timestamp >= accountCooldown.endTimestamp, Errors.COOL_DOWN_NOT_FINISH);
        require(transferAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 exchangeRate = _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS);
        uint256 baseAmountToUnstake = MathOperation.division(transferAmount * 1e18, exchangeRate);

        require(
            _baseBalance[account] >= baseAmountToUnstake,
            Errors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[account] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        delete _cooldowns[account];

        emit Redeem(account, transferAmount);
    }

    function addStakedToken(
        PowerTokenTypes.UpdateStakedToken memory updateStakedToken
    ) external onlyRouter {
        require(updateStakedToken.stakedTokenAmount != 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        //TODO: don't have to use in param governance token, because is available in this method
        uint256 exchangeRate = _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS);

        uint256 baseAmount = MathOperation.division(
            updateStakedToken.stakedTokenAmount * 1e18,
            exchangeRate
        );

        _baseBalance[updateStakedToken.onBehalfOf] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit StakedTokenAdded(
            updateStakedToken.onBehalfOf,
            updateStakedToken.stakedTokenAmount,
            exchangeRate,
            baseAmount
        );
    }

    function removeStakedTokenWithFee(
        PowerTokenTypes.UpdateStakedToken memory updateStakedToken
    ) external onlyRouter returns (uint256 stakedTokenAmountToTransfer) {
        require(updateStakedToken.stakedTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address account = updateStakedToken.onBehalfOf;

        uint256 exchangeRate = _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS);
        uint256 availablePwTokenAmount = _getAvailablePwTokenAmount(account, exchangeRate);

        require(
            availablePwTokenAmount >= updateStakedToken.stakedTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        uint256 baseAmountToUnstake = MathOperation.division(
            updateStakedToken.stakedTokenAmount * 1e18,
            exchangeRate
        );

        require(
            _baseBalance[account] >= baseAmountToUnstake,
            Errors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[account] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        stakedTokenAmountToTransfer = _calculateBaseAmountToPwToken(
            _calculateAmountWithCooldownFeeSubtracted(baseAmountToUnstake),
            exchangeRate
        );

        emit StakedTokenRemovedWithFee(
            account,
            updateStakedToken.stakedTokenAmount,
            exchangeRate,
            updateStakedToken.stakedTokenAmount - stakedTokenAmountToTransfer
        );
    }

    //TODO: change to delegateInternal in places where modifier allow requests from our smart contracts
    function delegate(
        address account,
        uint256 pwTokenAmount
    ) external override whenNotPaused onlyRouter {
        require(
            _getAvailablePwTokenAmount(
                account,
                _calculateInternalExchangeRate(_STAKED_TOKEN_ADDRESS)
            ) >= pwTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[account] += pwTokenAmount;
        emit Delegated(account, pwTokenAmount);
    }

    function undelegate(
        address account,
        uint256 pwTokenAmount
    ) external override whenNotPaused onlyRouter {
        require(
            _delegatedToLiquidityMiningBalance[account] >= pwTokenAmount,
            Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[account] -= pwTokenAmount;
        emit Undelegated(account, pwTokenAmount);
    }
}
