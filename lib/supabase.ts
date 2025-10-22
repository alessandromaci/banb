/**
 * @fileoverview Supabase client configuration and database type definitions.
 * This module provides the Supabase client instance and TypeScript interfaces
 * for all database tables used in the application.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client instance for database operations.
 * Uses anonymous key for client-side operations with Row Level Security (RLS).
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase';
 * const { data, error } = await supabase.from('profiles').select('*');
 * ```
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * User profile stored in the profiles table.
 * Represents a registered user with wallet connection and unique handle.
 *
 * @interface Profile
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - User's display name
 * @property {string} handle - Unique handle in format: {first3letters}{3random}banb (e.g., "joh7x2banb")
 * @property {string} wallet_address - Ethereum wallet address (lowercase)
 * @property {"active" | "inactive"} [status] - Account status, defaults to "active"
 * @property {string} created_at - ISO timestamp of profile creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Profile {
  id: string;
  name: string;
  handle: string;
  wallet_address: string;
  status?: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

/**
 * Payment recipient stored in the recipients table.
 * Can represent either an internal app user (friend) or external wallet/bank account.
 *
 * @interface Recipient
 * @property {string} id - Unique identifier (UUID)
 * @property {string} profile_id - Owner's profile ID (who added this recipient)
 * @property {string} name - Display name for the recipient
 * @property {"active" | "inactive"} status - Recipient status
 * @property {"crypto" | "bank"} recipient_type - Type of recipient (crypto wallet or bank account)
 * @property {string | null} profile_id_link - Links to profiles table if recipient is an app user
 * @property {string | null} external_address - External wallet address if not an app user
 * @property {BankDetails | null} bank_details - Bank account information for bank recipients
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} [updated_at] - ISO timestamp of last update
 */
export interface Recipient {
  id: string;
  profile_id: string;
  name: string;
  status: "active" | "inactive";
  recipient_type: "crypto" | "bank";
  profile_id_link: string | null;
  external_address: string | null;
  bank_details: BankDetails | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Bank account details for bank recipients.
 * Supports international (IBAN) and US (routing/account number) formats.
 *
 * @interface BankDetails
 * @property {string} iban - International Bank Account Number
 * @property {string} country - ISO country code (e.g., "US", "GB", "DE")
 * @property {string} currency - Currency code (e.g., "USD", "EUR", "GBP")
 * @property {string} [routing_number] - US bank routing number (ABA)
 * @property {string} [account_number] - US bank account number
 * @property {string} [bank_name] - Name of the bank institution
 */
export interface BankDetails {
  iban: string;
  country: string;
  currency: string;
  routing_number?: string;
  account_number?: string;
  bank_name?: string;
}

/**
 * Transaction record stored in the transactions table.
 * Tracks crypto payments between users with blockchain transaction details.
 *
 * @interface Transaction
 * @property {string} id - Unique identifier (UUID)
 * @property {string} sender_profile_id - Profile ID of the sender
 * @property {string} recipient_id - References recipients table
 * @property {string | null} tx_hash - Blockchain transaction hash (null until sent)
 * @property {string} chain - Blockchain network (e.g., "base", "ethereum")
 * @property {string} amount - Transaction amount as string (numeric(20,8) in DB)
 * @property {string} token - Token symbol (e.g., "USDC", "ETH")
 * @property {"pending" | "sent" | "success" | "failed"} status - Transaction status
 * @property {string} created_at - ISO timestamp of creation
 * @property {Object} [recipient] - Populated recipient details (from join)
 * @property {string} recipient.name - Recipient's display name
 * @property {string} recipient.profile_id - Recipient's profile ID
 * @property {string | null} recipient.external_address - Recipient's external wallet address
 */
export interface Transaction {
  id: string;
  sender_profile_id: string;
  recipient_id: string;
  tx_hash: string | null;
  chain: string;
  amount: string;
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

/**
 * Account represents a connected wallet account for a user profile.
 * Users can have multiple accounts (spending, investment, savings).
 * Each account stores its own balance and transaction history.
 *
 * @interface Account
 * @property {string} id - Unique identifier (UUID)
 * @property {string} profile_id - References profiles table
 * @property {string} name - Display name (e.g., "Main Account", "Spending Account")
 * @property {"spending" | "investment" | "savings"} type - Account type
 * @property {string} address - Wallet address (lowercase)
 * @property {string} network - Blockchain network (e.g., "base", "ethereum", "polygon")
 * @property {string} balance - Current balance as string (numeric(20,8) in DB)
 * @property {boolean} is_primary - Whether this is the primary account
 * @property {"active" | "inactive"} status - Account status
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface Account {
  id: string;
  profile_id: string;
  name: string;
  type: "spending" | "investment" | "savings";
  address: string;
  network: string;
  balance: string;
  is_primary: boolean;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

/**
 * AccountTransaction represents a transaction for a specific account.
 * Tracks both incoming and outgoing transactions with counterparty details.
 *
 * @interface AccountTransaction
 * @property {string} id - Unique identifier (UUID)
 * @property {string} account_id - References accounts table
 * @property {string} amount - Transaction amount as string (numeric(20,8) in DB)
 * @property {"in" | "out"} direction - Transaction direction (incoming or outgoing)
 * @property {string | null} counterparty - Counterparty wallet address or username
 * @property {string | null} counterparty_name - Display name of counterparty
 * @property {string | null} tx_hash - Blockchain transaction hash
 * @property {string} token_symbol - Token symbol (e.g., "USDC", "ETH")
 * @property {string} network - Blockchain network
 * @property {"pending" | "confirmed" | "failed"} status - Transaction status
 * @property {string | null} description - Optional description
 * @property {Record<string, unknown> | null} metadata - Additional transaction data (JSONB)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */
export interface AccountTransaction {
  id: string;
  account_id: string;
  amount: string;
  direction: "in" | "out";
  counterparty: string | null;
  counterparty_name: string | null;
  tx_hash: string | null;
  token_symbol: string;
  network: string;
  status: "pending" | "confirmed" | "failed";
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;

 * AI operation record stored in the ai_operations table.
 * Tracks AI agent interactions and operations for audit trail.
 *
 * @interface AIOperation
 * @property {string} id - Unique identifier (UUID)
 * @property {string} profile_id - Profile ID of the user
 * @property {"payment" | "analysis" | "query"} operation_type - Type of operation
 * @property {Record<string, unknown>} operation_data - Operation-specific data (JSONB)
 * @property {string} user_message - Original user message to AI
 * @property {string} ai_response - AI's response message
 * @property {boolean} user_confirmed - Whether user confirmed the operation
 * @property {boolean} executed - Whether operation was executed
 * @property {Record<string, unknown> | null} execution_result - Result of execution (JSONB)
 * @property {string} created_at - ISO timestamp of creation
 * @property {string | null} executed_at - ISO timestamp of execution
 */
export interface AIOperation {
  id: string;
  profile_id: string;
  operation_type: "payment" | "analysis" | "query";
  operation_data: Record<string, unknown>;
  user_message: string;
  ai_response: string;
  user_confirmed: boolean;
  executed: boolean;
  execution_result: Record<string, unknown> | null;
  created_at: string;
  executed_at: string | null;

}
