# Dynamic Fee Adjustment Hook for Balancer V3

This project implements a Dynamic Fee Adjustment Hook for Balancer V3 pools, optimizing swap fees based on market volatility and trading volume.

## Project Structure

```
dynamic-fee-adjustment-hook/
├── contracts/
│   ├── interfaces/
│   │   └── IDynamicFeeAdjustmentHook.sol
│   ├── libraries/
│   │   └── VolatilityOracle.sol
│   ├── mocks/
│   │   └── MockPool.sol
│   └── DynamicFeeAdjustmentHook.sol
├── migrations/
│   └── 1_deploy_contracts.js
├── test/
│   ├── DynamicFeeAdjustmentHook.test.js
│   └── DynamicFeeAdjustmentHook.integration.test.js
├── .gitignore
├── .solhint.json
└── README.md
```

## Features

- Dynamic fee adjustment based on market volatility
- Integration with Balancer V3 pools
- Configurable minimum and maximum fees
- Volatility calculation using exponential moving averages

## Installation


3. Install dependencies:
   ```
   npm install
   ```

## Usage

1. Compile the contracts:
   ```
   truffle compile
   ```
2. Run tests:
   ```
   truffle test
   ```
3. Deploy to a network (update truffle-config.js with your preferred network settings):
   ```
   truffle migrate --network <network-name>
   ```

## Testing

The project includes both unit tests and integration tests:
- `DynamicFeeAdjustmentHook.test.js`: Unit tests for the hook contract
- `DynamicFeeAdjustmentHook.integration.test.js`: Integration tests with mock Balancer components

Run all tests with:
```
truffle test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the GPL-3.0 License.
