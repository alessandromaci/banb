# Tech Stack

## Framework & Runtime

- **Next.js 15.5.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety

## Key Libraries

### Blockchain & Web3
- **wagmi 2.17.5** - React hooks for Ethereum
- **viem 2.38.0** - TypeScript interface for Ethereum
- **@coinbase/onchainkit 1.1.0** - Coinbase blockchain toolkit
- **@farcaster/miniapp-sdk** - Farcaster miniapp integration

### Backend & Data
- **@supabase/supabase-js** - Database and authentication
- **@tanstack/react-query** - Server state management

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** (New York style) - Component library built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
- **lucide-react** - Icon library
- **next-themes** - Theme management
- **Geist** - Font family (Sans & Mono)

### Forms & Validation
- **react-hook-form** - Form state management
- **zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

## Common Commands

```bash
# Development
npm run dev              # Start dev server (http)
npm run dev:https        # Start dev server with HTTPS

# Build & Deploy
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
```

## Configuration

- **Path aliases**: `@/*` maps to project root
- **CSS Variables**: Theme colors defined in `globals.css` and referenced in Tailwind config
- **Webpack**: Custom config excludes React Native dependencies and pino-pretty
- **TypeScript**: Strict mode enabled, target ES2017
