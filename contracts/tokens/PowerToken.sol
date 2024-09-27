// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "../interfaces/ILiquidityMiningInternal.sol";
import "../interfaces/IPowerToken.sol";
import "./PowerTokenInternal.sol";

///@title Smart contract responsible for managing Power Token.
/// @notice Power Token is retrieved when the account stakes [Staked] Token.
/// PowerToken smart contract allows for staking, unstaking of [Staked] Token, delegating, undelegating of Power Token balance to LiquidityMining.
contract PowerToken is PowerTokenInternal, IPowerToken {
    constructor(
        address routerAddress,
        address governanceTokenAddress,
        uint256 coolDownInSeconds
    ) PowerTokenInternal(routerAddress, governanceTokenAddress, coolDownInSeconds) {
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
        return MathOperation.division(_baseTotalSupply * _calculateInternalExchangeRate(), 1e18);
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

    function cooldownInternal(
        address account,
        uint256 pwTokenAmount
    ) external override whenNotPaused onlyRouter {
        uint256 availablePwTokenAmount = _calculateBaseAmountToPwToken(
            _baseBalance[account],
            _calculateInternalExchangeRate()
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

    function cancelCooldownInternal(address account) external override whenNotPaused onlyRouter {
        delete _cooldowns[account];
        emit CooldownChanged(0, 0);
    }

    function redeemInternal(
        address account
    ) external override whenNotPaused onlyRouter returns (uint256 transferAmount) {
        PowerTokenTypes.PwTokenCooldown memory accountCooldown = _cooldowns[account];
        transferAmount = accountCooldown.pwTokenAmount;
        require(block.timestamp >= accountCooldown.endTimestamp, Errors.COOL_DOWN_NOT_FINISH);
        require(transferAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 exchangeRate = _calculateInternalExchangeRate();
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

    function addGovernanceTokenInternal(
        PowerTokenTypes.UpdateGovernanceToken memory updateGovernanceToken
    ) external onlyRouter {
        require(
            updateGovernanceToken.governanceTokenAmount != 0,
            Errors.VALUE_NOT_GREATER_THAN_ZERO
        );

        uint256 exchangeRate = _calculateInternalExchangeRate();

        uint256 baseAmount = MathOperation.division(
            updateGovernanceToken.governanceTokenAmount * 1e18,
            exchangeRate
        );

        _baseBalance[updateGovernanceToken.beneficiary] += baseAmount;
        _baseTotalSupply += baseAmount;

        emit GovernanceTokenAdded(
            updateGovernanceToken.beneficiary,
            updateGovernanceToken.governanceTokenAmount,
            exchangeRate,
            baseAmount
        );
    }

    function removeGovernanceTokenWithFeeInternal(
        PowerTokenTypes.UpdateGovernanceToken memory updateGovernanceToken
    ) external onlyRouter returns (uint256 governanceTokenAmountToTransfer) {
        require(
            updateGovernanceToken.governanceTokenAmount > 0,
            Errors.VALUE_NOT_GREATER_THAN_ZERO
        );

        address account = updateGovernanceToken.beneficiary;

        uint256 exchangeRate = _calculateInternalExchangeRate();
        uint256 availablePwTokenAmount = _getAvailablePwTokenAmount(account, exchangeRate);

        require(
            availablePwTokenAmount >= updateGovernanceToken.governanceTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        uint256 baseAmountToUnstake = MathOperation.division(
            updateGovernanceToken.governanceTokenAmount * 1e18,
            exchangeRate
        );

        require(
            _baseBalance[account] >= baseAmountToUnstake,
            Errors.ACCOUNT_BASE_BALANCE_IS_TOO_LOW
        );

        _baseBalance[account] -= baseAmountToUnstake;
        _baseTotalSupply -= baseAmountToUnstake;

        governanceTokenAmountToTransfer = _calculateBaseAmountToPwToken(
            _calculateAmountWithCooldownFeeSubtracted(baseAmountToUnstake),
            exchangeRate
        );

        emit GovernanceTokenRemovedWithFee(
            account,
            updateGovernanceToken.governanceTokenAmount,
            exchangeRate,
            updateGovernanceToken.governanceTokenAmount - governanceTokenAmountToTransfer
        );
    }

    function delegateInternal(
        address account,
        uint256 pwTokenAmount
    ) external override whenNotPaused onlyRouter {
        require(
            _getAvailablePwTokenAmount(account, _calculateInternalExchangeRate()) >= pwTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[account] += pwTokenAmount;
        emit Delegated(account, pwTokenAmount);
    }

    function undelegateInternal(
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
