// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IFlowsService.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/IPowerToken.sol";
import "../libraries/errors/Errors.sol";

contract FlowsService is IFlowsService {
    using SafeERC20 for IERC20;
    address public immutable liquidityMining;
    address public immutable powerToken;
    address public immutable stakedToken;

    constructor(
        address liquidityMiningAddress,
        address stakedTokenAddress,
        address powerTokenAddress
    ) {
        require(
            liquidityMiningAddress != address(0),
            string.concat(Errors.WRONG_ADDRESS, " liquidityMiningAddress")
        );
        require(
            stakedTokenAddress != address(0),
            string.concat(Errors.WRONG_ADDRESS, " stakedTokenAddress")
        );
        require(
            powerTokenAddress != address(0),
            string.concat(Errors.WRONG_ADDRESS, " powerTokenAddress")
        );
        liquidityMining = liquidityMiningAddress;
        stakedToken = stakedTokenAddress;
        powerToken = powerTokenAddress;
    }

    function claim(address[] calldata lpTokens) external {
        require(lpTokens.length > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 rewardsAmountToTransfer = ILiquidityMining(liquidityMining).claim(
            msg.sender,
            lpTokens
        );
        require(rewardsAmountToTransfer > 0, Errors.NO_REWARDS_TO_CLAIM);
        IPowerToken(powerToken).addStakedToken(
            PowerTokenTypes.UpdateStakedToken(msg.sender, rewardsAmountToTransfer)
        );
        IERC20(stakedToken).safeTransferFrom(liquidityMining, powerToken, rewardsAmountToTransfer);
    }

    function updateIndicators(address account, address[] calldata lpTokens) external {
        require(lpTokens.length > 0, Errors.INPUT_ARRAYS_EMPTY);
        ILiquidityMining(liquidityMining).updateIndicators(account, lpTokens);
    }

    function delegate(address[] calldata lpTokens, uint256[] calldata pwTokenAmounts) external {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == pwTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(lpTokensLength > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 totalStakedTokenAmount;
        address account = msg.sender;
        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](lpTokensLength);
        for (uint256 i; i != lpTokensLength; ) {
            totalStakedTokenAmount += pwTokenAmounts[i];
            updatePwTokens[i] = LiquidityMiningTypes.UpdatePwToken(
                account,
                lpTokens[i],
                pwTokenAmounts[i]
            );
            unchecked {
                ++i;
            }
        }
        IPowerToken(powerToken).delegate(account, totalStakedTokenAmount);
        ILiquidityMining(liquidityMining).addPwTokens(updatePwTokens);
    }

    function undelegate(address[] calldata lpTokens, uint256[] calldata pwTokenAmounts) external {
        uint256 length = lpTokens.length;
        require(length == pwTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(length > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 totalStakedTokenAmount;
        address account = msg.sender;
        LiquidityMiningTypes.UpdatePwToken[]
            memory updatePwTokens = new LiquidityMiningTypes.UpdatePwToken[](length);
        for (uint256 i; i != length; ) {
            totalStakedTokenAmount += pwTokenAmounts[i];
            updatePwTokens[i] = LiquidityMiningTypes.UpdatePwToken(
                account,
                lpTokens[i],
                pwTokenAmounts[i]
            );
            unchecked {
                ++i;
            }
        }
        require(totalStakedTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
        ILiquidityMining(liquidityMining).removePwTokens(updatePwTokens);
        IPowerToken(powerToken).undelegate(account, totalStakedTokenAmount);
    }
}
