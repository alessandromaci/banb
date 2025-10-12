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
  balance: string; // numeric(20,2) in DB, returned as string
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  name: string;
  status: "active" | "inactive";
  profile_id: string | null; // Link to profiles if recipient is an app user (friend)
  external_address: string | null; // External wallet if not an app user
  wallets: {
    address: string;
    network: string;
  }[];
  created_at: string;
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
