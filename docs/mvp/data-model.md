# BANB – Database Strategy and Data Model Documentation

## 1. Overview

This document outlines the database strategy and data model for the BANB (Blockchain Agent Neo Bank) mini application. The system is built on **Supabase (PostgreSQL)** and follows a **profile-centric architecture** where user profiles serve as the primary entry point for all financial operations.

---

## 2. Architecture Principles

### 2.1 Profile-Centric Design

- **Primary Entity**: The `profiles` table serves as the central hub for all user data.
- **Foreign Key Strategy**: All major entities reference `profile_id` as the main relationship key.
- **User Identity**: Each user has a unique profile with a primary wallet address (corresponds to the smart wallet for email signup or Farcaster wallet for Farcaster login) and handle.

### 2.2 Account-Based Transaction Model

- **Multi-Account Support**: Profiles can have multiple accounts (linked wallets), each representing a different wallet address.
- **Account Types**: Spending, Investment, and Savings accounts for different use cases.
- **Transaction Tracking**: Transactions are tracked at the account level via `account_transactions` table.
- **Legacy Support**: The `transactions` table exists but is potentially deprecated in favor of the account-based model.

### 2.3 Relational Data Model

- **One-to-Many Relationships**: Profiles can have multiple accounts, investments, recipients, and transactions.
- **Referential Integrity**: Foreign key constraints ensure data consistency.
- **Audit Trail**: All tables include `created_at` and `updated_at` timestamps.

### 2.4 Blockchain Integration

- **Transaction Tracking**: All financial operations are recorded with blockchain transaction hashes.
- **Status Management**: Comprehensive status tracking for all financial operations (pending, confirmed, failed).
- **Multi-Chain Ready**: Network field supports multiple blockchain networks (currently Base).

---

## 3. Database Schema

### 3.1 Core Tables

#### 1. Profiles Table

**Purpose**: Central user identity and authentication.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT uuid_generate_v4() |
| `name` | TEXT | User display name | NOT NULL |
| `handle` | TEXT | Unique handle (e.g., {first3letters}{3random}) | NOT NULL, UNIQUE |
| `wallet_address` | TEXT | Primary blockchain wallet address (Base chain) | NOT NULL |
| `status` | TEXT | Account status | DEFAULT 'active', CHECK ('active' OR 'inactive') |
| `created_at` | TIMESTAMPTZ | Creation timestamp | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | NOT NULL, DEFAULT now() |

**Key Features:**
- Unique handle generation: e.g., "joh7x2"
- Wallet addresses stored in lowercase
- Account status tracking for management and verification
- Primary wallet corresponds to signup wallet (smart wallet for email, Farcaster wallet for Farcaster login)

---

#### 2. Accounts Table

**Purpose**: Stores linked wallet accounts for each profile. Each account represents a wallet address that can be used for transactions.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT uuid_generate_v4() |
| `profile_id` | UUID | Owner profile ID | NOT NULL, FK to profiles.id |
| `name` | TEXT | Display name (e.g., "Spending Account 1") | NOT NULL |
| `type` | TEXT | Account type | NOT NULL, CHECK ('spending' OR 'investment' OR 'savings') |
| `address` | TEXT | Blockchain wallet address | NOT NULL |
| `network` | TEXT | Blockchain network (e.g., 'base') | NOT NULL |
| `balance` | NUMERIC | Current balance | DEFAULT 0 |
| `is_primary` | BOOLEAN | Whether this is the primary account | DEFAULT false |
| `status` | TEXT | Account status | DEFAULT 'active', CHECK ('active' OR 'inactive') |
| `created_at` | TIMESTAMPTZ | Creation timestamp | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | DEFAULT now() |

**Key Features:**
- Each account corresponds to a linked wallet address
- Supports multiple account types (spending, investment, savings)
- Primary account flag for default account selection
- Soft delete via status field (inactive)
- Tree schema: `profile` → `account` → `account_transactions`

**Account Types:**
- **Spending**: Primary wallet for daily transactions
- **Investment**: Wallet for DeFi investments
- **Savings**: Wallet for savings goals

---

#### 3. Account Transactions Table

