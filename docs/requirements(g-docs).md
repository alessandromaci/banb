1. Overview
   BANB (Blockchain Agent Neo Bank) is a decentralized banking application that merges the fintech neo-bank’s ease of use functionality (payments, deposits, investments) with blockchain-native infrastructure and AI-driven automation.
   It enables users to:
   Manage a digital profile linked to blockchain wallets


Send payments (crypto and fiat-like)


Deposit and withdraw via third-party on/off-ramp providers


Add invest accounts according to personalized risk profiles


Use an AI agent to execute banking operations and craft transactions


The system is modular, mobile first, and designed to integrate both Web3 transaction logic (via wagmi/viem) and Web2 data persistence (via Supabase).
2. Target Architecture
   The BANB system architecture follows a three-layer model:
   [User Layer] → [Application Layer / API Routes] → [Service Layer / Databases / Blockchain]

2.1 User Layer
Frontend Framework:
Next.js 15 (App Router) + TypeScript + TailwindCSS + Shadcn/UI
Web3/Wallet Integration:
Wagmi v2.17+ (Web3 React hooks)


Viem v2.38+ (Low-level Ethereum interactions)


Farcaster MiniApp SDK (@farcaster/miniapp-sdk)


Farcaster MiniApp Wagmi Connector (@farcaster/miniapp-wagmi-connector)


OnchainKit v1.1 (Coinbase’s Base chain toolkit)


Current UI Features:
Landing Page (components/landing-page.tsx)


Serves as the marketing and onboarding entry point.


Authentication (components/auth/)


Login and Signup forms integrated with Farcaster Quick Auth.


Supports Farcaster wallet-based authentication.


Banking Home (components/banking-home.tsx)


Displays the user’s balance in USD or EURO terms (USDC on Base).


Quick action buttons (Send, Add, Withdraw, More).


Transaction history list.


AI chat/search input.


Payments Module (app/payments/, components/payments/)


Complete flow for sending crypto payments.


Includes:


Payment type selection (Wallet / Bank / IBAN)


Recipient management and search


Amount input


Review and confirmation screens


Transaction status tracking


UI Component Library:
Uses Shadcn/UI built on top of Radix primitives.


Custom theme provider with dark mode support.


Architecture Pattern:
Each feature module follows a consistent structure:
UI components in /components/


Business logic hooks in /lib/


Page routes in /app/



2.2 Application Layer (API Routes)
The Application Layer acts as BANB’s internal API gateway.
It is implemented using Next.js API Routes (app/api/) and serves as the bridge between the frontend and service layer.
Current API Endpoints:
Endpoint
Method
Purpose
Status
/api/auth
GET
Verify Farcaster JWT token and authenticate user
✅ Implemented

API Gateway Responsibilities:
Authenticate requests via Farcaster Quick Auth.


Validate JWT tokens.


Return authenticated user data (FID and session info).


Implementation Details:
Uses @farcaster/quick-auth for JWT verification.


Handles multiple environments (Vercel and local dev).


Includes CORS-aware domain verification.


Uses Bearer token authorization.


Planned Endpoints (to discuss):
POST /api/payments – Create and execute crypto payments.


POST /api/recipients – Manage recipient list.


POST /api/deposit – Handle fiat on-ramp operations.


POST /api/withdraw – Handle fiat off-ramp operations.


Proxy routes for external providers (Google Pay, Revolut Pay).


Current Data Flow:
User → Client-side Wagmi Hooks → Supabase Client → Database
↓
Blockchain (Base)


2.3 Service Layer
This layer handles all business logic.
It is currently implemented through client-side hooks and utility functions in the /lib/ directory.
Implemented Services:
Service
File
Description
Data Source
Payments Service
lib/payments.ts
Executes USDC transfers, manages transaction signing and status updates.
transactions table + Base blockchain
Recipients Service
lib/recipients.ts
Manages recipient contacts (add, retrieve).
recipients table
Transactions Service
lib/transactions.ts
Creates and updates transaction records.
transactions table
Supabase Client
lib/supabase.ts
Initializes Supabase client and provides typed database access.
Supabase PostgreSQL

Key Hooks & Functions:
Payments Service
useCryptoPayment() – Execute ERC20 transfers via Wagmi.


Creates a transaction record (status: pending).


Calls writeContract() for ERC20 transfer().


