# Requirements Document - Banb MVP v1

## Introduction

Banb MVP v1 extends the existing crypto neobank foundation to support multi-chain operations across Base and Solana. The system is built on a **profile-centric architecture** where each user profile can have multiple accounts (wallets) and investments.

**Existing Foundation (v0)**:
- User authentication via Privy (email, X, Farcaster)
- Profile management with primary smart wallet
- USDC payments on Base
- Morpho vault investments on Base
- AI chat for payment execution
- Recipient management

**MVP v1 Additions**:
- Solana wallet integration and USDC transactions
- Cross-chain bridging (Base ↔ Solana)
- Kamino lending protocol on Solana (complementing existing Morpho on Base)
- Enhanced AI analytics for spending insights
- AI-powered automation rules
- Virtual card simulation

The MVP supports real transactions with a $250 cap per action and serves as a live demo for external testing and investor presentations.

Note: Privacy-enhanced receiving features are deferred to post-MVP and may be teased in marketing messaging only.

## Glossary

- **Banb_System**: The complete crypto neobank application including frontend, backend, and blockchain integrations
- **User_Profile**: Central entity in Supabase representing a user account; has 1:many relationships with accounts and investments
- **Primary_Wallet**: The embedded smart wallet created automatically by Privy during signup on Base chain; serves as the core operation layer for all banking operations (send, borrow, invest); supports transaction bundling and gasless transactions
- **Primary_Account**: The first account created automatically during signup, linked to the Primary_Wallet; stored in accounts table with is_primary=true
- **External_Wallet**: Additional blockchain wallet (Base or Solana) connected by user via Privy; can only transfer USDC to Primary_Wallet via Move component; cannot perform send, borrow, or invest operations
- **Connected_Account**: Database entity representing an External_Wallet; stored in accounts table with is_primary=false
- **Account**: Database entity representing a wallet; each account has many account_transactions
- **Investment**: Database entity representing a Morpho vault deposit; each investment has many investment_movements
- **Account_Transaction**: Individual transaction record linked to an account (direction: 'in' or 'out')
- **Investment_Movement**: Individual movement record linked to an investment (type: 'deposit', 'withdrawal', 'reward', 'fee')
- **Bridge**: Service for moving USDC between Base and Solana chains; separate from lending protocols; used when Move operation involves different chains
- **Lending_Protocol**: Smart contract system for collateralized borrowing (Morpho on Base, Kamino on Solana); separate from bridge; operates entirely on single chain
- **Transaction_Limit**: Maximum amount of $250 USD per individual transaction
- **Privy_Service**: Third-party authentication and wallet management service providing embedded smart wallets and external wallet connections
- **Supabase_Database**: Backend PostgreSQL database with profile-centric schema
- **USDC**: USD Coin stablecoin token
- **Collateral_Asset**: Cryptocurrency deposited to secure a loan (WETH, stETH, cbBTC on Base; SOL on Solana)
- **Automation_Rule**: User-defined rule for automated financial actions; created via AI chat; tracked in automation_rules table
- **Mixpanel**: Analytics platform for tracking user behavior, funnels, and identifying bottlenecks in user journey
- **Smart_Wallet_Bundling**: Capability of Primary_Wallet to combine multiple operations (e.g., approve + transfer) into single transaction
- **Gasless_Transaction**: Transaction executed via Primary_Wallet where gas fees are paid in USDC instead of native tokens (ETH, SOL)

## Requirements

### Requirement 1: User Authentication and Profile Creation (Existing - Enhanced)

**User Story:** As a new user, I want to sign up using email, X (Twitter), or Farcaster, so that I can access the neobank with my preferred authentication method.

**Note**: This requirement describes existing functionality that must be maintained while adding Solana support.

#### Acceptance Criteria

