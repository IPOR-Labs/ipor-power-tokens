// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/IPowerToken.sol";
import "../interfaces/IPowerTokenStakeService.sol";
import "../libraries/errors/Errors.sol";

contract StakeService is IPowerTokenStakeService {
    using SafeERC20 for IERC20;

    address public immutable LIQUIDITY_MINING;
    address public immutable POWER_TOKEN;
    address public immutable GOVERNANCE_TOKEN;

    constructor(address liquidityMining, address powerToken, address governanceToken) {
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
        POWER_TOKEN = powerToken;
        GOVERNANCE_TOKEN = governanceToken;
    }

    function stakeLpTokensToLiquidityMining(
        address beneficiary,
        address[] calldata lpTokens,
        uint256[] calldata lpTokenMaxAmounts
    ) external {
        uint256 lpTokensLength = lpTokens.length;
        require(lpTokensLength == lpTokenMaxAmounts.length, Errors.INPUT_ARRAYS_LENGTH_MISMATCH);
        require(lpTokensLength > 0, Errors.INPUT_ARRAYS_EMPTY);
        require(beneficiary != address(0), Errors.WRONG_ADDRESS);
        LiquidityMiningTypes.UpdateLpToken[]
            memory updateLpTokens = new LiquidityMiningTypes.UpdateLpToken[](lpTokensLength);

        uint256 senderBalance;
        uint256 transferAmount;
        for (uint256 i; i != lpTokensLength; ) {
            require(lpTokens[i] != address(0), Errors.WRONG_ADDRESS);
            require(lpTokenMaxAmounts[i] > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
            senderBalance = IERC20(lpTokens[i]).balanceOf(msg.sender);
            transferAmount = senderBalance < lpTokenMaxAmounts[i]
                ? senderBalance
                : lpTokenMaxAmounts[i];

            IERC20(lpTokens[i]).safeTransferFrom(msg.sender, LIQUIDITY_MINING, transferAmount);
            updateLpTokens[i] = LiquidityMiningTypes.UpdateLpToken(
                beneficiary,
                lpTokens[i],
                transferAmount
            );

            unchecked {
                ++i;
            }
        }

        ILiquidityMining(LIQUIDITY_MINING).addLpTokensInternal(updateLpTokens);
    }

    function unstakeLpTokensFromLiquidityMining(
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

        ILiquidityMining(LIQUIDITY_MINING).removeLpTokensInternal(updateLpTokens);

        for (uint256 i; i != lpTokensLength; ) {
            IERC20(lpTokens[i]).safeTransferFrom(LIQUIDITY_MINING, transferTo, lpTokenAmounts[i]);
            unchecked {
                ++i;
            }
        }
    }

    function stakeGovernanceTokenToPowerToken(
        address beneficiary,
        uint256 governanceTokenAmount
    ) external {
        require(beneficiary != address(0), Errors.WRONG_ADDRESS);
        require(governanceTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        IPowerToken(POWER_TOKEN).addGovernanceTokenInternal(
            PowerTokenTypes.UpdateGovernanceToken(beneficiary, governanceTokenAmount)
        );

        IERC20(GOVERNANCE_TOKEN).safeTransferFrom(msg.sender, POWER_TOKEN, governanceTokenAmount);
    }

    function unstakeGovernanceTokenFromPowerToken(
        address transferTo,
        uint256 governanceTokenAmount
    ) external {
        require(governanceTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 governanceTokenAmountToTransfer = IPowerToken(POWER_TOKEN)
            .removeGovernanceTokenWithFeeInternal(
                PowerTokenTypes.UpdateGovernanceToken(msg.sender, governanceTokenAmount)
            );

        IERC20(GOVERNANCE_TOKEN).safeTransferFrom(
            POWER_TOKEN,
            transferTo,
            governanceTokenAmountToTransfer
        );
    }

    function pwTokenCooldown(uint256 pwTokenAmount) external {
        require(pwTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
        IPowerToken(POWER_TOKEN).cooldownInternal(msg.sender, pwTokenAmount);
    }

    function pwTokenCancelCooldown() external {
        IPowerToken(POWER_TOKEN).cancelCooldownInternal(msg.sender);
    }

    function redeemPwToken(address transferTo) external {
        uint256 transferAmount = IPowerToken(POWER_TOKEN).redeemInternal(msg.sender);
        ///@dev pwTokenAmount can be transfered because it is in relation 1:1 to Governace Token
        IERC20(GOVERNANCE_TOKEN).safeTransferFrom(POWER_TOKEN, transferTo, transferAmount);
    }

    function getConfiguration()
        external
        view
        returns (
            address liquidityMiningAddress,
            address powerTokenAddress,
            address governanceTokenAddress
        )
    {
        return (LIQUIDITY_MINING, POWER_TOKEN, GOVERNANCE_TOKEN);
    }
}
