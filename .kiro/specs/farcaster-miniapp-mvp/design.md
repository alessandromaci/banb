# Design Document

## Overview

BANB (Blockchain Agent Neo Bank) is a Farcaster MiniApp that provides decentralized banking functionality through a mobile-first interface. The MVP design focuses on delivering a complete, working payment flow with proper authentication, recipient management, and transaction tracking.

### Design Principles

1. **Mobile-First**: All UI components optimized for touch interaction and small screens
2. **Progressive Enhancement**: Core features work immediately, advanced features layer on top
3. **Fail-Safe**: Graceful degradation with clear error states and recovery paths
4. **Blockchain-Native**: Direct integration with Base chain for USDC transfers
5. **Minimal Dependencies**: Lightweight testing infrastructure without heavy frameworks

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5
- **Styling**: TailwindCSS 3 + Shadcn/UI components
- **Web3**: Wagmi v2, Viem v2, OnchainKit v1.1
- **Farcaster**: MiniApp SDK, MiniApp Wagmi Connector, Quick Auth
- **Database**: Supabase (PostgreSQL with REST API)
- **Blockchain**: Base (Ethereum L2), USDC ERC20 token
- **Deployment**: Vercel (serverless)

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Layer (Mobile)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Landing   │  │   Auth     │  │  Banking   │            │
│  │   Page     │→ │  (Login/   │→ │   Home     │            │
│  │            │  │  Signup)   │  │ Dashboard  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                         ↓                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Payment   │  │ Recipient  │  │Transaction │            │
│  │   Flow     │← │   Select   │← │  History   │            │
│  │  (4 steps) │  │            │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Application Layer (Next.js API)                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ /api/auth  │  │ /api/      │  │ /api/      │            │
│  │ (Farcaster │  │ webhook    │  │ (future)   │            │
│  │  JWT)      │  │            │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (lib/)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  payments  │  │ recipients │  │transactions│            │
│  │  .ts       │  │  .ts       │  │  .ts       │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐                            │
│  │ user-      │  │ supabase   │                            │
│  │ context.tsx│  │  .ts       │                            │
│  └────────────┘  └────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Data & Blockchain Layer                         │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   Supabase DB        │  │   Base Blockchain    │        │
│  │  ┌────────────┐      │  │  ┌────────────┐     │        │
│  │  │ profiles   │      │  │  │ USDC Token │     │        │
│  │  │ recipients │      │  │  │ Contract   │     │        │
│  │  │transactions│      │  │  │ (ERC20)    │     │        │
│  │  └────────────┘      │  │  └────────────┘     │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```


### Data Flow Architecture

#### Authentication Flow
```
User Opens App → Farcaster SDK Init → Connect Wallet
    ↓
JWT Token Generated → /api/auth Verification
    ↓
User FID Retrieved → Profile Lookup/Creation in Supabase
    ↓
UserContext Updated → localStorage Persistence → Banking Home
```

#### Payment Flow
```
User Clicks "Send" → Select Recipient (or Add New)
    ↓
Enter Amount → Validate Balance → Review Screen
    ↓
Confirm Payment → Create Transaction Record (status: pending)
    ↓
Execute ERC20 Transfer via Wagmi → Broadcast to Base
    ↓
Update Transaction (status: sent, tx_hash)
    ↓
Poll for Confirmation → useWaitForTransactionReceipt
    ↓