1. WHEN a user initiates signup, THE Banb_System SHALL create a User_Profile record in the profiles table in Supabase_Database
2. WHEN a user signs up via any method, THE Privy_Service SHALL automatically create an embedded EVM smart wallet
3. WHEN the smart wallet is created, THE Banb_System SHALL create a Primary_Account record in the accounts table with is_primary=true, network='base', and type='spending'
4. WHEN the Primary_Account is created, THE Banb_System SHALL store the wallet address in both the profile.wallet_address field and the account.address field
5. WHEN a user signs up via Farcaster, THE Banb_System SHALL store the Farcaster identity in the User_Profile metadata
6. WHEN authentication succeeds, THE Banb_System SHALL display the user dashboard with wallet balances and transaction history

### Requirement 2: Multi-Chain Wallet Connection (External Wallets) - NEW

**User Story:** As a user, I want to connect external wallets (Base or Solana) to my Banb profile, so that I can transfer funds from them to my primary smart wallet.

**Note**: External wallets serve as funding sources only. All operations (send, borrow, invest) execute through the primary smart wallet.

#### Acceptance Criteria

1. WHEN a user selects "Add Account", THE Banb_System SHALL display the Privy wallet connection modal with Base and Solana as available chain options
2. WHEN a user connects an external wallet through Privy, THE Banb_System SHALL link the wallet to the user's Privy account as a linked wallet
3. WHEN the Privy wallet link succeeds, THE Banb_System SHALL create a new account record in the accounts table with network='base' or 'solana', type='spending', and is_primary=false
4. WHEN an external account is created, THE Banb_System SHALL link it to the User_Profile via the profile_id foreign key
5. WHEN an external wallet is connected, THE Banb_System SHALL retrieve and display the account with appropriate chain badge
6. WHEN an external account is displayed, THE Banb_System SHALL show a "Move" button as the only available action
7. WHEN a user clicks "Move" on external account, THE Banb_System SHALL navigate to Move page with that account as source
8. THE Banb_System SHALL fetch and display USDC balance for connected external wallets using appropriate SDK (@solana/web3.js for Solana, Wagmi for EVM)

### Requirement 3: External Wallet Transfer to Primary Wallet

**User Story:** As a user, I want to transfer USDC from my external wallets to my primary smart wallet, so that I can use those funds for all banking operations.

**Note**: External wallets (Base or Solana) can only transfer to the primary wallet. They cannot send to other recipients or perform other operations.

#### Acceptance Criteria

1. WHEN a user initiates a transfer from an external Solana wallet, THE Banb_System SHALL construct a transaction using @solana/web3.js
2. WHEN a user initiates a transfer from an external Base wallet, THE Banb_System SHALL construct a transaction using Wagmi
3. WHEN the transaction is signed, THE Banb_System SHALL submit it to the appropriate blockchain network
4. WHEN the transaction confirms, THE Banb_System SHALL record it in the account_transactions table with description='internal_transfer'
5. WHEN the transaction completes, THE Banb_System SHALL display the transaction in the user's homepage transaction history
6. WHERE the transaction amount exceeds Transaction_Limit, THE Banb_System SHALL reject the transaction with an error message
7. WHEN a user attempts to send from external wallet to non-primary destination, THE Banb_System SHALL reject the operation with error message

### Requirement 4: Insufficient Balance Notification

**User Story:** As a user, I want to be notified when I don't have enough funds in my active wallet, so that I can manually move funds or create an automation rule.

#### Acceptance Criteria

1. WHEN a user initiates a send or borrow action, THE Banb_System SHALL verify the active wallet balance
2. IF the active wallet balance is insufficient, THEN THE Banb_System SHALL display an error message indicating the shortfall amount
3. WHEN the insufficient balance error appears, THE Banb_System SHALL prevent the transaction from executing
4. THE Banb_System SHALL calculate required balance including transaction fees and amount
5. THE Banb_System SHALL suggest the user either manually move funds via the Move page or create an automation rule



### Requirement 5: Move Funds Between Own Accounts - NEW

**User Story:** As a user, I want to move USDC from any of my accounts to my primary wallet, so that I can consolidate funds for banking operations.

