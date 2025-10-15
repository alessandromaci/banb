import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  name: string;
  handle: string;
  wallet_address: string;
  status?: "active" | "inactive"; // Optional for now
  created_at: string;
  updated_at: string;
}

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

export interface BankDetails {
  iban: string;
  country: string;
  currency: string;
  routing_number?: string; // Optional for US banks
  account_number?: string; // Optional for US banks
  bank_name?: string; // Optional bank name
}

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

export interface Investment {
  id: string;
  profile_id: string;
  investment_name: string;
  investment_type: "morpho_vault" | "savings_account";
  vault_address?: string;
  amount_invested: string; // numeric(20,8) in DB, returned as string
  current_rewards: string; // numeric(20,8) in DB, returned as string
  apr: number; // decimal(5,2) in DB
  status: "pending" | "active" | "completed" | "failed";
  created_at: string;
  updated_at?: string;
}

export interface InvestmentMovement {
  id: string;
  profile_id: string;
  investment_id: string;
  movement_type: "deposit" | "withdrawal" | "reward" | "fee";
  amount: string; // numeric(20,8) in DB, returned as string
  token: string;
  tx_hash?: string;
  chain: string;
  status: "pending" | "confirmed" | "failed";
  metadata?: Record<string, unknown>; // JSONB field for additional data
  created_at: string;
  updated_at?: string;
}
