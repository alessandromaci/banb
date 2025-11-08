# BANB System Architecture

## 2. Target Architecture

The BANB system architecture follows a three-layer model:

**[User Layer] → [Application Layer / API Routes] → [Service Layer / Databases / Blockchain]**

---

## 2.1 User Layer

### Frontend Framework

- **Next.js 15** (App Router) + **TypeScript** + **TailwindCSS** + **Shadcn/UI**
- **React 19** with modern hooks and context patterns
- **Framer Motion** for animations
- **React Hook Form** + **Zod** for form validation

### Web3/Wallet Integration

**Privy Authentication & Wallet Management:**

- **Privy Provider** (`@privy-io/react-auth`) - Primary authentication and wallet management
- **Smart Wallets Provider** (`@privy-io/react-auth/smart-wallets`) - Embedded smart wallet support created during user signup automatically by Privy. This applies only to email type sign up and not Farcaster.
- **Privy Wagmi Connector** (`@privy-io/wagmi`) - Wagmi integration for Privy wallets
- Supports multiple login methods: **Email**, **Google**, **Apple**, **Farcaster**
- Automatic smart wallet creation for email-based users
- Multi-wallet linking and management
- Auotomatic detecment of Farcaster context during login so that Farcaster users get automatically redirected to the homepage connected to their Farcaster wallet.

**Wagmi v2.17+** (Web3 React hooks):

- Blockchain state management and wallet connections
- Transaction execution and monitoring
- Contract interactions via hooks

**Viem v2.38+** (Low-level Ethereum interactions):

- Transaction building and signing
- Contract ABI encoding/decoding
- Chain configuration

**Farcaster Integration:**

- **Farcaster MiniApp SDK** (`@farcaster/miniapp-sdk`) - Farcaster MiniApp context and actions
- **Farcaster MiniApp Wagmi Connector** (`@farcaster/miniapp-wagmi-connector`) - Wallet connection within Farcaster
- **Farcaster Quick Auth** (`@farcaster/quick-auth`) - JWT token verification
- Auto-login when detected inside Farcaster MiniApp
- Farcaster wallet-based authentication

