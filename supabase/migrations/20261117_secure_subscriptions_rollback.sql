-- Rollback Migration: 20261117_secure_subscriptions_rollback.sql
-- Description: Revert RLS trigger and idempotency table created by 20261117_secure_subscriptions.sql

DROP TRIGGER IF EXISTS trg_protect_user_billing_fields ON public.user_settings;
DROP FUNCTION IF EXISTS public.protect_user_billing_fields();

DROP TRIGGER IF EXISTS trg_protect_user_billing_insert ON public.user_settings;
DROP FUNCTION IF EXISTS public.protect_user_billing_insert();

DROP TABLE IF EXISTS public.stripe_webhook_events;

