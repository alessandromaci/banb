# Requirements Document

## Introduction

BANB (Blockchain Agent Neo Bank) is a Farcaster MiniApp that provides decentralized banking functionality with blockchain-native infrastructure. The MVP focuses on delivering a working prototype with core features fully integrated: user authentication via Farcaster, crypto wallet payments using USDC on Base, recipient management, and transaction tracking. The application prioritizes mobile-first design, seamless Web3 integration, and a complete end-to-end payment flow that users can test immediately.

This spec targets rapid prototyping with emphasis on feature completeness over breadth - each implemented feature must work end-to-end before moving to the next.

## Requirements

### Requirement 1: Farcaster Authentication Integration with Profile Creation

**User Story:** As a Farcaster user, I want to authenticate using my Farcaster wallet and have my profile automatically created, so that I can securely access my banking features without manual setup.

#### Acceptance Criteria

1. WHEN a user opens the MiniApp THEN the system SHALL initialize the Farcaster MiniApp SDK and display the authentication screen
2. WHEN a user connects their wallet via Farcaster connector THEN the system SHALL verify the JWT token using @farcaster/quick-auth
3. IF the JWT token is valid THEN the system SHALL retrieve the user's FID and wallet address
4. WHEN authentication succeeds THEN the system SHALL check if a profile exists for the wallet address
5. IF no profile exists THEN the system SHALL create a new profile with auto-generated handle (e.g., user_<fid>) and name
6. IF profile exists THEN the system SHALL load the existing profile
7. WHEN profile is loaded/created THEN the system SHALL store it in UserContext and redirect to banking home
8. IF authentication fails THEN the system SHALL display an error message and allow retry
9. WHEN the user session expires THEN the system SHALL prompt re-authentication

### Requirement 2: Banking Dashboard Display

**User Story:** As an authenticated user, I want to view my USDC balance and recent transactions on a dashboard, so that I can monitor my account status at a glance.

#### Acceptance Criteria

1. WHEN the banking home loads THEN the system SHALL fetch and display the user's USDC balance from Base chain
2. WHEN the balance is loading THEN the system SHALL show a loading indicator
3. IF the balance fetch fails THEN the system SHALL display an error state with retry option
4. WHEN transactions exist THEN the system SHALL display the 10 most recent transactions with status, amount, and recipient
5. WHEN no transactions exist THEN the system SHALL display an empty state message
6. WHEN the user pulls to refresh THEN the system SHALL reload balance and transaction data
7. WHEN displaying amounts THEN the system SHALL format currency values with proper decimals and symbols

### Requirement 3: Recipient Management

**User Story:** As a user, I want to add and manage payment recipients with their wallet addresses, so that I can easily send payments to saved contacts.

#### Acceptance Criteria

1. WHEN a user initiates a payment THEN the system SHALL display a recipient selection interface
2. WHEN the user clicks "Add New Recipient" THEN the system SHALL display a form with fields for name and wallet address
3. WHEN the user submits a recipient form THEN the system SHALL validate the wallet address format
4. IF the wallet address is invalid THEN the system SHALL display a validation error
5. IF the wallet address is valid THEN the system SHALL save the recipient to the recipients table in Supabase
6. WHEN recipients are saved THEN the system SHALL display them in a searchable list
7. WHEN the user searches recipients THEN the system SHALL filter results by name in real-time
8. WHEN a recipient is selected THEN the system SHALL proceed to the amount input screen

### Requirement 4: Crypto Payment Execution

**User Story:** As a user, I want to send USDC payments to recipients via their wallet addresses, so that I can transfer funds securely on the blockchain.

#### Acceptance Criteria

1. WHEN a user selects a recipient THEN the system SHALL display an amount input screen
2. WHEN the user enters an amount THEN the system SHALL validate it is greater than zero and not exceeding balance
3. IF the amount exceeds balance THEN the system SHALL disable the continue button and show an error
4. WHEN the user proceeds to review THEN the system SHALL display recipient, amount, estimated gas, and total
5. WHEN the user confirms payment THEN the system SHALL create a pending transaction record in Supabase
6. WHEN the transaction record is created THEN the system SHALL call the ERC20 transfer function via Wagmi
7. IF the blockchain transaction is broadcasted THEN the system SHALL update the transaction status to "sent" with tx_hash
8. WHEN the transaction is confirmed on-chain THEN the system SHALL update the status to "success"
9. IF the transaction fails THEN the system SHALL update the status to "failed" and display error details
10. WHEN the payment completes THEN the system SHALL redirect to a success screen with transaction details

### Requirement 5: Transaction Status Tracking

**User Story:** As a user, I want to track the status of my payments in real-time, so that I know when my transactions are confirmed on the blockchain.

#### Acceptance Criteria

