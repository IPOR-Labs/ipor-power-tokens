// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.9;

interface IMiltonFrontendDataProvider {
    struct IporAssetConfigurationFront {
        address asset;
        uint256 minCollateralizationFactorValue;
        uint256 maxCollateralizationFactorValue;
        uint256 openingFeePercentage;
        uint256 iporPublicationFeeAmount;
        uint256 liquidationDepositAmount;
        uint256 incomeTaxPercentage;
        uint256 spreadPayFixedValue;
        uint256 spreadRecFixedValue;
    }

    struct IporSwapFront {
        uint256 id;
        address asset;
        uint256 collateral;
        uint256 notionalAmount;
        uint256 collateralizationFactor;
        uint8 direction;
        uint256 fixedInterestRate;
        int256 positionValue;
        uint256 startingTimestamp;
        uint256 endingTimestamp;
        uint256 liquidationDepositAmount;
    }

	function getIpTokenExchangeRate(address asset) external view returns(uint256);

    function getTotalOutstandingNotional(address asset)
        external
        view
        returns (uint256 payFixedTotalNotional, uint256 recFixedTotalNotional);

    function getMySwaps(address asset)
        external
        view
        returns (IporSwapFront[] memory items);

    function getConfiguration()
        external
        view
        returns (IporAssetConfigurationFront[] memory);
}
