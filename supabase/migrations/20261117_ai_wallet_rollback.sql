-- Rollback Migration: 20261117_ai_wallet_rollback.sql
-- Description: Safely drops ai wallet tables and functions if needed.

DROP FUNCTION IF EXISTS public.deduct_ai_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_ai_credits(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_or_create_ai_wallet(UUID);
DROP TABLE IF EXISTS public.ai_credit_transactions CASCADE;
DROP TABLE IF EXISTS public.ai_wallets CASCADE;

