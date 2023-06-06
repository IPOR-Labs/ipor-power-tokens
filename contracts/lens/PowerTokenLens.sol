// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "../interfaces/IPowerTokenLens.sol";
import "../interfaces/IPowerToken.sol";
import "../interfaces/IPowerTokenInternal.sol";
import "../libraries/errors/Errors.sol";

contract PowerTokenLens is IPowerTokenLens {
    address public immutable POWER_TOKEN;

    constructor(address powerToken) {
        require(powerToken != address(0), string.concat(Errors.WRONG_ADDRESS, " powerToken"));
        POWER_TOKEN = powerToken;
    }

    function totalSupplyOfPwToken() external view override returns (uint256) {
        return IPowerToken(POWER_TOKEN).totalSupply();
    }

    function balanceOfPwToken(address account) external view override returns (uint256) {
        return IPowerToken(POWER_TOKEN).balanceOf(account);
    }

    function balanceOfPwTokenDelegatedToLiquidityMining(
        address account
    ) external view override returns (uint256) {
        return IPowerToken(POWER_TOKEN).delegatedToLiquidityMiningBalanceOf(account);
    }

    function getPwTokenUnstakeFee() external view returns (uint256) {
        return IPowerToken(POWER_TOKEN).getUnstakeWithoutCooldownFee();
    }

    function getPwTokensInCooldown(
        address account
    ) external view returns (PowerTokenTypes.PwTokenCooldown memory) {
        return IPowerToken(POWER_TOKEN).getActiveCooldown(account);
    }

    function getPwTokenCooldownTime() external view returns (uint256) {
        return IPowerTokenInternal(POWER_TOKEN).COOL_DOWN_IN_SECONDS();
    }

    function getPwTokenExchangeRate() external view returns (uint256) {
        return IPowerTokenInternal(POWER_TOKEN).calculateExchangeRate();
    }

    function getPwTokenTotalSupplyBase() external view returns (uint256) {
        return IPowerTokenInternal(POWER_TOKEN).totalSupplyBase();
    }
}
