# Components Guide

## Component Organization

Components are organized into three main categories:

1. **Page Components** (`app/*/page.tsx`): Route-level components
2. **Feature Components** (`components/`): Reusable feature modules
3. **UI Components** (`components/ui/`): Base UI primitives

## Page Components

### LandingPage (`components/landing-page.tsx`)

**Purpose:** First screen users see with animated onboarding carousel

**Features:**
- 4 animated slides with different backgrounds
- Auto-advance every 5 seconds
- Manual navigation with arrows
- Sign up / Login CTAs

**Key Props:** None (standalone page)

**State:**
- `currentSlide`: Active slide index (0-3)

**Animations:**
- Lightspeed: Grid perspective zoom effect
- Particles: Floating radial gradients
- Waves: Diagonal repeating lines
- Grid: Moving grid pattern

**Usage:**
```tsx
import { LandingPage } from "@/components/landing-page";

export default function Page() {
  return <LandingPage />;
}
```

---

### BankingHome (`components/banking-home.tsx`)

**Purpose:** Main dashboard showing balance, actions, and recent transactions

**Features:**
- Profile header with avatar
- Balance display (USD/EUR toggle)
- USDC balance from blockchain
- Account switcher (Main/Investment)
- Quick actions (Add money, Withdraw, Send, More)
- AI search bar
- Recent transactions list
- More menu bottom sheet

**Key State:**
- `currency`: Display currency (USD/EUR)
- `activeAccount`: Selected account type
- `moreMenuOpen`: Bottom sheet visibility
- `transactions`: Recent transaction list

**Hooks Used:**
- `useAccount()`: Wallet connection
- `useUSDCBalance()`: Blockchain balance
- `useUser()`: Profile data
- `useExchangeRate()`: Currency conversion

**Usage:**
```tsx
// Requires authentication
// Redirects to /login if no profile
<BankingHome />
```

---

### LoginForm (`components/auth/login-form.tsx`)

**Purpose:** Authenticate existing users by connecting wallet

**Flow:**
1. User clicks "Connect Wallet"
2. Wallet connection modal opens
3. On success, fetch profile by wallet address
4. Store profile in context
5. Redirect to /home

**Key Functions:**
- `handleConnect()`: Wallet connection logic
- `getProfileByWallet()`: Database lookup

---

### SignUpForm (`components/auth/signup-form.tsx`)

**Purpose:** Register new users with name and wallet

**Flow:**
1. User enters name
2. Connects wallet
3. System generates unique handle
4. Creates profile in database
5. Stores profile in context
6. Redirects to /home

**Validation:**
- Name: Required, min 2 characters
- Wallet: Must be connected
- Handle: Auto-generated, unique

**Handle Format:** `{3letters}{3random}banb`
- Example: "John Doe" → "joh7x2banb"

---

### PaymentsPage (`app/payments/page.tsx`)

**Purpose:** Payment initiation screen with recipient selection

**Features:**
- Search bar for recipients
- Payment method options (Bank, Wallet, Phone)
- Friends list with quick select
- QR code scanner (WIP)

**Components Used:**
- `SearchBar`: Recipient search
- `PaymentOptions`: Method selector
- `FriendList`: Saved recipients

**Navigation:**
- Back to /home
- Forward to /payments/[type]

---

### TransactionsPage (`app/transactions/page.tsx`)

**Purpose:** Complete transaction history

**Features:**
- Pending transactions section
- Completed transactions grouped by date
- Transaction status indicators
- Amount formatting with token

**Data Loading:**
- Fetches all transactions for current user
- Groups by date for better UX
- Shows loading spinner during fetch

**Transaction States:**
- Pending: Yellow with spinner
- Sent: Yellow with spinner
- Success: Green checkmark
- Failed: Red X

---

## Feature Components

### SearchBar (`components/payments/SearchBar.tsx`)

**Purpose:** Search input for finding recipients

**Props:**
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}
```

**Features:**
- Debounced search input
- Clear button
- Search icon

---

### PaymentOptions (`components/payments/PaymentOptions.tsx`)

**Purpose:** Payment method selector buttons

**Options:**
1. Bank Account (disabled)
2. Wallet Address (active)
3. Phone Number (disabled)

**Navigation:**
- Wallet → `/payments/wallet`

---

### FriendList (`components/payments/FriendList.tsx`)

**Purpose:** Display saved recipients for quick payment

**Features:**
- Avatar with initials
- Name and username
- Currency indicator
- Click to select recipient

**Data Source:**
- Currently uses mock data (`lib/mockFriends.ts`)
- TODO: Integrate with `lib/recipients.ts`

---

## UI Components (Primitives)

### Button (`components/ui/button.tsx`)

**Variants:**
- `default`: Primary purple button
- `ghost`: Transparent with hover
- `outline`: Border with transparent bg
- `destructive`: Red for dangerous actions

**Sizes:**
- `default`: Standard height
- `sm`: Compact
- `lg`: Large
- `icon`: Square for icons

**Usage:**
```tsx
<Button variant="default" size="lg">
  Click Me
