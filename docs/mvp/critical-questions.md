# Critical Questions & Gaps - BANB MVP v1

## ⚠️ MUST RESOLVE BEFORE STARTING (Day 1-2)

### 1. **Bridge Provider Decision** 🔴 BLOCKER
**Question:** Wormhole или Allbridge для Base ↔ Solana USDC transfers?

**Evaluation Criteria:**
- ✅ Programmatic SDK (no iframe/redirect)
- ✅ Base + Solana support
- ✅ USDC native support
- ✅ Documentation quality
- ✅ Fee structure (target < $1 per transfer)
- ✅ Time to complete (target < 5 min)

**Action Plan:**
1. Day 1: Read both docs (2 hours):
   - Wormhole: https://docs.wormhole.com/wormhole/quick-start/cross-chain-dev/automatic-relayer
   - Allbridge: https://docs.allbridge.io/allbridge-core/
2. Day 1: Test both SDKs with simple USDC transfer (testnet)
3. Day 1 EOD: Make decision and document in this file

**My Recommendation:** Start with Wormhole - better documentation, more mature, better developer experience based on research.

---

### 2. **Solana USDC Address Verification** 🔴 BLOCKER
**Question:** Is `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` correct mainnet USDC?

**Risk:** Wrong address = lost funds in production

**Action Plan:**
1. Verify on Solana Explorer: https://explorer.solana.com/
2. Cross-check with Circle's official USDC documentation
3. Test small transfer on devnet first
4. Document verified addresses in lib/solana/constants.ts:
```typescript
// Verified Solana USDC addresses
export const SOLANA_USDC_MINT = {
  mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
};
```

**My Answer:** YES, this is correct. Official Circle USDC on Solana mainnet.

---

### 3. **Kamino Protocol Integration** 🔴 BLOCKER
**Question:** How to integrate Kamino lending? SDK? Program ID? Documentation?

**Missing Info:**
- Kamino SDK/library name
- Installation command
- Basic borrowing example
- Supported collateral types
- APR calculation method

**Action Plan:**
1. Day 1: Study docs: https://docs.kamino.finance/
2. Find SDK on npm: https://www.npmjs.com/search?q=kamino
3. Join Kamino Discord for developer support if needed
4. Create proof-of-concept: deposit SOL, borrow USDC on devnet
5. Document integration pattern in lib/lending/kamino.ts

**Research Findings Needed:**
- [ ] NPM package name
- [ ] Program ID for mainnet
- [ ] Minimum collateral requirements
- [ ] Liquidation threshold
- [ ] How to query user position

---

### 4. **Smart Wallet Gasless Mechanism** 🔴 BLOCKER
**Question:** How does Privy smart wallet enable "pay gas with USDC"?

**Confusion:** Docs claim gasless transactions, but mechanism unclear.

**Hypotheses:**
1. EIP-4337 Account Abstraction with Paymaster
2. Privy runs relayer service
3. Transaction bundling optimizes gas
4. User doesn't see gas, but it's deducted from USDC

**Action Plan:**
1. Read Privy docs: https://docs.privy.io/wallets/smart-wallets/
2. Test transaction on Base testnet
3. Check if USDC approval needed for gas payment
4. Understand fee structure (does Privy charge extra?)

**Expected Answer:** Privy uses EIP-4337 + Paymaster. Gas is paid in native token (ETH) by paymaster, then reimbursed from user's USDC. This is abstracted from user.

---

### 5. **Primary Wallet Solana Support** 🔴 CRITICAL ARCHITECTURE
**Question:** Primary wallet is "EVM on Base" - how does it work with Solana operations?

**Conflict:**
- Docs say: "All operations execute through primary smart wallet"
- But: Primary wallet is EVM (Base chain)
- Problem: Can't execute Solana operations from EVM wallet

**Resolution Options:**
1. **Option A:** User has TWO primary wallets:
   - Primary Base wallet (smart wallet, EVM)
   - Primary Solana wallet (created on first Solana use)
   - External wallets can only Move to respective primary

2. **Option B:** ALL operations on Solana use external wallet:
   - Primary wallet = Base only
   - Solana operations require connected external wallet
   - No "gasless" benefit on Solana

