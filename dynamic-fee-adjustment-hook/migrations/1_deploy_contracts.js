const DynamicFeeAdjustmentHook = artifacts.require("DynamicFeeAdjustmentHook");

module.exports = function(deployer) {
  deployer.deploy(DynamicFeeAdjustmentHook);
};