1. WHEN a payment is initiated THEN the system SHALL display a status indicator showing "pending"
2. WHEN the transaction is broadcasted THEN the system SHALL update the indicator to "sent" with the transaction hash
3. WHEN the transaction hash is available THEN the system SHALL provide a link to view it on a block explorer
4. WHEN waiting for confirmation THEN the system SHALL poll the blockchain using useWaitForTransactionReceipt
5. IF the transaction is confirmed THEN the system SHALL update the status to "success" and show confirmation time
6. IF the transaction fails on-chain THEN the system SHALL update the status to "failed" and display the revert reason
7. WHEN viewing transaction history THEN the system SHALL display color-coded status badges (pending: yellow, sent: blue, success: green, failed: red)

### Requirement 6: Local Testing Infrastructure

**User Story:** As a developer, I want a lightweight testing setup without heavy dependencies, so that I can quickly validate core functionality during development.

#### Acceptance Criteria

1. WHEN the test runner is executed THEN the system SHALL discover all *.test.mjs files in the tests/ directory
2. WHEN tests are discovered THEN the system SHALL execute them serially and report results
3. IF a test passes THEN the system SHALL display a green checkmark with the test name
4. IF a test fails THEN the system SHALL display a red X with the error stack trace
5. WHEN all tests complete THEN the system SHALL exit with code 0 if all passed or code 1 if any failed
6. WHEN testing payment logic THEN the system SHALL validate amount formatting, address validation, and transaction state transitions
7. WHEN testing recipient logic THEN the system SHALL validate name and wallet address requirements

### Requirement 7: MiniApp Configuration and Deployment

**User Story:** As a developer, I want the MiniApp properly configured for Farcaster integration, so that users can access it seamlessly within the Farcaster ecosystem.

#### Acceptance Criteria

1. WHEN the MiniApp is deployed THEN the system SHALL expose metadata via minikit.config.ts including name, icon, and homeUrl
2. WHEN NEXT_PUBLIC_URL is set THEN the system SHALL use it as the base URL for all MiniApp metadata
3. IF NEXT_PUBLIC_URL is not set AND running on Vercel THEN the system SHALL use VERCEL_PROJECT_PRODUCTION_URL
4. IF neither variable is set THEN the system SHALL default to http://localhost:3000 for development
5. WHEN the MiniApp loads in Farcaster THEN the system SHALL initialize the SDK context correctly
6. WHEN running in development THEN the system SHALL support HTTPS mode via npm run dev:https for wallet testing
7. WHEN deployed to production THEN the system SHALL serve over HTTPS with valid certificates

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback during operations, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the system SHALL display a user-friendly message with retry option
2. WHEN a wallet connection fails THEN the system SHALL explain the issue and provide troubleshooting steps
3. WHEN insufficient balance is detected THEN the system SHALL prevent transaction submission and show the shortfall
4. WHEN a transaction is rejected by the user THEN the system SHALL return to the review screen without creating a record
5. WHEN the blockchain is congested THEN the system SHALL display estimated wait times
6. WHEN an unexpected error occurs THEN the system SHALL log details to console and show a generic error message
7. WHEN operations succeed THEN the system SHALL display success toasts with relevant details

### Requirement 9: Mobile-First Responsive Design

**User Story:** As a mobile user, I want the interface optimized for small screens, so that I can easily navigate and complete transactions on my phone.

#### Acceptance Criteria

1. WHEN the app loads on mobile THEN the system SHALL display a single-column layout with touch-friendly buttons
2. WHEN the user taps input fields THEN the system SHALL show appropriate mobile keyboards (numeric for amounts)
3. WHEN displaying lists THEN the system SHALL use infinite scroll or pagination for performance
4. WHEN the user navigates THEN the system SHALL use smooth transitions between screens
5. WHEN buttons are displayed THEN the system SHALL ensure minimum 44px touch targets
6. WHEN forms are shown THEN the system SHALL auto-focus the first input field
7. WHEN the app is used in landscape THEN the system SHALL maintain usability without horizontal scrolling

### Requirement 10: Data Persistence and Sync

**User Story:** As a user, I want my recipients and transaction history persisted reliably, so that I don't lose data between sessions.

#### Acceptance Criteria

1. WHEN a recipient is added THEN the system SHALL immediately save it to Supabase with created_at timestamp
2. WHEN a transaction is created THEN the system SHALL persist it with all required fields before blockchain submission
3. WHEN transaction status changes THEN the system SHALL update the record atomically in Supabase
4. IF a database write fails THEN the system SHALL retry up to 3 times with exponential backoff
5. WHEN the user returns to the app THEN the system SHALL load the latest data from Supabase
6. WHEN offline THEN the system SHALL display cached data with an offline indicator
7. WHEN connection is restored THEN the system SHALL sync pending changes automatically
