// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "@balancer-labs/v3-solidity-utils/contracts/math/FixedPoint.sol";

/**
 * @title VolatilityOracle
 * @notice Library for calculating and tracking market volatility
 */
library VolatilityOracle {
    using FixedPoint for uint256;

    uint256 private constant ALPHA = 0.5e18; // EMA factor, represented as fixed point
    uint256 private constant SECONDS_PER_DAY = 86400;

    struct VolatilityData {
        uint256 emaPrice;
        uint256 emaPriceSquared;
        uint256 lastUpdateTimestamp;
        uint256 lastVolatility;
    }

    /**
     * @notice Updates the volatility data with a new price observation
     * @param data The volatility data structure
     * @param newPrice The new price observation
     * @return The updated volatility measure
     */
    function updateVolatility(VolatilityData storage data, uint256 newPrice) internal returns (uint256) {
        uint256 timeDelta = block.timestamp - data.lastUpdateTimestamp;
        if (timeDelta == 0) {
            return data.lastVolatility;
        }

        // Calculate time-weighted alpha
        uint256 timeWeight = (ALPHA * timeDelta) / SECONDS_PER_DAY;
        uint256 timeWeightComplement = FixedPoint.ONE - timeWeight;

        // Update EMA of price and price squared
        data.emaPrice = (timeWeight * newPrice + timeWeightComplement * data.emaPrice) / FixedPoint.ONE;
        data.emaPriceSquared = (timeWeight * newPrice.mulDown(newPrice) + timeWeightComplement * data.emaPriceSquared) / FixedPoint.ONE;

        // Calculate volatility
        uint256 variance = data.emaPriceSquared > data.emaPrice.mulDown(data.emaPrice) 
            ? data.emaPriceSquared - data.emaPrice.mulDown(data.emaPrice)
            : 0;
        
        data.lastVolatility = FixedPoint.sqrt(variance);
        data.lastUpdateTimestamp = block.timestamp;

        return data.lastVolatility;
    }

    /**
     * @notice Initializes the volatility data structure
     * @param data The volatility data structure to initialize
     * @param initialPrice The initial price to use
     */
    function initializeVolatilityData(VolatilityData storage data, uint256 initialPrice) internal {
        data.emaPrice = initialPrice;
        data.emaPriceSquared = initialPrice.mulDown(initialPrice);
        data.lastUpdateTimestamp = block.timestamp;
        data.lastVolatility = 0;
    }

    /**
     * @notice Gets the current volatility measure
     * @param data The volatility data structure
     * @return The current volatility measure
     */
    function getCurrentVolatility(VolatilityData storage data) internal view returns (uint256) {
        return data.lastVolatility;
    }
}