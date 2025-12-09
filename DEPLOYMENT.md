# 🚀 Deployment Guide (Zero Cost)

This guide helps you deploy your **B2C Supply Chain System** to the cloud for free using:
- **Vercel** (Hosting)
- **Neon** (Database)
- **Sepolia Testnet** (Blockchain)

---

## Step 1: Prepare Your "Deployer" Wallet
You need a MetaMask wallet with some **Sepolia ETH** (Test Money) to pay for the contract deployment.

1.  Open MetaMask -> Settings -> Advanced -> **Show Private Key**.
2.  **COPY THIS KEY**. (Keep it safe! Anyone with this key controls the wallet).
3.  Go to [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) or [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) to get free test ETH.

---

## Step 2: Setup Database (Neon)
1.  Go to [Neon.tech](https://neon.tech/) and Sign Up (Free).
2.  Create a **New Project**.
3.  It will give you a **Connection String** (e.g., `postgres://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require`).
4.  Copy this string.
5.  **Local Test**: You can temporarily put this in your local `.env` as `DATABASE_URL` or manually run the setup script against it using a tool like DBeaver.
    *   *Easier method during Vercel deployment: We will run the setup script later.*

---

## Step 3: Get a Blockchain RPC (Alchemy)
1.  Go to [Alchemy.com](https://www.alchemy.com/) and Sign Up.
2.  Create a new App -> Choose **Ethereum** -> **Sepolia**.
3.  Click "API Key" and copy the **HTTPS URL**. (e.g., `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`).

---

## Step 4: Deploy to Vercel
1.  Push your latest code to **GitHub**.
2.  Go to [Vercel.com](https://vercel.com/) -> **Add New** -> **Project**.
3.  Import your GitHub repository.
4.  **Environment Variables**:
    You MUST add these variables in the Vercel dashboard:

    | Name | Value | Description |
    | :--- | :--- | :--- |
    | `DB_HOST` | `ep-raspy-silence-a142bohw-pooler.ap-southeast-1.aws.neon.tech` | Your Neon Host |
    | `DB_USER` | `neondb_owner` | Your Neon User |
    | `DB_PASSWORD` | `npg_yVTYKO5HEJ9S` | Your Neon Password |
    | `DB_NAME` | `neondb` | Default database name |
    | `DB_PORT` | `5432` | Standard Postgres port |
    | `PRIVATE_KEY` | `0xYourMetaMaskPrivateKey` | **YOUR** Wallet Key (Step 1) |
    | `SEPOLIA_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/omEX1b70HrUQsbSedya19` | Your Alchemy URL |
    | `NEXT_PUBLIC_BLOCKCHAIN_NETWORK` | `sepolia` | Optional flag for your reference |

5.  Click **Deploy**.

---

## Step 5: Post-Deployment Setup
Once Vercel finishes, the app will start, but it might fail because the **Database is empty** and **Contract is missing**.

### A. Run Database Setup (Local -> Cloud)
From your local terminal, connect to the Neon database and run the setup script:
```bash
# Run this exact command to seed your Cloud Database
psql 'postgresql://neondb_owner:npg_yVTYKO5HEJ9S@ep-raspy-silence-a142bohw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' -f scripts/setup_db.sql
```
*Alternatively, paste the contents of `scripts/setup_db.sql` into the SQL Editor on the Neon dashboard.*

### B. Deploy Contract to Sepolia
From your local terminal, deploy the contract to the real Public Testnet:
```bash
# 1. Set env vars temporarily
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/omEX1b70HrUQsbSedya19"
export PRIVATE_KEY="0xYourMetaMaskPrivateKey"

# 2. Deploy
npx hardhat run scripts/deploy.ts --network sepolia
```

### C. Update Vercel with Contract Address
1.  The terminal will show: `OrderTracker deployed to: 0x123...abc`
2.  Go to your **Vercel Project Settings** -> **Environment Variables**.
3.  Add/Update:
    `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x123...abc`
4.  **Redeploy** on Vercel to apply the new address.

---

## 🎯 Done!
Your friends can now visit `https://your-project.vercel.app`.
- Buyer clicks "Buy" -> The **Server** uses **Your MetaMask Account** to sign the transaction.
- The Blockchain records it on Sepolia.
- You can see the txn on [Sepolia Etherscan](https://sepolia.etherscan.io/).
