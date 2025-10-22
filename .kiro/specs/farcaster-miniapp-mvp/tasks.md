# Implementation Plan

This implementation plan breaks down the BANB Farcaster MiniApp MVP into discrete, actionable coding tasks. Each task builds incrementally on previous work, with a focus on delivering a complete, working payment flow for the Base blockchain hackathon. Tasks are ordered to validate core functionality early and ensure all features are fully integrated.

**Testing Philosophy**: All features include comprehensive test coverage to enforce code quality and prevent regressions. Tests are written to validate requirements and should not be modified to pass - instead, the implementation should be corrected to meet the test specifications. This ensures robust, production-ready code.

## Task List

- [ ] 1. Set up testing infrastructure
  - Create `scripts/run-tests.mjs` with test discovery and execution logic
  - Create `tests/` directory for test files
  - Add utility test helpers for common assertions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.1 Write sample test to validate test runner
  - Create `tests/sample.test.mjs` with basic assertions
  - Test the test runner execution and output formatting
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 2. Implement core utility functions with validation
  - Create address validation function in `lib/utils.ts` (isValidEthereumAddress)
  - Create amount validation function (isValidAmount, max 2 decimals)
  - Create currency formatting function (formatCurrency)
  - _Requirements: 4.3, 8.1, 8.2, 8.3_

- [ ] 2.1 Write comprehensive tests for utility functions
  - Test address validation with valid Ethereum addresses (0x...)
  - Test address validation rejects invalid formats, empty addresses, incorrect length
  - Test amount validation edge cases (zero, negative, too many decimals, exceeding balance)
  - Test currency formatting with various inputs (0, decimals, large numbers)
  - Test decimal precision for USDC (6 decimals)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.6_

- [ ] 3. Create profile management service
  - Create `lib/profile.ts` with profile CRUD functions
  - Implement `getProfileByWalletAddress()` to lookup existing profiles
  - Implement `createProfile()` with auto-generated handle (user_<fid>) and name
  - Implement `updateProfile()` for profile updates
  - Add proper TypeScript types for profile operations
  - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [ ] 3.1 Write comprehensive tests for profile logic
  - Test profile creation with valid data and correct handle format (user_<fid>)
  - Test profile lookup by wallet address returns existing profiles
  - Test profile creation fails gracefully with invalid data
  - Test UserContext updates after profile operations
  - Test wallet address extraction from authentication data
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 4. Enhance authentication flow with automatic profile creation
  - Update `components/auth/LoginForm.tsx` to fetch/create profile after Farcaster auth
  - After JWT verification, call `getProfileByWalletAddress()`
  - If no profile exists, call `createProfile()` with FID and wallet address
  - Store profile in UserContext and localStorage
  - Redirect to banking home after successful profile load
  - Handle errors gracefully with user-friendly messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [ ] 4.1 Write comprehensive tests for authentication flow
  - Test JWT token validation with valid and invalid tokens
  - Test profile creation on first login with correct data
  - Test profile loading on subsequent logins
  - Test error handling for authentication failures
  - Test session expiration triggers re-authentication
  - Test UserContext is updated after successful authentication
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.8, 1.9_

- [ ] 5. Build recipient management UI and logic
  - Create `components/payments/RecipientSelect.tsx` with recipient list display
  - Implement search functionality with real-time filtering
  - Create "Add New Recipient" button and modal
  - Create `components/payments/RecipientForm.tsx` with name and address inputs
  - Add inline validation for address format
  - Integrate with `lib/recipients.ts` functions (getRecipientsByProfile, createRecipient)
  - Ensure profile_id is passed from UserContext when creating recipients
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 5.1 Write comprehensive tests for recipient management
  - Test recipient name validation requires minimum 2 characters and rejects empty names
  - Test address validation integration with valid/invalid Ethereum addresses
  - Test search filtering logic is case-insensitive and returns empty array when no matches
  - Test recipient creation saves to database with correct profile_id
  - Test recipient list retrieval returns only user's recipients
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 6. Implement amount input with balance validation
  - Create `components/payments/AmountInput.tsx` with numeric input
  - Integrate `useUSDCBalance()` hook to fetch user balance
  - Add real-time balance validation (amount <= balance)
  - Disable continue button when amount exceeds balance
  - Add optional note field
  - Format amount display with proper decimals
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.6_