Update Transaction (status: success) → Success Screen
```

## Components and Interfaces

### 1. User Layer Components

#### Landing Page (`components/landing-page.tsx`)
- **Purpose**: Marketing and onboarding entry point
- **Key Features**:
  - Hero section with app description
  - Feature highlights
  - CTA button to login/signup
- **State**: None (stateless presentation)
- **Navigation**: Routes to `/login` or `/signup`

#### Authentication Components (`components/auth/`)

**LoginForm.tsx**
- **Purpose**: Farcaster wallet authentication
- **Key Features**:
  - Farcaster Quick Auth integration
  - Wallet connection via MiniApp connector
  - JWT token handling
- **State**: 
  - `isConnecting: boolean`
  - `error: string | null`
- **Hooks**: 
  - `useConnect()` from Wagmi
  - `useAccount()` from Wagmi
- **API Calls**: `GET /api/auth` with Bearer token
- **Success Flow**: Set profile in UserContext → Navigate to `/home`

**SignupForm.tsx**
- **Purpose**: New user onboarding with profile creation
- **Key Features**:
  - Same Farcaster auth as login
  - Additional profile setup (name, handle)
  - Profile creation in Supabase
- **State**:
  - `isConnecting: boolean`
  - `profileData: { name: string, handle: string }`
  - `error: string | null`
- **Database**: Creates record in `profiles` table
- **Success Flow**: Set profile in UserContext → Navigate to `/home`

#### Banking Home (`components/banking-home.tsx`)
- **Purpose**: Main dashboard showing balance and transactions
- **Key Features**:
  - USDC balance display with loading state
  - Quick action buttons (Send, Add, Withdraw, More)
  - Transaction history list (10 most recent)
  - AI chat input (placeholder for future)
- **State**:
  - `balance: string | undefined`
  - `isLoadingBalance: boolean`
  - `transactions: Transaction[]`
  - `isLoadingTransactions: boolean`
- **Hooks**:
  - `useUSDCBalance(address)` from lib/payments
  - `useUser()` from lib/user-context
- **Data Sources**:
  - Balance: Base blockchain via Wagmi
  - Transactions: Supabase via `getRecentTransactions()`
- **Refresh**: Pull-to-refresh triggers data reload


#### Payment Flow Components (`components/payments/`)

**PaymentOptions.tsx**
- **Purpose**: Select payment type (Wallet/Bank/IBAN)
- **Key Features**:
  - Three payment type cards
  - Visual selection state
- **State**: `selectedType: 'wallet' | 'bank' | 'iban'`
- **Navigation**: Routes to `/payments/${type}/recipient`

**RecipientSelect.tsx**
- **Purpose**: Choose existing recipient or add new
- **Key Features**:
  - Searchable recipient list
  - "Add New Recipient" button
  - Recipient cards with name and address preview
- **State**:
  - `recipients: Recipient[]`
  - `searchTerm: string`
  - `isLoading: boolean`
- **Data Source**: `getRecipientsByProfile(profileId)` from lib/recipients
- **Search**: Client-side filtering by name
- **Navigation**: Routes to `/payments/${type}/${recipientId}/amount`

**RecipientForm.tsx**
- **Purpose**: Add new recipient
- **Key Features**:
  - Name input field
  - Wallet address input with validation
  - Address format validation (0x...)
- **State**:
  - `name: string`
  - `address: string`
  - `isSubmitting: boolean`
  - `validationError: string | null`
- **Validation**:
  - Name: Required, min 2 characters
  - Address: Required, valid Ethereum address format
- **API Call**: `createRecipient()` from lib/recipients
- **Success Flow**: Navigate to amount input with new recipient ID

**AmountInput.tsx**
- **Purpose**: Enter payment amount
- **Key Features**:
  - Numeric keyboard input
  - Balance display and validation
  - Currency formatting (USDC)
  - Optional note field
- **State**:
  - `amount: string`
  - `note: string`
  - `balance: string`
  - `isValid: boolean`
- **Validation**:
  - Amount > 0
  - Amount <= balance
  - Valid decimal format (max 2 decimals)
- **Hooks**: `useUSDCBalance(userAddress)`
- **Navigation**: Routes to `/payments/${type}/${recipientId}/review?amount=${amount}&note=${note}`

**ReviewCard.tsx**
- **Purpose**: Final confirmation before sending
- **Key Features**:
  - Recipient details display
  - Amount and note display
  - Estimated gas fee
  - Total calculation
  - Confirm button
- **State**:
  - `isExecuting: boolean`
  - `error: string | null`
- **Hooks**: `useCryptoPayment()` from lib/payments
- **Payment Execution**:
  1. Call `executePayment()` with payment data
  2. Show loading state
  3. Handle success/error
- **Success Flow**: Navigate to `/payments/status/${txId}`
- **Error Flow**: Display error toast, allow retry

**StatusIndicator.tsx**
- **Purpose**: Track transaction status in real-time
- **Key Features**:
  - Status badge (pending/sent/success/failed)
  - Transaction hash with block explorer link
  - Progress indicator for pending transactions
  - Retry button for failed transactions
- **State**:
  - `transaction: Transaction | null`
  - `isLoading: boolean`
- **Hooks**: `useTransactionStatus(txId)` from lib/payments
- **Polling**: Auto-refreshes until status is success or failed
- **Navigation**: "Done" button returns to `/home`

### 2. Service Layer (lib/)

#### payments.ts

**useCryptoPayment() Hook**
```typescript
interface CryptoPaymentData {
  recipientId: string;
  amount: string;
  token: string;
  chain: string;
  to: string;
  sender_profile_id: string;
  tokenAddress?: string;
  decimals?: number;
}

interface CryptoPaymentResult {
  hash: string;
  txId: string;
  status: "pending" | "sent" | "success" | "failed";
}

