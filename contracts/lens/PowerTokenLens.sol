// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "../interfaces/IPowerTokenLens.sol";
import "../interfaces/IPowerToken.sol";
import "../interfaces/IPowerTokenInternal.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/ContractValidator.sol";

/// @dev It is not recommended to use lens contract directly, should be used only through router (like IporProtocolRouter or PowerTokenRouter)
contract PowerTokenLens is IPowerTokenLens {
    using ContractValidator for address;
    address public immutable powerToken;

    constructor(address powerTokenInput) {
        powerToken = powerTokenInput.checkAddress();
    }

    function totalSupplyOfPwToken() external view override returns (uint256) {
        return IPowerToken(powerToken).totalSupply();
    }

    function balanceOfPwToken(address account) external view override returns (uint256) {
        return IPowerToken(powerToken).balanceOf(account);
    }

    function balanceOfPwTokenDelegatedToLiquidityMining(
        address account
    ) external view override returns (uint256) {
        return IPowerToken(powerToken).delegatedToLiquidityMiningBalanceOf(account);
    }

    function getPwTokenUnstakeFee() external view returns (uint256) {
        return IPowerToken(powerToken).getUnstakeWithoutCooldownFee();
    }

    function getPwTokensInCooldown(
        address account
    ) external view returns (PowerTokenTypes.PwTokenCooldown memory) {
        return IPowerToken(powerToken).getActiveCooldown(account);
    }

    function getPwTokenCooldownTime() external view returns (uint256) {
        return IPowerTokenInternal(powerToken).COOL_DOWN_IN_SECONDS();
    }

    function getPwTokenExchangeRate() external view returns (uint256) {
        return IPowerTokenInternal(powerToken).calculateExchangeRate();
    }

    function getPwTokenTotalSupplyBase() external view returns (uint256) {
        return IPowerTokenInternal(powerToken).totalSupplyBase();
    }
}