</Button>
```

---

### Card (`components/ui/card.tsx`)

**Purpose:** Container with rounded corners and border

**Sub-components:**
- `Card`: Main container
- `CardHeader`: Top section
- `CardTitle`: Title text
- `CardDescription`: Subtitle text
- `CardContent`: Main content area
- `CardFooter`: Bottom section

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

---

### Input (`components/ui/input.tsx`)

**Purpose:** Text input field

**Features:**
- Styled with Tailwind
- Focus states
- Error states
- Disabled states

**Usage:**
```tsx
<Input
  type="text"
  placeholder="Enter name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

### Avatar (`components/ui/avatar.tsx`)

**Purpose:** User profile image or fallback

**Sub-components:**
- `Avatar`: Container
- `AvatarImage`: Image element
- `AvatarFallback`: Fallback content (initials)

**Usage:**
```tsx
<Avatar>
  <AvatarImage src="/avatar.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### BottomSheet (`components/ui/bottom-sheet.tsx`)

**Purpose:** Mobile-friendly modal that slides up from bottom

**Props:**
```typescript
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

**Features:**
- Backdrop overlay
- Slide-up animation
- Drag to close (optional)
- Close button

**Usage:**
```tsx
<BottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Options"
>
  <div>Content here</div>
</BottomSheet>
```

---

## Component Patterns

### 1. Server vs Client Components

**Server Components** (default in Next.js 15):
- No `"use client"` directive
- Can fetch data directly
- Cannot use hooks or browser APIs
- Examples: Layout, static pages

**Client Components** (with `"use client"`):
- Required for interactivity
- Can use React hooks
- Can access browser APIs
- Examples: Forms, dashboards, interactive UI

### 2. Data Fetching Pattern

```tsx
"use client";

export function MyComponent() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchFromAPI();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <Error message={error} />;
  return <DataDisplay data={data} />;
}
```

### 3. Form Handling Pattern

```tsx
"use client";

export function MyForm() {
  const [formData, setFormData] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitData(formData);
      router.push("/success");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

### 4. Blockchain Interaction Pattern

```tsx
"use client";

export function BlockchainComponent() {
  const { address } = useAccount();
  const { executePayment, isLoading } = useCryptoPayment();

  const handlePayment = async () => {
    try {
      const result = await executePayment({
        recipientId: "...",
        amount: "10.00",
        token: "USDC",
        chain: "base",
        to: "0x...",
        sender_profile_id: profile.id,
      });
      console.log("Payment successful:", result.hash);
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={isLoading || !address}>
      {isLoading ? "Processing..." : "Send Payment"}
    </Button>
  );
}
```

## Styling Guidelines

### Tailwind Classes

**Colors:**
- Primary: `bg-[#5B4FE8]` (purple)
- Background: `bg-[#1E1B3D]` (dark purple)
- Text: `text-white`, `text-white/60` (with opacity)
- Success: `text-green-400`
- Warning: `text-yellow-400`
- Error: `text-red-400`

**Spacing:**
- Container padding: `px-6 py-4`
- Card padding: `p-4`
- Gap between elements: `gap-3`, `gap-4`

**Borders:**
- Radius: `rounded-xl`, `rounded-2xl`, `rounded-3xl`
- Border: `border-white/10`, `border-white/20`

**Typography:**
- Headings: `text-3xl font-bold`
- Body: `text-base`
- Small: `text-sm`, `text-xs`

### Responsive Design

All components use mobile-first design:
```tsx
<div className="mx-auto max-w-md">
  {/* Content constrained to mobile width */}
</div>
```

### Dark Mode

Currently hardcoded to dark theme. Light mode support planned via `next-themes`.

## Testing Components

### Manual Testing Checklist

For each component:
- [ ] Renders without errors
- [ ] Handles loading states
- [ ] Handles error states
- [ ] Handles empty states
- [ ] Responsive on mobile
- [ ] Accessible (keyboard navigation)
- [ ] Proper TypeScript types

### Common Issues

1. **Hydration Mismatch**: Use `useState` + `useEffect` for client-only data
2. **Missing "use client"**: Add directive for interactive components
3. **Wallet Not Connected**: Check `address` before blockchain calls
4. **Profile Not Loaded**: Check `profile` from `useUser()` before rendering
