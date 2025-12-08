// /scripts/deploy.ts - ROBUST VIEM DEPLOYMENT FIX

import hre from 'hardhat';
// Ensure viem plugin types/runtime are available
import '@nomicfoundation/hardhat-viem';
// NOTE: We do not rely on hre.viem here, but access the clients via the Hardhat methods.

async function main() {
  console.log('Deploying OrderTracker...');

  // Try using Viem runtime if available, otherwise fall back to Hardhat Ethers
  const viemRuntime = (hre as any).viem;
  if (viemRuntime && typeof viemRuntime.getViemClients === 'function') {
    console.log('Using Viem clients from Hardhat runtime');
    const { publicClient, walletClients } = await viemRuntime.getViemClients();
    const [deployer] = walletClients;

    // Read compiled artifact
    const artifact = await hre.artifacts.readArtifact('OrderTracker');

    console.log(`Deployer address: ${deployer.account.address}`);

    // Deploy using viem deployer
    const hash = await deployer.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode,
      args: [],
    });

    console.log(`Deployment transaction hash: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const address = receipt.contractAddress;
    if (!address)
      throw new Error('Contract deployment failed to return an address.');
    console.log(`OrderTracker deployed to: ${address}`);
    return;
  }

  // Fallback to Hardhat Ethers
  if ((hre as any).ethers) {
    console.log('Viem not available — falling back to Hardhat Ethers');
    const ethers = (hre as any).ethers;
    const OrderTracker = await ethers.getContractFactory('OrderTracker');
    const orderTracker = await OrderTracker.deploy();
    await orderTracker.waitForDeployment();
    const address = await orderTracker.getAddress();
    console.log(`OrderTracker deployed to: ${address}`);
    return;
  }

  throw new Error(
    'No supported deployment clients available (viem or ethers).'
  );

  // NOTE: Copy this address (e.g., 0x5FbDB2315678afec8c3562b921AA65B2eB42d14A)
  // and update the CONTRACT_ADDRESS in /lib/blockchain.ts
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
