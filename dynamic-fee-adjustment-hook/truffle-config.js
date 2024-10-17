require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    goerli: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`),
      network_id: 5,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    mainnet: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`),
      network_id: 1,
      gas: 5500000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },

  mocha: {
    timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  plugins: ['solidity-coverage'],

  // Configure directory where Truffle should look for contracts from other packages
  contracts_directory: "../*/contracts",

  // Configure the directory where Truffle should put compiled contracts
  contracts_build_directory: "./build/contracts"
};