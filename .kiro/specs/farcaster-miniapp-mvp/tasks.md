# Implementation Plan

This implementation plan breaks down the BANB Farcaster MiniApp MVP into discrete, actionable coding tasks. Each task builds incrementally on previous work, with a focus on delivering a complete, working payment flow for the Base blockchain hackathon. Tasks are ordered to validate core functionality early and ensure all features are fully integrated.

**Hackathon Focus**: This plan prioritizes a functional, easy-to-use demo that showcases USDC payments on Base with Farcaster authentication. Core features are implemented first, with optional testing tasks marked with `*` that can be skipped if time is limited.

## Task List

- [ ] 1. Set up testing infrastructure
  - Create `scripts/run-tests.mjs` with test discovery and execution logic
  - Create `tests/` directory for test files
  - Add utility test helpers for common assertions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 1.1 Write sample test to validate test runner
  - Create `tests/sample.test.mjs` with basic assertions
  - Test the test runner execution and output formatting
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 2. Implement core utility functions with validation
  - Create address validation function in `lib/utils.ts` (isValidEthereumAddress)
  - Create amount validation function (isValidAmount, max 2 decimals)
  - Create currency formatting function (formatCurrency)
  - _Requirements: 4.3, 8.1, 8.2, 8.3_

- [ ]* 2.1 Write unit tests for utility functions
  - Test address validation with valid/invalid cases
  - Test amount validation edge cases (zero, negative, too many decimals)
  - Test currency formatting with various inputs
  - _Requirements: 6.6_

- [ ] 3. Create profile management service
  - Create `lib/profile.ts` with profile CRUD functions
  - Implement `getProfileByWalletAddress()` to lookup existing profiles
  - Implement `createProfile()` with auto-generated handle (user_<fid>) and name
  - Implement `updateProfile()` for profile updates
  - Add proper TypeScript types for profile operations
  - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [ ]* 3.1 Write tests for profile logic
  - Test profile creation with valid data
  - Test profile lookup by wallet address
  - Test auto-generated handle format
  - _Requirements: 1.4, 1.5, 1.6_

- [ ] 4. Enhance authentication flow with automatic profile creation
  - Update `components/auth/LoginForm.tsx` to fetch/create profile after Farcaster auth
  - After JWT verification, call `getProfileByWalletAddress()`
  - If no profile exists, call `createProfile()` with FID and wallet address
  - Store profile in UserContext and localStorage
  - Redirect to banking home after successful profile load
  - Handle errors gracefully with user-friendly messages
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [ ]* 4.1 Write tests for authentication flow
  - Test profile creation on first login
  - Test profile loading on subsequent logins
  - Test error handling for auth failures
  - _Requirements: 1.4, 1.5, 1.6, 1.8_

- [ ] 5. Build recipient management UI and logic
  - Create `components/payments/RecipientSelect.tsx` with recipient list display
  - Implement search functionality with real-time filtering
  - Create "Add New Recipient" button and modal
  - Create `components/payments/RecipientForm.tsx` with name and address inputs
  - Add inline validation for address format
  - Integrate with `lib/recipients.ts` functions (getRecipientsByProfile, createRecipient)
  - Ensure profile_id is passed from UserContext when creating recipients
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ]* 5.1 Write tests for recipient validation
  - Test name validation (required, min length)
  - Test address validation integration
  - Test search filtering logic
  - _Requirements: 3.3, 3.4, 3.7_

- [ ] 6. Implement amount input with balance validation
  - Create `components/payments/AmountInput.tsx` with numeric input
  - Integrate `useUSDCBalance()` hook to fetch user balance
  - Add real-time balance validation (amount <= balance)
  - Disable continue button when amount exceeds balance
  - Add optional note field
  - Format amount display with proper decimals
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.6_

- [ ]* 6.1 Write tests for amount validation logic
  - Test balance comparison logic
  - Test decimal formatting
  - Test zero and negative amount handling
  - _Requirements: 4.2, 4.3_

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

- [ ]* 7.1 Write tests for payment execution logic
  - Test transaction record creation
  - Test wei conversion for USDC (6 decimals)
  - Test status transition logic (pending → sent → success)
  - _Requirements: 4.5, 4.6, 4.7, 4.8_

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

- [ ]* 8.1 Write tests for transaction status logic
  - Test status badge color mapping
  - Test valid/invalid status transitions
  - Test block explorer URL generation
  - _Requirements: 5.7_

- [ ] 9. Enhance banking home dashboard
  - Update `components/banking-home.tsx` to fetch USDC balance
  - Add loading skeleton for balance
  - Fetch recent transactions using `getRecentTransactions()` with profile_id
  - Display transaction list with status, amount, and recipient
  - Add empty state for no transactions
  - Implement pull-to-refresh functionality
  - Add error state with retry button
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 10.5_

- [ ]* 9.1 Write tests for transaction formatting
  - Test transaction grouping by date
  - Test amount formatting with positive/negative values
  - Test empty state logic
  - _Requirements: 2.4, 2.5, 2.7_

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

- [ ]* 11.1 Write tests for error handling logic
  - Test retry logic with exponential backoff
  - Test error message formatting
  - Test error recovery flows
  - _Requirements: 8.1, 8.2, 8.6_

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

- [ ] 15. End-to-end integration testing and polish
  - Test complete payment flow from dashboard to success
  - Verify all error states display correctly
  - Test with real USDC on Base Mainnet (small amounts)
  - Verify transaction confirmation polling works
  - Test recipient management (add, search, select)
  - Verify balance updates after payment
  - Test session persistence across page refreshes
  - Fix any UI/UX issues discovered during testing
  - Prepare demo script for hackathon presentation
  - _Requirements: All requirements_

## Notes for Hackathon Success

**Critical Path (Must Have)**:
- Tasks 1-10: Core payment flow from auth to transaction completion
- Task 13: MiniApp configuration for Farcaster integration
- Task 15: End-to-end testing

**Nice to Have (If Time Permits)**:
- Tasks marked with `*`: Unit tests for validation
- Task 11: Advanced error handling
- Task 12: Mobile optimizations
- Task 14: Advanced data sync

**Demo Preparation**:
- Have test USDC ready on Base Mainnet
- Prepare 2-3 test recipient addresses
- Test the full flow multiple times before presenting
- Have backup plan if network is slow (show video recording)