**Purpose**: Tracks all transactions at the account level. This is the primary transaction tracking table.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT uuid_generate_v4() |
| `account_id` | UUID | Account ID | NOT NULL, FK to accounts.id |
| `amount` | NUMERIC | Transaction amount | NOT NULL |
| `direction` | TEXT | Transaction direction | NOT NULL, CHECK ('in' OR 'out') |
| `counterparty` | TEXT | Counterparty wallet address or username | NULL |
| `counterparty_name` | TEXT | Display name of counterparty | NULL |
| `tx_hash` | TEXT | Blockchain transaction hash | NULL |
| `token_symbol` | TEXT | Token symbol (e.g., 'USDC') | DEFAULT 'USDC' |
| `network` | TEXT | Blockchain network | NOT NULL |
| `status` | TEXT | Transaction status | DEFAULT 'pending', CHECK ('pending' OR 'confirmed' OR 'failed') |
| `description` | TEXT | Optional description | NULL |
| `metadata` | JSONB | Additional transaction data | NULL |
| `created_at` | TIMESTAMPTZ | Creation timestamp | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | DEFAULT now() |

**Key Features:**
- Per-account transaction tracking
- Direction-based tracking (incoming/outgoing)
- Counterparty information for both internal and external transactions
- Full blockchain traceability via transaction hashes
- Flexible JSONB metadata for additional data
- Status lifecycle: pending → confirmed/failed

---

#### 4. Recipients Table

**Purpose**: Stores payment recipients — friends, external wallets, or bank accounts.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT uuid_generate_v4() |
| `profile_id` | UUID | Owner profile ID | NOT NULL, FK to profiles.id |
| `name` | TEXT | Display name | NOT NULL |
| `status` | TEXT | Recipient status | NOT NULL, DEFAULT 'active', CHECK ('active' OR 'inactive') |
| `recipient_type` | VARCHAR | Type: 'crypto' or 'bank' | DEFAULT 'crypto', CHECK ('crypto' OR 'bank') |
| `profile_id_link` | UUID | Link to other user profile if app user | NULL, FK to profiles.id |
| `external_address` | TEXT | External wallet address | NULL |
| `bank_details` | JSONB | Bank account details | DEFAULT '[]' |
| `created_at` | TIMESTAMPTZ | Creation timestamp | NOT NULL, DEFAULT now() |

**Key Features:**
- Dual recipient types (internal app users + external wallets/banks)
- JSONB `bank_details` for flexible account info
- Link to internal profiles for in-app transfers
- Default recipient type is 'crypto'

**Bank Details Example:**
```json
{
  "iban": "string",
  "country": "string",
  "currency": "string",
  "routing_number": "string (optional)",
  "account_number": "string (optional)",
  "bank_name": "string (optional)"
}
```

---

#### 5. Transactions Table (Potentially Deprecated)

**Purpose**: Legacy table for recording crypto payment transactions. May be deprecated in favor of `account_transactions`.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT uuid_generate_v4() |
| `sender_profile_id` | UUID | Sender's profile ID | NOT NULL, FK to profiles.id |
| `recipient_id` | UUID | Recipient ID | NOT NULL, FK to recipients.id |
| `tx_hash` | TEXT | Blockchain transaction hash | NULL |
| `chain` | TEXT | Blockchain network | NOT NULL, DEFAULT 'base' |
| `amount` | NUMERIC | Amount in token units | NOT NULL |
| `token` | TEXT | Token symbol | NOT NULL, DEFAULT 'USDC' |
| `status` | TEXT | Transaction status | NOT NULL, DEFAULT 'pending', CHECK ('pending' OR 'sent' OR 'success' OR 'failed') |
| `created_at` | TIMESTAMPTZ | Creation timestamp | NOT NULL, DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | NOT NULL, DEFAULT now() |

**Key Features:**
- High-precision amounts
- Full blockchain traceability via transaction hashes
- Multi-token and multi-chain compatibility
- **Note**: This table may be deprecated in favor of the account-based `account_transactions` table

---

#### 6. Investments Table

