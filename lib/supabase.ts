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
}
