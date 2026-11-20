-- Migration: 20261117_secure_subscriptions.sql
-- Description: Secure public.user_settings against client self-elevation, implement idempotency table for Stripe events, and protect billing entitlement fields.

-- 1. Create table for Stripe webhook event idempotency
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'processed',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON public.stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_date ON public.stripe_webhook_events(processed_at);

-- Enable RLS on idempotency table (strictly backend / service_role access only)
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to stripe_webhook_events" ON public.stripe_webhook_events;
CREATE POLICY "No client access to stripe_webhook_events"
ON public.stripe_webhook_events
FOR ALL
TO authenticated, anon
USING (false);

-- 2. Create Trigger Function to block authenticated clients from altering billing fields
CREATE OR REPLACE FUNCTION public.protect_user_billing_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if operation is executed by authenticated end-user client
    IF auth.role() = 'authenticated' THEN
        -- If any billing/subscription field has been changed, reject immediately
        IF (NEW.plan IS DISTINCT FROM OLD.plan) OR
           (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) OR
           (NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id) OR
           (NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id) OR
           (NEW.current_period_end IS DISTINCT FROM OLD.current_period_end) OR
           (NEW.cancel_at_period_end IS DISTINCT FROM OLD.cancel_at_period_end) OR
           (NEW.subscription_price_id IS DISTINCT FROM OLD.subscription_price_id) THEN
            RAISE EXCEPTION 'Unauthorized: Subscription and billing entitlement fields can only be modified by the verified billing service.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_user_billing_fields ON public.user_settings;

CREATE TRIGGER trg_protect_user_billing_fields
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_billing_fields();

-- 3. Create Trigger Function on INSERT to prevent initial self-elevation to pro on new account creation
CREATE OR REPLACE FUNCTION public.protect_user_billing_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.role() = 'authenticated' THEN
        -- Force newly inserted user rows to start at 'free' defaults
        NEW.plan := 'free';
        NEW.subscription_status := 'free';
        NEW.stripe_subscription_id := NULL;
        NEW.stripe_customer_id := NULL;
        NEW.subscription_price_id := NULL;
        NEW.current_period_end := NULL;
        NEW.cancel_at_period_end := false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_user_billing_insert ON public.user_settings;

CREATE TRIGGER trg_protect_user_billing_insert
BEFORE INSERT ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_billing_insert();

