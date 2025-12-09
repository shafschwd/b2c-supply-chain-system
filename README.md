# B2C Supply Chain System

A blockchain-enabled supply chain tracking system where buyers, sellers, and logistics providers can interact transparently.
Built with **Next.js 14**, **Hardhat (Ethereum/Solidity)**, and **PostgreSQL**.

---

## 🚀 Quick Start Guide

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or later)
- **Git**
- **PostgreSQL** (v14 or later)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/b2c-supply-chain-system.git
cd b2c-supply-chain-system
```

### 3. Install Dependencies
```bash
npm install
```

---

## 🛠️ Setup Database (PostgreSQL)

You need a local PostgreSQL database running.

1. **Start PostgreSQL Service**:
   ```bash
   # MacOS (Homebrew)
   brew services start postgresql@14
   # OR just run the app if installed globally
   ```

2. **Create the Database Application User**:
   Run this command in your terminal to create a database and a dedicated user:
   ```bash
   createdb supply_chain_db
   createuser -s scm_user
   ```
   *Note: If you have different credentials, update them in `.env` later.*

3. **Initialize the Schema**:
   Run the provided setup script to create tables (users, orders, items, shipments):
   ```bash
   psql -d supply_chain_db -f scripts/setup_db.sql
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   # OR create it manually:
   touch .env
   ```
   Add the following content to `.env`:
   ```env
   # Database Configuration
   DB_USER=scm_user
   DB_PASSWORD=123456
   DB_HOST=localhost
   DB_NAME=supply_chain_db
   DB_PORT=5432
   ```

---

## ⛓️ Setup Blockchain (Hardhat Local Node)

To simulate the blockchain locally, you need to run a dedicated node.

1. **Open a New Terminal Window** (Terminal A) and run:
   ```bash
   npx hardhat node
   ```
   *Keep this terminal open! This is your local blockchain running on `http://127.0.0.1:8545`.*

2. **Deploy the Smart Contract**:
   Open a **second terminal** (Terminal B) and run:
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   ```

3. **IMPORTANT: Update Contract Address**:
   After deployment, the terminal will show a message like:
   > OrderTracker deployed to: 0x5FbDB2315678afec8c3562b921AA65B2eB42d14A

   Copy this address and update the file **`lib/blockchain.ts`**:
   ```typescript
   // lib/blockchain.ts
   const CONTRACT_ADDRESS: Address = getAddress('0x5FbDB2315678afec8c3562b921AA65B2eB42d14A');
   ```

---

## 🏃 Run the Application

Now that the Database and Blockchain are running, start the web app.

In your terminal (Terminal B):
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the Flow

1. **Sign Up a Buyer**: Create an account (e.g., "Buyer One").
2. **Sign Up a Seller**: Create a second account (incognito window) with role "Seller".
3. **Sign Up Logistics**: Create a third account with role "Logistics Provider".
   * *Required for shipment updates to work!*
4. **Create an Order**: As a Buyer, select an item and buy it.
5. **Simulate Flow**:
   - Seller logs in -> "Accept Order".
   - Logistics logs in -> Update Location -> "Out for Delivery".
   - Buyer logs in -> "Confirm Receipt".

## 🐛 Troubleshooting

- **Error: `ECONNREFUSED 127.0.0.1:8545`**
  - Your Hardhat node is not running. Run `npx hardhat node`.
- **Error: `InvalidAddressError`**
  - You probably restarted the Hardhat node but didn't update the `CONTRACT_ADDRESS` in `lib/blockchain.ts`. Redeploy and update it.
- **Error: ForeignKey Violation (Logistics)**
  - You forgot to create a user with the "Logistics Provider" role. The system needs at least one to assign shipments to.