function useCryptoPayment(): {
  executePayment: (data: CryptoPaymentData) => Promise<CryptoPaymentResult>;
  isLoading: boolean;
  error: string | null;
}
```

**Implementation Details**:
1. Validates wallet connection
2. Creates pending transaction in Supabase
3. Converts amount to wei using `parseUnits(amount, 6)` for USDC
4. Calls `writeContractAsync()` with ERC20 transfer function
5. Updates transaction to "sent" with tx_hash
6. Returns result for status tracking

**useTransactionStatus() Hook**
```typescript
function useTransactionStatus(txId: string | null): {
  transaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

**Implementation Details**:
1. Fetches transaction from Supabase by ID
2. Uses `useWaitForTransactionReceipt()` to poll blockchain
3. Auto-updates transaction to "success" when confirmed
4. Provides manual refetch function

**useUSDCBalance() Hook**
```typescript
function useUSDCBalance(address?: `0x${string}`): {
  formattedBalance: string | undefined;
  isLoading: boolean;
  isError: boolean;
}
```

**Implementation Details**:
1. Calls ERC20 `balanceOf()` via `useReadContract()`
2. Formats balance from wei to decimal (6 decimals for USDC)
3. Returns formatted string with 2 decimal places


#### recipients.ts

**Key Functions**:
```typescript
// Get all recipients for a profile
getRecipientsByProfile(profileId: string): Promise<Recipient[]>

// Get single recipient by ID
getRecipient(recipientId: string): Promise<Recipient | null>

// Create new recipient
createRecipient(data: {
  profile_id: string;
  name: string;
  profile_id_link?: string;
  external_address?: string;
  status?: "active" | "inactive";
}): Promise<Recipient>

// Update recipient
updateRecipient(recipientId: string, updates: Partial<Recipient>): Promise<Recipient>

// Delete recipient
deleteRecipient(recipientId: string): Promise<void>

// Search recipients by name
searchRecipients(profileId: string, searchTerm: string): Promise<Recipient[]>
```

**Design Notes**:
- Recipients can be either app users (profile_id_link) or external wallets (external_address)
- Search uses Supabase's `ilike` for case-insensitive matching
- All queries scoped to profile_id for data isolation

#### transactions.ts

**Key Functions**:
```typescript
// Get all transactions for a profile (sent + received)
getTransactionsByProfile(profileId: string): Promise<Transaction[]>

// Get recent transactions (limited)
getRecentTransactions(profileId: string, limit?: number): Promise<Transaction[]>

// Get sent transactions only
getSentTransactions(profileId: string): Promise<Transaction[]>

// Get received transactions only
getReceivedTransactions(profileId: string): Promise<Transaction[]>

// Create new transaction
createTransaction(data: {
  recipient_id: string;
  chain: string;
  amount: string;
  token: string;
  sender_profile_id: string;
}): Promise<Transaction>

// Update transaction status
updateTransactionStatus(
  transactionId: string,
  status: "pending" | "sent" | "success" | "failed",
  txHash?: string
): Promise<Transaction>

// Get transaction by ID
getTransactionStatus(transactionId: string): Promise<Transaction | null>

// Utility: Group transactions by date
groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]>

// Utility: Format transaction amount
formatTransactionAmount(amount: string | number, token?: string): string
```

**Design Notes**:
- Transactions are profile-centric (user can be sender or recipient)
- Status lifecycle: pending → sent → success/failed
- Includes Supabase joins to fetch recipient/sender details
- Utility functions for UI formatting

#### user-context.tsx

**UserContext Interface**:
```typescript
interface UserContextType {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  isLoading: boolean;
}
```

**Implementation Details**:
- Provides global user state via React Context
- Persists profile to localStorage for session management
- Loads profile on app initialization
- Used throughout app for authentication checks

#### supabase.ts

**Database Types**:
```typescript
interface Profile {
  id: string;
  name: string;
  handle: string;
  wallet_address: string;
  balance: string;
  created_at: string;
  updated_at: string;
}

interface Recipient {
  id: string;
  profile_id: string;
  name: string;
  status: "active" | "inactive";
  profile_id_link: string | null;
  external_address: string | null;
  created_at: string;
  updated_at?: string;
}

interface Transaction {
  id: string;
  sender_profile_id: string;
  recipient_id: string;
  tx_hash: string | null;
  chain: string;
  amount: string;
  token: string;
  status: "pending" | "sent" | "success" | "failed";
  created_at: string;
}
```

**Client Configuration**:
- Initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Provides typed client for all database operations
- Exports type definitions for type safety

### 3. API Layer (app/api/)

#### /api/auth (GET)

**Purpose**: Verify Farcaster JWT token and authenticate user

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response (Success)**:
```json
{
  "success": true,
  "user": {
    "fid": "123456",
    "issuedAt": 1234567890,
    "expiresAt": 1234567890
  }
}
```

**Response (Error)**:
```json
{
  "message": "Invalid token"
}
```

**Implementation Details**:
1. Extracts Bearer token from Authorization header
2. Determines domain from request headers (Origin → Host → env vars)
3. Verifies JWT using `@farcaster/quick-auth`
4. Returns user FID on success
5. Handles InvalidTokenError and generic errors

**Domain Resolution Logic**:
- Production: Uses `NEXT_PUBLIC_URL`
- Vercel Preview: Uses `VERCEL_URL`
- Local: Defaults to `localhost:3000`
- CORS-aware: Prioritizes Origin header for cross-origin requests


## Data Models

### Database Schema (Supabase PostgreSQL)

#### profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  balance NUMERIC(20,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX idx_profiles_handle ON profiles(handle);
```

**Purpose**: Store user identity and profile information

**Key Fields**:
- `id`: Primary key (UUID)
- `name`: Display name
- `handle`: Unique username (e.g., @alice)
- `wallet_address`: Connected Ethereum address
- `balance`: Cached balance for quick display (updated periodically)
- `created_at`, `updated_at`: Timestamps

**Relationships**:
- One-to-many with `recipients` (profile_id)
- One-to-many with `transactions` (sender_profile_id)

#### recipients Table
```sql
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  profile_id_link UUID REFERENCES profiles(id) ON DELETE SET NULL,
  external_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT recipient_address_check CHECK (
    (profile_id_link IS NOT NULL AND external_address IS NULL) OR
    (profile_id_link IS NULL AND external_address IS NOT NULL)
  )
);