Updates transaction to sent after hash confirmation.


On success → marks transaction as success.


On error → updates status to failed.


useTransactionStatus(txId) – Track transaction confirmation.


Polls blockchain for receipt via Wagmi.


Auto-updates DB when confirmed.


useUSDCBalance(address) – Fetch and format the USDC balance from Base chain.


Recipients Service
addRecipient(data) – Create a new recipient with wallet info.


getRecipient(id) – Retrieve a recipient by ID.


Transactions Service
createTransaction(data) – Insert new pending transaction.


updateTransactionStatus(txId, status, txHash?) – Update transaction lifecycle.


getTransactionStatus(txId) – Retrieve transaction status.


Blockchain Integration:
Network: Base (Mainnet)


Token: USDC – Contract 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913


Transfer Method: ERC20 transfer() via Wagmi


Confirmation: Handled by useWaitForTransactionReceipt()


Not Yet Implemented:
Profile Service (user identity and handle generation)


Deposit/Withdraw Service (fiat on/off-ramps)


Investment Service


AI Agent Service


Real-time event streaming (polling currently used)



3. Data Architecture
   BANB uses Supabase as the main data backend.
   Supabase provides PostgreSQL with RESTful access and realtime subscriptions.
   Current Schema
   recipients
   Stores user contacts for crypto payments.
   Field
   Type
   Description
   id
   UUID
   Primary key (auto-generated).
   name
   text
   Recipient name.
   status
   text
   Active/inactive.
   wallets
   jsonb
   Array of { address, network }.
   created_at
   timestamptz
   Creation timestamp.

Notes:
No profile_id (user association) yet.


Wallets stored in flexible JSON format.


transactions
Tracks blockchain payments and their state.
Field
Type
Description
id
UUID
Primary key.
recipient_id
UUID
FK → recipients.id
tx_hash
text
On-chain hash.
chain
text
Blockchain network (e.g., Base).
amount
text
Transaction value.
token
text
Token symbol (e.g., USDC).
status
text
pending, sent, success, failed.
created_at
timestamptz
Timestamp.

Transaction Lifecycle:
Pending – Created, awaiting send.


Sent – Broadcasted to blockchain.


Success – Confirmed on-chain.


Failed – Transaction reverted or error.


Planned Tables:
profiles – Stores user identity (handle, wallet).


deposits – On-ramp records.


withdrawals – Off-ramp records.


investments – User investments and returns.



4. Process Flows
   User Authentication Flow
   Current Implementation:
   Farcaster MiniApp SDK initializes upon app load.


User connects wallet via Farcaster connector.


/api/auth verifies JWT with @farcaster/quick-auth.


Returns user FID and session data.


Session handled client-side (no DB persistence yet).



Payment Flow (Crypto Wallet)
User selects “Send to Crypto Wallet”.


Adds or selects recipient (stored in recipients).


Enters amount.


Reviews transaction details.


Executes payment via useCryptoPayment().


Creates pending record in transactions.


Calls writeContract() to send USDC.


Updates record to sent.


Waits for confirmation.


Polls via useWaitForTransactionReceipt().


Updates to success once confirmed.


Displays transaction status UI.



Deposit and Withdraw Flow
Status: Planned.
Triggered via external providers (Google Pay / Revolut Pay).


Managed through /api/deposit and /api/withdraw.


Data recorded in deposits and withdrawals tables.



Investment Flow
Status: Planned.
Will connect wallet actions to on-chain investment pools.


Tracked through an investments table.



AI Chat Flow
Status: Planned.
User can type natural language commands.


AI Agent (LLM) interprets and routes actions.


Executes via internal service functions.


Confirms before sending blockchain transactions.



5. Integration Points
   Component
   Technology
   Purpose
   Status
   Supabase
   @supabase/supabase-js
   PostgreSQL + Realtime
   ✅ Implemented
   Wagmi
   wagmi
   Wallets + Blockchain calls
   ✅ Implemented
   Viem
   viem
   Low-level Ethereum functions
   ✅ Implemented
   Farcaster MiniApp SDK
   @farcaster/miniapp-sdk
   MiniApp context + wallet bridge
   ✅ Implemented
   Farcaster MiniApp Connector
   @farcaster/miniapp-wagmi-connector
   Wallet auth
   ✅ Implemented
   Farcaster Quick Auth
   @farcaster/quick-auth
   JWT-based login
   ✅ Implemented
   OnchainKit
   @coinbase/onchainkit
   Base chain utilities
   ✅ Implemented
   Google Pay / Revolut Pay
   External APIs
   Fiat on/off-ramps
   🚧 Planned
   LLM / AI Agent
   OpenAI / v0 API
   AI-based command execution
   🚧 Planned


