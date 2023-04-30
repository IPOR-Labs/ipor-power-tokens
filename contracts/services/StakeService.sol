// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.17;

import "../interfaces/IStakeService.sol";
import "../libraries/errors/Errors.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ILiquidityMiningV2.sol";

contract StakeService is IStakeService {
    using SafeERC20 for IERC20;

    address public immutable LIQUIDITY_MINING_ADDRESS;
    address public immutable POWER_TOKEN_ADDRESS;

    constructor(address liquidityMiningAddress, address powerTokenAddress) {
        LIQUIDITY_MINING_ADDRESS = liquidityMiningAddress;
        POWER_TOKEN_ADDRESS = powerTokenAddress;
    }

    /// @notice Stakes the lpToken amount into the LiquidityMining.
    /// @param lpTokens addresses of the lpToken
    /// @param lpTokenAmounts for lpTokens staked, represented with 18 decimals
    function stakeLpTokens(
        address onBehalfOf,
        address[] calldata lpTokens,
        uint256[] calldata lpTokenAmounts
    ) external {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == lpTokenAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(lpTokensLength > 0, Errors.INPUT_ARRAYS_EMPTY);
        require(onBehalfOf != address(0), Errors.WRONG_ADDRESS);
        ILiquidityMiningV2.UpdateLpToken[]
            memory updateLpTokens = new ILiquidityMiningV2.UpdateLpToken[](lpTokensLength);
        for (uint256 i; i != lpTokensLength; ) {
            require(lpTokens[i] != address(0), Errors.WRONG_ADDRESS);
            require(lpTokenAmounts[i] > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
            uint256 senderBalance = IERC20(lpTokens[i]).balanceOf(msg.sender);
            uint256 transferAmount = senderBalance < lpTokenAmounts[i]
                ? senderBalance
                : lpTokenAmounts[i];

            IERC20(lpTokens[i]).safeTransferFrom(
                msg.sender,
                LIQUIDITY_MINING_ADDRESS,
                transferAmount
            );
            updateLpTokens[i] = ILiquidityMiningV2.UpdateLpToken(
                onBehalfOf,
                lpTokens[i],
                transferAmount
            );

            unchecked {
                ++i;
            }
        }

        ILiquidityMiningV2(LIQUIDITY_MINING_ADDRESS).addLpTokens(updateLpTokens);
    }

    /// @notice Unstakes the lpToken amount from the LiquidityMining.
    /// @param lpToken address of the underlying asset
    /// @param lpTokenAmount lpToken amount being unstaked, represented with 18 decimals
    function unstake(address lpToken, uint256 lpTokenAmount) external {
        revert("Not implemented");
    }
}