CREATE INDEX idx_recipients_profile ON recipients(profile_id);
CREATE INDEX idx_recipients_status ON recipients(profile_id, status);
```

**Purpose**: Store payment recipients (contacts/friends list)

**Key Fields**:
- `id`: Primary key (UUID)
- `profile_id`: Owner of this recipient entry (FK to profiles)
- `name`: Recipient display name
- `status`: Active or inactive
- `profile_id_link`: Link to profiles if recipient is an app user
- `external_address`: Wallet address if recipient is external
- `created_at`, `updated_at`: Timestamps

**Constraints**:
- Must have either `profile_id_link` OR `external_address`, not both
- Cascading delete when profile is deleted

**Relationships**:
- Many-to-one with `profiles` (profile_id)
- Optional many-to-one with `profiles` (profile_id_link)
- One-to-many with `transactions` (recipient_id)

#### transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE RESTRICT,
  tx_hash TEXT,
  chain TEXT NOT NULL,
  amount NUMERIC(20,8) NOT NULL,
  token TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_sender ON transactions(sender_profile_id, created_at DESC);
CREATE INDEX idx_transactions_recipient ON transactions(recipient_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
```

**Purpose**: Track all payment transactions

**Key Fields**:
- `id`: Primary key (UUID)
- `sender_profile_id`: User who sent the payment (FK to profiles)
- `recipient_id`: Recipient of the payment (FK to recipients)
- `tx_hash`: Blockchain transaction hash (null until broadcasted)
- `chain`: Blockchain network (e.g., "Base")
- `amount`: Transaction amount (numeric with 8 decimal precision)
- `token`: Token symbol (e.g., "USDC")
- `status`: Transaction lifecycle state
- `created_at`: Timestamp

**Status Lifecycle**:
1. `pending`: Transaction created, not yet broadcasted
2. `sent`: Broadcasted to blockchain, awaiting confirmation
3. `success`: Confirmed on-chain
4. `failed`: Transaction reverted or error occurred

**Relationships**:
- Many-to-one with `profiles` (sender_profile_id)
- Many-to-one with `recipients` (recipient_id)

**Indexes**:
- Optimized for querying by sender with recent-first ordering
- Optimized for querying by recipient with recent-first ordering
- Fast lookups by status and tx_hash

### Blockchain Data Models

#### USDC Token (ERC20)
```
Contract Address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Network: Base (Chain ID: 8453)
Decimals: 6
Symbol: USDC
```

**Key Functions Used**:
- `balanceOf(address)`: Get token balance
- `transfer(address to, uint256 amount)`: Send tokens

**Transaction Structure**:
```typescript
{
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  abi: ERC20_ABI,
  functionName: "transfer",
  args: [recipientAddress, amountInWei],
  chainId: 8453
}
```


## Error Handling

### Error Categories and Strategies

#### 1. Authentication Errors

**Wallet Connection Failures**
- **Cause**: User rejects connection, wallet not available
- **Handling**: Display error toast with retry button
- **User Message**: "Unable to connect wallet. Please try again."
- **Recovery**: Allow user to retry connection

**JWT Verification Failures**
- **Cause**: Invalid token, expired token, domain mismatch
- **Handling**: Clear session, redirect to login
- **User Message**: "Session expired. Please log in again."
- **Recovery**: Force re-authentication

**Profile Creation Failures**
- **Cause**: Database error, duplicate handle
- **Handling**: Display specific error, allow retry
- **User Message**: "Handle already taken" or "Unable to create profile"
- **Recovery**: Allow user to choose different handle

#### 2. Payment Errors

**Insufficient Balance**
- **Cause**: Amount exceeds available USDC
- **Handling**: Disable confirm button, show error message
- **User Message**: "Insufficient balance. You need X more USDC."
- **Recovery**: User must reduce amount or add funds

**Invalid Recipient Address**
- **Cause**: Malformed Ethereum address
- **Handling**: Show validation error on input field
- **User Message**: "Invalid wallet address format"
- **Recovery**: User must enter valid address

**Transaction Rejected**
- **Cause**: User rejects transaction in wallet
- **Handling**: Return to review screen, preserve form data
- **User Message**: "Transaction cancelled"
- **Recovery**: User can retry or modify amount

**Transaction Failed On-Chain**
- **Cause**: Gas estimation failure, contract revert
- **Handling**: Update transaction status to "failed", show error details
- **User Message**: "Transaction failed: [reason]"
- **Recovery**: Provide retry button, suggest checking balance/network

