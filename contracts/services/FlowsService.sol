// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPowerTokenFlowsService.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/IPowerToken.sol";
import "../libraries/errors/Errors.sol";

contract FlowsService is IPowerTokenFlowsService {
    using SafeERC20 for IERC20;
    address public immutable LIQUIDITY_MINING;
    address public immutable POWER_TOKEN;
    address public immutable STAKED_TOKEN;

    constructor(address liquidityMining, address governanceToken, address powerToken) {
        require(
            liquidityMining != address(0),
            string.concat(Errors.WRONG_ADDRESS, " liquidityMining")
        );
        require(
            governanceToken != address(0),
            string.concat(Errors.WRONG_ADDRESS, " governanceToken")
        );
        require(powerToken != address(0), string.concat(Errors.WRONG_ADDRESS, " powerToken"));
        LIQUIDITY_MINING = liquidityMining;
        STAKED_TOKEN = governanceToken;
        POWER_TOKEN = powerToken;
    }

    function claimRewardsFromLiquidityMining(address[] calldata lpTokens) external {
        require(lpTokens.length > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 rewardsAmountToTransfer = ILiquidityMining(LIQUIDITY_MINING).claim(
            msg.sender,
            lpTokens
        );
        require(rewardsAmountToTransfer > 0, Errors.NO_REWARDS_TO_CLAIM);
        IPowerToken(POWER_TOKEN).addGovernanceToken(
            PowerTokenTypes.UpdateGovernanceToken(msg.sender, rewardsAmountToTransfer)
        );
        IERC20(STAKED_TOKEN).safeTransferFrom(
            LIQUIDITY_MINING,
            POWER_TOKEN,
            rewardsAmountToTransfer
        );
    }

    function updateIndicatorsInLiquidityMining(
        address account,
        address[] calldata lpTokens
    ) external {
        require(lpTokens.length > 0, Errors.INPUT_ARRAYS_EMPTY);
        ILiquidityMining(LIQUIDITY_MINING).updateIndicators(account, lpTokens);
    }

    function delegatePwTokensToLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == pwTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(lpTokensLength > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 totalGovernanceTokenAmount;
        address account = msg.sender;
        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](lpTokensLength);
        for (uint256 i; i != lpTokensLength; ) {
            totalGovernanceTokenAmount += pwTokenAmounts[i];
            updatePwTokens[i] = LiquidityMiningTypes.UpdatePwToken(
                account,
                lpTokens[i],
                pwTokenAmounts[i]
            );
            unchecked {
                ++i;
            }
        }
        IPowerToken(POWER_TOKEN).delegate(account, totalGovernanceTokenAmount);
        ILiquidityMining(LIQUIDITY_MINING).addPwTokens(updatePwTokens);
    }

    function undelegatePwTokensFromLiquidityMining(
        address[] calldata lpTokens,
        uint256[] calldata pwTokenAmounts
    ) external {
        uint256 length = lpTokens.length;
        require(length == pwTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(length > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 totalGovernanceTokenAmount;
        address account = msg.sender;
        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](length);
        for (uint256 i; i != length; ) {
            totalGovernanceTokenAmount += pwTokenAmounts[i];
            updatePwTokens[i] = LiquidityMiningTypes.UpdatePwToken(
                account,
                lpTokens[i],
                pwTokenAmounts[i]
            );
            unchecked {
                ++i;
            }
        }
        require(totalGovernanceTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
        ILiquidityMining(LIQUIDITY_MINING).removePwTokens(updatePwTokens);
        IPowerToken(POWER_TOKEN).undelegate(account, totalGovernanceTokenAmount);
    }

    function getConfiguration()
        external
        view
        returns (address liquidityMining, address powerToken, address governanceToken)
    {
        return (LIQUIDITY_MINING, POWER_TOKEN, STAKED_TOKEN);
    }
}