3. **Option C:** Bridge everything to Base first:
   - All operations on Base via primary wallet
   - Solana wallets only as funding sources
   - User bridges Solana → Base → operate

**My Recommendation:** **Option A** - Create Solana primary wallet on demand
- When user first needs Solana operation, create embedded Solana wallet via Privy
- Store as second primary wallet with chain='solana', is_primary=true
- Maintains gasless UX on Solana (if Privy supports it)

**Action Needed:** Verify with Privy docs if they support embedded Solana wallets with similar features.

---

### 6. **Bridge Transaction Hash Recording** 🟡 NEEDS DEFINITION
**Question:** Bridge has 2 TX hashes (source chain + dest chain). How to record?

**Current Schema:**
```sql
account_transactions (
  tx_hash VARCHAR(255)  -- Only one hash?
)
```

**Problem:** Bridge transaction has:
- Source TX hash (e.g., Solana signature)
- Destination TX hash (e.g., Base TX hash)
- Bridge tracking ID

**Proposed Solution:**
```typescript
// Source account record
{
  tx_hash: sourceTxHash,
  metadata: {
    bridge_provider: 'wormhole',
    bridge_id: 'wormhole_tracking_id',
    destination_chain: 'base',
    destination_tx_hash: destTxHash,
    bridge_fee: '0.50'
  }
}

// Destination account record
{
  tx_hash: destTxHash,
  metadata: {
    bridge_provider: 'wormhole',
    bridge_id: 'wormhole_tracking_id',
    source_chain: 'solana',
    source_tx_hash: sourceTxHash
  }
}
```

**Decision:** Use metadata JSONB for additional hashes. Primary tx_hash = chain-specific hash for that account.

---

### 7. **Automation Rule Evaluation Trigger** 🟡 NEEDS ARCHITECTURE
**Question:** How to run periodic rule evaluation in Next.js serverless environment?

**Requirements:**
- Evaluate rules every 5 minutes (or on events)
- Check all active rules for all users
- Execute actions when conditions met
- No server to run cron jobs (Vercel serverless)

**Options:**

**Option A: Vercel Cron Jobs**
```typescript
// app/api/cron/evaluate-rules/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Evaluate all rules
  await evaluateAllRules();
  return new Response('OK');
}
```
- Configure in vercel.json: `{"crons": [{"path": "/api/cron/evaluate-rules", "schedule": "*/5 * * * *"}]}`
- Pros: Native Vercel support, simple
- Cons: Only on Pro plan

**Option B: External Cron Service (cron-job.org)**
- Free service hits our API endpoint every 5 min
- Pros: Free, works on any plan
- Cons: External dependency

**Option C: Event-Driven (No Polling)**
- Evaluate rules ONLY when transactions complete
- Check if transaction triggers any rule conditions
- Pros: More efficient, real-time
- Cons: Misses time-based conditions, more complex logic

**My Recommendation:** **Option A + C Hybrid**
- Use Vercel cron for periodic checks (backup)
- Trigger evaluation on every transaction (primary)
- Best of both: responsive + catches edge cases

**Action:** Decide if Vercel Pro plan is available. If not, use Option B.

---

### 8. **Collateral Price Oracle** 🟡 NEEDS DEFINITION
**Question:** Where do asset prices come from for collateral ratio calculation?

**Needed Prices:**
- WETH/USD
- stETH/USD
- cbBTC/USD
- SOL/USD
- ETH/USD (for gas estimation)

**Use Cases:**
1. Calculate collateral ratio: `(collateral_value_usd / borrowed_value_usd) * 100`
2. Enforce $250 limit on non-USDC assets
3. Show USD equivalent in UI

**Options:**

**Option A: Protocol APIs**
- Morpho API likely returns position with USD values
- Kamino API same
- Pros: Free, accurate, same as protocol uses
- Cons: Different APIs for each protocol

**Option B: Chainlink Price Feeds**
- Read on-chain price oracles
- Pros: Decentralized, standard
- Cons: Extra RPC calls, complexity