- [ ] 6.1 Write comprehensive tests for amount validation logic
  - Test amount validation rejects zero amounts
  - Test amount validation rejects negative amounts
  - Test amount validation rejects amounts exceeding balance
  - Test amount validation accepts valid amounts with up to 6 decimals
  - Test balance comparison logic with various scenarios
  - Test decimal formatting with edge cases
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7. Build payment review and confirmation screen
  - Create `components/payments/ReviewCard.tsx` with transaction summary
  - Display recipient name and address
  - Display amount, estimated gas, and total
  - Add confirm button with loading state
  - Integrate `useCryptoPayment()` hook
  - Ensure sender_profile_id is passed from UserContext
  - Handle payment execution on confirm
  - Navigate to status screen on success
  - Display error toast on failure
  - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 8.1, 8.2, 8.3, 8.4_

- [ ] 7.1 Write comprehensive tests for payment execution logic
  - Test transaction record creation with status "pending"
  - Test USDC amount conversion to wei uses 6 decimals correctly
  - Test transaction status transitions (pending → sent → success)
  - Test transaction status transitions (pending → sent → failed)
  - Test transaction hash is stored when status changes to "sent"
  - Test ERC20 transfer function is called with correct parameters
  - Test payment execution fails gracefully with insufficient balance
  - Test payment execution fails gracefully with invalid recipient address
  - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9_

- [ ] 8. Implement transaction status tracking
  - Create `components/payments/StatusIndicator.tsx` with status badges
  - Integrate `useTransactionStatus()` hook
  - Display transaction hash with block explorer link (BaseScan)
  - Add polling logic for pending transactions
  - Update UI when transaction confirms
  - Show success state with confirmation time
  - Show failure state with error message
  - Add "Done" button to return to home
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 8.1 Write comprehensive tests for transaction status logic
  - Test status badge colors match correct statuses (pending: yellow, sent: blue, success: green, failed: red)
  - Test block explorer URL generation for Base chain
  - Test transaction hash format validation (0x followed by 64 hex chars)
  - Test status polling stops after success or failed status
  - Test transaction status retrieval by ID returns correct transaction
  - Test transaction status update persists to database
  - Test invalid status transitions are rejected (e.g., success → pending)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 9. Enhance banking home dashboard
  - Update `components/banking-home.tsx` to fetch USDC balance
  - Add loading skeleton for balance
  - Fetch recent transactions using `getRecentTransactions()` with profile_id
  - Display transaction list with status, amount, and recipient
  - Add empty state for no transactions
  - Implement pull-to-refresh functionality
  - Add error state with retry button
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 10.5_

- [ ] 9.1 Write comprehensive tests for dashboard functionality
  - Test balance fetching returns correct USDC amount
  - Test loading states are displayed during data fetch
  - Test error states are displayed when fetch fails
  - Test transaction list displays correct number of items (max 10)
  - Test empty state is shown when no transactions exist
  - Test currency formatting with various amounts (0, decimals, large numbers)
  - Test transaction grouping by date works correctly
  - Test retry functionality reloads data successfully
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 10. Wire up complete payment flow routing
  - Create route `/app/payments/wallet/recipient/page.tsx` for recipient selection
  - Create route `/app/payments/wallet/[recipientId]/amount/page.tsx` for amount input
  - Create route `/app/payments/wallet/[recipientId]/review/page.tsx` for review
  - Create route `/app/payments/status/[txId]/page.tsx` for status tracking
  - Ensure query params are passed correctly (amount, note)
  - Add back navigation between steps
  - Preserve form state during navigation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.10, 9.4_

- [ ] 11. Implement comprehensive error handling
  - Add error boundaries for React components
  - Implement retry logic with exponential backoff in `lib/payments.ts`
  - Add user-friendly error messages for common failures
  - Handle wallet connection errors in auth components
  - Handle insufficient balance errors in amount input
  - Handle transaction rejection in review screen
  - Handle network errors with retry buttons
  - Add error logging with structured format
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 11.1 Write comprehensive tests for error handling logic
  - Test error messages are user-friendly and actionable
  - Test retry logic implements exponential backoff correctly
  - Test retry logic stops after maximum attempts (3)
  - Test error logging includes timestamp, error type, and context
  - Test network errors trigger retry option display
  - Test insufficient balance errors prevent transaction submission
  - Test user rejection returns to correct screen without side effects
  - Test success messages include relevant transaction details
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_

