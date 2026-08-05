-- 20260805_stripe_subscriptions.sql
-- Migration: Ensure user_settings table contains all required Stripe & Supabase subscription columns

CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan VARCHAR(50) DEFAULT 'free',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    subscription_status VARCHAR(50) DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add missing columns if table already exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'plan') THEN
        ALTER TABLE public.user_settings ADD COLUMN plan VARCHAR(50) DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.user_settings ADD COLUMN stripe_customer_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.user_settings ADD COLUMN stripe_subscription_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.user_settings ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'current_period_end') THEN
        ALTER TABLE public.user_settings ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'cancel_at_period_end') THEN
        ALTER TABLE public.user_settings ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

-- Create policies for user read & update
CREATE POLICY "Users can read own settings" 
ON public.user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON public.user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Indexes for fast Stripe Customer & Subscription Lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_cust ON public.user_settings(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_sub ON public.user_settings(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
