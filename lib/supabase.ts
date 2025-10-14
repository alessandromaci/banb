import { createClient } from "@supabase/supabase-js";

/**
 * Supabase project URL from environment variables.
 * @constant {string}
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Supabase anonymous key for client-side authentication.
 * @constant {string}
 */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client instance for database operations.
 * Provides access to all Supabase features including database queries,
 * real-time subscriptions, authentication, and storage.
 *
 * @constant
 * @type {SupabaseClient}
 *
 * @example
 * // Query data
 * const { data, error } = await supabase.from('profiles').select('*');
 *
 * @example
 * // Insert data
 * const { data, error } = await supabase.from('profiles').insert({ name: 'John' });
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * User profile interface representing the profiles table in the database.
 * Contains user account information, wallet address, and balance.
 *
 * @interface Profile
 * @property {string} id - Unique profile identifier (UUID)
 * @property {string} name - User's display name
 * @property {string} handle - Unique handle/username (format: {prefix}{random}banb)
 * @property {string} wallet_address - Blockchain wallet address (lowercase)
 * @property {string} balance - Account balance as string (numeric(20,2) in DB)
 * @property {string} created_at - ISO timestamp of profile creation
 * @property {string} updated_at - ISO timestamp of last profile update
 */
export interface Profile {
  id: string;
  name: string;
  handle: string;
  wallet_address: string;
  status?: "active" | "inactive"; // Optional for now
  created_at: string;
  updated_at: string;
}

/**
 * Recipient interface representing the recipients table (friends list).
 * A recipient can be either an internal app user or an external wallet address.
 *
 * @interface Recipient
 * @property {string} id - Unique recipient identifier (UUID)
 * @property {string} profile_id - ID of the profile that owns this recipient entry
 * @property {string} name - Display name for the recipient
 * @property {"active" | "inactive"} status - Recipient status
 * @property {string | null} profile_id_link - Link to profiles table if recipient is an app user
 * @property {string | null} external_address - External wallet address if not an app user
 * @property {string} created_at - ISO timestamp of recipient creation
 * @property {string} [updated_at] - ISO timestamp of last recipient update
 */
export interface Recipient {
  id: string;
  profile_id: string; // Owner of this recipient entry
  name: string;
  status: "active" | "inactive";
  recipient_type: "crypto" | "bank"; // NEW: Distinguish crypto vs bank recipients
  profile_id_link: string | null; // Link to profiles if recipient is an app user (friend)
  external_address: string | null; // External wallet if not an app user
  bank_details: BankDetails | null; // NEW: Bank account details (IBAN, routing, etc.)
  created_at: string;
  updated_at?: string;
}

/**
 * Transaction interface representing the transactions table.
 * Tracks all payment transactions between users or to external addresses.
 *
 * @interface Transaction
 * @property {string} id - Unique transaction identifier (UUID)
 * @property {string} sender_profile_id - Profile ID of the transaction sender
 * @property {string} recipient_id - References recipients table
 * @property {string | null} tx_hash - Blockchain transaction hash (null if pending)
 * @property {string} chain - Blockchain network name (e.g., "base")
 * @property {string} amount - Transaction amount as string (numeric(20,8) in DB)
 * @property {string} token - Token symbol (e.g., "USDC", "ETH")
 * @property {"pending" | "sent" | "success" | "failed"} status - Transaction status
 * @property {string} created_at - ISO timestamp of transaction creation
 */

export interface Transaction {
  id: string;
  sender_profile_id: string; // NEW: Who sent this transaction
  recipient_id: string; // References recipients table
  tx_hash: string | null;
  chain: string;
  amount: string; // numeric(20,8) in DB, returned as string
  token: string;
  status: "pending" | "sent" | "success" | "failed";
  created_at: string;
  recipient?: {
    name: string;
    profile_id: string;
    external_address: string | null;
  };
}

export interface BankDetails {
  iban: string;
  country: string;
  currency: string;
  routing_number?: string; // Optional for US banks
  account_number?: string; // Optional for US banks
  bank_name?: string; // Optional bank name
}
