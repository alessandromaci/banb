# Banb - Project Overview

## What is Banb?

Banb (Blockchain Agent Neo Bank) is a decentralized banking application that combines the user-friendly features of modern fintech neo-banks with blockchain infrastructure and AI-driven automation.

## Core Features

- **Digital Profile Management**: Users create profiles linked to blockchain wallets
- **Crypto Payments**: Send USDC payments on Base blockchain
- **Multi-Currency Display**: View balances in USD or EUR
- **Transaction History**: Track all sent and received payments
- **Friend Management**: Save recipients for quick payments
- **Farcaster Integration**: Built as a Farcaster MiniApp with seamless authentication

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.4 with React 19
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives + custom components
- **Fonts**: Geist Sans & Geist Mono

### Blockchain
- **Chain**: Base (Ethereum L2)
- **Wallet Connection**: Wagmi v2 + Viem
- **Connectors**: Farcaster MiniApp connector, Porto
- **Token**: USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)

### Backend & Data
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context + TanStack Query
- **Authentication**: Farcaster MiniApp SDK

### Key Libraries
- `@farcaster/miniapp-sdk`: Farcaster integration
- `@coinbase/onchainkit`: Coinbase wallet integration
- `wagmi` + `viem`: Ethereum interactions
- `@supabase/supabase-js`: Database client
- `zod`: Schema validation
- `react-hook-form`: Form management

## Project Structure

```
banb/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── home/              # Main banking dashboard
│   ├── login/             # Login page
│   ├── signup/            # Registration page
│   ├── payments/          # Payment flows
│   ├── profile/           # User profile
│   ├── transactions/      # Transaction history
│   ├── cards/             # Card management (WIP)
│   └── success/           # Success screens
├── components/            # React components
│   ├── auth/             # Authentication forms
│   ├── payments/         # Payment UI components
│   ├── ui/               # Reusable UI primitives
│   ├── banking-home.tsx  # Main dashboard
│   └── landing-page.tsx  # Landing/onboarding
├── lib/                   # Business logic & utilities
│   ├── supabase.ts       # Database client & types
│   ├── user-context.tsx  # User state management
│   ├── payments.ts       # Crypto payment logic
│   ├── transactions.ts   # Transaction CRUD
│   ├── profile.ts        # Profile management
│   ├── recipients.ts     # Friend/recipient management
│   ├── currency.ts       # Currency conversion
│   └── utils.ts          # Utility functions
├── public/               # Static assets
└── docs/                 # Documentation (this folder)
```

## Database Schema

### Tables

1. **profiles**: User accounts
   - id, name, handle, wallet_address, balance, timestamps

2. **recipients**: Saved payment recipients (friends)
   - id, profile_id, name, status, profile_id_link, external_address

3. **transactions**: Payment records
   - id, sender_profile_id, recipient_id, tx_hash, chain, amount, token, status

## User Flow

1. **Onboarding**: User lands on animated landing page
2. **Authentication**: Sign up/login with Farcaster or wallet
3. **Profile Creation**: Generate unique handle, link wallet
4. **Dashboard**: View balance, recent transactions, quick actions
5. **Send Payment**: Select recipient → Enter amount → Confirm → Execute on-chain
6. **Transaction Tracking**: Monitor pending/completed transactions

## Key Concepts

### Profile System
- Each user has a unique handle (format: `{3letters}{3random}banb`)
- Profiles store fiat balance (for display) and link to wallet addresses
- Wallet addresses are normalized to lowercase

### Payment Flow
1. User selects recipient and amount
2. System creates transaction record (status: pending)
3. Smart contract call executes USDC transfer
4. Transaction hash stored (status: sent)
5. Wait for blockchain confirmation (status: success)

### Currency Display
- Balances stored in USD
- Real-time EUR conversion via exchange rate API
- Users can toggle display currency

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`: Coinbase OnchainKit API key
- `NEXT_PUBLIC_URL`: Application URL (for Farcaster config)

## Development Commands

```bash
npm run dev          # Start development server
npm run dev:https    # Start with HTTPS (for Farcaster testing)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Mobile-First Design

The app is optimized for mobile devices with:
- Max-width container (max-w-md)
- Touch-friendly buttons and spacing
- Bottom sheet modals for mobile UX
- Responsive typography and layouts