**Note**: The Move component is specifically for transferring from external wallets to the primary smart wallet. The primary wallet is the destination for all Move operations.

#### Acceptance Criteria

1. WHEN a user clicks "Move" button on an external account card, THE Banb_System SHALL navigate to `/app/move/page.tsx` with the source account pre-selected
2. WHEN the Move page loads, THE Banb_System SHALL display the source account as fixed and the primary wallet as the destination
3. WHEN the source and destination are on different chains, THE Banb_System SHALL automatically trigger bridge operation
4. WHEN the source and destination are on the same chain, THE Banb_System SHALL execute a standard transfer
5. WHEN the user proceeds, THE Banb_System SHALL reuse the existing transaction modal UI (amount input, review, status)
6. WHEN the move completes, THE Banb_System SHALL create two records in account_transactions table (one 'out' for source, one 'in' for destination)
7. THE Banb_System SHALL set description='internal_transfer' or description='bridge' based on whether chains differ
8. WHERE the move amount exceeds Transaction_Limit, THE Banb_System SHALL reject the transaction
9. WHEN a user attempts to move from primary wallet, THE Banb_System SHALL not display "Move" button (primary wallet uses "Send" for external payments)

### Requirement 6: Smart Wallet as Primary Operation Layer

**User Story:** As a user, I want all my banking operations to execute through my primary smart wallet, so that I can enjoy gasless transactions and simplified operations without managing gas tokens.

**Note**: The primary smart wallet (Privy embedded wallet on Base) is the core operation layer. External wallets can only transfer USDC to the primary wallet via the Move component.

#### Acceptance Criteria

1. WHEN a user signs up, THE Banb_System SHALL create a primary smart wallet via Privy on Base chain
2. WHEN a user executes any send, borrow, or invest operation, THE Banb_System SHALL use the primary smart wallet
3. WHEN a user executes operations via primary smart wallet, THE Banb_System SHALL enable transaction bundling (e.g., approve + transfer in one transaction)
4. WHEN a user executes operations via primary smart wallet, THE Banb_System SHALL support gasless transactions (pay gas with USDC)
5. WHEN a user connects an external wallet, THE Banb_System SHALL only allow that wallet to transfer USDC to the primary wallet
6. WHEN a user views external wallet options, THE Banb_System SHALL display them as "funding sources" that can move to primary account
7. THE Banb_System SHALL NOT require users to manage native tokens (ETH, SOL) for gas when using primary wallet operations

### Requirement 7: Cross-Chain Bridging - NEW

**User Story:** As a user, I want to transfer USDC between my Base and Solana accounts, so that I can move funds across different blockchain networks.

**Note**: Bridge is used exclusively for moving USDC between chains. It is separate from and not connected to lending protocols (Morpho/Kamino).

**Bridge Trigger Scenarios**:
1. **Manual**: User clicks "Move" on account and selects destination on different chain
2. **Automated**: Programmable rule executes transfer from account on different chain

#### Acceptance Criteria

1. WHEN a user initiates a move from Solana account to Base account (or vice versa), THE Banb_System SHALL detect the chain mismatch
2. WHEN chain mismatch is detected, THE Banb_System SHALL automatically initiate bridge transaction using programmatic SDK (Wormhole or Allbridge, no iframe)
3. WHEN the bridge transaction is constructed, THE Banb_System SHALL display estimated fees and completion time in the transaction review
4. WHEN the user confirms, THE Banb_System SHALL prompt for transaction signature via Privy wallet
5. WHEN the bridge transaction is submitted, THE Banb_System SHALL display progress status (Sent → Bridging → Completed)
6. WHEN the bridge transaction completes, THE Banb_System SHALL create TWO records in account_transactions table:
   - Source account: direction='out', description='bridge', metadata includes destination chain and bridge provider
   - Destination account: direction='in', description='bridge', metadata includes source chain and bridge provider
