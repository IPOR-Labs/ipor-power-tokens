// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/IPowerToken.sol";
import "../interfaces/IStakeService.sol";
import "../libraries/errors/Errors.sol";

contract StakeService is IStakeService {
    using SafeERC20 for IERC20;

    address public immutable LIQUIDITY_MINING;
    address public immutable POWER_TOKEN;
    address public immutable STAKED_TOKEN;

    constructor(
        address liquidityMiningAddress,
        address powerTokenAddress,
        address stakedTokenAddress
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
        LIQUIDITY_MINING = liquidityMiningAddress;
        POWER_TOKEN = powerTokenAddress;
        STAKED_TOKEN = stakedTokenAddress;
    }

    function stakeLpTokens(
        address onBehalfOf,
        address[] calldata lpTokens,
        uint256[] calldata lpTokenAmounts
    ) external {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == lpTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(lpTokensLength > 0, Errors.INPUT_ARRAYS_EMPTY);
        require(onBehalfOf != address(0), Errors.WRONG_ADDRESS);
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpTokens = new LiquidityMiningTypes.UpdateLpToken[](lpTokensLength);

        uint256 senderBalance;
        uint256 transferAmount;
        for (uint256 i; i != lpTokensLength; ) {
            require(lpTokens[i] != address(0), Errors.WRONG_ADDRESS);
            require(lpTokenAmounts[i] > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
            senderBalance = IERC20(lpTokens[i]).balanceOf(msg.sender);
            transferAmount = senderBalance < lpTokenAmounts[i] ? senderBalance : lpTokenAmounts[i];

            IERC20(lpTokens[i]).safeTransferFrom(msg.sender, LIQUIDITY_MINING, transferAmount);
            updateLpTokens[i] = LiquidityMiningTypes.UpdateLpToken(
                onBehalfOf,
                lpTokens[i],
                transferAmount
            );

            unchecked {
                ++i;
            }
        }

        ILiquidityMining(LIQUIDITY_MINING).addLpTokens(updateLpTokens);
    }

    function unstakeLpTokens(
        address transferTo,
        address[] calldata lpTokens,
        uint256[] calldata lpTokenAmounts
    ) external {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == lpTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(lpTokensLength > 0, Errors.INPUT_ARRAYS_EMPTY);
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpTokens = new LiquidityMiningTypes.UpdateLpToken[](lpTokensLength);

        for (uint256 i; i != lpTokensLength; ) {
            require(lpTokens[i] != address(0), Errors.WRONG_ADDRESS);
            require(lpTokenAmounts[i] > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

            updateLpTokens[i] = LiquidityMiningTypes.UpdateLpToken(
                msg.sender,
                lpTokens[i],
                lpTokenAmounts[i]
            );

            unchecked {
                ++i;
            }
        }

        ILiquidityMining(LIQUIDITY_MINING).removeLpTokens(updateLpTokens);

        for (uint256 i; i != lpTokensLength; ) {
            IERC20(lpTokens[i]).safeTransferFrom(LIQUIDITY_MINING, transferTo, lpTokenAmounts[i]);
            unchecked {
                ++i;
            }
        }
    }

    function stakeProtocolToken(address onBehalfOf, uint256 iporTokenAmount) external {
        require(onBehalfOf != address(0), Errors.WRONG_ADDRESS);
        require(iporTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        IPowerToken(POWER_TOKEN).addStakedToken(
            PowerTokenTypes.UpdateStakedToken(onBehalfOf, iporTokenAmount)
        );

        IERC20(STAKED_TOKEN).safeTransferFrom(msg.sender, POWER_TOKEN, iporTokenAmount);
    }

    function unstakeProtocolToken(address transferTo, uint256 iporTokenAmount) external {
        require(iporTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 stakedTokenAmountToTransfer = IPowerToken(POWER_TOKEN).removeStakedTokenWithFee(
            PowerTokenTypes.UpdateStakedToken(msg.sender, iporTokenAmount)
        );

        IERC20(STAKED_TOKEN).safeTransferFrom(POWER_TOKEN, transferTo, stakedTokenAmountToTransfer);
    }

    function cooldown(uint256 pwTokenAmount) external {
        require(pwTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
        IPowerToken(POWER_TOKEN).cooldown(msg.sender, pwTokenAmount);
    }

    function cancelCooldown() external {
        IPowerToken(POWER_TOKEN).cancelCooldown(msg.sender);
    }

    function redeem(address transferTo) external {
        uint256 transferAmount = IPowerToken(POWER_TOKEN).redeem(msg.sender);
        ///@dev We can transfer pwTokenAmount because it is in relation 1:1 to Staked Token
        IERC20(STAKED_TOKEN).safeTransferFrom(POWER_TOKEN, transferTo, transferAmount);
    }

    function getConfiguration()
        external
        view
        returns (
            address liquidityMiningAddress,
            address powerTokenAddress,
            address stakedTokenAddress
        )
    {
        return (LIQUIDITY_MINING, POWER_TOKEN, STAKED_TOKEN);
    }
}
