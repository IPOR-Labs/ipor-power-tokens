// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/ILiquidityMiningInternalV2.sol";
import "../interfaces/IPowerTokenV2.sol";
import "./PowerTokenInternalV2.sol";

///@title Smart contract responsible for managing Power Token.
/// @notice Power Token is retrieved when the account stakes [Staked] Token.
/// PowerToken smart contract allows staking, unstaking of [Staked] Token, delegating, undelegating of Power Token balance to LiquidityMining.
contract PowerTokenV2 is PowerTokenInternalV2, IPowerTokenV2 {
    address internal immutable ROUTER_ADDRESS; // Router address

    constructor(address routerAddress) {
        require(routerAddress != address(0), Errors.WRONG_ADDRESS);
        ROUTER_ADDRESS = routerAddress;
        _disableInitializers();
    }

    modifier onlyRouter() {
        require(_msgSender() == ROUTER_ADDRESS, Errors.NOT_ROUTER);
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

    //    ----------------------------------------------
    //    New implementation
    //    ----------------------------------------------

    function addStakedToken(IPowerTokenV2.UpdateStakedToken memory updateStakedToken) external {
        require(updateStakedToken.stakedTokenAmount != 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);

        uint256 baseAmount = Math.division(
            updateStakedToken.stakedTokenAmount * Constants.D18,
            exchangeRate
        );

        _baseBalance[updateStakedToken.onBehalfOf] += baseAmount;
        _baseTotalSupply += baseAmount;

        //todo: Add event
    }

    function removeStakedTokenWithFee(IPowerTokenV2.UpdateStakedToken memory updateStakedToken)
        external
        returns (uint256 stakedTokenAmountToTransfer)
    {
        require(updateStakedToken.stakedTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        address stakedTokenAddress = _stakedToken;
        address account = updateStakedToken.onBehalfOf;

        uint256 exchangeRate = _calculateInternalExchangeRate(stakedTokenAddress);
        uint256 availablePwTokenAmount = _getAvailablePwTokenAmount(account, exchangeRate);

        require(
            availablePwTokenAmount >= updateStakedToken.stakedTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        uint256 baseAmountToUnstake = Math.division(
            updateStakedToken.stakedTokenAmount * Constants.D18,
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

        //todo add event
    }

    function delegate(address account, uint256 pwTokenAmount)
        external
        override
        whenNotPaused
        onlyRouter
    {
        require(
            _getAvailablePwTokenAmount(account, _calculateInternalExchangeRate(_stakedToken)) >=
                pwTokenAmount,
            Errors.ACC_AVAILABLE_POWER_TOKEN_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[account] += pwTokenAmount;
        // todo add event
    }

    function undelegate(address account, uint256 pwTokenAmount)
        external
        override
        whenNotPaused
        onlyRouter
    {
        require(
            _delegatedToLiquidityMiningBalance[account] >= pwTokenAmount,
            Errors.ACC_DELEGATED_TO_LIQUIDITY_MINING_BALANCE_IS_TOO_LOW
        );

        _delegatedToLiquidityMiningBalance[account] -= pwTokenAmount;

        //        todo add event
    }
}