**Network Errors**
- **Cause**: RPC timeout, network congestion
- **Handling**: Retry with exponential backoff (3 attempts)
- **User Message**: "Network error. Retrying..."
- **Recovery**: Auto-retry, then allow manual retry

#### 3. Database Errors

**Connection Failures**
- **Cause**: Supabase unavailable, network issues
- **Handling**: Show error state with retry button
- **User Message**: "Unable to load data. Please try again."
- **Recovery**: Provide manual refresh

**Write Failures**
- **Cause**: Constraint violations, permissions
- **Handling**: Log error, show generic message
- **User Message**: "Unable to save. Please try again."
- **Recovery**: Retry with exponential backoff

**Data Not Found**
- **Cause**: Recipient/transaction deleted or doesn't exist
- **Handling**: Redirect to appropriate screen
- **User Message**: "Recipient not found"
- **Recovery**: Return to recipient selection

#### 4. Validation Errors

**Form Validation**
- **Handling**: Inline error messages on fields
- **Examples**:
  - "Name is required"
  - "Amount must be greater than 0"
  - "Invalid address format"
- **Recovery**: User corrects input

**Business Logic Validation**
- **Handling**: Toast notifications or modal dialogs
- **Examples**:
  - "Cannot send to yourself"
  - "Minimum amount is 0.01 USDC"
- **Recovery**: User adjusts action

### Error Logging Strategy

**Client-Side Logging**
```typescript
console.error("[Component] Error description", {
  context: "relevant data",
  error: errorObject
});
```

**Structured Logging Format**:
- Prefix with component/function name
- Include relevant context (user ID, transaction ID, etc.)
- Log full error object for debugging
- Use emoji indicators (❌ for errors, ✓ for success)

**Production Considerations**:
- Errors logged to browser console (future: send to monitoring service)
- Sensitive data (private keys, full addresses) never logged
- User-facing messages are friendly and actionable

### Retry Logic

**Exponential Backoff**
```typescript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

**Applied To**:
- Database writes (3 retries)
- RPC calls (3 retries)
- API requests (2 retries)

**Not Applied To**:
- User-rejected transactions (no auto-retry)
- Validation errors (immediate feedback)
- Authentication failures (redirect to login)


## Testing Strategy

### Overview

The MVP uses a lightweight, dependency-free testing approach aligned with the project's guidelines. Tests focus on core business logic and data transformations without requiring heavy frameworks like Jest or Vitest.

### Testing Infrastructure

#### Test Runner (scripts/run-tests.mjs)

**Purpose**: Minimal Node.js-based test runner

**Features**:
- Discovers `*.test.mjs` files in `tests/` directory
- Executes tests serially
- Reports pass/fail with colored output
- Exits with appropriate status code

**Usage**:
```bash
node scripts/run-tests.mjs
```

**Output Format**:
```
✔ sample.test.mjs passed
✔ payments.test.mjs passed
✘ recipients.test.mjs failed
  Error: Expected 'John' but got 'Jane'

