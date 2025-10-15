# BANB Farcaster MiniApp MVP Spec

## Overview

This spec defines the implementation plan for BANB (Blockchain Agent Neo Bank), a Farcaster MiniApp for the Base blockchain hackathon. The MVP focuses on delivering a functional, easy-to-use USDC payment system with Farcaster authentication.

## What's Included

### 1. Requirements Document (`requirements.md`)
Defines 10 core requirements using EARS format (Easy Approach to Requirements Syntax):

1. **Farcaster Authentication with Profile Creation** - Auto-create user profiles on first login
2. **Banking Dashboard Display** - Show USDC balance and transaction history
3. **Recipient Management** - Add and search payment recipients
4. **Crypto Payment Execution** - Send USDC on Base blockchain
5. **Transaction Status Tracking** - Real-time transaction monitoring
6. **Local Testing Infrastructure** - Lightweight testing without heavy frameworks
7. **MiniApp Configuration** - Proper Farcaster integration
8. **Error Handling** - User-friendly error messages
9. **Mobile-First Design** - Optimized for mobile devices
10. **Data Persistence** - Reliable data storage and sync

### 2. Design Document (`design.md`)
Comprehensive technical design covering:

- **System Architecture** - Three-layer model (User → API → Service → Data/Blockchain)
- **Components and Interfaces** - Detailed component specifications
- **Data Models** - Database schema and blockchain data structures
- **Error Handling** - Strategies for all error scenarios
- **Testing Strategy** - Lightweight, dependency-free testing approach
- **Configuration** - Environment variables and deployment setup
- **Mobile-First Patterns** - Touch interactions, responsive design, accessibility

### 3. Implementation Plan (`tasks.md`)
15 actionable tasks organized for incremental development:

**Critical Path (Must Have)**:
- Tasks 1-10: Core payment flow
- Task 13: MiniApp configuration
- Task 15: End-to-end testing

**Optional (Nice to Have)**:
- Tasks marked with `*`: Unit tests
- Task 11: Advanced error handling
- Task 12: Mobile optimizations
- Task 14: Advanced data sync

## Key Features for Hackathon Demo

### ✅ What Works End-to-End
1. **Farcaster Login** → Auto-create profile → Dashboard
2. **Add Recipient** → Enter wallet address → Save to database
3. **Send Payment** → Select recipient → Enter amount → Review → Confirm → Track status
4. **View Transactions** → See history with status badges → Click for details

### 🎯 Hackathon Highlights
- **Base Blockchain Native**: USDC payments on Base L2
- **Farcaster Integration**: Seamless wallet authentication
- **Mobile-First**: Optimized for Farcaster mobile app
- **Real-Time Tracking**: Live transaction status updates
- **User-Friendly**: Clear error messages and loading states

## Technology Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- TailwindCSS 3
- Shadcn/UI components

### Web3
- Wagmi v2 (React hooks for Ethereum)
- Viem v2 (Low-level Ethereum interactions)
- OnchainKit v1.1 (Coinbase Base utilities)
- Farcaster MiniApp SDK

### Backend
- Next.js API Routes (serverless)
- Supabase (PostgreSQL database)
- Farcaster Quick Auth (JWT verification)

### Blockchain
- Base (Ethereum L2)
- USDC ERC20 token (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)

## Getting Started with Implementation

### 1. Review the Spec
- Read `requirements.md` to understand what needs to be built
- Review `design.md` for technical details
- Check `tasks.md` for implementation order

### 2. Start with Critical Path
Execute tasks in order:
1. Set up testing infrastructure (Task 1)
2. Implement utilities (Task 2)
3. Create profile service (Task 3)
4. Enhance authentication (Task 4)
5. Build recipient management (Task 5)
6. Implement amount input (Task 6)
7. Build payment review (Task 7)
8. Add status tracking (Task 8)
9. Enhance dashboard (Task 9)
10. Wire up routing (Task 10)

### 3. Test and Polish
- Run end-to-end tests (Task 15)
- Fix any issues discovered
- Prepare demo script

### 4. Deploy
- Configure environment variables
- Deploy to Vercel
- Test in Farcaster app

## Important Notes

### Profile Management (NEW)
The spec adds a critical missing piece: **automatic profile creation**. When users log in with Farcaster:
1. System checks if profile exists for wallet address
2. If not, creates profile with auto-generated handle (user_<fid>)
3. Stores profile in UserContext and localStorage
4. All subsequent operations use profile_id

### Database Schema Updates Needed
The existing schema needs profile_id associations:
- `recipients.profile_id` - Owner of recipient entry
- `transactions.sender_profile_id` - Who sent the transaction

### Testing Approach
Uses lightweight Node.js test runner (no Jest/Vitest):
- Tests in `tests/*.test.mjs`
- Run with `node scripts/run-tests.mjs`
- Uses Node's built-in `assert/strict`
- Focus on pure functions (no network calls)

### Hackathon Tips
1. **Start Early**: Profile management is foundational
2. **Test Often**: Run the full flow after each major task
3. **Have Backup**: Record a video demo in case of network issues
4. **Prepare USDC**: Get test USDC on Base Mainnet before demo day
5. **Practice Demo**: Run through the flow multiple times

## Success Criteria

### Minimum Viable Demo
- [ ] User can log in with Farcaster
- [ ] User can add a recipient
- [ ] User can send USDC payment
- [ ] Transaction appears in history
- [ ] Status updates show correctly

### Bonus Points
- [ ] Mobile-optimized UI
- [ ] Error handling works smoothly
- [ ] Loading states are polished
- [ ] Transaction confirmation is fast

## Questions or Issues?

Refer back to:
- `requirements.md` - What needs to be built
- `design.md` - How to build it
- `tasks.md` - Step-by-step implementation

Good luck with the hackathon! 🚀
