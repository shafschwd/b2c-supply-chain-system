// /hardhat.config.ts - TOOLBOX VIEM SETUP

import { HardhatUserConfig } from 'hardhat/config';
import toolbox from '@nomicfoundation/hardhat-toolbox-viem';

const config: HardhatUserConfig = {
  // @ts-ignore - plugins might not be in the type definition yet for v3
  plugins: [toolbox],
  solidity: '0.8.20',
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31337,
    },
    sepolia: {
      type: 'http',
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