2 passed, 1 failed
```

#### Test File Structure

**Location**: `tests/*.test.mjs`

**Format**:
```javascript
import assert from 'node:assert/strict';

export async function test() {
  // Test logic here
  assert.equal(actual, expected);
}
```

**Rules**:
- Use Node's built-in `assert/strict` module
- Export an async function named `test`
- Throw to fail, return to pass
- Keep tests deterministic (no network calls)

### Test Coverage

#### 1. Utility Functions

**File**: `tests/utils.test.mjs`

**Test Cases**:
- Currency formatting (formatTransactionAmount)
- Address validation (isValidEthereumAddress)
- Amount parsing (parseAmount)
- Date grouping (groupTransactionsByDate)

**Example**:
```javascript
import assert from 'node:assert/strict';
import { formatTransactionAmount } from '../lib/transactions.js';

export async function test() {
  // Test positive amount
  assert.equal(formatTransactionAmount('10.5', 'USDC'), '10.50 USDC');
  
  // Test negative amount
  assert.equal(formatTransactionAmount('-5.25', 'USDC'), '-5.25 USDC');
  
  // Test zero
  assert.equal(formatTransactionAmount('0', 'USDC'), '0.00 USDC');
}
```

#### 2. Payment Logic

**File**: `tests/payments.test.mjs`

**Test Cases**:
- Amount validation (positive, non-zero, max decimals)
- Balance checking (sufficient/insufficient)
- Wei conversion (parseUnits correctness)
- Transaction state transitions

**Example**:
```javascript
import assert from 'node:assert/strict';
import { parseUnits } from 'viem';

export async function test() {
  // Test USDC amount conversion (6 decimals)
  const amount = '10.50';
  const wei = parseUnits(amount, 6);
  assert.equal(wei.toString(), '10500000');
  
  // Test max decimals
  const tooManyDecimals = '10.123456789';
  const truncated = parseUnits(tooManyDecimals.slice(0, -3), 6);
  assert.equal(truncated.toString(), '10123456');
}
```

#### 3. Recipient Validation

**File**: `tests/recipients.test.mjs`

**Test Cases**:
- Name validation (required, min length)
- Address format validation (0x prefix, 40 hex chars)
- Duplicate detection logic
- Search filtering

**Example**:
```javascript
import assert from 'node:assert/strict';

function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function test() {
  // Valid address
  assert.equal(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'), true);
  
  // Invalid: missing 0x
  assert.equal(isValidEthereumAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb'), false);
  
  // Invalid: too short
  assert.equal(isValidEthereumAddress('0x123'), false);
  
  // Invalid: non-hex characters
  assert.equal(isValidEthereumAddress('0xGGGd35Cc6634C0532925a3b844Bc9e7595f0bEb'), false);
}
```

#### 4. Transaction Status Logic

**File**: `tests/transaction-status.test.mjs`

**Test Cases**:
- Status transition validation (pending → sent → success)
- Invalid transitions (success → pending)
- Status badge color mapping
- Timestamp formatting

**Example**:
```javascript
import assert from 'node:assert/strict';

function isValidStatusTransition(from, to) {
  const validTransitions = {
    'pending': ['sent', 'failed'],
    'sent': ['success', 'failed'],
    'success': [],
    'failed': []
  };
  return validTransitions[from]?.includes(to) || false;
}

export async function test() {
  // Valid transitions
  assert.equal(isValidStatusTransition('pending', 'sent'), true);
  assert.equal(isValidStatusTransition('sent', 'success'), true);
  
  // Invalid transitions
  assert.equal(isValidStatusTransition('success', 'pending'), false);
  assert.equal(isValidStatusTransition('failed', 'sent'), false);
}
```

### Integration Testing Approach

**Scope**: End-to-end flows without external dependencies

**Strategy**:
- Mock Supabase responses with in-memory data
- Mock Wagmi hooks with predefined return values
- Test component logic in isolation
- Validate state transitions

**Not Included in MVP**:
- Browser automation (Playwright/Cypress)
- Visual regression testing
- Load/performance testing
- Real blockchain interactions

### Manual Testing Checklist

**Authentication Flow**:
- [ ] Connect wallet successfully
- [ ] Handle wallet rejection
- [ ] Verify JWT token
- [ ] Create new profile
- [ ] Load existing profile
- [ ] Session persistence across refreshes

**Payment Flow**:
- [ ] Select recipient from list
- [ ] Add new recipient
- [ ] Enter valid amount
- [ ] Validate insufficient balance
- [ ] Review transaction details
- [ ] Confirm payment
- [ ] Track transaction status
- [ ] View success screen
- [ ] Handle transaction failure

**Dashboard**:
- [ ] Display correct USDC balance
- [ ] Show recent transactions
- [ ] Refresh data on pull-to-refresh
- [ ] Handle empty states
- [ ] Navigate to payment flow

**Error Scenarios**:
- [ ] Network disconnection during payment
- [ ] Invalid recipient address
- [ ] Transaction rejection
- [ ] Database unavailable
- [ ] Expired session

### Continuous Testing

**Development Workflow**:
1. Write test for new utility function
2. Implement function
3. Run `node scripts/run-tests.mjs`
4. Fix failures
5. Commit when all tests pass

**Pre-Deployment**:
1. Run full test suite
2. Manual testing of critical paths
3. Verify on testnet (Base Sepolia)
4. Deploy to production


## Configuration and Environment

### Environment Variables

#### Required Variables

**Supabase Configuration**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
- **Purpose**: Database connection
- **Usage**: Client-side Supabase initialization
- **Security**: Anon key is safe for client-side use (RLS enforced)

**OnchainKit Configuration**
```bash
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your-coinbase-api-key
```
- **Purpose**: Coinbase OnchainKit features
- **Usage**: Enhanced Base chain utilities
- **Optional**: App works without it, but some features may be limited

**Deployment Configuration**
```bash
NEXT_PUBLIC_URL=https://your-domain.com
```
- **Purpose**: Base URL for MiniApp metadata
- **Usage**: Screenshots, icons, webhooks in minikit.config.ts
- **Fallback**: Uses VERCEL_PROJECT_PRODUCTION_URL or localhost:3000

#### Auto-Injected Variables (Vercel)

```bash
VERCEL_URL=your-preview-deployment.vercel.app
VERCEL_PROJECT_PRODUCTION_URL=your-production-domain.vercel.app
VERCEL_ENV=production|preview|development
```
- **Purpose**: Automatic domain detection
- **Usage**: API auth domain verification
- **Managed By**: Vercel platform

### Configuration Files

#### app/config.ts (Wagmi Configuration)

```typescript
import { http, createConfig, createStorage } from "wagmi";
import { base } from "wagmi/chains";
import { porto } from "wagmi/connectors";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [miniAppConnector(), porto()],
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
});
```

**Key Decisions**:
- **Chains**: Base only (mainnet, chain ID 8453)
- **Connectors**: Farcaster MiniApp + Porto (fallback)
- **Transport**: HTTP (default RPC)
- **Storage**: localStorage for wallet persistence

#### minikit.config.ts (Farcaster MiniApp Manifest)

```typescript
const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const minikitConfig = {
  accountAssociation: {
    header: "...",
    payload: "...",
    signature: "..."
  },
  miniapp: {
    version: "1",
    name: "Banb",
    subtitle: "Blockchain Agent Neo Bank",
    description: "...",
    screenshotUrls: [`${ROOT_URL}/bab.png`],
    iconUrl: `${ROOT_URL}/bab.png`,
    splashImageUrl: `${ROOT_URL}/bab.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["finance", "banking", "blockchain", "agent", "ai"],
    // ... other metadata
  }
};
```

**Key Decisions**:
- **Account Association**: Pre-signed for domain verification
- **Assets**: All images served from public/ directory
- **Category**: Finance (for Farcaster app store)
- **Webhook**: Placeholder for future notifications

#### app/providers.tsx (React Context Setup)

```typescript
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/lib/user-context";

export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          {children}
        </UserProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**Provider Hierarchy**:
1. **WagmiProvider**: Web3 wallet and blockchain state
2. **QueryClientProvider**: React Query for data fetching
3. **UserProvider**: Global user profile state

#### app/rootProvider.tsx (OnchainKit Setup)

```typescript
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

export function RootProvider({ children }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
    >
      {children}
    </OnchainKitProvider>
  );
}
```

**Purpose**: Enables OnchainKit components and utilities

### Build Configuration

#### next.config.ts

```typescript
const nextConfig = {
  experimental: {
    https: true, // For npm run dev:https
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};
```

**Key Decisions**:
- **HTTPS Support**: Experimental flag for local wallet testing
- **Externals**: Prevent bundling of Node.js-only packages
- **Aliases**: Disable React Native shims for web

#### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Key Decisions**:
- **Strict Mode**: Enabled for type safety
- **Module Resolution**: Bundler mode for Next.js 15
- **Path Alias**: `@/` maps to project root

### Development vs Production

#### Development Mode
```bash
npm run dev          # HTTP on localhost:3000
npm run dev:https    # HTTPS on localhost:3000 (for wallet testing)
```

**Characteristics**:
- Hot module replacement
- Detailed error messages
- Source maps enabled
- Console logging verbose

#### Production Mode
```bash
npm run build        # Create optimized build
npm run start        # Serve production build
```

**Characteristics**:
- Minified bundles
- Optimized images
- Server-side rendering
- Edge functions on Vercel

### Security Considerations

**Environment Variables**:
- Never commit `.env.local` to git
- Use Vercel dashboard for production secrets
- Rotate API keys periodically

**Supabase RLS**:
- Row-level security policies enforce data isolation
- Anon key is safe for client-side use
- Users can only access their own data

**Wallet Security**:
- Private keys never leave user's wallet
- Transactions require explicit user approval
- No server-side key storage


## Mobile-First Design Patterns

### Responsive Layout Strategy

#### Breakpoints
```css
/* Tailwind default breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

**Design Priority**: Mobile-first (< 640px)

#### Layout Patterns

**Single Column Layout**
- All content stacked vertically
- Full-width cards and buttons
- Minimal horizontal scrolling
- Touch-friendly spacing (min 44px targets)

**Navigation**
- Bottom navigation bar for primary actions
- Top app bar for context and back button
- Swipe gestures for back navigation
- Pull-to-refresh for data updates

**Forms**
- One input per row
- Large touch targets (min 44px height)
- Auto-focus first field
- Appropriate mobile keyboards (numeric for amounts)
- Clear validation feedback

### Touch Interactions

#### Button Sizing
```css
/* Minimum touch target */
.btn {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}
```

#### Tap States
- Active state on touch (visual feedback)
- Disabled state clearly visible
- Loading state with spinner
- Success state with checkmark

#### Gestures
- **Swipe Left**: Navigate back (browser default)
- **Pull Down**: Refresh data
- **Long Press**: Show context menu (future)
- **Tap**: Primary action
- **Double Tap**: Disabled (prevent accidental actions)

### Input Optimization

#### Keyboard Types
```typescript
// Amount input
<input type="number" inputMode="decimal" />

