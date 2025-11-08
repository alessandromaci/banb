-- BANB Database Schema - Initial Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 1. PROFILES TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(50) UNIQUE NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ====================================
-- 2. ACCOUNTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'spending', 'investment', 'savings'
  address VARCHAR(255) NOT NULL,
  network VARCHAR(50) NOT NULL DEFAULT 'base', -- 'base', 'ethereum', 'solana', 'polygon'
  balance NUMERIC(20, 8) DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_profile_id ON accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_accounts_address ON accounts(address);
CREATE INDEX IF NOT EXISTS idx_accounts_network ON accounts(network);
CREATE INDEX IF NOT EXISTS idx_accounts_is_primary ON accounts(is_primary);

-- ====================================
-- 3. ACCOUNT_TRANSACTIONS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS account_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount NUMERIC(20, 8) NOT NULL,
  direction VARCHAR(10) NOT NULL, -- 'in', 'out'
  counterparty VARCHAR(255),
  counterparty_name VARCHAR(255),
  tx_hash VARCHAR(255),
  token_symbol VARCHAR(10) NOT NULL,
  network VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'confirmed', 'failed'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for account_transactions
CREATE INDEX IF NOT EXISTS idx_account_transactions_account_id ON account_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_status ON account_transactions(status);
CREATE INDEX IF NOT EXISTS idx_account_transactions_created_at ON account_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_transactions_tx_hash ON account_transactions(tx_hash);

-- ====================================
-- 4. RECIPIENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  recipient_type VARCHAR(20) NOT NULL, -- 'crypto', 'bank'
  profile_id_link UUID REFERENCES profiles(id),
  external_address VARCHAR(255),
  bank_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for recipients
CREATE INDEX IF NOT EXISTS idx_recipients_profile_id ON recipients(profile_id);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON recipients(status);

-- ====================================
-- 5. INVESTMENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  investment_name VARCHAR(255) NOT NULL,
  investment_type VARCHAR(50) NOT NULL, -- 'morpho_vault', 'savings_account'
  vault_address VARCHAR(255),
  amount_invested NUMERIC(20, 8) DEFAULT 0,
  current_rewards NUMERIC(20, 8) DEFAULT 0,
  apr NUMERIC(5, 2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for investments
CREATE INDEX IF NOT EXISTS idx_investments_profile_id ON investments(profile_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

-- ====================================
-- 6. INVESTMENT_MOVEMENTS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS investment_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL, -- 'deposit', 'withdrawal', 'reward', 'fee'
  amount NUMERIC(20, 8) NOT NULL,
  token VARCHAR(10) NOT NULL,
  tx_hash VARCHAR(255),
  chain VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for investment_movements
CREATE INDEX IF NOT EXISTS idx_investment_movements_investment_id ON investment_movements(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_movements_profile_id ON investment_movements(profile_id);

-- ====================================
-- 7. AI_OPERATIONS TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS ai_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'payment', 'analysis', 'query'
  operation_data JSONB NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  user_confirmed BOOLEAN DEFAULT FALSE,
  executed BOOLEAN DEFAULT FALSE,
  execution_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Indexes for ai_operations
CREATE INDEX IF NOT EXISTS idx_ai_operations_profile_id ON ai_operations(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_operations_created_at ON ai_operations(created_at DESC);

-- ====================================
-- 8. LEGACY TRANSACTIONS TABLE (for backward compatibility)
-- ====================================
-- This table exists in current codebase, keeping for compatibility
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id),
  tx_hash VARCHAR(255),
  chain VARCHAR(50) NOT NULL,
  amount NUMERIC(20, 8) NOT NULL,
  token VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'success', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_sender_profile_id ON transactions(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recipient_id ON transactions(recipient_id);

-- ====================================
-- ENABLE ROW LEVEL SECURITY
-- ====================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ====================================
-- RLS POLICIES (Basic - can be refined)
-- ====================================

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Accounts: Users can manage their own accounts
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can manage their own accounts"
  ON accounts FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text));

-- Account transactions: Users can view their own transactions
CREATE POLICY "Users can view their own account transactions"
  ON account_transactions FOR SELECT
  USING (account_id IN (SELECT id FROM accounts WHERE profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text)));

CREATE POLICY "Users can manage their own account transactions"
  ON account_transactions FOR ALL
  USING (account_id IN (SELECT id FROM accounts WHERE profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text)));

-- Recipients: Users can manage their own recipients
CREATE POLICY "Users can view their own recipients"
  ON recipients FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can manage their own recipients"
  ON recipients FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text));

-- Investments: Users can manage their own investments
CREATE POLICY "Users can view their own investments"
  ON investments FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text));

CREATE POLICY "Users can manage their own investments"
  ON investments FOR ALL
  USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid()::text = id::text));

-- Similar policies for other tables...

-- ====================================
-- UPDATED_AT TRIGGER FUNCTION
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_transactions_updated_at BEFORE UPDATE ON account_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_movements_updated_at BEFORE UPDATE ON investment_movements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- DONE!
-- ====================================
-- Schema created successfully
