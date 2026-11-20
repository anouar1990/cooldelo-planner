-- Migration: 20261117_ai_wallet.sql
-- Description: Implement shared AI recharge wallet, credit transactions ledger, and atomic deduction/addition procedures.

-- 1. Create ai_wallets table
CREATE TABLE IF NOT EXISTS public.ai_wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_purchased INTEGER NOT NULL DEFAULT 0,
    lifetime_used INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_wallets_user_id ON public.ai_wallets(user_id);

-- Enable RLS
ALTER TABLE public.ai_wallets ENABLE ROW LEVEL SECURITY;

-- Clients can only read their own wallet
DROP POLICY IF EXISTS "Users can view own ai_wallet" ON public.ai_wallets;
CREATE POLICY "Users can view own ai_wallet"
ON public.ai_wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Deny client modifications directly
DROP POLICY IF EXISTS "No client direct insert to ai_wallets" ON public.ai_wallets;
CREATE POLICY "No client direct insert to ai_wallets"
ON public.ai_wallets
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

DROP POLICY IF EXISTS "No client direct update to ai_wallets" ON public.ai_wallets;
CREATE POLICY "No client direct update to ai_wallets"
ON public.ai_wallets
FOR UPDATE
TO authenticated, anon
USING (false);

-- 2. Create ai_credit_transactions table
CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'recharge', 'generation_usage', 'refund', 'bonus'
    description TEXT,
    reference_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_tx_user ON public.ai_credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credit_tx_ref ON public.ai_credit_transactions(reference_id);

-- Enable RLS
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai_credit_transactions" ON public.ai_credit_transactions;
CREATE POLICY "Users can view own ai_credit_transactions"
ON public.ai_credit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "No client direct insert to ai_credit_transactions" ON public.ai_credit_transactions;
CREATE POLICY "No client direct insert to ai_credit_transactions"
ON public.ai_credit_transactions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- 3. Stored Procedure: get_or_create_ai_wallet
CREATE OR REPLACE FUNCTION public.get_or_create_ai_wallet(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
BEGIN
    SELECT * INTO v_wallet FROM public.ai_wallets WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        INSERT INTO public.ai_wallets (user_id, balance, lifetime_purchased, lifetime_used, updated_at)
        VALUES (p_user_id, 0, 0, 0, NOW())
        ON CONFLICT (user_id) DO NOTHING;
        
        SELECT * INTO v_wallet FROM public.ai_wallets WHERE user_id = p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'user_id', v_wallet.user_id,
        'balance', v_wallet.balance,
        'lifetime_purchased', v_wallet.lifetime_purchased,
        'lifetime_used', v_wallet.lifetime_used,
        'updated_at', v_wallet.updated_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Stored Procedure: add_ai_credits (atomic recharge)
CREATE OR REPLACE FUNCTION public.add_ai_credits(
    p_user_id UUID,
    p_credits INTEGER,
    p_reference_id TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    IF p_credits <= 0 THEN
        RAISE EXCEPTION 'Credits to add must be positive.';
    END IF;

    INSERT INTO public.ai_wallets (user_id, balance, lifetime_purchased, lifetime_used, updated_at)
    VALUES (p_user_id, p_credits, p_credits, 0, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        balance = public.ai_wallets.balance + p_credits,
        lifetime_purchased = public.ai_wallets.lifetime_purchased + p_credits,
        updated_at = NOW()
    RETURNING balance INTO v_new_balance;

    INSERT INTO public.ai_credit_transactions (
        user_id,
        amount,
        balance_after,
        type,
        description,
        reference_id
    ) VALUES (
        p_user_id,
        p_credits,
        v_new_balance,
        'recharge',
        COALESCE(p_description, 'AI Credit Recharge'),
        p_reference_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'added', p_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Stored Procedure: deduct_ai_credits (atomic deduction with race-condition lock)
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
    p_user_id UUID,
    p_credits INTEGER,
    p_reference_id TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    IF p_credits <= 0 THEN
        RAISE EXCEPTION 'Credits to deduct must be positive.';
    END IF;

    -- Ensure wallet exists
    PERFORM public.get_or_create_ai_wallet(p_user_id);

    -- Row-level lock to prevent concurrent overdraft
    SELECT balance INTO v_current_balance
    FROM public.ai_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_current_balance < p_credits THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient AI credits',
            'code', 'INSUFFICIENT_CREDITS',
            'balance', v_current_balance,
            'required', p_credits
        );
    END IF;

    v_new_balance := v_current_balance - p_credits;

    UPDATE public.ai_wallets
    SET
        balance = v_new_balance,
        lifetime_used = lifetime_used + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.ai_credit_transactions (
        user_id,
        amount,
        balance_after,
        type,
        description,
        reference_id
    ) VALUES (
        p_user_id,
        -p_credits,
        v_new_balance,
        'generation_usage',
        COALESCE(p_description, 'AI Generation'),
        p_reference_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance', v_new_balance,
        'deducted', p_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

