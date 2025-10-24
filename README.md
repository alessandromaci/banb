# BANB - Blockchain Agent Neo Bank

<div align="center">

**A decentralized banking application that merges neo-bank ease of use with blockchain infrastructure and AI-driven automation**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

**BANB** (Blockchain Agent Neo Bank) is a mobile-first decentralized banking application that bridges Web3 and traditional finance. It combines the intuitive UX of modern neo-banks with blockchain-native infrastructure, enabling users to manage digital assets, make payments, invest, and leverage AI automation for banking operations.

### Key Highlights

- 🔐 **Multi-Wallet Support** - Create a new wallet via email. Or, connect external wallet MetaMask, Phantom, WalletConnect, and more
- 💸 **Seamless Payments** - Send crypto with a neo-bank UX
- 💰 **Investment Accounts** - Earn yield through DeFi protocols (Morpho, etc.)
- 🤖 **AI Banking Agent** - Natural language commands for transactions and insights
- 📊 **Portfolio Analytics** - Real-time balance tracking and transaction history
- 🚀 **Base Chain Native** - Built on Base for fast, low-cost transactions
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode

---

## ✨ Features

### 🔑 Authentication & Profile Management

- **Privy Integration** - Secure wallet authentication with email and Farcaster support
- **Multi-Account Support** - Manage multiple wallets (spending & investment accounts)
- **Unique Handles** - User-friendly handles (e.g., `joh7x2`) for easy identification
- **Profile Customization** - Manage linked wallets and preferences

### 💳 Payments & Transfers

- **Send Crypto** - Transfer USDC to friends or external wallets
- **Recipient Management** - Save contacts for quick payments
- **Transaction History** - Complete audit trail with status tracking
- **Batch Transactions** - EIP-5792 support for multi-step operations
- **Real-time Status** - Live transaction confirmation tracking

### 💎 Investment Accounts

- **DeFi Integration** - Access to Morpho vaults and other yield strategies
- **Risk Profiles** - Personalized investment options
- **Movement Tracking** - Track deposits, withdrawals, rewards, and fees
- **APR Display** - Real-time yield rates
- **Investment Flow** - Seamless approve + deposit transactions

### 🤖 BANB AI

- **Natural Language** - Command banking operations with plain English
- **Transaction Execution** - AI-powered payment and investment flows
- **Portfolio Insights** - Automated financial analysis and recommendations
- **Operation History** - Track all AI-assisted actions
- **Consent Management** - User approval for sensitive operations

### 📱 Deposit & Withdraw

- **On/Off Ramp** - Connect to third-party providers (Apple Pay, Google Pay)
- **Wallet Deposits** - Direct transfers from external wallets

### 📊 Analytics & Insights

- **Balance Overview** - Real-time portfolio valuation
- **Transaction Analytics** - Spending patterns and trends
- **Investment Performance** - Track yield and returns
- **Visual Dashboards** - Interactive charts (Recharts integration)

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router & Turbopack
- **UI Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Blockchain

- **Wallet Connector:** [Privy](https://privy.io/) + [Wagmi v2](https://wagmi.sh/)
- **Ethereum Library:** [Viem](https://viem.sh/)
- **Chain:** [Base](https://base.org/) (L2 Optimistic Rollup)
- **Smart Contracts:** ERC-20 (USDC), Morpho Protocol
- **Standards:** EIP-5792 (Batch Transactions), EIP-1193

### Backend

- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **API:** Next.js API Routes (REST)
- **Authentication:** Privy + SIWE (Sign-In with Ethereum)
- **State Management:** React Context + TanStack Query

### AI Integration

- **AI Provider:** OpenAI (via MCP Server)
- **Chat Interface:** Custom AI agent with operation validation
- **MCP:** Model Context Protocol for secure AI-to-blockchain interactions

### Development

- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Linting:** ESLint + Next.js Config
- **Package Manager:** npm
- **Build Tool:** Turbopack (dev), Webpack (production)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** ([Sign up](https://supabase.com/))
- **Privy Account** ([Sign up](https://privy.io/))
- **Base RPC Access** (optional: [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/))
- **MetaMask** or compatible Web3 wallet

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/alessandromaci/banb.git
cd banb
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# AI Configuration (optional)
OPENAI_API_KEY=sk-...
MCP_SERVER_URL=http://localhost:3001

```

### Supported Login Methods

- 🦊 MetaMask
- 🔗 WalletConnect
- 📧 Email (with embedded wallet)
- 🟪 Farcaster

---

## 🤖 AI Agent Features

### Capabilities

- **Send Payments** - "Send $50 to Alex"
- **Investment Insights** - "Show me my investment performance"
- **Transaction History** - "List my recent transactions"
- **Balance Queries** - "What's my current balance?"

### Security

- User consent required for transactions
- Amount limits and validation
- Operation history tracking
- Rollback support for failed operations

### MCP Integration

- Model Context Protocol for AI-to-blockchain communication
- Secure parameter validation
- Transaction simulation before execution

## 🐛 Troubleshooting

### Common Issues

**Wallet not connecting**

- Ensure MetaMask is installed
- Check network is set to Base
- Clear browser cache

**Transaction failing**

- Verify sufficient USDC balance
- Check USDC approval amount
- Ensure wallet is on Base chain

**Slow loading**

- Clear `.next` cache
- Check Privy configuration
- Verify RPC endpoint

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Docs](https://docs.privy.io/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Base Documentation](https://docs.base.org/)
- [Morpho Protocol](https://morpho.org/)
- [Supabase Docs](https://supabase.com/docs)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the BANB team

---

## 📧 Support

For support, email [alessandromaci96@gmail.com](mailto:alessandromaci96@gmail.com) or open an issue on GitHub.

---

<div align="center">

**[Website](https://banb.finance)** •

Made with ⚡️ on [Base](https://base.org/)

</div>