7. WHEN the bridge completes, THE Banb_System SHALL update both account balances within 10 seconds
8. THE Banb_System SHALL execute the entire bridge flow without using iframes or redirecting to external UIs
9. WHERE the bridge amount exceeds Transaction_Limit, THE Banb_System SHALL reject the transaction
10. WHEN automation rule triggers bridge, THE Banb_System SHALL follow the same flow and log execution in ai_operations table

### Requirement 8: Transfer UI Experience

**User Story:** As a user, I want a simple and clear interface for moving funds between my accounts, so that I can easily manage my money across wallets and chains.

#### Acceptance Criteria

1. WHEN a user clicks "Move Funds", THE Banb_System SHALL display a modal with "From" and "To" wallet dropdowns
2. WHEN a user enters an amount, THE Banb_System SHALL validate it as a numeric USDC value
3. WHEN a user confirms the transfer, THE Banb_System SHALL display a progress indicator
4. WHEN the transfer completes successfully, THE Banb_System SHALL display a success confirmation with transaction hash link to block explorer
5. THE Banb_System SHALL present same-chain and cross-chain transfers with a unified, consistent UI flow

### Requirement 9: Morpho Lending Integration (Base) - EXISTING + ENHANCED

**User Story:** As a user on Base, I want to deposit collateral and borrow USDC, so that I can access liquidity without selling my crypto assets.

**Note**: Morpho vault deposits already exist in the investments table. This requirement adds borrowing functionality (collateralized lending) which is separate from vault investments. Morpho lending is not connected to the bridge - it operates entirely on Base chain.

#### Acceptance Criteria

1. WHEN a user accesses the borrow feature on Base, THE Banb_System SHALL display supported collateral types (WETH, stETH, cbBTC)
2. WHEN a user views borrow options, THE Banb_System SHALL display live APR and collateral ratio from Morpho API
3. WHEN a user deposits collateral, THE Banb_System SHALL execute a transaction on Base mainnet via Wagmi
4. WHEN a collateral deposit succeeds, THE Banb_System SHALL create or update a record in the lending_positions table with protocol='morpho' and chain='base'
5. WHEN a user borrows USDC, THE Banb_System SHALL execute a borrow transaction on the Morpho lending protocol
6. WHEN a borrow succeeds, THE Banb_System SHALL create a record in the lending_transactions table with transaction_type='borrow'
7. WHEN a user repays USDC, THE Banb_System SHALL execute a repayment transaction on Morpho
8. WHEN a repay succeeds, THE Banb_System SHALL create a record in the lending_transactions table with transaction_type='repay'
9. WHEN a user withdraws collateral, THE Banb_System SHALL execute a withdrawal transaction on Morpho
10. WHEN a withdrawal succeeds, THE Banb_System SHALL create a record in the lending_transactions table with transaction_type='withdraw'
11. WHERE any borrow, repay, or collateral action exceeds Transaction_Limit, THE Banb_System SHALL reject the transaction
12. WHEN borrowing completes, THE Banb_System SHALL display the borrowed balance in the user dashboard

### Requirement 10: Kamino Lending Integration (Solana) - NEW

**User Story:** As a user on Solana, I want to deposit SOL as collateral and borrow USDC, so that I can leverage my Solana assets for liquidity.

**Note**: Kamino lending is separate from and not connected to the bridge. It operates entirely on Solana chain.

#### Acceptance Criteria