6. Configuration and Environment
   Main Configuration Files:
   app/config.ts – Wagmi + Base chain setup


app/providers.tsx – App-wide context providers


app/rootProvider.tsx – OnchainKit and MiniApp setup


lib/supabase.ts – Supabase client initialization


minikit.config.ts – Farcaster MiniApp manifest


Environment Variables:
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_ONCHAINKIT_API_KEY=<coinbase-onchainkit-api-key>
NEXT_PUBLIC_URL=<production-url>
VERCEL_URL=<vercel-preview-url>

7. Deployment Architecture
   Platform: Vercel
   Components:
   Frontend → Next.js (SSR + SSG)


API → Next.js API Routes


Database → Supabase (PostgreSQL)


Blockchain → Base (Ethereum L2)


Deployment Flow:
User → Next.js Frontend (Vercel)
→ API Routes
→ Supabase / Blockchain

Domain Configuration:
Handled through minikit.config.ts for Farcaster MiniApp compatibility.

8. Technology Stack Summary
   Frontend:
   React 19 + Next.js 15 (App Router)
   TailwindCSS + Shadcn/UI
   Wagmi 2 + Viem 2 (Web3 stack)
   Farcaster MiniApp SDK + OnchainKit
   Backend:
   Next.js API Routes (serverless)
   Supabase (PostgreSQL + REST API)
   Farcaster Quick Auth
   Blockchain:
   Base (Ethereum L2)
   USDC (ERC20) via Wagmi & Viem
   DevOps:
   Vercel (deployment)
   TypeScript 5 + ESLint
   PostCSS (build pipeline)
9. Repo Folder Structure Summary
   9.1. Repository Overview
   bab_mini_app_new/
   ├── app/           # Next.js 15 App Router (pages + API)
   ├── components/    # UI components (feature-based)
   ├── lib/           # Business logic, blockchain, DB access
   ├── hooks/         # Shared React hooks
   ├── styles/        # Global CSS
   ├── public/        # Static assets
   └── config files   # Root-level settings


9.2. Folder Breakdown
app/ — Routes & API
Implements all pages and API endpoints.
/api/auth → Farcaster JWT verification


/home → Banking dashboard


/login / /signup → Authentication


/payments → Full crypto payment flow (type → recipient → amount → review → status)


/success → Confirmation page


providers.tsx, rootProvider.tsx → Wagmi, OnchainKit, and MiniApp setup



components/ — UI Layer
Feature-based structure with shared Shadcn/UI library.
auth/ → Login & Signup forms


payments/ → PaymentOptions, FriendList, RecipientForm, ReviewCard, StatusIndicator


ui/ → Buttons, inputs, dialogs, cards, forms, toasts


landing-page.tsx, banking-home.tsx → Core screens


theme-provider.tsx → Dark mode support



lib/ — Business Logic
Contains all functional logic and Supabase interaction.
payments.ts → Execute and track USDC payments


recipients.ts → Manage recipient list


transactions.ts → Transaction creation and updates


supabase.ts → Client + type definitions


utils.ts → Helpers (e.g., cn()), abi/ERC20.json for contract calls



hooks/ — Shared Hooks
Reusable utilities such as use-mobile and use-toast.
(Note: some duplication with components/ui/use-* hooks.)

public/ & styles/
public/ → App logo, placeholder assets


app/globals.css → Active global style sheet



9.3. Architecture Pattern
Three-layer separation:
app/          → Routes & API
components/   → Presentation (UI)
lib/          → Logic & Data (DB + Blockchain)

Each feature (e.g. Payments) follows:
app/payments/      → Routes
components/payments/ → UI
lib/payments.ts    → Logic


9.4. Data Flow Example
1. User clicks “Send”
2. ReviewCard.tsx calls useCryptoPayment()
3. lib/payments.ts creates transaction + executes ERC20 transfer
4. lib/transactions.ts updates Supabase
5. Wagmi monitors on-chain status