- [ ] 12. Optimize for mobile experience
  - Add touch-friendly button sizing (min 44px)
  - Implement appropriate mobile keyboards (numeric for amounts)
  - Add pull-to-refresh on dashboard
  - Optimize images with Next.js Image component
  - Add loading skeletons for better perceived performance
  - Implement smooth page transitions
  - Test on mobile viewport sizes
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 13. Verify MiniApp configuration and deployment readiness
  - Verify `minikit.config.ts` has correct metadata
  - Ensure `NEXT_PUBLIC_URL` is set correctly for production
  - Test MiniApp initialization in Farcaster context
  - Verify HTTPS mode works with `npm run dev:https`
  - Test account association signature
  - Verify all assets (icons, screenshots) are accessible
  - Test webhook endpoint (placeholder)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 14. Implement data persistence and sync
  - Add localStorage persistence for user session
  - Implement automatic data refresh on app focus
  - Add optimistic updates for instant feedback
  - Handle offline state with cached data
  - Add sync indicator when data is stale
  - Implement retry logic for failed database writes
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 14.1 Write comprehensive tests for data persistence
  - Test recipient creation persists to database immediately
  - Test transaction creation includes all required fields
  - Test transaction status updates are atomic
  - Test database retry logic with exponential backoff
  - Test retry logic stops after 3 attempts
  - Test data loading retrieves latest records from database
  - Test offline state displays cached data correctly
  - Test sync logic handles conflicts appropriately
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 15. Implement currency conversion API and service
  - Create `/app/api/currency/rates/route.ts` to fetch USDC to USD and EURO rates
  - Integrate with CoinGecko API or similar price feed service
  - Implement 5-minute caching for conversion rates
  - Create `lib/currency.ts` with conversion utility functions
  - Implement `useCurrencyConversion()` hook for fetching rates
  - Implement `convertToFiat()` function for USDC to fiat conversion
  - Implement `useCurrencyPreference()` hook for localStorage persistence
  - Add error handling for rate fetch failures with fallback behavior
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.9, 11.10_

- [ ] 15.1 Write comprehensive tests for currency conversion logic
  - Test USDC to USD conversion with various amounts
  - Test USDC to EURO conversion with various amounts
  - Test currency formatting includes correct symbols ($ for USD, € for EURO)
  - Test currency formatting uses 2 decimal places
  - Test conversion rate caching with 5-minute TTL
  - Test fallback to USDC display when rates unavailable
  - Test currency preference persistence in localStorage
  - Test currency toggle updates display immediately
  - Test transaction amounts show fiat conversion
  - Test rate API error handling returns graceful fallback
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 11.7, 11.8, 11.9, 11.10_

- [ ] 16. Build currency toggle and balance display components
  - Create `components/currency/CurrencyToggle.tsx` with USD/EURO toggle
  - Create `components/currency/BalanceDisplay.tsx` for fiat balance display
  - Create `components/currency/TransactionAmountDisplay.tsx` for transaction amounts
  - Integrate currency toggle into banking home dashboard
  - Display balance in selected currency with proper formatting
  - Show USDC amount as secondary display
  - Add loading state for conversion rate fetch
  - Display error state when rates unavailable
  - Persist currency preference to localStorage
  - _Requirements: 11.5, 11.6, 11.7, 11.8, 11.10_

- [ ] 16.1 Write comprehensive tests for currency display components
  - Test currency toggle state management and persistence
  - Test balance calculation with different rates and amounts
  - Test formatting for USD with $ symbol and 2 decimals
  - Test formatting for EURO with € symbol and 2 decimals
  - Test error state display when rates unavailable
  - Test loading state during rate fetch
  - Test USDC fallback display
  - _Requirements: 11.5, 11.6, 11.7, 11.8, 11.9_

- [ ] 17. Add fiat conversion to transaction displays
  - Update transaction list items to show fiat equivalent amounts
  - Update payment review screen to show fiat conversion
  - Update transaction status screen to show fiat amounts
  - Ensure all amounts use selected currency preference
  - Format amounts consistently across all screens
  - _Requirements: 11.11_

- [x] 18. Create AI agent database schema and API endpoints




  - Create `ai_operations` table in Supabase for audit trail
  - Create `/app/api/ai/chat/route.ts` for AI message processing
  - Create `/app/api/ai/execute/route.ts` for operation execution
  - Implement authentication and rate limiting for AI endpoints
  - Add input sanitization to prevent prompt injection
  - Set up AI backend integration (OpenAI, Anthropic, or local model)
  - _Requirements: 12.1, 12.2, 12.4, 12.6, 12.7, 12.9_

