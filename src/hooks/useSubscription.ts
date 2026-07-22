import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '../lib/analytics';
import { Linking, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Stripe price ID for 0machine Planner Pro ($9/month)
export const STRIPE_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_ID ?? 'price_1TAtn4GNkz6GTxuMwTn9DjU3';
export const HOBBY_PRICE_ID = STRIPE_PRICE_ID;
export const PRO_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRO_PRICE_ID ?? 'price_1TuaQPGNkz6GTxuMEEjO6kny';
export const BIZ_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_BIZ_PRICE_ID ?? 'price_1TuaQVGNkz6GTxuMi59lGKB5';

// Hardcoded fallback in case env var isn't loaded by Expo
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://kfydsuuelaxaffntdjxh.supabase.co';
// Direct payment link fallback if edge function is unavailable
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/14A3cv0Jp8aL47b1I7eUU01';

export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'cancelled';

export interface SubscriptionInfo {
    status: SubscriptionStatus;
    stripeCustomerId: string | null;
    priceId: string | null;
}

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionInfo>({
        status: 'free',
        stripeCustomerId: null,
        priceId: null,
    });
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Free Forever model: core app is permanently free. Pro features require an active paid subscription ($19/mo).
    const hasActiveTrial = false;
    const daysLeftInTrial = 0;

    // Pro access applies if Stripe subscription status is 'active' or 'trialing'
    const isPro = subscription.status === 'active';

    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setSubscription({ status: 'free', stripeCustomerId: null, priceId: null });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('user_settings')
                .select('subscription_status, stripe_customer_id, subscription_price_id')
                .eq('user_id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            setSubscription({
                status: (data?.subscription_status as SubscriptionStatus) ?? 'free',
                stripeCustomerId: data?.stripe_customer_id ?? null,
                priceId: data?.subscription_price_id ?? null,
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Real-time listener: update when user_settings changes (e.g., after webhook)
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`user_settings:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_settings',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newRow = payload.new as any;
                    const status = newRow.subscription_status ?? 'free';
                    setSubscription({
                        status,
                        stripeCustomerId: newRow.stripe_customer_id ?? null,
                        priceId: newRow.subscription_price_id ?? null,
                    });

                    if (status === 'active') {
                        trackEvent('subscription_paid', { price: 19, currency: 'USD' }, `paid_${user.id}_${newRow.subscription_price_id || 'active'}`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const startCheckout = async (priceId?: string) => {
        if (!user) return;

        trackEvent('checkout_started', { priceId: priceId ?? STRIPE_PRICE_ID, price: 19, currency: 'USD' });
        setCheckoutLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Not authenticated');

            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/stripe-checkout`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        price_id: priceId ?? STRIPE_PRICE_ID,
                        success_url: 'https://app.0machine.com/dashboard?subscription=success',
                        cancel_url: 'https://app.0machine.com/dashboard?subscription=cancelled',
                    }),
                }
            );

            if (!response.ok) {
                // Edge function failed — fall back to direct payment link
                console.warn('Checkout edge function failed, using direct payment link');
                await Linking.openURL(STRIPE_PAYMENT_LINK);
                return;
            }

            const result = await response.json();

            if (result.error) throw new Error(result.error);
            if (result.url) {
                await Linking.openURL(result.url);
            } else {
                // No URL returned — fall back to direct payment link
                await Linking.openURL(STRIPE_PAYMENT_LINK);
            }
        } catch (err: any) {
            const msg = err.message ?? 'Something went wrong. Please try again.';
            setError(msg);
            // Alert is imported at the top — no dynamic require needed
            Alert.alert(
                'Checkout Failed',
                msg + '\n\nTrying direct payment link...',
                [{ text: 'Open Payment Page', onPress: () => Linking.openURL(STRIPE_PAYMENT_LINK) }, { text: 'Cancel', style: 'cancel' }]
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    return {
        subscription,
        isPro,
        hasActiveTrial,
        daysLeftInTrial,
        loading,
        checkoutLoading,
        error,
        refetch: fetchSubscription,
        startCheckout,
    };
}
