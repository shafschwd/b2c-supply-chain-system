// /scripts/deploy.ts - ROBUST VIEM DEPLOYMENT FIX

import hre from 'hardhat';
// Ensure viem plugin types/runtime are available
import '@nomicfoundation/hardhat-viem';
// NOTE: We do not rely on hre.viem here, but access the clients via the Hardhat methods.

async function main() {
  console.log('Deploying OrderTracker...');

  // Hardhat v3: Access viem via network connection
  // @ts-ignore - network.connect is v3 specific
  const { viem } = await hre.network.connect();

  if (viem) {
    console.log("Using Hardhat Viem...");
    const orderTracker = await viem.deployContract("OrderTracker", []);
    console.log(`OrderTracker deployed to: ${orderTracker.address}`);
    return;
  }

  throw new Error("Viem plugin not found availability in network connection.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
