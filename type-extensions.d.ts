// type-extensions.d.ts

import 'hardhat/types/runtime';
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment extends HardhatEthersHelpers {}
}
