# Avail Nexus SDK Demo

A comprehensive demonstration application showcasing the capabilities of the [Avail Nexus SDK](https://www.npmjs.com/package/avail-nexus-sdk) for cross-chain interactions and asynchronous composability on blockchain networks.

## 🌟 Overview

This demo application demonstrates the power of the Avail Nexus SDK, enabling seamless communication and information sharing among diverse application chains. It showcases scenarios where transactions can occur on one chain while related operations happen on different chains, highlighting the exciting possibilities of asynchronous blockchain composability.

### Key Features

- **🌉 Cross-Chain Bridging**: Transfer tokens between supported blockchain networks
- **💸 Token Transfers**: Send tokens to any address across different chains
- **📋 Smart Contract Interactions**: Execute arbitrary smart contract functions with cost estimation
- **📊 Transaction History**: Track and monitor all your transactions with real-time status updates
- **👛 Multi-Wallet Support**: Connect with various wallets using ConnectKit integration
- **🎨 Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **⚡ Real-time Updates**: Live transaction progress tracking and notifications

## 🏗️ Architecture

The application demonstrates three core functionalities of the Nexus SDK:

### 1. Bridge Operations

Cross-chain token bridging with automatic route optimization and cost estimation.

### 2. Transfer Operations

Direct token transfers with recipient validation and gas estimation.

### 3. Deposit Operations

Smart contract interactions with ABI parsing, function simulation, and execution.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- A Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/nexus-sample-app.git
   cd nexus-sample-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables))

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# WalletConnect Project ID (required for wallet connections)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

### Getting a WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env.local` file

## 🎯 Usage Guide

### 1. Connect Your Wallet

- Click "Connect Wallet" in the header
- Choose your preferred wallet
- Approve the connection

### 2. Bridge Tokens

- Navigate to the "Bridge" tab
- Select destination chains
- Choose token and amount
- Review transaction details and fees
- Execute the bridge transaction

### 3. Transfer Tokens

- Go to the "Transfer" tab
- Select the destination chain
- Choose token and enter amount
- Input recipient address
- Review and confirm the transfer

### 4. Smart Contract Interactions

- Access the "Deposit" tab
- Enter contract address and select target chain
- Input function name and parameters
- Load or paste contract ABI
- Simulate and execute the transaction

### 5. Monitor Transactions

- View real-time progress in the transaction tracker
- Check transaction history for past operations
- Click on any transaction to view details on block explorer

## 🌐 Supported Networks

The demo supports multiple blockchain networks including:

- **Ethereum Mainnet**
- **Base**
- **Arbitrum**
- **Optimism**
- **Polygon**
- **Avalanche**
- **Linea**
- **Scroll**

## 🛠️ Technical Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Web3**: Wagmi, Viem, ConnectKit
- **State Management**: Zustand with persistence
- **SDK**: Avail Nexus SDK v0.0.5
- **Notifications**: Sonner toast notifications

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/             # React components
│   ├── bridge/            # Bridge-related components
│   ├── layout/            # Layout components
│   ├── shared/            # Shared/reusable components
│   └── ui/                # UI library components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and constants
├── provider/              # Context providers
├── store/                 # Zustand stores
└── types/                 # TypeScript type definitions
```

## 🔍 Key Components

- **NexusBridge**: Cross-chain token bridging interface
- **NexusTransfer**: Token transfer functionality
- **NexusDeposit**: Smart contract interaction component
- **TransactionHistory**: Historical transaction tracking
- **TransactionProgress**: Real-time progress monitoring

## 🧪 Features in Detail

### Transaction Management

- Persistent transaction history in local storage
- Real-time status updates using SDK events
- Comprehensive error handling and user feedback
- Automatic retry mechanisms for failed transactions

### User Experience

- Form validation with real-time feedback
- Gas estimation and cost calculation
- Transaction simulation before execution
- Responsive design for all device sizes

### Developer Features

- Comprehensive TypeScript types
- Error boundary implementation
- Modular component architecture
- Easy SDK integration examples

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Resources

- [Avail Nexus SDK Documentation](https://www.npmjs.com/package/avail-nexus-sdk)
- [Avail Project](https://www.availproject.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/nexus-sample-app/issues) page
2. Review the SDK documentation
3. Join the [Avail Discord](https://discord.gg/avail) community

---

**Made with ❤️ by the Amartya Singh**