1. WHEN a user accesses the borrow feature on Solana, THE Banb_System SHALL display SOL as the supported collateral type
2. WHEN a user views borrow options, THE Banb_System SHALL display live APR and collateral ratio from Kamino
3. WHEN a user deposits SOL collateral, THE Banb_System SHALL execute a transaction on Solana mainnet using @solana/web3.js
4. WHEN a collateral deposit succeeds, THE Banb_System SHALL create or update a record in the lending_positions table with protocol='kamino' and chain='solana'
5. WHEN a user borrows USDC, THE Banb_System SHALL execute a borrow transaction on the Kamino lending protocol
6. WHEN a borrow succeeds, THE Banb_System SHALL create a record in the lending_transactions table with transaction_type='borrow'
7. WHEN a user repays USDC, THE Banb_System SHALL execute a repayment transaction on Kamino
8. WHEN a repay succeeds, THE Banb_System SHALL create a record in the lending_transactions table with transaction_type='repay'
9. WHEN a user withdraws SOL collateral, THE Banb_System SHALL execute a withdrawal transaction on Kamino
10. WHEN a withdrawal succeeds, THE Banb_System SHALL create a record in the lending_transactions table with transaction_type='withdraw'
11. WHERE any borrow, repay, or collateral action exceeds Transaction_Limit, THE Banb_System SHALL reject the transaction
12. WHEN borrowing completes, THE Banb_System SHALL display the borrowed balance in the user dashboard

### Requirement 11: Virtual Card with Integrated Lending Management

**User Story:** As a user, I want to see a simulated spending card with my available balance and manage my lending positions, so that I can visualize spending power and control borrowing in one place.

#### Acceptance Criteria

1. WHEN a user navigates to the /card route, THE Banb_System SHALL display a virtual card UI showing total available to spend
2. WHEN the card UI loads, THE Banb_System SHALL calculate available spending balance as (wallet balance + borrowed USDC)
3. WHEN the card page loads, THE Banb_System SHALL display two collapsible sections: "Available USDC" and "Borrowed USDC"
4. WHEN a user expands "Available USDC" section, THE Banb_System SHALL show breakdown of USDC across all accounts
5. WHEN a user expands "Borrowed USDC" section, THE Banb_System SHALL display lending position details including collateral, borrowed amount, APR, and collateral ratio
6. WHEN lending position details are shown, THE Banb_System SHALL provide action buttons for "Borrow More", "Repay", and "Withdraw Collateral"
7. WHEN a user selects collateral type, THE Banb_System SHALL display available options (WETH, stETH, cbBTC for Base; SOL for Solana)
8. WHEN a user performs lending actions, THE Banb_System SHALL execute real blockchain transactions via the primary smart wallet
9. WHEN lending position data is fetched, THE Banb_System SHALL query directly from protocol APIs (Morpho for Base, Kamino for Solana)
10. WHEN a user clicks "Pay with card", THE Banb_System SHALL generate a simulated transaction record stored in memory only
11. WHEN simulated transactions are generated, THE Banb_System SHALL display them in a transaction list
12. WHEN the user refreshes the page or navigates away, THE Banb_System SHALL clear all simulated transactions
13. THE Banb_System SHALL display a "Test mode — No real money spent" disclaimer for simulated card payments
14. THE Banb_System SHALL refetch lending position data after any borrow, repay, or withdraw action completes



### Requirement 12: AI-Powered Spending Analytics

**User Story:** As a user, I want to ask questions about my spending patterns and get insights, so that I can understand where my money goes and how to save more.

#### Acceptance Criteria

1. WHEN a user asks "How much did I spend this week?", THE Banb_System SHALL query the account_transactions table and return the total amount
2. WHEN a user asks "Where do I spend the most?", THE Banb_System SHALL aggregate spending by category or recipient and return the top spending destination
3. WHEN a user asks "How much am I spending per category?", THE Banb_System SHALL return a breakdown of spending by transaction category
4. WHEN a user asks "How can I save most?", THE Banb_System SHALL analyze spending patterns and suggest the highest-impact saving opportunities
5. WHEN the AI processes a query, THE Banb_System SHALL aggregate data across all Connected_Accounts and chains
6. WHEN the AI returns results, THE Banb_System SHALL display them as chat replies with numeric summaries and actionable insights
7. WHEN a user submits a query, THE Banb_System SHALL respond within 2 seconds
8. THE Banb_System SHALL extend the existing AI chat module to support guided analytics queries

### Requirement 13: AI-Powered Financial Automation - NEW

