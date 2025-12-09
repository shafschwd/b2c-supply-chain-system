// /lib/blockchain.ts (Real Hardhat/Viem interaction)

import {
  createPublicClient,
  createWalletClient,
  http,
  Hex,
  decodeEventLog,
  encodeFunctionData,
  PublicClient,
  WalletClient,
  Address,
} from 'viem';
import { hardhat, sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { BlockchainRecord } from '@/types/blockchain';

// NOTE: Compiled ABI from OrderTracker.sol - Replace with actual compiled ABI from artifacts
// This is a placeholder ABI. Replace with the actual compiled ABI after running 'npx hardhat compile'
const ORDER_TRACKER_ABI_PLACEHOLDER = [
  {
    type: 'function',
    name: 'recordEvent',
    inputs: [
      { name: 'uniqueId', type: 'string' },
      { name: 'eventType', type: 'uint8' },
      { name: 'dataHash', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

import { getAddress } from 'viem';

// --- CONFIGURATION ---
// You MUST update this address after the initial deployment (see Step 2)
const CONTRACT_ADDRESS: Address = getAddress((process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string) || '0x5fbdb2315678afecb367f032d93f642f64180aa3');

// Helper to ensure private key has 0x prefix
const formatPrivateKey = (key: string | undefined): Hex => {
  if (!key) {
    console.warn("⚠️ WARNING: No PRIVATE_KEY found in env. using default Hardhat key (0xac09...). This will fail on Sepolia!");
    return '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  }
  console.log("✅ PRIVATE_KEY loaded from env.");
  if (key.startsWith('0x')) return key as Hex;
  return `0x${key}` as Hex;
};

// Forces use of Hardhat default key (Account #0) when running locally, regardless of env file.
const isSepolia = process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === 'sepolia';
const DEPLOYER_PRIVATE_KEY = isSepolia 
  ? formatPrivateKey(process.env.PRIVATE_KEY) 
  : '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Determine Chain
const CURRENT_CHAIN = process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === 'sepolia' ? sepolia : hardhat;

// --- CLIENTS ---
const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);

// Public Client (for reading/fetching events)
const publicClient: PublicClient = createPublicClient({
  chain: CURRENT_CHAIN,
  transport: http(process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === 'sepolia' ? process.env.SEPOLIA_RPC_URL : 'http://127.0.0.1:8545'), 
});

// Wallet Client (for writing/sending transactions)
const walletClient: WalletClient = createWalletClient({
  account,
  chain: CURRENT_CHAIN,
  transport: http(process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === 'sepolia' ? process.env.SEPOLIA_RPC_URL : 'http://127.0.0.1:8545'),
});

// The ABI for the OrderEvent (must match the event in OrderTracker.sol)
const ORDER_EVENT_ABI = [
  {
    type: 'event',
    name: 'OrderEvent',
    inputs: [
      { name: 'uniqueId', type: 'string', indexed: true },
      { name: 'eventType', type: 'uint8', indexed: true }, // EventType is uint8
      { name: 'dataHash', type: 'bytes32', indexed: false },
      { name: 'sender', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
const ORDER_TRACKER_ABI = ORDER_TRACKER_ABI_PLACEHOLDER; // Using placeholder until artifacts are compiled

// --- FUNCTIONS ---

/**
 * @dev Records a new event on the blockchain. Replaces mockBlockchain.recordTransaction.
 */
export async function recordEventOnChain(
  uniqueId: string,
  eventType: number, // Corresponds to the Solidity Enum index (0, 1, 2, 3)
  dataHash: Hex
): Promise<Hex> {
  try {
    // Prepare the transaction data for the 'recordEvent' function
    const data = encodeFunctionData({
      abi: ORDER_TRACKER_ABI,
      functionName: 'recordEvent',
      args: [uniqueId, eventType, dataHash],
    });

    // Send the transaction via the wallet client (signing it with the deployer account)
    const hash = await walletClient.sendTransaction({
      account,
      chain: CURRENT_CHAIN,
      to: CONTRACT_ADDRESS,
      data: data,
    });

    // Wait for the transaction to be mined
    await publicClient.waitForTransactionReceipt({ hash });

    console.log(
      `[BC] Recorded event ${eventType} for ID ${uniqueId}. TX Hash: ${hash}`
    );
    return hash;
  } catch (error) {
    console.error('Error recording event on chain:', error);
    throw new Error('Blockchain transaction failed.');
  }
}

// Helper to safely fetch logs with a limited block range
const BLOCK_RANGE_LIMIT = 9n; // Alchemy Free Tier: Max 10 blocks inclusive

/**
 * @dev Fetches the latest OrderEvent logs. Replaces mockBlockchain.getLedger.
 */
export async function getBlockchainLedger(): Promise<BlockchainRecord[]> {
  try {
    const currentBlock = BigInt(await publicClient.getBlockNumber());
    const fromBlock = currentBlock - BLOCK_RANGE_LIMIT > 0n ? currentBlock - BLOCK_RANGE_LIMIT : 0n;

    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: ORDER_EVENT_ABI[0],
      fromBlock: fromBlock,
      toBlock: currentBlock 
    });
    console.log(`[BC] Raw logs found: ${logs.length}`);

    const mappedLogs = logs.map((log): BlockchainRecord => {
      const decoded = decodeEventLog({
        abi: ORDER_EVENT_ABI,
        data: log.data,
        topics: log.topics,
      });

      return {
        tx_hash: log.transactionHash,
        block_timestamp: Number(decoded.args.timestamp) * 1000,
        event_type:
          decoded.args.eventType === 0
            ? 'ORDER_CREATED'
            : decoded.args.eventType === 1
            ? 'STATUS_UPDATE'
            : decoded.args.eventType === 2
            ? 'DELIVERY_CONFIRMED'
            : 'PAYMENT_RELEASED',
        data_hash: decoded.args.dataHash as Hex,
        sender_address: decoded.args.sender,
      };
    });
    
    console.log(`[BC] Fetched ${mappedLogs.length} logs.`);
    return mappedLogs;
  } catch (error) {
    console.error('[BC] Error fetching blockchain ledger:', error);
    return [];
  }
}
