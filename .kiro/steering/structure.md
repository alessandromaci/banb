# Project Structure

## Directory Organization

```
/app                    # Next.js App Router pages and layouts
  /api                  # API routes
  /[feature]            # Feature-based route folders (home, login, payments, etc.)
  layout.tsx            # Root layout with metadata and providers
  page.tsx              # Root page component
  providers.tsx         # Client-side providers (Wagmi, React Query, User Context)
  config.ts             # Wagmi configuration

/components             # React components
  /auth                 # Authentication components
  /deposit-withdraw     # Deposit/withdraw flows
  /payments             # Payment-related components
  /ui                   # shadcn/ui components (Radix-based)
  [feature].tsx         # Feature components (analytics, cards, banking-home, etc.)

/lib                    # Shared utilities and business logic
  /abi                  # Smart contract ABIs
  supabase.ts           # Supabase client and database types
  user-context.tsx      # User state management
  [feature].ts          # Feature-specific utilities (payments, transactions, etc.)
  utils.ts              # General utilities (cn helper, etc.)

/hooks                  # Custom React hooks
  use-mobile.ts         # Mobile detection
  use-toast.ts          # Toast notifications

/public                 # Static assets (images, icons)
```

## Conventions

### File Naming
- **Components**: kebab-case for files (`banking-home.tsx`), PascalCase for exports
- **Utilities**: kebab-case (`user-context.tsx`)
- **Routes**: kebab-case folder names matching URL structure

### Component Patterns
- Use `"use client"` directive for client components with hooks/interactivity
- Server components by default (no directive needed)
- Co-locate feature-specific components in `/app/[feature]` or `/components/[feature]`

### Import Aliases
- `@/components` - Components directory
- `@/lib` - Library utilities
- `@/hooks` - Custom hooks
- `@/` - Project root

### Styling
- Tailwind utility classes for styling
- CSS variables for theme colors (defined in `globals.css`)
- Use `cn()` utility from `@/lib/utils` for conditional classes

### Data Layer
- Supabase for persistence (profiles, recipients, transactions)
- Type definitions co-located in `lib/supabase.ts`
- React Query for server state caching
- Wagmi/viem for blockchain interactions

## Git Workflow

### Branch Naming
- Feature branches: `feature/[feature-name]` (e.g., `feature/payment-flow`)
- Bug fixes: `fix/[issue-description]` (e.g., `fix/wallet-connection`)
- Chores: `chore/[task-description]` (e.g., `chore/update-dependencies`)

### Development Process
1. **Start new work**: Create a feature branch from main
2. **During development**: Make focused commits with clear messages
3. **When complete**: Push branch and create PR for review
4. **Commit messages**: Use conventional format:
   - `feat: add payment recipient selection`
   - `fix: resolve wallet connection timeout`
   - `chore: setup steering rules for AI assistance`
   - `docs: update API documentation`

### Best Practices
- Always work on a branch, never commit directly to main
- Keep commits atomic and focused on a single concern
- Write descriptive commit messages that explain the "why"
- Push branches when feature/fix is complete and tested