**Option C: Coingecko/CoinMarketCap API**
- REST API for prices
- Pros: Simple, centralized
- Cons: Not real-time, rate limits

**My Recommendation:** **Option A** - Use protocol APIs
- When fetching lending position, USD values included
- For $250 limit validation, query Coingecko API (free tier: 50 calls/min)
- Cache prices for 1 minute to reduce API calls

**Action:** Confirm Morpho/Kamino APIs return USD values in position query.

---

## 🔵 NICE-TO-CLARIFY (Can resolve during dev)

### 9. AI Rule Parsing
**Decision:** Use OpenAI function calling with structured output
- Define rule schema as JSON schema
- Let GPT-4 parse natural language → structured rule
- Validate before saving to DB

### 10. Bridge Fee Display Timing
**Decision:** Call `getQuote()` when user selects destination account
- Show fee immediately after destination selection
- Update on amount change (debounced)
- Final confirmation on review screen

### 11. Insufficient Balance Error Timing
**Decision:** Three-tier validation
- Warning on amount input (if exceeds balance)
- Error on review screen (prevents proceeding)
- Final check on submit (in case balance changed)

### 12. Transaction Bundling Support
**Assumption:** Only smart wallets support bundling
- Primary wallet (Base): YES - Privy smart wallet
- Primary wallet (Solana): TBD - check Privy docs
- External wallets: NO - standard wallet transactions

### 13. Investment vs Lending Clarity
**Clarification:**
- `investments` table = Morpho VAULT deposits (passive yield)
- Lending positions = Morpho/Kamino BORROWING (query from API, not DB)
- Different features, different storage

### 14. Simulated Card Transactions
**Decision:** Component state only
- Clear on page refresh
- Clear on navigation away
- No persistence needed (it's fake data)

### 15. Account Type Usage
**Decision:** User-selectable labels
- Default: "Spending" for primary, "External" for others
- User can rename to "Savings", "Investment", etc.
- Purely organizational, doesn't affect functionality

---

## 📚 RESEARCH ASSIGNMENTS (Pre-Week 1)

**Before starting development, assign team members to research:**

1. **Bridge Evaluation** (1 day)
   - Compare Wormhole vs Allbridge
   - Test both on testnet
   - Make recommendation

2. **Kamino Integration** (1 day)
   - Read full docs
   - Find SDK
   - Create test borrow transaction
   - Document integration pattern

3. **Privy Capabilities** (0.5 day)
   - Confirm gasless transactions mechanism
   - Check Solana embedded wallet support
   - Test transaction bundling on Base

4. **Morpho Borrowing** (0.5 day)
   - Review Morpho Blue docs (existing is vault only)
   - Find borrowing API/SDK
   - Understand collateral requirements

5. **Automation Architecture** (0.5 day)
   - Decide: Vercel cron vs external vs event-driven
   - Test chosen solution
   - Document implementation plan

**Total Research Time: ~3.5 days**
**Recommendation:** Parallelize research, have 2-3 people knock this out in 1-2 days.

---

## ✅ RESOLUTION CHECKLIST

Before writing code, verify these are resolved:

- [ ] Bridge provider chosen and tested (Wormhole or Allbridge)
- [ ] Solana USDC address verified and documented
- [ ] Kamino SDK identified and tested on devnet
- [ ] Privy gasless mechanism understood
- [ ] Primary wallet Solana support clarified (Option A/B/C chosen)
- [ ] Bridge tx_hash recording pattern defined
- [ ] Automation trigger architecture decided (Vercel cron / external / event)
- [ ] Price oracle strategy defined (protocol API + Coingecko backup)
- [ ] All research assignments completed
- [ ] NPM packages list finalized and compatibility verified

---

## 🎯 RECOMMENDATION

**Timeline:**
- **Day 0 (Today):** Review this document with team
- **Day 1-2:** Research sprint - resolve all critical gaps
- **Day 3:** Begin Solana integration with confidence
- **Week 1:** Development proceeds without blockers

**Cost:** 1-2 days upfront research
**Benefit:** No mid-development blockers, clear implementation path

---

**Document Owner:** Technical Lead
**Last Updated:** 2025-11-08
**Status:** Awaiting Resolution