// Wallet address
<input type="text" inputMode="text" autoCapitalize="none" />

// Name input
<input type="text" inputMode="text" autoCapitalize="words" />

// Search
<input type="search" inputMode="search" />
```

#### Auto-Complete
- Recipient names from saved list
- Recent amounts (future)
- Wallet addresses from clipboard detection

#### Validation Feedback
- Inline errors below input
- Red border on invalid input
- Green checkmark on valid input
- Disabled submit until valid

### Performance Optimizations

#### Image Loading
```typescript
import Image from 'next/image';

<Image
  src="/bab.png"
  alt="Logo"
  width={48}
  height={48}
  priority={true} // For above-fold images
/>
```

#### List Virtualization
- Render only visible items
- Infinite scroll for long lists
- Skeleton loaders during fetch

#### Code Splitting
```typescript
// Lazy load heavy components
const PaymentFlow = dynamic(() => import('@/components/payments/PaymentFlow'));
```

#### Data Fetching
- React Query for caching
- Stale-while-revalidate strategy
- Optimistic updates for instant feedback

### Accessibility

#### Screen Reader Support
```typescript
<button aria-label="Send payment">
  <SendIcon />
</button>

<div role="status" aria-live="polite">
  {isLoading ? 'Loading...' : 'Transaction complete'}