**User Story:** As a user, I want to create automated rules for managing my money via AI chat, so that routine financial tasks happen automatically without my intervention.

#### Acceptance Criteria

1. WHEN a user types a message starting with "create rule" or similar pattern in AI chat, THE Banb_System SHALL detect rule creation intent
2. WHEN rule creation is detected, THE Banb_System SHALL parse the rule parameters (condition, action, accounts, thresholds)
3. WHEN rule is successfully parsed, THE Banb_System SHALL store it in the automation_rules table linked to the User_Profile
4. WHEN a user asks about spending/earnings, THE Banb_System SHALL proactively suggest relevant automation rules
5. WHEN a rule condition is met, THE Banb_System SHALL execute the specified action automatically
6. WHEN an automated action executes, THE Banb_System SHALL create a record in account_transactions with metadata indicating automation_rule_id
7. WHEN an automated action executes, THE Banb_System SHALL create a record in ai_operations table with operation_type='automation' and execution details
8. WHEN an automated action executes, THE Banb_System SHALL notify the user of the action taken
9. WHEN a user navigates to AI section, THE Banb_System SHALL display an "AI Rules" tab at the top
10. WHEN user clicks "AI Rules" tab, THE Banb_System SHALL show list of active rules with pause/delete buttons (no manual parameter editing)
11. WHEN user wants to edit rule parameters, THE Banb_System SHALL require them to use AI chat
12. THE Banb_System SHALL respect Transaction_Limit for all automated actions
13. WHEN automation rule requires bridge (source and destination on different chains), THE Banb_System SHALL automatically trigger bridge operation

### Requirement 14: Transaction Limit Enforcement

**User Story:** As a system administrator, I want all transactions to be capped at $250, so that the MVP operates within safe testing limits.

#### Acceptance Criteria

1. WHEN a user attempts any send transaction exceeding $250 USD, THE Banb_System SHALL reject the transaction with an error message
2. WHEN a user attempts any borrow transaction exceeding $250 USD, THE Banb_System SHALL reject the transaction with an error message
3. WHEN a user attempts any bridge transaction exceeding $250 USD, THE Banb_System SHALL reject the transaction with an error message
4. WHEN a user attempts any collateral deposit exceeding $250 USD equivalent, THE Banb_System SHALL reject the transaction with an error message
5. THE Banb_System SHALL calculate USD value using current market prices for all asset types

### Requirement 15: Data Consistency Between Privy and Supabase - EXISTING + ENHANCED

**User Story:** As a system, I need to maintain synchronized data between Privy wallet management and Supabase profile management, so that user accounts remain consistent.

**Note**: This describes the existing sync mechanism that must be extended to support Solana wallets.

#### Acceptance Criteria

1. WHEN a user signs up, THE Banb_System SHALL create both a Privy user account and a User_Profile record in the profiles table
2. WHEN a smart wallet is created in Privy during signup, THE Banb_System SHALL create a Primary_Account record in the accounts table with the wallet address
3. WHEN a user links a new external wallet in Privy (Base or Solana), THE Banb_System SHALL create a corresponding account record in the accounts table with is_primary=false
4. WHEN wallet data changes in Privy, THE Banb_System SHALL update the corresponding account records in Supabase
5. THE Banb_System SHALL maintain a profile-centric architecture where:
   - One User_Profile (profiles table) maps to multiple accounts (accounts table) via profile_id foreign key
   - One User_Profile maps to multiple investments (investments table) via profile_id foreign key
   - Each account has multiple account_transactions via account_id foreign key
   - Each investment has multiple investment_movements via investment_id foreign key

### Requirement 16: Dashboard Display

**User Story:** As a user, I want to see all my wallet balances, recent transactions, and available actions on my dashboard, so that I have a complete overview of my finances.

#### Acceptance Criteria

