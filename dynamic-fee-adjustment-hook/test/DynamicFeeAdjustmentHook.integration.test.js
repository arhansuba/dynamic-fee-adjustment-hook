const DynamicFeeAdjustmentHook = artifacts.require("DynamicFeeAdjustmentHook");
const MockVault = artifacts.require("MockVault");
const MockPool = artifacts.require("MockPool");
const MockToken = artifacts.require("MockToken");
const { expect } = require('chai');
const { BN, expectEvent, time } = require('@openzeppelin/test-helpers');

contract('DynamicFeeAdjustmentHook Integration', function (accounts) {
    const [owner, user1, user2] = accounts;
    const minFee = new BN('10000000000000000'); // 1%
    const maxFee = new BN('50000000000000000'); // 5%
    const volatilityThreshold = new BN('1000000000000000000'); // 1.0 in 18 decimal fixed point

    let hook, vault, pool, tokenA, tokenB;

    beforeEach(async function () {
        vault = await MockVault.new();
        hook = await DynamicFeeAdjustmentHook.new(vault.address, minFee, maxFee, volatilityThreshold);
        
        tokenA = await MockToken.new("Token A", "TKA", 18);
        tokenB = await MockToken.new("Token B", "TKB", 18);

        pool = await MockPool.new(vault.address, hook.address);

        // Initialize pool with some liquidity
        await tokenA.mint(pool.address, new BN('1000000000000000000000')); // 1000 tokens
        await tokenB.mint(pool.address, new BN('1000000000000000000000')); // 1000 tokens

        await vault.registerPool(pool.address);
        await hook.onRegister(vault.address, pool.address, [
            { token: tokenA.address, scaling: new BN('1000000000000000000') },
            { token: tokenB.address, scaling: new BN('1000000000000000000') }
        ], {});
    });

    describe('Swap Simulation', function () {
        it('should adjust fees over multiple swaps', async function () {
            const initialFee = await hook.getCurrentFee(pool.address);
            expect(initialFee).to.be.bignumber.equal(minFee);

            // Simulate multiple swaps
            for (let i = 0; i < 10; i++) {
                const swapParams = {
                    pool: pool.address,
                    tokenIn: tokenA.address,
                    tokenOut: tokenB.address,
                    amountIn: new BN('1000000000000000000'), // 1 token
                    amountOut: new BN('950000000000000000'), // 0.95 token (5% slippage)
                };

                await vault.simulateSwap(swapParams);
                await time.increase(time.duration.minutes(5)); // Increase time between swaps
            }

            const finalFee = await hook.getCurrentFee(pool.address);
            expect(finalFee).to.be.bignumber.greaterThan(initialFee);
        });
    });

    describe('Volatility Calculation', function () {
        it('should increase volatility with price changes', async function () {
            const initialVolatility = await hook.getCurrentVolatility(pool.address);

            // Simulate swaps with varying prices
            const swapScenarios = [
                { amountIn: '1000000000000000000', amountOut: '950000000000000000' },
                { amountIn: '1000000000000000000', amountOut: '1050000000000000000' },
                { amountIn: '1000000000000000000', amountOut: '900000000000000000' },
                { amountIn: '1000000000000000000', amountOut: '1100000000000000000' },
            ];

            for (const scenario of swapScenarios) {
                const swapParams = {
                    pool: pool.address,
                    tokenIn: tokenA.address,
                    tokenOut: tokenB.address,
                    amountIn: new BN(scenario.amountIn),
                    amountOut: new BN(scenario.amountOut),
                };

                await vault.simulateSwap(swapParams);
                await time.increase(time.duration.hours(1));
            }

            const finalVolatility = await hook.getCurrentVolatility(pool.address);
            expect(finalVolatility).to.be.bignumber.greaterThan(initialVolatility);
        });
    });

    describe('Fee Limits', function () {
        it('should never exceed maxFee', async function () {
            // Simulate extreme volatility
            for (let i = 0; i < 20; i++) {
                const swapParams = {
                    pool: pool.address,
                    tokenIn: tokenA.address,
                    tokenOut: tokenB.address,
                    amountIn: new BN('1000000000000000000'),
                    amountOut: new BN(i % 2 === 0 ? '500000000000000000' : '2000000000000000000'),
                };

                await vault.simulateSwap(swapParams);
                await time.increase(time.duration.minutes(1));
            }

            const finalFee = await hook.getCurrentFee(pool.address);
            expect(finalFee).to.be.bignumber.at.most(maxFee);
        });
    });
});