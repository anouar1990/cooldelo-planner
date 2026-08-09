import { useState, useEffect, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { trackEvent } from '../lib/analytics';

export type PlanType = 'free' | 'starter' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export const STRIPE_PRICES = {
  STARTER_MONTHLY: process.env.EXPO_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID ?? 'price_1TAtn4GNkz6GTxuMwTn9DjU3',
  STARTER_ANNUAL: process.env.EXPO_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID ?? 'price_1U0sHpGNkz6GTxuMMsaB6NUp',
  PRO_MONTHLY: process.env.EXPO_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID ?? 'price_1U0sHtGNkz6GTxuMtY8nj81a',
  PRO_ANNUAL: process.env.EXPO_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID ?? 'price_1U0sHkGNkz6GTxuMW2LnYzpW',
};

export const STRIPE_PAYMENT_LINKS = {
  STARTER_MONTHLY: 'https://buy.stripe.com/14A3cv0Jp8aL47b1I7eUU01',
  STARTER_ANNUAL: 'https://buy.stripe.com/8x28wPcs776HavzdqPeUU03',
  PRO_MONTHLY: 'https://buy.stripe.com/8x2cN5gIndv5dHL86veUU00',
  PRO_ANNUAL: 'https://buy.stripe.com/dRm4gz9fV62DdHLcmLeUU02',
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

      const userEmail = user.email?.toLowerCase() || '';
      const isAdminOwner = userEmail.endsWith('@0machine.com') || 
                           userEmail.endsWith('@cooldelo.com') || 
                           userEmail === 'anouarkharbache@gmail.com' ||
                           userEmail === 'cooldelodxf@gmail.com';

      const rawPlan = (data?.plan as PlanType) ?? (data?.subscription_status === 'active' ? 'pro' : 'free');
      const rawStatus = data?.subscription_status ?? (isAdminOwner ? 'active' : 'free');
      const finalPlan = isAdminOwner ? 'pro' : (rawStatus === 'active' || rawStatus === 'trialing' ? (rawPlan === 'free' ? 'pro' : rawPlan) : 'free');

      setSubscription({
        plan: finalPlan,
        billingCycle: (data?.billing_cycle as BillingCycle) ?? 'monthly',
        status: isAdminOwner ? 'active' : rawStatus,
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

    if (user?.id) {
      const channel = supabase
        .channel(`user-subscription-sync-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` },
          () => {
            console.log('[REALTIME SUBSCRIPTION SYNC] user_settings updated for user:', user.id);
            fetchSubscription();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, fetchSubscription]);

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

  const openUrlSafe = (url: string) => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = url;
    } else {
      Linking.openURL(url);
    }
  };

  const createCheckoutSession = async (targetPlan: 'starter' | 'pro', cycle: BillingCycle = 'monthly') => {
    try {
      setCheckoutLoading(true);
      trackEvent('checkout_initiated', { plan: targetPlan, cycle });

      let fallbackBaseUrl = STRIPE_PAYMENT_LINKS.STARTER_MONTHLY;
      let priceId = STRIPE_PRICES.STARTER_MONTHLY;

      if (targetPlan === 'starter' && cycle === 'monthly') {
        fallbackBaseUrl = STRIPE_PAYMENT_LINKS.STARTER_MONTHLY;
        priceId = STRIPE_PRICES.STARTER_MONTHLY;
      } else if (targetPlan === 'starter' && cycle === 'annual') {
        fallbackBaseUrl = STRIPE_PAYMENT_LINKS.STARTER_ANNUAL;
        priceId = STRIPE_PRICES.STARTER_ANNUAL;
      } else if (targetPlan === 'pro' && cycle === 'monthly') {
        fallbackBaseUrl = STRIPE_PAYMENT_LINKS.PRO_MONTHLY;
        priceId = STRIPE_PRICES.PRO_MONTHLY;
      } else if (targetPlan === 'pro' && cycle === 'annual') {
        fallbackBaseUrl = STRIPE_PAYMENT_LINKS.PRO_ANNUAL;
        priceId = STRIPE_PRICES.PRO_ANNUAL;
      }

      const emailParam = user?.email ? `?prefilled_email=${encodeURIComponent(user.email)}` : '';
      const directFallbackUrl = `${fallbackBaseUrl}${emailParam}`;

      if (!user) {
        openUrlSafe(directFallbackUrl);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
          body: { priceId, userId: user.id, userEmail: user.email, plan: targetPlan, cycle },
        });

        if (!fnError && data?.url) {
          openUrlSafe(data.url);
        } else {
          openUrlSafe(directFallbackUrl);
        }
      } catch (invokeErr) {
        console.warn('Edge function invoke fallback to direct Stripe link:', invokeErr);
        openUrlSafe(directFallbackUrl);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const fallbackUrl = targetPlan === 'pro'
        ? (cycle === 'annual' ? STRIPE_PAYMENT_LINKS.PRO_ANNUAL : STRIPE_PAYMENT_LINKS.PRO_MONTHLY)
        : (cycle === 'annual' ? STRIPE_PAYMENT_LINKS.STARTER_ANNUAL : STRIPE_PAYMENT_LINKS.STARTER_MONTHLY);
      openUrlSafe(fallbackUrl);
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

  const applyPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    const validCodes = ['1MONTHFREE', 'FREE30', 'VIP30', 'MAKER30', '0MACHINE100', 'STARTER9', 'PRO19'];

    if (!validCodes.includes(cleanCode)) {
      return { success: false, message: 'Invalid promo code. Try "1MONTHFREE" or "FREE30".' };
    }

    if (!user) {
      return { success: false, message: 'Please sign in to redeem your coupon code.' };
    }

    try {
      setCheckoutLoading(true);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const targetPlan: PlanType = cleanCode === 'STARTER9' ? 'starter' : 'pro';

      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          subscription_status: 'active',
          plan: targetPlan,
          current_period_end: thirtyDaysFromNow.toISOString(),
        }, { onConflict: 'user_id' });

      if (updateError) throw updateError;

      await fetchSubscription();
      trackEvent('promo_code_applied', { code: cleanCode, plan: targetPlan });

      return {
        success: true,
        message: `🎉 Promo Code "${cleanCode}" Applied! 1 Month Free Trial (${targetPlan.toUpperCase()}) activated.`,
      };
    } catch (err: any) {
      console.error('Apply promo code error:', err);
      return { success: false, message: err.message || 'Failed to apply promo code. Please try again.' };
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
    applyPromoCode,
    refetch: fetchSubscription,
  };
}
