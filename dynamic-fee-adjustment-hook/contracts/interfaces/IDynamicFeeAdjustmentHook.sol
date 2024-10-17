// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "@balancer-labs/v3-vault/contracts/interfaces/IHooks.sol";
import "@balancer-labs/v3-vault/contracts/interfaces/IVault.sol";
import "@balancer-labs/v3-vault/contracts/VaultTypes.sol";

interface IDynamicFeeAdjustmentHook is IHooks {
    /**
     * @notice Emitted when the fee is adjusted
     * @param pool The address of the pool
     * @param newFee The new fee percentage (scaled by 1e18)
     */
    event FeeAdjusted(address indexed pool, uint256 newFee);

    /**
     * @notice Called before a swap to potentially adjust the fee
     * @param params The swap parameters
     * @return True if the swap should proceed, false otherwise
     * @return The adjusted swap fee percentage (scaled by 1e18)
     */
    function onBeforeSwap(IVault.SwapParams calldata params) external returns (bool, uint256);

    /**
     * @notice Called after a swap to update volatility metrics
     * @param params The swap parameters
     */
    function onAfterSwap(IVault.SwapParams calldata params) external;

    /**
     * @notice Get the current fee for a specific pool
     * @param pool The address of the pool
     * @return The current fee percentage (scaled by 1e18)
     */
    function getCurrentFee(address pool) external view returns (uint256);

    /**
     * @notice Set the parameters for fee adjustment
     * @param minFee The minimum fee percentage (scaled by 1e18)
     * @param maxFee The maximum fee percentage (scaled by 1e18)
     * @param volatilityThreshold The volatility threshold for fee adjustment
     */
    function setFeeAdjustmentParameters(uint256 minFee, uint256 maxFee, uint256 volatilityThreshold) external;

    /**
     * @notice Get the current volatility measure for a specific pool
     * @param pool The address of the pool
     * @return The current volatility measure
     */
    function getCurrentVolatility(address pool) external view returns (uint256);
}