1. WHEN a user logs in, THE Banb_System SHALL display the dashboard with all Connected_Account balances
2. WHEN the dashboard loads, THE Banb_System SHALL display recent transaction history across all accounts
3. WHEN the dashboard loads, THE Banb_System SHALL display an action menu with options for send, borrow, and add account
4. WHEN account balances change, THE Banb_System SHALL update the dashboard display within 10 seconds
5. THE Banb_System SHALL aggregate and display total portfolio value across all chains

### Requirement 17: Analytics and Monitoring with Mixpanel

**User Story:** As a product manager, I want to track user behavior and identify bottlenecks in the user journey, so that I can optimize the product experience.

#### Acceptance Criteria

1. WHEN a user views any page, THE Banb_System SHALL track the page view event with page name and timestamp
2. WHEN a user clicks any button, THE Banb_System SHALL track the button click event with button name and context
3. WHEN a user initiates a transaction, THE Banb_System SHALL track transaction initiated event with type, chain, and amount
4. WHEN a transaction completes, THE Banb_System SHALL track transaction completed event with success status and duration
5. WHEN a transaction fails, THE Banb_System SHALL track transaction failed event with error type and message
6. WHEN a user creates an automation rule, THE Banb_System SHALL track AI rule created event with rule type
7. WHEN an automation rule executes, THE Banb_System SHALL track AI rule executed event with rule ID and success status
8. WHEN a user encounters an error, THE Banb_System SHALL track error occurred event with error type, context, and page
9. THE Banb_System SHALL track complete user funnels including signup, first transaction, and feature adoption
10. THE Banb_System SHALL identify the user with their profile ID for all tracked events
11. THE Banb_System SHALL NOT track API route performance or server-side metrics (focus on client-side user behavior only)

### Requirement 18: Database Schema Extensions for MVP v1

**User Story:** As a system, I need to extend the existing database schema to support multi-chain operations, automation rules, and enhanced transaction tracking, so that all MVP v1 features have proper data persistence.

#### Acceptance Criteria

1. WHEN the database migration runs, THE Banb_System SHALL add a 'chain' column to the accounts table with values 'base', 'solana', or 'ethereum'
2. WHEN the database migration runs, THE Banb_System SHALL create indexes on accounts table for chain queries (idx_accounts_chain, idx_accounts_profile_chain)
3. WHEN the database migration runs, THE Banb_System SHALL add 'category', 'is_automated', and 'automation_rule_id' columns to account_transactions table
4. WHEN the database migration runs, THE Banb_System SHALL create indexes on account_transactions for analytics queries (idx_account_transactions_created_at, idx_account_transactions_category)
5. WHEN the database migration runs, THE Banb_System SHALL create automation_rules table with columns: id, profile_id, name, description, condition_type, condition_params, action_type, action_params, enabled, last_executed_at, execution_count, created_at, updated_at
6. WHEN the database migration runs, THE Banb_System SHALL create indexes on automation_rules table (idx_automation_rules_profile, idx_automation_rules_enabled)
7. THE Banb_System SHALL use existing ai_operations table to track automation rule executions (no new table needed)
8. THE Banb_System SHALL use existing account_transactions table for all transaction types including bridge operations (no bridge_transactions table needed)
9. THE Banb_System SHALL query lending positions directly from protocol APIs (no lending_positions or lending_transactions tables needed)
10. THE Banb_System SHALL store simulated card transactions in memory only (no card_simulations table needed)

### Requirement 19: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when transactions fail, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a transaction fails due to insufficient balance, THE Banb_System SHALL display a message indicating the shortfall amount
2. WHEN a transaction fails due to network errors, THE Banb_System SHALL display a message suggesting retry
3. WHEN a transaction is rejected due to Transaction_Limit, THE Banb_System SHALL display the limit and attempted amount
4. WHEN a wallet connection fails, THE Banb_System SHALL display troubleshooting guidance
5. THE Banb_System SHALL log all errors to external monitoring service (Sentry) for debugging and user assistance
6. THE Banb_System SHALL NOT create error logs in Supabase database (use external monitoring tools only)

