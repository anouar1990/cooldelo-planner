import { useState, useEffect, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { trackEvent } from '../lib/analytics';

export type PlanType = 'free' | 'starter' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export const STRIPE_PRICES = {
  STARTER_MONTHLY: process.env.EXPO_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID ?? 'price_starter_monthly_9',
  STARTER_ANNUAL: process.env.EXPO_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID ?? 'price_starter_annual_59',
  PRO_MONTHLY: process.env.EXPO_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? 'price_pro_monthly_19',
  PRO_ANNUAL: process.env.EXPO_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? 'price_pro_annual_149',
};

export interface SubscriptionInfo {
  plan: PlanType;
  billingCycle: BillingCycle;
  status: 'free' | 'active' | 'past_due' | 'cancelled' | 'trialing';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan: 'free',
    billingCycle: 'monthly',
    status: 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        plan: 'free', billingCycle: 'monthly', status: 'free',
        stripeCustomerId: null, stripeSubscriptionId: null,
        currentPeriodEnd: null, cancelAtPeriodEnd: false,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('subscription_status, plan, billing_cycle, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const rawPlan = (data?.plan as PlanType) ?? (data?.subscription_status === 'active' ? 'pro' : 'free');
      const rawStatus = data?.subscription_status ?? 'free';

      setSubscription({
        plan: rawStatus === 'free' ? 'free' : rawPlan,
        billingCycle: (data?.billing_cycle as BillingCycle) ?? 'monthly',
        status: rawStatus,
        stripeCustomerId: data?.stripe_customer_id ?? null,
        stripeSubscriptionId: data?.stripe_subscription_id ?? null,
        currentPeriodEnd: data?.current_period_end ?? null,
        cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
      });
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isFree = subscription.plan === 'free';
  const isStarter = subscription.plan === 'starter' || subscription.plan === 'pro';
  const isPro = subscription.plan === 'pro';

  const canAccessFeature = (feature: 'inventory' | 'design_downloads' | 'pdf_invoices' | 'nesting' | 'csv_export' | 'whatsapp' | 'analytics' | 'team'): boolean => {
    if (isPro) return true;
    if (isStarter) {
      return feature === 'inventory' || feature === 'design_downloads' || feature === 'pdf_invoices';
    }
    return false;
  };

  const createCheckoutSession = async (targetPlan: 'starter' | 'pro', cycle: BillingCycle = 'monthly') => {
    if (!user) return;
    try {
      setCheckoutLoading(true);
      trackEvent('checkout_initiated', { plan: targetPlan, cycle });

      let priceId = STRIPE_PRICES.STARTER_MONTHLY;
      if (targetPlan === 'starter' && cycle === 'annual') priceId = STRIPE_PRICES.STARTER_ANNUAL;
      if (targetPlan === 'pro' && cycle === 'monthly') priceId = STRIPE_PRICES.PRO_MONTHLY;
      if (targetPlan === 'pro' && cycle === 'annual') priceId = STRIPE_PRICES.PRO_ANNUAL;

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId, userId: user.id, userEmail: user.email, plan: targetPlan, cycle },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        Linking.openURL(data.url);
      } else {
        // Fallback checkout redirect URL
        const fallbackUrl = targetPlan === 'pro'
          ? 'https://buy.stripe.com/14A3cv0Jp8aL47b1I7eUU01'
          : 'https://buy.stripe.com/14A3cv0Jp8aL47b1I7eUU01';
        Linking.openURL(fallbackUrl);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('Checkout Failed', err.message || 'Unable to open checkout portal.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;
    try {
      setCheckoutLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke('create-portal-session', {
        body: { customerId: subscription.stripeCustomerId, userId: user.id },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        Linking.openURL(data.url);
      } else {
        Alert.alert('Billing Portal', 'Please contact support to update your billing preferences.');
      }
    } catch (err: any) {
      Alert.alert('Portal Error', err.message || 'Unable to load Stripe Customer Portal.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return {
    subscription,
    loading,
    checkoutLoading,
    isFree,
    isStarter,
    isPro,
    canAccessFeature,
    createCheckoutSession,
    openCustomerPortal,
    refetch: fetchSubscription,
  };
}