</div>
```

#### Focus Management
- Logical tab order
- Focus trap in modals
- Skip to content link
- Visible focus indicators

#### Color Contrast
- WCAG AA compliance (4.5:1 for text)
- Status colors distinguishable
- Dark mode support

### Animation and Transitions

#### Page Transitions
```css
/* Smooth page navigation */
.page-enter {
  opacity: 0;
  transform: translateX(100%);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 300ms ease-out;
}
```

#### Loading States
- Skeleton screens for content
- Spinner for actions
- Progress bar for multi-step flows

#### Micro-interactions
- Button press feedback (scale down)
- Success checkmark animation
- Error shake animation
- Toast slide-in from top

### Offline Handling

#### Network Detection
```typescript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

#### Offline UI
- Banner showing offline status
- Disable actions requiring network
- Show cached data with indicator
- Queue actions for when online (future)

### Dark Mode Support

#### Theme Provider
```typescript
import { ThemeProvider } from '@/components/theme-provider';

<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

#### Color Tokens
```css
/* Light mode */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;

/* Dark mode */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

#### System Preference Detection
- Respects user's OS theme
- Manual toggle available
- Persists preference to localStorage

## Deployment Strategy

### Vercel Deployment

#### Build Process
1. Install dependencies (`npm ci`)
2. Run TypeScript compiler (`tsc --noEmit`)
3. Build Next.js app (`next build`)
4. Generate static pages and API routes
5. Deploy to Vercel Edge Network

#### Environment Setup
- Production: `VERCEL_ENV=production`
- Preview: `VERCEL_ENV=preview` (for PRs)
- Development: Local only

#### Domain Configuration
- Production: Custom domain (e.g., banb.app)
- Preview: Auto-generated Vercel URL
- SSL: Automatic via Vercel

### Database Migration Strategy

#### Initial Setup
1. Create Supabase project
2. Run SQL migrations for tables
3. Set up Row Level Security policies
4. Configure API keys

#### Schema Updates
```sql
-- Example migration
ALTER TABLE transactions ADD COLUMN note TEXT;
CREATE INDEX idx_transactions_note ON transactions(note);
```

**Process**:
1. Test migration on staging database
2. Backup production database
3. Run migration during low-traffic window
4. Verify data integrity
5. Deploy app update

### Monitoring and Observability

#### Metrics to Track
- **Performance**: Page load time, API response time
- **Errors**: Client errors, API errors, transaction failures
- **Usage**: Active users, transactions per day, payment volume
- **Blockchain**: Gas costs, transaction success rate

#### Tools (Future)
- Vercel Analytics for performance
- Sentry for error tracking
- Supabase logs for database queries
- Custom dashboard for business metrics

### Rollback Strategy

#### Quick Rollback
```bash
# Revert to previous deployment
vercel rollback
```

#### Database Rollback
- Restore from Supabase backup
- Run reverse migration if needed
- Verify data consistency

#### Communication
- Status page for users
- Incident report for team
- Post-mortem for learning

## Future Enhancements (Post-MVP)

### Phase 2: Enhanced Features
- **AI Agent**: Natural language payment commands
- **Fiat On/Off-Ramps**: Google Pay, Revolut Pay integration
- **Investment Accounts**: DeFi protocol integration
- **Recurring Payments**: Scheduled transfers
- **Multi-Currency**: Support for multiple tokens

### Phase 3: Advanced Features
- **Social Features**: Split payments, group expenses
- **Notifications**: Push notifications for transactions
- **Analytics**: Spending insights and reports
- **Security**: Biometric authentication, spending limits
- **Internationalization**: Multi-language support

### Technical Debt to Address
- Implement comprehensive error monitoring
- Add end-to-end tests with Playwright
- Optimize bundle size (code splitting)
- Implement proper caching strategy
- Add rate limiting to API routes
- Set up CI/CD pipeline with automated tests

## Conclusion

This design document provides a comprehensive blueprint for the BANB Farcaster MiniApp MVP. The architecture prioritizes:

1. **Simplicity**: Minimal dependencies, clear separation of concerns
2. **Reliability**: Robust error handling, graceful degradation
3. **Performance**: Mobile-optimized, efficient data fetching
4. **Security**: Wallet-based auth, RLS policies, no server-side keys
5. **Testability**: Lightweight testing infrastructure, pure functions

The design is intentionally focused on delivering a working payment flow that users can test immediately, with clear paths for future enhancement.
