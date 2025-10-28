require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('@nomicfoundation/hardhat-ethers');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.19',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    hederaTestnet: {
      url: 'https://testnet.hashio.io/api',
      accounts: process.env.HEDERA_PRIVATE_KEY && process.env.HEDERA_PRIVATE_KEY !== 'your_hedera_private_key_here' ? [process.env.HEDERA_PRIVATE_KEY] : [],
      chainId: 296,
      gas: 'auto',
      gasPrice: 'auto',
      timeout: 120000,
    },
    hederaMainnet: {
      url: 'https://mainnet.hashio.io/api',
      accounts: process.env.HEDERA_PRIVATE_KEY && process.env.HEDERA_PRIVATE_KEY !== 'your_hedera_private_key_here' ? [process.env.HEDERA_PRIVATE_KEY] : [],
      chainId: 295,
      gas: 'auto',
      gasPrice: 'auto',
      timeout: 120000,
    },
  },
  paths: {
    sources: './src/lib/contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 120000,
  },
  etherscan: {
    apiKey: {
      hederaTestnet: 'abc', // Placeholder for Hedera
      hederaMainnet: 'abc', // Placeholder for Hedera
    },
    customChains: [
      {
        network: 'hederaTestnet',
        chainId: 296,
        urls: {
          apiURL: 'https://server-verify.hashscan.io',
          browserURL: 'https://hashscan.io/testnet',
        },
      },
      {
        network: 'hederaMainnet',
        chainId: 295,
        urls: {
          apiURL: 'https://server-verify.hashscan.io',
          browserURL: 'https://hashscan.io/mainnet',
        },
      },
    ],
  },
};