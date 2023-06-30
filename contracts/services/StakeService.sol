// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/IPowerToken.sol";
import "../interfaces/IPowerTokenStakeService.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/ContractValidator.sol";

contract StakeService is IPowerTokenStakeService {
    using ContractValidator for address;
    using SafeERC20 for IERC20;

    address public immutable liquidityMining;
    address public immutable powerToken;
    address public immutable governanceToken;

    constructor(
        address liquidityMiningInput,
        address powerTokenInput,
        address governanceTokenInput
    ) {
        liquidityMining = liquidityMiningInput.checkAddress();
        powerToken = powerTokenInput.checkAddress();
        governanceToken = governanceTokenInput.checkAddress();
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
        return (liquidityMining, powerToken, governanceToken);
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

            IERC20(lpTokens[i]).safeTransferFrom(msg.sender, liquidityMining, transferAmount);
            updateLpTokens[i] = LiquidityMiningTypes.UpdateLpToken(
                beneficiary,
                lpTokens[i],
                transferAmount
            );

            unchecked {
                ++i;
            }
        }

        ILiquidityMining(liquidityMining).addLpTokensInternal(updateLpTokens);
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

        ILiquidityMining(liquidityMining).removeLpTokensInternal(updateLpTokens);

        for (uint256 i; i != lpTokensLength; ) {
            IERC20(lpTokens[i]).safeTransferFrom(liquidityMining, transferTo, lpTokenAmounts[i]);
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

        IPowerToken(powerToken).addGovernanceTokenInternal(
            PowerTokenTypes.UpdateGovernanceToken(beneficiary, governanceTokenAmount)
        );

        IERC20(governanceToken).safeTransferFrom(msg.sender, powerToken, governanceTokenAmount);
    }

    function unstakeGovernanceTokenFromPowerToken(
        address transferTo,
        uint256 governanceTokenAmount
    ) external {
        require(governanceTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);

        uint256 governanceTokenAmountToTransfer = IPowerToken(powerToken)
            .removeGovernanceTokenWithFeeInternal(
                PowerTokenTypes.UpdateGovernanceToken(msg.sender, governanceTokenAmount)
            );

        IERC20(governanceToken).safeTransferFrom(
            powerToken,
            transferTo,
            governanceTokenAmountToTransfer
        );
    }

    function pwTokenCooldown(uint256 pwTokenAmount) external {
        require(pwTokenAmount > 0, Errors.VALUE_NOT_GREATER_THAN_ZERO);
        IPowerToken(powerToken).cooldownInternal(msg.sender, pwTokenAmount);
    }

    function pwTokenCancelCooldown() external {
        IPowerToken(powerToken).cancelCooldownInternal(msg.sender);
    }

    function redeemPwToken(address transferTo) external {
        uint256 transferAmount = IPowerToken(powerToken).redeemInternal(msg.sender);
        ///@dev pwTokenAmount can be transfered because it is in relation 1:1 to Governace Token
        IERC20(governanceToken).safeTransferFrom(powerToken, transferTo, transferAmount);
    }
}
