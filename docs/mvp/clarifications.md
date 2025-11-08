# Design Clarifications - Final Decisions

## 1. Transaction Architecture

### File Structure
- **Unified file approach**: `lib/solana/transactions.ts` and `lib/solana/payments.ts`
- Keep logic separate but in same files for cleaner structure
- Mirror the existing Base pattern:
  - `lib/solana/transactions.ts` - Database operations (create, update, get from account_transactions)
  - `lib/solana/payments.ts` - React hooks using Privy's Solana wallet methods
- Reference: https://docs.privy.io/wallets/using-wallets/solana/web3-integrations

### Transaction Flow
- Solana transactions follow same UX as Base:
  1. Input amount
  2. Review
  3. State checks
  4. Execute blockchain transaction
  5. Write to DB (account_transactions table)

## 2. Bridge Integration

### Two Scenarios

**Scenario 1: Manual Move**
- Location: `/app/move/page.tsx`
- Trigger: User clicks "Move" button on an account card
- Flow:
  - Source account is fixed (the account where user clicked "Move")
  - User selects destination from dropdown of their accounts
  - If source is Solana and destination is Base (primary), bridge is triggered
  - Reuse existing transaction modal UI/UX
  - Bridge detection happens within the move component

**Scenario 2: Programmable Rules**
- Trigger: Automation rule executes (e.g., "if main account < $10, transfer from highest balance account")
- Flow:
  - Rule execution logic checks source and destination chains
  - If chains differ, trigger bridge automatically
  - Bridge detection happens in automation execution logic

### Bridge Transaction Recording
- Create TWO records in `account_transactions` table:
  - Source account: direction='out', description='bridge' or 'internal_transfer'
  - Destination account: direction='in', description='bridge' or 'internal_transfer'
- Use description field to identify internal movements vs external payments
- Display in transaction history as outbound (source) and inbound (destination)

## 3. Programmable Rules (AI-Powered Automation)

### Rule Creation
- **Method**: Via AI chat only
- **Pattern Detection**: AI should detect phrases like "create rule that..." or "set up automation for..."
- **Proactive Suggestions**: AI can suggest rules based on user queries
  - Example: User asks about spending/earnings → AI suggests auto-transfer rule

### Rule Management UI
- **Location**: Within existing AI section (same path)
- **UI**: Tab at top labeled "AI Rules" to switch view
- **Capabilities**:
  - View active rules
  - Pause/resume rules (quick button)
  - Delete rules (quick button)
  - Edit rules (only via AI chat - no manual editing of parameters)
- **Philosophy**: Encourage AI interaction over manual mode

## 4. Database Structure

### Current Tables
- `transactions` table = **LEGACY** (to be deleted after verification)
- `account_transactions` table = **ACTIVE** (current source of truth)
- Reference: See "data model" section in Google Doc for complete DB structure

### Account Transactions Table
- Used for ALL transaction types:
  - External payments (send USDC to others)
  - Internal transfers (between own accounts, same chain)
  - Bridge operations (between own accounts, different chains)
  - Lending operations (borrow, repay)
- `description` field identifies transaction type
- Each transaction creates records for both source and destination accounts

## 5. Lending Position Management

### Data Fetching Strategy
- **Source**: Query directly from Morpho/Kamino APIs (no database cache)
- **Caching**: Use React Query with appropriate staleTime
- **Refresh Triggers**:
  - User opens card modal → fetch latest
  - User navigates away and returns → fetch latest
  - User borrows/withdraws → immediately refetch
- **Freeze Behavior**: Data stays static while modal is open (unless user performs action)

### Performance Priority
- Prioritize user experience and performance
- React Query recommended for:
  - Automatic background refetching
  - Cache management
  - Loading states
  - Error handling

## 6. Smart Wallet Strategy

### Core Operation Layer
- **Primary wallet**: Always Privy smart wallet (EVM on Base)
- **All operations**: Execute through smart wallet by default
- **Benefits**:
  - Transaction bundling (approve + transfer in one tx)
  - Gasless transactions (pay gas with USDC)
  - Simplified UX

### External Wallet Handling
- **Use case**: Only for `/move` component
- **Limitation**: Can only transfer USDC from external wallet to primary wallet
- **No smart wallet features**: Execute as traditional wallet (sequential transactions)

## 7. Move Component Details

### Page Structure
- **Path**: `/app/move/page.tsx`
- **Entry point**: "Move" button on each account card
- **Source**: Fixed (account where button was clicked)
- **Destination**: Dropdown to select from user's accounts

### UI/UX Reuse
- After destination selection, reuse existing transaction modal
- Same flow as "Send" button:
  - Amount input
  - Review screen
  - Status updates
  - Confirmation

### Bridge Detection
- Automatic within move component
- If source.chain !== destination.chain → trigger bridge
- User sees standard transaction flow with bridge indicator

## 8. Mixpanel Analytics

### Tracking Focus
- **User flow and funnel analysis**
- **Events to track**:
  - Button clicks
  - Page visits (with duration)
  - Navigation patterns
  - Errors and bottlenecks
  - Transaction completions/failures
  - Feature usage

### Implementation
- Client-side tracking primarily
- Track user journey through the app
- Identify drop-off points and friction
- No need for API route tracking unless specific value identified

## Next Steps

1. Update design document with these clarifications
2. Remove unnecessary components/tables from design
3. Add detailed sections for:
   - Solana integration pattern
   - Move component specification
   - AI rules management
   - Bridge detection logic
4. Create tasks.md with implementation plan