- [x] 19. Implement AI agent service layer




  - Create `lib/ai-agent.ts` with AI interaction functions
  - Implement `useAIAgent()` hook for chat interface
  - Implement `executeAIOperation()` function for operation execution
  - Implement `getPortfolioInsights()` function for spending analysis
  - Add context retrieval functions (balance, transactions, recipients)
  - Implement operation parsing from AI responses
  - Add audit logging for all AI operations
  - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.10, 12.11_

- [x] 19.1 Write tests for AI agent operation validation







  - Test operation type validation
  - Test payment operation data structure
  - Test analysis operation data structure
  - Test operation confirmation flow
  - Test audit trail creation
  - _Requirements: 12.4, 12.7, 12.11_

- [x] 20. Build AI agent chat interface





  - Create `components/ai/AIAgentChat.tsx` with message history
  - Create `components/ai/AIOperationConfirmation.tsx` for operation approval
  - Create `components/ai/PortfolioInsightsCard.tsx` for insights display
  - Add suggested prompts for common actions
  - Implement typing indicator during AI processing
  - Add message input with send button
  - Integrate with `useAIAgent()` hook
  - Handle operation confirmations with modal dialogs
  - Display portfolio insights when requested
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.9, 12.10_

- [x] 21. Integrate AI agent into banking home





  - Add AI chat interface to banking home dashboard
  - Implement collapsible/expandable chat panel
  - Add AI icon/button to trigger chat
  - Ensure AI has access to user context (profile, balance, transactions)
  - Test AI-suggested payment flow end-to-end
  - Test portfolio analysis features
  - Add user consent flow for AI features
  - _Requirements: 12.1, 12.2, 12.3, 12.9_





- [x] 22. Implement AI operation execution and security

  - Add confirmation modal for all AI-suggested operations
  - Implement operation validation before execution
  - Add security warnings for payment operations
  - Log all AI operations to ai_operations table
  - Implement operation result tracking
  - Add user ability to view AI operation history
  - Ensure all AI operations follow same security rules as manual operations
  - _Requirements: 12.4, 12.5, 12.6, 12.7, 12.8, 12.11_

- [x] 22.1 Write tests for AI security measures





  - Test prompt injection prevention
  - Test operation validation
  - Test confirmation requirement enforcement
  - Test audit logging
  - _Requirements: 12.6, 12.7, 12.11_

- [ ] 23. End-to-end integration testing and polish
  - Test complete payment flow from dashboard to success
  - Test currency conversion with different currencies
  - Test AI agent chat and operation execution
  - Verify all error states display correctly
  - Test with real USDC on Base Mainnet (small amounts)
  - Verify transaction confirmation polling works
  - Test recipient management (add, search, select)
  - Verify balance updates after payment
  - Test session persistence across page refreshes
  - Test AI-suggested payments end-to-end
  - Test portfolio insights accuracy
  - Fix any UI/UX issues discovered during testing
  - Prepare demo script for hackathon presentation
  - _Requirements: All requirements_

## Notes for Hackathon Success

**Critical Path (Must Have)**:
- Tasks 1-10: Core payment flow from auth to transaction completion (including tests)
- Task 13: MiniApp configuration for Farcaster integration
- Tasks 15-17: Currency conversion features (including tests)
- Tasks 18-22: AI agent integration (including tests)
- Task 23: End-to-end testing

**Testing Requirements**:
- All test tasks (*.1 subtasks) are mandatory and must be completed with their parent tasks
- Tests validate requirements and enforce code quality standards
- Tests should fail when implementation is incorrect, not be modified to pass
- Each feature must have passing tests before moving to the next feature

**Feature Priority**:
1. **Core Payment Flow** (Tasks 1-10): Essential for basic functionality with full test coverage
2. **Currency Conversion** (Tasks 15-17): Enhances user experience with familiar currencies and validated conversions
3. **AI Agent** (Tasks 18-22): Differentiator feature for hackathon with security testing

**Demo Preparation**:
- Have test USDC ready on Base Mainnet
- Prepare 2-3 test recipient addresses
- Test the full flow multiple times before presenting
- Prepare AI demo prompts: "Analyze my spending", "Send $50 to Alice"
- Test currency toggle between USD and EURO
- Have backup plan if network is slow (show video recording)
- Highlight AI agent as key innovation in presentation

**AI Backend Setup**:
- Choose AI provider: OpenAI (fastest), Anthropic (most capable), or Ollama (free/local)
- Set up API keys in environment variables
- Test AI responses before demo
- Prepare fallback responses if AI is unavailable