**Purpose**: Stores user investment positions in DeFi protocols created via the BANB app.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT gen_random_uuid() |
| `profile_id` | UUID | Investor's profile ID | NOT NULL, FK to profiles.id |
| `investment_name` | VARCHAR | Investment name | NOT NULL |
| `investment_type` | VARCHAR | 'morpho_vault' or 'savings_account' | NOT NULL, CHECK ('morpho_vault' OR 'savings_account') |
| `vault_address` | VARCHAR | Smart contract address | NULL |
| `amount_invested` | NUMERIC | Initial investment amount | NOT NULL, DEFAULT 0 |
| `current_rewards` | NUMERIC | Current reward balance | NOT NULL, DEFAULT 0 |
| `apr` | NUMERIC | Annual percentage rate | NOT NULL |
| `status` | VARCHAR | Investment status | NOT NULL, DEFAULT 'pending', CHECK ('pending' OR 'active' OR 'completed' OR 'failed') |
| `created_at` | TIMESTAMPTZ | Creation timestamp | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | DEFAULT now() |

**Key Features:**
- Direct integration with DeFi protocols like Morpho
- Reward and APR tracking for yield calculations
- Clear investment lifecycle management
- Default values for amounts and status

---

#### 7. Investment Movements Table

**Purpose**: Tracks detailed transaction history for investments (deposits, withdrawals, rewards, fees).

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT gen_random_uuid() |
| `profile_id` | UUID | User's profile ID | NOT NULL, FK to profiles.id |
| `investment_id` | UUID | Investment ID | NOT NULL, FK to investments.id |
| `movement_type` | VARCHAR | 'deposit', 'withdrawal', 'reward', 'fee' | NOT NULL, CHECK ('deposit' OR 'withdrawal' OR 'reward' OR 'fee') |
| `amount` | NUMERIC | Movement amount | NOT NULL |
| `token` | VARCHAR | Token symbol | NOT NULL, DEFAULT 'USDC' |
| `tx_hash` | VARCHAR | Blockchain transaction hash | NULL |
| `chain` | VARCHAR | Blockchain network | DEFAULT 'base' |
| `status` | VARCHAR | Movement status | NOT NULL, DEFAULT 'pending', CHECK ('pending' OR 'confirmed' OR 'failed') |
| `metadata` | JSONB | Additional data | NULL |
| `created_at` | TIMESTAMPTZ | Creation timestamp | DEFAULT now() |
| `updated_at` | TIMESTAMPTZ | Last update timestamp | DEFAULT now() |

**Key Features:**
- Full investment history (deposits, withdrawals, rewards, fees)
- Flexible JSONB metadata for protocol-specific info
- Audit trail for compliance
- Default values for token, chain, and status

---

#### 8. AI Operations Table

**Purpose**: Audit log for AI agent operations and user interactions.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, UNIQUE, DEFAULT gen_random_uuid() |
| `profile_id` | UUID | User's profile ID | NOT NULL, FK to profiles.id |
| `operation_type` | TEXT | Operation type | NOT NULL, CHECK ('payment' OR 'analysis' OR 'query') |
| `operation_data` | JSONB | Operation parameters and data | NOT NULL |
| `user_message` | TEXT | Original user message | NOT NULL |
| `ai_response` | TEXT | AI agent response | NOT NULL |
| `user_confirmed` | BOOLEAN | Whether user confirmed the operation | DEFAULT false |
| `executed` | BOOLEAN | Whether operation was executed | DEFAULT false |
| `execution_result` | JSONB | Execution result data | NULL |
| `created_at` | TIMESTAMPTZ | Creation timestamp | DEFAULT now() |
| `executed_at` | TIMESTAMPTZ | Execution timestamp | NULL |

**Key Features:**
- Complete audit trail for AI operations
- Tracks user consent and execution status
- Stores operation parameters and results in JSONB
- Supports multiple operation types (payment, analysis, query)

---

## 4. Relationships and Foreign Keys

| Relationship | Type | Description |
|-------------|------|-------------|
| `profiles` → `accounts` | 1:many | One profile can have multiple accounts (linked wallets) |
| `accounts` → `account_transactions` | 1:many | One account can have multiple transactions |
| `profiles` → `recipients` | 1:many | One profile can have multiple recipients |
| `profiles` → `transactions` | 1:many | One profile can send multiple transactions (legacy) |
| `recipients` → `transactions` | 1:many | One recipient can receive multiple transactions (legacy) |
| `profiles` → `investments` | 1:many | One profile can have multiple investments |
| `investments` → `investment_movements` | 1:many | One investment can have multiple movements |
| `profiles` → `investment_movements` | 1:many | One profile can have multiple investment movements |
| `profiles` → `ai_operations` | 1:many | One profile can have multiple AI operations |
| `profiles` → `recipients` (profile_id_link) | 1:many | Links internal users as recipients |

