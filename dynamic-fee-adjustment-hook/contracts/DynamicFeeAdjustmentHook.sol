// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.24;

import "./interfaces/IDynamicFeeAdjustmentHook.sol";
import "./libraries/VolatilityOracle.sol";
import "@balancer-labs/v3-vault/contracts/interfaces/IVault.sol";
import "@balancer-labs/v3-solidity-utils/contracts/helpers/Authentication.sol";
import "@balancer-labs/v3-solidity-utils/contracts/math/FixedPoint.sol";

contract DynamicFeeAdjustmentHook is IDynamicFeeAdjustmentHook, Authentication {
    using FixedPoint for uint256;
    using VolatilityOracle for VolatilityOracle.VolatilityData;

    IVault public immutable vault;

    mapping(address => VolatilityOracle.VolatilityData) private poolVolatility;
    mapping(address => uint256) private poolFees;

    uint256 public minFee;
    uint256 public maxFee;
    uint256 public volatilityThreshold;

    constructor(IVault _vault, uint256 _minFee, uint256 _maxFee, uint256 _volatilityThreshold) Authentication(bytes32("")) {
        vault = _vault;
        minFee = _minFee;
        maxFee = _maxFee;
        volatilityThreshold = _volatilityThreshold;
    }

    function onRegister(
        address factory,
        address pool,
        TokenConfig[] memory tokenConfigs,
        LiquidityManagement calldata
    ) public override onlyVault returns (bool) {
        // Initialize volatility data for the new pool
        uint256 initialPrice = _getInitialPrice(pool, tokenConfigs);
        poolVolatility[pool].initializeVolatilityData(initialPrice);
        poolFees[pool] = minFee;
        return true;
    }

    function onBeforeSwap(IVault.SwapParams calldata params) external override onlyVault returns (bool, uint256) {
        address pool = params.pool;
        uint256 currentVolatility = poolVolatility[pool].getCurrentVolatility();
        uint256 newFee = _calculateFee(currentVolatility);

        if (newFee != poolFees[pool]) {
            poolFees[pool] = newFee;
            emit FeeAdjusted(pool, newFee);
        }

        return (true, newFee);
    }

    function onAfterSwap(IVault.SwapParams calldata params) external override onlyVault {
        address pool = params.pool;
        uint256 newPrice = _calculatePrice(params);
        poolVolatility[pool].updateVolatility(newPrice);
    }

    function getCurrentFee(address pool) external view override returns (uint256) {
        return poolFees[pool];
    }

    function getCurrentVolatility(address pool) external view override returns (uint256) {
        return poolVolatility[pool].getCurrentVolatility();
    }

    function setFeeAdjustmentParameters(uint256 _minFee, uint256 _maxFee, uint256 _volatilityThreshold) external override authenticate {
        require(_minFee < _maxFee, "Min fee must be less than max fee");
        minFee = _minFee;
        maxFee = _maxFee;
        volatilityThreshold = _volatilityThreshold;
    }

    function _calculateFee(uint256 currentVolatility) private view returns (uint256) {
        if (currentVolatility <= volatilityThreshold) {
            return minFee;
        }
        uint256 volatilityRatio = currentVolatility.divDown(volatilityThreshold);
        uint256 feeRange = maxFee - minFee;
        uint256 additionalFee = feeRange.mulDown(volatilityRatio - FixedPoint.ONE);
        return minFee + additionalFee;
    }

    function _calculatePrice(IVault.SwapParams calldata params) private pure returns (uint256) {
        // Simple price calculation, can be improved for more accuracy
        return params.amountIn.divDown(params.amountOut);
    }

    function _getInitialPrice(address pool, TokenConfig[] memory tokenConfigs) private view returns (uint256) {
        require(tokenConfigs.length >= 2, "Pool must have at least two tokens");
        (IERC20[] memory tokens, uint256[] memory balances,) = vault.getPoolTokens(bytes32(uint256(uint160(pool))));
        require(tokens.length >= 2, "Pool must have at least two tokens");
        
        // Use the price ratio of the first two tokens as the initial price
        return balances[0].divDown(balances[1]);
    }

    function getHookFlags() public pure override returns (HookFlags memory hookFlags) {
        hookFlags.shouldCallBeforeSwap = true;
        hookFlags.shouldCallAfterSwap = true;
    }
}