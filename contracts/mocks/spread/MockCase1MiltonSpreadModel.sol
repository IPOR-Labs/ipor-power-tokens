// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.9;

import "./MockBaseMiltonSpreadModel.sol";

//TODO: add set methods and use them in tests, remove many MockCaseX classes
contract MockCase1MiltonSpreadModel is MockBaseMiltonSpreadModel {
    function _getSpreadPremiumsMaxValue()
        internal
        pure
        virtual
        override
        returns (uint256)
    {
        return 10000000000000000;
    }

    function _getDCKfValue() internal pure virtual override returns (uint256) {
        return 1000000000000000;
    }

    function _getDCLambdaValue()
        internal
        pure
        virtual
        override
        returns (uint256)
    {
        return 0;
    }

    function _getDCKOmegaValue()
        internal
        pure
        virtual
        override
        returns (uint256)
    {
        return 30000000000000000;
    }

    function _getDCMaxLiquidityRedemptionValue()
        internal
        pure
        virtual
        override
        returns (uint256)
    {
        return 1000000000000000000;
    }

    function _getAtParComponentKVolValue()
        internal
        pure
        virtual
        override
        returns (uint256)
    {
        return 31000000000000000;
    }

    function _getAtParComponentKHistValue()
        internal
        pure
        virtual
        override
        returns (uint256)
    {
        return 14000000000000000;
    }
}