**Key Relationship Patterns:**
- **Profile-Centric**: All major entities reference `profile_id`
- **Account-Based Transactions**: Transactions are tracked per account via `account_transactions`
- **Investment Tracking**: Investments and their movements are linked via `investment_id`

---

## 5. Data Flow and Business Logic

### 5.1 User Registration Flow

1. User connects wallet (via email/Farcaster/Google/Apple)
2. System checks for existing profile via `getProfileByAnyWallet(address)`
3. If no profile exists:
   - Create profile with `wallet_address` (primary wallet)
   - Generate unique handle
   - Set status to 'active'
   - Create initial spending account in `accounts` table
4. If profile exists:
   - Load existing profile
   - Redirect to home

### 5.2 Wallet Linking Flow

1. User clicks "Add Wallet" in profile page
2. Privy `linkWallet()` modal opens
3. User connects external wallet (MetaMask, Rainbow, WalletConnect, Phantom)
4. Wallet linked to Privy account
5. Get linked wallet address
6. Check if wallet already exists in `accounts` table
7. If new:
   - Create account record in `accounts` table
   - Set account type (spending/investment/savings)
   - Auto-increment account number
8. User can switch active wallet via `useSetActiveWallet()`

### 5.3 Payment Flow (Account-Based)

1. User initiates payment
2. Payment form validation
3. Create `account_transaction` record (status = 'pending', direction = 'out')
4. Execute ERC20 transfer via Wagmi `writeContract()`
5. Transaction hash returned
6. Update `account_transaction` (status = 'sent', tx_hash)
7. Wait for blockchain confirmation (`useWaitForTransactionReceipt`)
8. Update `account_transaction` (status = 'confirmed')
9. If recipient is internal user, create corresponding 'in' transaction for recipient account

### 5.4 Investment Flow

1. User selects investment option
2. User enters deposit amount
3. Check if investment exists for vault
4. If new: Create `investment` record (status = 'pending')
5. If existing: Update investment amount
6. Execute batched transaction (approve + deposit) via EIP-5792
7. Create `investment_movement` record (type = 'deposit', status = 'pending')
8. Wait for batch transaction confirmation
9. Update `investment_movement` (status = 'confirmed', tx_hash)
10. Update `investment` record (status = 'active', amount_invested)

### 5.5 AI Operation Flow

1. User sends message in AI chat
2. AI processes request and detects operation
3. Create `ai_operation` record (user_confirmed = false, executed = false)
4. Show confirmation modal to user
5. If user confirms:
   - Update `ai_operation` (user_confirmed = true)
   - Execute operation (create transaction, etc.)
   - Update `ai_operation` (executed = true, execution_result, executed_at)
6. If user rejects:
   - Update `ai_operation` (user_confirmed = false, executed = false)

---

## 6. Status Management

### Transaction Statuses (account_transactions)

- **pending** – Transaction created, awaiting blockchain execution
- **confirmed** – Transaction confirmed on-chain
- **failed** – Transaction failed or rejected

### Transaction Statuses (transactions - legacy)

- **pending** – Transaction created, awaiting blockchain execution
- **sent** – Transaction submitted to the blockchain
- **success** – Transaction confirmed on-chain
- **failed** – Transaction failed or rejected

### Investment Statuses

- **pending** – Investment created, awaiting confirmation
- **active** – Investment confirmed and earning rewards
- **completed** – Investment withdrawn
- **failed** – Investment failed or reverted

### Movement Statuses

- **pending** – Movement created, awaiting blockchain confirmation
- **confirmed** – Movement confirmed on blockchain
- **failed** – Movement failed

### Account Statuses

- **active** – Account is active and can be used
- **inactive** – Account is soft-deleted (cannot be used)

### Profile Statuses

- **active** – Profile is active
- **inactive** – Profile is deactivated

---

## 7. Data Types and Constraints

### Numeric Precision

- **Amounts**: NUMERIC (no explicit precision in schema, but typically 20,8) — for crypto values (8 decimal places)
- **APR**: NUMERIC (no explicit precision in schema, but typically 5,2) — for percentage values (2 decimal places)
- **Balance**: NUMERIC — for account balances

