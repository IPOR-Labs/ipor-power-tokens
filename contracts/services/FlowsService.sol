// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IPowerTokenFlowsService.sol";
import "../interfaces/ILiquidityMining.sol";
import "../interfaces/IPowerToken.sol";
import "../libraries/errors/Errors.sol";
import "../libraries/ContractValidator.sol";

/// @dev It is not recommended to use service contract directly, should be used only through router (like IporProtocolRouter or PowerTokenRouter)
contract FlowsService is IPowerTokenFlowsService {
    using ContractValidator for address;
    using SafeERC20 for IERC20;
    address public immutable liquidityMining;
    address public immutable powerToken;
    address public immutable governanceToken;

    constructor(
        address liquidityMiningInput,
        address governanceTokenInput,
        address powerTokenInput
    ) {
        liquidityMining = liquidityMiningInput.checkAddress();
        governanceToken = governanceTokenInput.checkAddress();
        powerToken = powerTokenInput.checkAddress();
    }

    function getConfiguration() external view returns (address, address, address) {
        return (liquidityMining, powerToken, governanceToken);
    }

    function claimRewardsFromLiquidityMining(address[] calldata lpTokens) external {
        require(lpTokens.length > 0, Errors.INPUT_ARRAYS_EMPTY);
        uint256 rewardsAmountToTransfer = ILiquidityMining(liquidityMining).claimInternal(
            msg.sender,
            lpTokens
        );
        require(rewardsAmountToTransfer > 0, Errors.NO_REWARDS_TO_CLAIM);
        IPowerToken(powerToken).addGovernanceTokenInternal(
            PowerTokenTypes.UpdateGovernanceToken(msg.sender, rewardsAmountToTransfer)
        );
        IERC20(governanceToken).safeTransferFrom(
            liquidityMining,
            powerToken,
            rewardsAmountToTransfer
        );
    }

    function updateIndicatorsInLiquidityMining(
        address account,
        address[] calldata lpTokens
    ) external {
        require(lpTokens.length > 0, Errors.INPUT_ARRAYS_EMPTY);
        ILiquidityMining(liquidityMining).updateIndicators(account, lpTokens);
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
        IPowerToken(powerToken).delegateInternal(account, totalGovernanceTokenAmount);
        ILiquidityMining(liquidityMining).addPwTokensInternal(updatePwTokens);
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
        ILiquidityMining(liquidityMining).removePwTokensInternal(updatePwTokens);
        IPowerToken(powerToken).undelegateInternal(account, totalGovernanceTokenAmount);
    }
}
