# API Reference

## Library Functions

This document covers all functions in the `lib/` directory.

## Profile Management (`lib/profile.ts`)

### `createProfile(data: CreateProfileData): Promise<Profile>`

Creates a new user profile with auto-generated unique handle.

**Parameters:**
```typescript
interface CreateProfileData {
  name: string;
  wallet_address: string;
}
```

**Returns:** `Promise<Profile>`

**Throws:**
- "This wallet is already registered" - Wallet already exists
- "This name is already taken" - Handle collision (rare)
- "Could not generate unique handle" - Failed after 10 attempts

**Example:**
```typescript
const profile = await createProfile({
  name: "John Doe",
  wallet_address: "0x1234..."
});
// profile.handle = "joh7x2banb"
```

---

### `getProfileByWallet(wallet_address: string): Promise<Profile | null>`

Fetches profile by wallet address.

**Parameters:**
- `wallet_address`: Ethereum address (case-insensitive)

**Returns:** `Profile` or `null` if not found

**Example:**
```typescript
const profile = await getProfileByWallet("0x1234...");
if (profile) {
  console.log(profile.name);
}
```

---

### `getProfile(id: string): Promise<Profile | null>`

Fetches profile by ID.

**Parameters:**
- `id`: Profile UUID

**Returns:** `Profile` or `null` if not found

---

### `updateBalance(id: string, balance: string): Promise<Profile>`

Updates user's fiat balance.

**Parameters:**
- `id`: Profile UUID
- `balance`: New balance as string (e.g., "100.50")

**Returns:** Updated `Profile`