### String Constraints

- **Handles**: Must be unique and format-validated (first 3 letters + 3 random chars)
- **Wallet Addresses**: Stored in lowercase, validated as Ethereum-compatible
- **Transaction Hashes**: Must follow blockchain hash format (e.g., 0x...)

### Check Constraints

- **Account Types**: 'spending', 'investment', 'savings'
- **Transaction Directions**: 'in', 'out'
- **Transaction Statuses**: 'pending', 'confirmed', 'failed' (account_transactions) or 'pending', 'sent', 'success', 'failed' (transactions)
- **Investment Types**: 'morpho_vault', 'savings_account'
- **Investment Statuses**: 'pending', 'active', 'completed', 'failed'
- **Movement Types**: 'deposit', 'withdrawal', 'reward', 'fee'
- **Recipient Types**: 'crypto', 'bank'
- **Operation Types**: 'payment', 'analysis', 'query'

### JSONB Usage

- **Bank Details**: Flexible structure for bank account metadata
- **Metadata Fields**: Used for custom attributes in movements and transactions
- **Operation Data**: Stores AI operation parameters
- **Execution Result**: Stores AI operation execution results

### Default Values

- **Status Fields**: Most status fields default to 'pending' or 'active'
- **Token Fields**: Default to 'USDC'
- **Chain Fields**: Default to 'base'
- **Numeric Fields**: Amounts and balances default to 0
- **Boolean Fields**: Default to false

---

## 8. Security Considerations

### Row Level Security (RLS)

- Enforced on all tables
- Users can only access their own records (filtered by `profile_id`)
- Administrative operations require a service role key

### Data Validation

- **Client-side validation** for smooth UX
- **Server-side validation** for integrity and security
- **Database constraints** to enforce referential consistency
- **Check constraints** for enum-like fields

### Audit Trail

- `created_at` and `updated_at` timestamps across all tables
- Complete transaction and investment histories preserved
- Status transitions logged for compliance and traceability
- AI operations fully audited with user consent tracking

---

## 9. Performance Considerations

### Indexing Strategy

- Primary keys on all UUID columns (automatic)
- Indexes on all foreign key relationships (recommended)
- Composite indexes for high-frequency query combinations:
  - `(profile_id, status)` on accounts
  - `(account_id, status, created_at)` on account_transactions
  - `(profile_id, investment_id, created_at)` on investment_movements

### Query Optimization

- Efficient joins through indexed relationships
- Pagination for large dataset retrieval
- Caching for frequently accessed queries or aggregates
- Account-based queries for faster transaction lookups

---

## 10. Future Considerations

### Scalability

- Support for horizontal scaling via read replicas
- Table partitioning for high-volume transaction datasets
- Archival strategies for historical data

### Feature Extensions

- Multi-currency and cross-chain support
- Advanced investment strategies (e.g., auto-compounding)
- Integration with additional DeFi and TradFi protocols
- Enhanced AI operation types

### Compliance

- GDPR compliance for personal data
- Adherence to financial regulations
- Full audit trail and record-keeping requirements
- AI operation consent tracking

---

## 11. API Integration

### Supabase Client

- Type-safe operations via Supabase SDK
- Real-time database subscriptions for live updates (future)
- Automatic TypeScript type generation for data safety

### Error Handling

- Graceful degradation for partial data
- Structured error messages for API responses
- Transaction rollback for failed operations

---

## 12. Migration Notes

### Account-Based Model

The system has migrated from a profile-centric transaction model to an account-based model:

- **Old Model**: `profiles` → `transactions` (direct relationship)
- **New Model**: `profiles` → `accounts` → `account_transactions` (account-based)

The `transactions` table is maintained for backward compatibility but may be deprecated in the future.

### Key Benefits of Account-Based Model

1. **Multi-Wallet Support**: Users can have multiple wallets/accounts
2. **Better Organization**: Transactions are organized by account
3. **Account Types**: Different account types (spending, investment, savings)
4. **Flexibility**: Easy to add new account types or features
5. **Transaction History**: Per-account transaction history for better UX

---

This data model enables BANB to provide a comprehensive, scalable, and secure foundation for decentralized banking operations with full Web3 integration and AI-powered automation.