**OnchainKit v1.1** (Coinbase's Base chain toolkit):

- Base chain utilities and helpers

### Authentication Flow

**Email/Google/Apple Login:**

1. User clicks "Continue with Email/Google/Apple"
2. Privy modal opens for OAuth or email verification
3. On successful login, Privy creates or retrieves user account
4. If no smart wallet exists, system automatically creates embedded wallet
5. User redirected to signup (new users) or check-profile (existing users)
6. After successful signup, a new profile row gets created in the profile table with an associated new entry in the account table. The tree schema is profile -> account -> account-transactions. A profile can have several accounts linked. Each account corresponds to a newly linked wallet.

**Farcaster Login:**

1. System detects Farcaster MiniApp context via SDK
2. Auto-initiates Farcaster login flow with `useLoginToMiniApp()`
3. User signs message via Farcaster wallet
4. Privy authenticates user with Farcaster account
5. System checks for existing profile by wallet address
6. If profile exists → load and redirect to home
7. If no profile → create profile with Farcaster username and redirect to home
8. After successful signup, a new profile row gets created in the profile table with an associated new entry in the account table. The tree schema is profile -> account -> account-transactions. A profile can have several accounts linked. Each account corresponds to a newly linked wallet.

**Smart Wallet Creation:**

- Automatically created for email-based logins via `useCreateWallet()` hook
- Smart wallets are embedded wallets managed by Privy
- Support for EIP-5792 batch transactions
- Support for paymaster to allow users to pay gas fees via USDC

**Wallet Linking:**

- Users can link multiple external wallets (MetaMask, Rainbow, WalletConnect, Phantom)
- Linked wallets stored in Privy `linkedAccounts`
- Each linked wallet is added as an account in Supabase `accounts` table
- Users can switch between wallets via `useSetActiveWallet()` via the `/profile` page.
- Profile lookup supports authentication via any linked wallet address

### Current UI Features

**Landing Page** (`components/landing-page.tsx`):

- Marketing and onboarding entry point
- Animated logo reveal and tagline rotation
- Auto-detection of Farcaster MiniApp context
- Conditional login button display (hidden in Farcaster)
- Auto-login flow for Farcaster users

**Authentication** (`components/auth/`):

- **LoginForm** - Farcaster wallet authentication
- **SignupForm** - New user onboarding with profile creation
- Integrated with Privy for all login methods
- Automatic profile creation/retrieval

**Banking Home** (`components/banking-home.tsx`):

- Displays user's balance in USD or EURO terms (USDC on Base)
- Quick action buttons (Send, Add, Withdraw, More)
- Transaction history list
- AI chat/search input
- Investment account overview
- Tab navigation (Home, Transactions, Investments, AI)

**Payments Module** (`app/payments/`, `components/payments/`):

- Complete flow for sending crypto payments
- Payment type selection (Wallet / IBAN Bank (not enabled))
- Recipient management and search
- Amount input with validation
- Review and confirmation screens
- Transaction status tracking
- Real-time blockchain confirmation

**Profile Management** (`app/profile/page.tsx`):

- Edit profile name and handle
- View and manage linked wallets
- Switch active wallet
- View all accounts (spending accounts)
- Manage other preference settings (app theme, preferred currency)
- Delete account functionality

**Investment Dashboard**:

- View investment accounts with APR and balances
- Investment movement history (deposits, withdrawals, rewards)
- Monthly rewards calculation
- Investment creation flow with Morpho vault integration

**AI Chat Interface** (`components/ai/AIAgentChat.tsx`):

- Conversational banking assistant
- Natural language commands
- Operation confirmation modals
- Message history
- Suggested prompts
- Integration with MCP tools for data queries

### UI Component Library

- **Shadcn/UI** built on top of **Radix primitives**
- Custom theme provider with dark mode support
- Responsive design with mobile-first approach
- Consistent design system across all components

### Architecture Pattern

Each feature module follows a consistent structure:

- **UI components** in `/components/`
- **Business logic hooks** in `/lib/`
- **Page routes** in `/app/`
- **API routes** in `/app/api/`

---

## 2.2 Application Layer (API Routes)

The Application Layer acts as BANB's internal API gateway. It is implemented using **Next.js API Routes** (`app/api/`) and serves as the bridge between the frontend and service layer. The use of API is now limited to only some functionalities. There is currently some inconsisency on when and where we use API routes within the user flow.

### Current API Endpoints

| Endpoint            | Method | Purpose                                                  | Status         |
| ------------------- | ------ | -------------------------------------------------------- | -------------- |
| `/api/auth`         | GET    | Verify Farcaster JWT token and authenticate user         | ✅ Implemented |
| `/api/ai/chat`      | POST   | Process AI agent chat messages with MCP tool integration | ✅ Implemented |
| `/api/ai/execute`   | POST   | Execute AI-suggested operations (payments, analysis)     | ✅ Implemented |
| `/api/transactions` | POST   | Create transaction records                               | ✅ Implemented |
| `/api/recipients`   | POST   | Create and manage recipient contacts                     | ✅ Implemented |

### API Gateway Responsibilities

- Authenticate requests via Privy session or Farcaster JWT (we don't use it for other types of authentications like email, google oauth, or apple oauth because it's handled directly by Privy)
- Validate JWT tokens for Farcaster users
- Return authenticated user data (profile ID, wallet addresses)
- Rate limiting for AI endpoints
- Input sanitization and validation
- Context enrichment (balance, transactions, recipients) for AI requests

### Implementation Details

**Authentication:**

- Uses Privy session management for email/Google/Apple users
- Uses `@farcaster/quick-auth` for Farcaster JWT verification
- Handles multiple environments (Vercel and local dev)
- Includes CORS-aware domain verification
- Uses Bearer token authorization

**AI Chat Endpoint:**

- Integrates with OpenAI, Anthropic, or local models
- MCP (Model Context Protocol) tool integration for:
  - `get_user_balance` - Fetch USDC balance
  - `get_accounts` - Get linked accounts
  - `get_recent_transactions` - Transaction history
  - `get_onchain_transactions` - Blockchain transaction fetch
  - `get_recipients` - Saved payment recipients
  - `get_transaction_summary` - Spending analysis
  - `get_investment_options` - Available investment products
- Rate limiting per profile ID
- Operation parsing and audit logging

**AI Execute Endpoint:**

- Executes AI-suggested operations after user confirmation
- Supports payment execution and analysis operations
- Creates transaction records before blockchain execution
- Returns operation results for client-side completion

### Current Data Flow

```
User → Client-side Wagmi Hooks → Supabase Client → Database
                               ↓
                         Blockchain (Base)
                               ↓
                         Privy (Auth/Wallets)
```

---

## 2.3 Service Layer

This layer handles all business logic. It is currently implemented through **client-side hooks and utility functions** in the `/lib/` directory, with data persistence in **Supabase PostgreSQL**.

### Implemented Services

| Service                  | File                          | Description                                                     | Data Source                                              |
| ------------------------ | ----------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| **Profile Service**      | `lib/profile.ts`              | User profile CRUD, handle generation, multi-wallet lookup       | `profiles` table                                         |
| **Accounts Service**     | `lib/accounts.ts`             | Multi-account management (spending, investment, savings)        | `accounts` table                                         |
| **Payments Service**     | `lib/payments.ts`             | Execute USDC transfers, transaction signing and status updates  | `transactions` table + Base blockchain                   |
| **Recipients Service**   | `lib/recipients.ts`           | Manage recipient contacts (add, retrieve, search)               | `recipients` table                                       |
| **Transactions Service** | `lib/transactions.ts`         | Create and update transaction records, status tracking          | `transactions` table (probably not needed anymore)       |
| **Investment Service**   | `lib/investments.ts`          | Investment account management and tracking                      | `investments` table                                      |
| **Investment Movements** | `lib/investment-movements.ts` | Track deposits, withdrawals, rewards, fees                      | `investment_movements` table                             |
| **Investment Payments**  | `lib/investment-payments.ts`  | Execute investment deposits via Morpho vaults                   | `investments` + `investment_movements` + Base blockchain |
| **Onchain Transactions** | `lib/onchain-transactions.ts` | Fetch transaction history from Base blockchain via Basescan API | Basescan API                                             |
| **AI Agent**             | `lib/ai-agent.ts`             | AI chat interface and message management                        | `ai_operations` table                                    |
| **MCP Server**           | `lib/mcp-server.ts`           | Model Context Protocol tools for AI integration                 | Various services                                         |
| **Supabase Client**      | `lib/supabase.ts`             | Initializes Supabase client and provides typed database access  | Supabase PostgreSQL                                      |

### Key Hooks & Functions

#### Profile Service

- `createProfile(data)` - Create new user profile with auto-generated handle
- `getProfile(id)` - Retrieve profile by UUID
- `getProfileByWallet(address)` - Find profile by primary wallet address
- `getProfileByAnyWallet(address)` - Find profile by any linked wallet (primary or account)
- `updateProfile(id, data)` - Update profile information
- `generateHandle(name)` - Generate unique handle (first 3 letters + 3 random chars)

#### Accounts Service

- `createAccount(data)` - Create new account (spending/investment/savings) for profile
- `getAccountsByProfile(profileId)` - Retrieve all accounts for a profile
- `updateAccount(accountId, data)` - Update account details
- `deleteAccount(accountId)` - Soft delete account (set status to inactive)

**Account Types:**

- **Spending** - Primary wallet for daily transactions
- **Investment/Savings** - Wallet for DeFi investments

#### Payments Service

- `useCryptoPayment()` - Execute ERC20 transfers via Wagmi
  - Creates transaction record (status: pending)
  - Calls `writeContract()` for ERC20 transfer()
  - Updates transaction to "sent" after hash confirmation
  - On success → marks transaction as "success"
  - On error → updates status to "failed"
- `useTransactionStatus(txId)` - Track transaction confirmation
  - Polls blockchain for receipt via Wagmi
  - Auto-updates DB when confirmed
- `useUSDCBalance(address)` - Fetch and format the USDC balance from Base chain

#### Recipients Service

- `addRecipient(data)` - Create a new recipient with wallet info
- `getRecipient(id)` - Retrieve a recipient by ID
- `getRecipientsByProfile(profileId)` - Get all recipients for a profile
- `searchRecipients(query, profileId)` - Search recipients by name or address

#### Transactions Service

- `createTransaction(data)` - Insert new pending transaction
- `updateTransactionStatus(txId, status, txHash?)` - Update transaction lifecycle
- `getTransactionStatus(txId)` - Retrieve transaction status
- `getTransactionsByProfile(profileId, limit?)` - Get transaction history
- `formatTransactionAmount(amount, token)` - Format amounts for display

#### Investment Service

- `useInvestments(profileId)` - React hook for investment management
  - Fetches all investments for a profile
  - `createInvestment(data)` - Create new investment record
  - `updateInvestmentStatus(id, status, rewards?)` - Update investment status
  - `getInvestmentSummary()` - Get aggregated investment data
- `getInvestmentOptions()` - Get available investment products (Morpho vaults)
- `getInvestmentOption(id)` - Get specific investment option details

**Investment Types:**

- **Morpho Vault/Savings Account** - DeFi yield strategies (Spark USDC, Steakhouse USDC, Seamless USDC)

#### Investment Movements Service

- `createDepositMovement(data)` - Record investment deposit
- `createWithdrawalMovement(data)` - Record investment withdrawal
- `getInvestmentHistory(profileId, limit?)` - Get movement history
- `getInvestmentSummaryByVault(profileId)` - Get aggregated data per vault

#### Investment Payments Service

- `useInvestmentPayment(profileId)` - Execute investment deposits
  - Batched transaction approach (approve + deposit in one transaction) where possible sicne this is only allowed via a smart account
  - EIP-5792 support for batch transactions
  - Creates investment record and movement
  - Updates investment status on confirmation
  - Handles existing investment updates (adds to existing position)

#### Onchain Transactions Service

- `fetchOnchainTransactions(profileId, limit?)` - Fetch transactions from Base blockchain
  - Uses Basescan API (Etherscan v2 API for Base)
  - Fetches both ETH and ERC20 token transfers
  - Formats transactions with display-friendly data
  - Returns transaction hashes with explorer links

#### AI Agent Service

- `useAIAgent(profileId, userAddress?)` - AI chat interface hook
  - `sendMessage(message)` - Send message to AI endpoint
  - `clearHistory()` - Clear conversation history
  - Message history management
  - Pending operation tracking
  - Error handling

#### MCP Server Tools

- `getUserBalanceHandler` - Get USDC balance for authenticated user
- `getAccountsHandler` - Get all linked accounts with balances
- `getRecentTransactionsHandler` - Get transaction history from database
- `getOnchainTransactionsHandler` - Fetch transactions from blockchain
- `getRecipientsHandler` - Get saved payment recipients
- `getTransactionSummaryHandler` - Get spending analysis and patterns
- `getInvestmentOptionsHandler` - Get available investment products

### Blockchain Integration

**Network:** Base (Mainnet) - Chain ID: 8453

**Token Contracts:**

- **USDC** - `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)

**Morpho Vault Contracts:**

- **Spark USDC Vault** - `0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A`
- **Steakhouse USDC Vault** - `0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183`
- **Seamless USDC Vault** - `0x616a4E1db48e22028f6bbf20444Cd3b8e3273738`

**Transfer Methods:**

- **ERC20 transfer()** - Standard USDC transfers via Wagmi
- **Morpho Vault deposit()** - Investment deposits via batched transactions
- **EIP-5792 Batch Transactions** - Multi-step operations (approve + deposit)

**Transaction Confirmation:**

- Handled by `useWaitForTransactionReceipt()` from Wagmi
- Automatic status updates in database
- Real-time confirmation tracking
- Explorer links via Basescan

**Onchain Transaction Fetching:**

- Basescan API (Etherscan v2 API for Base)
- Fetches both ETH and ERC20 token transfers
- Supports pagination and filtering
- Returns formatted transaction data with explorer links

### Database Schema (Supabase PostgreSQL)

**Core Tables:**

- `profiles` - User profiles with primary wallet address
- `recipients` - Payment recipient contacts

- `accounts` - Linked accounts (spending, investment, savings) per profile. Each account corresponds to a linked wallet
- `account_transactions` - Per-account transaction tracking

- `investments` - Investment account records
- `investment_movements` - Investment deposit/withdrawal/reward/fee records

- `ai_operations` - AI operation audit log

- `transactions` - Payment transaction records (probably to deprecate)

**Key Relationships:**

- `profiles` → `accounts` (one-to-many)
- `profiles` → `investments` (one-to-many)
- `investments` → `investment_movements` (one-to-many)
- `accounts` → `account_transactions` (one-to-many)
- `profiles` → `transactions` (one-to-many, sender) (probably to deprecate)

### Not Yet Implemented

- **Fiat On/Off-Ramp Service** - Integration with payment providers (Apple Pay, Google Pay, Revolut Pay)
- **Real-time Event Streaming** - WebSocket/SSE for live updates (currently using polling)
- **Advanced Analytics Service** - Predictive analytics and insights
- **Notification Service** - Push notifications for transactions and updates
- **Multi-chain Support** - Support for chains beyond Base

---

## 2.4 Data Flow Examples

### Payment Flow

```
User initiates payment
    ↓
Payment form validation
    ↓
Create transaction record (status: pending) in Supabase
    ↓
Execute ERC20 transfer via Wagmi writeContract()
    ↓
Transaction hash returned
    ↓
Update transaction record (status: sent, tx_hash)
    ↓
Wait for blockchain confirmation (useWaitForTransactionReceipt)
    ↓
Update transaction record (status: success)
    ↓
Create account_transaction records for sender and recipient accounts
    ↓
Update account balances in Supabase (to deprecate probably)
```

### Investment Flow

```
User selects investment option
    ↓
User enters deposit amount
    ↓
Check if investment exists for vault
    ↓
If new: Create investment record (status: pending)
If existing: Update investment amount
    ↓
Execute batched transaction (approve + deposit) via EIP-5792
    ↓
Create investment_movement record (type: deposit, status: pending)
    ↓
Wait for batch transaction confirmation
    ↓
Update investment_movement (status: confirmed, tx_hash)
    ↓
Update investment record (status: active, amount_invested)
```

### Authentication Flow (Farcaster)

```
User opens app in Farcaster MiniApp
    ↓
Detect Farcaster context via SDK
    ↓
Auto-initiate login with useLoginToMiniApp()
    ↓
User signs message via Farcaster wallet
    ↓
Privy authenticates with Farcaster account
    ↓
Get wallet address from Privy user
    ↓
Check for profile via getProfileByAnyWallet(address)
    ↓
If profile exists:
    - Load profile into UserContext
    - Redirect to /home
If no profile:
    - Create profile with Farcaster username
    - Create initial spending account
    - Load profile into UserContext
    - Redirect to /home?newUser=true
```

### Authentication Flow (Email)

```
User clicks "Add Wallet" in profile
    ↓
Privy linkWallet() modal opens
    ↓
User connects via email methods (Gmail, Apple, or inputting email address)
    ↓
Check if wallet already exists in profile table
    ↓
If profile exists:
    - Load profile into UserContext
    - Redirect to /home
If new:
    - Create profile record in Supabase
    - Create account record in Supabase
    - Set account type (spending)
    - Redirect to /home?newUser=true

```

### AI Chat Flow

```
User sends message in AI chat
    ↓
Send POST /api/ai/chat with message and context
    ↓
API enriches context (balance, transactions, recipients)
    ↓
Call AI backend (OpenAI/Anthropic) with MCP tools
    ↓
AI processes request and calls relevant MCP tools
    ↓
AI generates response with tool results
    ↓
If operation detected (payment, etc.):
    - Create ai_operation record
    - Return operation in response
    ↓
Client displays AI response
    ↓
If operation pending:
    - Show confirmation modal
    - User confirms or rejects
    ↓
If confirmed:
    - Call /api/ai/execute
    - Execute operation (create transaction, etc.)
    - Return result for client-side blockchain execution
```

---

## 2.5 Security & Authentication

### Authentication Methods

1. **Privy Authentication**

   - Email/Password with embedded wallet
   - Google OAuth
   - Apple OAuth
   - Farcaster wallet authentication

2. **Session Management**

   - Privy handles session management
   - JWT tokens for Farcaster users
   - Session persistence across page reloads

3. **Wallet Security**

   - Smart wallets managed by Privy (non-custodial)
   - Private keys never exposed to application
   - EIP-1193 standard for wallet interactions

4. **Link Wallets**
   - External wallet connection (MetaMask, Rainbow, WalletConnect, Phantom)
   - Accounts linked to profile via Privy and new accounts created in Supabase tables

### Authorization

- Profile-based access control
- All database queries filtered by `profile_id`
- Wallet address verification for blockchain operations
- Rate limiting on AI endpoints

### Data Privacy

- User data stored in Supabase with RLS (Row Level Security)
- Wallet addresses stored in lowercase for consistency
- Transaction data encrypted in transit (HTTPS)
- No sensitive data in client-side code

---

## 2.6 Technology Stack Summary

### Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- TailwindCSS
- Shadcn/UI + Radix UI
- Framer Motion

### Blockchain

- Privy (Authentication & Wallet Management)
- Wagmi v2 (React Hooks for Ethereum)
- Viem v2 (Ethereum Utilities)
- Base Chain (L2 Optimistic Rollup)
- Farcaster MiniApp SDK

### Backend

- Next.js API Routes
- Supabase (PostgreSQL Database)
- TanStack Query (Server State)

### AI

- OpenAI API (with MCP integration)
- Anthropic API (optional)
- Model Context Protocol (MCP)

### Development

- ESLint
- TypeScript strict mode
- npm package manager

---

This architecture enables BANB to provide a seamless, secure, and user-friendly decentralized banking experience with full Web3 integration, AI-powered automation, and comprehensive financial management capabilities.
