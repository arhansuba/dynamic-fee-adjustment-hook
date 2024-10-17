const DynamicFeeAdjustmentHook = artifacts.require("DynamicFeeAdjustmentHook");
const MockVault = artifacts.require("MockVault");
const MockPool = artifacts.require("MockPool");
const { expect } = require('chai');
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

contract('DynamicFeeAdjustmentHook', function (accounts) {
    const [owner, user1, user2] = accounts;
    const minFee = new BN('10000000000000000'); // 1%
    const maxFee = new BN('50000000000000000'); // 5%
    const volatilityThreshold = new BN('1000000000000000000'); // 1.0 in 18 decimal fixed point

    let hook, vault, pool;

    beforeEach(async function () {
        vault = await MockVault.new();
        hook = await DynamicFeeAdjustmentHook.new(vault.address, minFee, maxFee, volatilityThreshold);
        pool = await MockPool.new(vault.address, hook.address);
    });

    describe('Initialization', function () {
        it('should set the correct initial values', async function () {
            expect(await hook.vault()).to.equal(vault.address);
            expect(await hook.minFee()).to.be.bignumber.equal(minFee);
            expect(await hook.maxFee()).to.be.bignumber.equal(maxFee);
            expect(await hook.volatilityThreshold()).to.be.bignumber.equal(volatilityThreshold);
        });
    });

    describe('Fee Adjustment', function () {
        it('should adjust fee based on volatility', async function () {
            const swapParams = {
                pool: pool.address,
                tokenIn: constants.ZERO_ADDRESS,
                tokenOut: constants.ZERO_ADDRESS,
                amountIn: new BN('1000000000000000000'),
                amountOut: new BN('900000000000000000'),
            };

            // Simulate multiple swaps to increase volatility
            for (let i = 0; i < 5; i++) {
                await hook.onBeforeSwap(swapParams);
                await hook.onAfterSwap(swapParams);
            }

            const currentFee = await hook.getCurrentFee(pool.address);
            expect(currentFee).to.be.bignumber.greaterThan(minFee);
            expect(currentFee).to.be.bignumber.lessThanOrEqual(maxFee);
        });

        it('should emit FeeAdjusted event when fee changes', async function () {
            const swapParams = {
                pool: pool.address,
                tokenIn: constants.ZERO_ADDRESS,
                tokenOut: constants.ZERO_ADDRESS,
                amountIn: new BN('1000000000000000000'),
                amountOut: new BN('800000000000000000'),
            };

            const receipt = await hook.onBeforeSwap(swapParams);
            expectEvent(receipt, 'FeeAdjusted', { pool: pool.address });
        });
    });

    describe('Parameter Updates', function () {
        it('should allow owner to update fee adjustment parameters', async function () {
            const newMinFee = new BN('20000000000000000'); // 2%
            const newMaxFee = new BN('100000000000000000'); // 10%
            const newVolatilityThreshold = new BN('2000000000000000000'); // 2.0

            await hook.setFeeAdjustmentParameters(newMinFee, newMaxFee, newVolatilityThreshold, { from: owner });

            expect(await hook.minFee()).to.be.bignumber.equal(newMinFee);
            expect(await hook.maxFee()).to.be.bignumber.equal(newMaxFee);
            expect(await hook.volatilityThreshold()).to.be.bignumber.equal(newVolatilityThreshold);
        });

        it('should revert when non-owner tries to update parameters', async function () {
            await expectRevert(
                hook.setFeeAdjustmentParameters(minFee, maxFee, volatilityThreshold, { from: user1 }),
                'ACTION_NOT_AUTHORIZED'
            );
        });
    });
});