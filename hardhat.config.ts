// /hardhat.config.ts - TOOLBOX VIEM SETUP

import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem'; // SINGLE import for all features

const config: HardhatUserConfig = {
  solidity: '0.8.20',
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31337,
    },
  },
};

export default config;
