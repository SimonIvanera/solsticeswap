# SolsticeSwap

A privacy-preserving token swap platform built with Fully Homomorphic Encryption (FHE) technology. All orders are fully encrypted on-chain, protecting users from front-running and MEV attacks.

## 🏗️ Project Structure

This repository contains two main components:

- **`fhevm-hardhat-template/`** - Smart contract development environment using Hardhat and FHEVM
- **`solsticeswap-frontend/`** - Next.js frontend application for interacting with the SolsticeSwap protocol

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm** or **yarn**: Package manager
- **MetaMask** or compatible Web3 wallet

### Smart Contract Setup

1. Navigate to the contract directory:
   ```bash
   cd fhevm-hardhat-template
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   ```

4. Compile contracts:
   ```bash
   npx hardhat compile
   ```

5. Run tests:
   ```bash
   npx hardhat test
   ```

6. Deploy to local network:
   ```bash
   npx hardhat node
   npx hardhat deploy --network localhost
   ```

7. Deploy to Sepolia testnet:
   ```bash
   npx hardhat deploy --network sepolia
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd solsticeswap-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate ABI and address mappings:
   ```bash
   npm run genabi
   ```

4. Start development server (with mock FHEVM):
   ```bash
   npm run dev:mock
   ```

5. Start development server (with real Relayer SDK):
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## 📋 Features

- **Encrypted Order Creation**: Create buy/sell orders with fully encrypted parameters
- **Order Matching**: Match compatible buy and sell orders
- **Trade Execution**: Execute matched orders on-chain
- **Privacy Protection**: All sensitive data (amounts, prices) are encrypted using FHE
- **On-chain Analytics**: View aggregated statistics from public order data
- **Wallet Integration**: Connect with MetaMask or EIP-6963 compatible wallets

## 🔐 Security

- All order parameters (amounts, prices) are encrypted using FHEVM
- Orders are matched and executed without revealing sensitive information
- Front-running and MEV attacks are mitigated through encryption
- Decryption keys are managed securely through the Relayer SDK

## 🌐 Deployment

### Smart Contract

The contract is deployed on Sepolia testnet:
- **Contract Address**: See `fhevm-hardhat-template/deployments/sepolia/SolsticeSwap.json`

### Frontend

The frontend is deployed on Vercel:
- **Production URL**: See deployment configuration in `solsticeswap-frontend/.vercel/`

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [Next.js Documentation](https://nextjs.org/docs)

## 🧪 Testing

### Contract Tests

```bash
cd fhevm-hardhat-template
npx hardhat test
```

### Frontend Tests

```bash
cd solsticeswap-frontend
npm run test
```

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For issues and questions:
- Check the [FHEVM Documentation](https://docs.zama.ai)
- Review the code comments and inline documentation
- Open an issue in this repository

---

**Built with privacy-first principles**

