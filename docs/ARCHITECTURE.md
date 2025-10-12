# Architecture Documentation

## System Architecture

Banb follows a modern web3 application architecture with clear separation between frontend, blockchain, and backend layers.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js 15 + React 19 + Tailwind CSS + Radix UI           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────┐
                              │                             │
                              ▼                             ▼
┌──────────────────────────────────────┐   ┌────────────────────────────┐
│       Blockchain Layer               │   │     Backend Layer          │
│  Base (Ethereum L2)                  │   │  Supabase (PostgreSQL)     │
│  - USDC Smart Contract               │   │  - User Profiles           │
│  - Wagmi + Viem                      │   │  - Recipients              │
│  - Wallet Connectors                 │   │  - Transactions            │
└──────────────────────────────────────┘   └────────────────────────────┘
```

## Layer Breakdown

### 1. Frontend Layer

**Responsibilities:**
- User interface rendering
- User interaction handling
- State management
- Routing and navigation

**Key Technologies:**
- **Next.js App Router**: File-based routing, server components
- **React 19**: UI components with hooks
- **Wagmi**: React hooks for Ethereum
- **TanStack Query**: Async state management
- **Context API**: Global user state

**Component Hierarchy:**
```
RootLayout (app/layout.tsx)
├── Providers (app/providers.tsx)
│   ├── WagmiProvider (blockchain connection)
│   ├── QueryClientProvider (data fetching)
│   └── UserProvider (user state)
└── Page Components
    ├── LandingPage (/)
    ├── LoginPage (/login)
    ├── SignUpPage (/signup)
    ├── BankingHome (/home)
    ├── PaymentsPage (/payments)
    ├── TransactionsPage (/transactions)
    └── ProfilePage (/profile)
```

### 2. Blockchain Layer

**Responsibilities:**
- Wallet connection and management
- Smart contract interactions
- Transaction signing and broadcasting
- On-chain state reading

**Architecture:**
```
User Wallet
    │
    ├── Farcaster MiniApp Connector
    │   └── Embedded wallet in Farcaster app
    │
    └── Porto Connector
        └── External wallet connection
            │
            ▼
        Wagmi Config (app/config.ts)
            │
            ├── Chain: Base
            ├── Transport: HTTP RPC
            └── Storage: localStorage
                │
                ▼
        Smart Contracts
            └── USDC (ERC20)
                ├── balanceOf()
                ├── transfer()
                └── approve()
```

**Payment Flow:**
1. User initiates payment in UI
2. `useCryptoPayment` hook prepares transaction
3. `writeContractAsync` signs and broadcasts
4. `useWaitForTransactionReceipt` monitors confirmation
5. Transaction status updated in database

### 3. Backend Layer (Supabase)

**Responsibilities:**
- User profile storage
- Transaction history
- Recipient management
- Data persistence

**Database Schema:**

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  balance NUMERIC(20,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recipients table (friends list)
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  profile_id_link UUID REFERENCES profiles(id),
  external_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_profile_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES recipients(id),
  tx_hash TEXT,
  chain TEXT NOT NULL,
  amount NUMERIC(20,8) NOT NULL,
  token TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `profiles.wallet_address` (unique)
- `profiles.handle` (unique)
- `recipients.profile_id`
- `transactions.sender_profile_id`
- `transactions.recipient_id`

## Data Flow Patterns

### 1. User Authentication Flow

```
Landing Page
    │
    ├─ Sign Up
    │   ├─ Connect Wallet (Farcaster/Porto)
    │   ├─ Enter Name
    │   ├─ Generate Unique Handle
    │   ├─ Create Profile in DB
    │   └─ Store in UserContext + localStorage
    │
    └─ Login
        ├─ Connect Wallet
        ├─ Fetch Profile by wallet_address
        └─ Store in UserContext + localStorage
```

### 2. Payment Execution Flow

```
User Selects Recipient
    │
    ▼
Enter Amount
    │
    ▼
Review Payment
    │
    ▼
Create Transaction Record (status: pending)
    │
    ▼
Execute Smart Contract Call
    │
    ├─ Success
    │   ├─ Update Transaction (status: sent, tx_hash)
    │   ├─ Wait for Confirmation
    │   └─ Update Transaction (status: success)
    │
    └─ Failure
        └─ Update Transaction (status: failed)
```

### 3. Balance Display Flow

```
User Opens Dashboard
    │
    ├─ Fetch Profile from UserContext
    │   └─ Display Fiat Balance (from DB)
    │
    ├─ Fetch USDC Balance (from blockchain)
    │   └─ useReadContract → balanceOf()
    │
    └─ Fetch Exchange Rate (if EUR selected)
        └─ Convert USD → EUR for display
```

## State Management

### Global State (UserContext)

```typescript
interface UserContextType {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isLoading: boolean;
}
```

**Persistence:** localStorage (`banb_profile`)

**Usage:**
- Available throughout the app via `useUser()` hook
- Automatically syncs with localStorage
- Cleared on logout

### Server State (TanStack Query)

Used for:
- Blockchain data (balances, transactions)
- Async operations with caching
- Automatic refetching and invalidation

### Local Component State

Used for:
- Form inputs
- UI toggles (modals, dropdowns)
- Temporary data

## Security Considerations

### Wallet Security
- Private keys never leave user's wallet
- All transactions require user signature
- No custody of user funds

### Data Security
- Wallet addresses normalized to lowercase
- Profile data stored in Supabase with RLS (Row Level Security)
- API keys stored in environment variables

### Transaction Security
- Transaction records created before execution
- Status tracking prevents double-spending
- Failed transactions marked in database

## Performance Optimizations

### Frontend
- Server components for static content
- Client components only where needed
- Code splitting via Next.js dynamic imports
- Image optimization with Next.js Image

### Blockchain
- Read operations cached via TanStack Query
- Write operations batched when possible
- Transaction receipts polled efficiently

### Database
- Indexed queries for fast lookups
- Pagination for large result sets
- Optimistic updates in UI

## Error Handling

### Blockchain Errors
- Wallet connection failures → Retry prompt
- Transaction rejections → User notification
- Network errors → Fallback to cached data

### Database Errors
- Connection failures → Retry logic
- Constraint violations → User-friendly messages
- Not found errors → Graceful fallbacks

### UI Errors
- Loading states for async operations
- Error boundaries for component failures
- Toast notifications for user feedback

## Scalability Considerations

### Current Architecture
- Suitable for MVP and early growth
- Single database instance
- Client-side heavy

### Future Improvements
- API layer for business logic
- Caching layer (Redis)
- Background job processing
- Multi-chain support
- Microservices for specific features
