-- Fix RLS Policies for Privy Authentication
-- Run this in Supabase SQL Editor

-- ====================================
-- DROP OLD POLICIES
-- ====================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view their own account transactions" ON account_transactions;
DROP POLICY IF EXISTS "Users can manage their own account transactions" ON account_transactions;
DROP POLICY IF EXISTS "Users can view their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can manage their own recipients" ON recipients;
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
DROP POLICY IF EXISTS "Users can manage their own investments" ON investments;

-- ====================================
-- CREATE NEW PERMISSIVE POLICIES (DEV MODE)
-- ====================================
-- For production, implement proper authentication with Privy JWT validation

-- Profiles: Allow all operations (authenticated via Privy in app layer)
CREATE POLICY "Allow all operations on profiles"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Accounts: Allow all operations
CREATE POLICY "Allow all operations on accounts"
  ON accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Account transactions: Allow all operations
CREATE POLICY "Allow all operations on account_transactions"
  ON account_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Recipients: Allow all operations
CREATE POLICY "Allow all operations on recipients"
  ON recipients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Investments: Allow all operations
CREATE POLICY "Allow all operations on investments"
  ON investments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Investment movements: Allow all operations
CREATE POLICY "Allow all operations on investment_movements"
  ON investment_movements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- AI operations: Allow all operations
CREATE POLICY "Allow all operations on ai_operations"
  ON ai_operations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Transactions: Allow all operations
CREATE POLICY "Allow all operations on transactions"
  ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- NOTE FOR PRODUCTION
-- ====================================
-- These permissive policies should be replaced with proper JWT validation
-- using Privy's authentication tokens. For now, security is handled at
-- the application layer in API routes using service role key.
