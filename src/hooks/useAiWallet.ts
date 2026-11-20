import { useState, useEffect, useCallback } from 'react';
import { Linking, Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { trackEvent } from '../lib/analytics';

export type AiPackageId = 'pack_100' | 'pack_300' | 'pack_700';

export interface AiPackageInfo {
  id: AiPackageId;
  name: string;
  credits: number;
  price: string;
  amount: number;
  unitPrice: string;
  savings: string | null;
  badge: string | null;
  desc: string;
}

export const AI_RECHARGE_PACKAGES: AiPackageInfo[] = [
  {
    id: 'pack_100',
    name: 'Starter',
    credits: 100,
    price: '$10',
    amount: 10,
    unitPrice: '$0.10 / gen',
    savings: null,
    badge: null,
    desc: 'Great for testing & one-off custom workshop orders.',
  },
  {
    id: 'pack_300',
    name: 'Maker',
    credits: 300,
    price: '$25',
    amount: 25,
    unitPrice: '$0.083 / gen',
    savings: 'Save 20%',
    badge: 'Popular',
    desc: 'The sweet spot for active laser shops & craft fair sellers.',
  },
  {
    id: 'pack_700',
    name: 'Studio Pro',
    credits: 700,
    price: '$50',
    amount: 50,
    unitPrice: '$0.071 / gen',
    savings: 'Save 40%',
    badge: 'Best Value',
    desc: 'Maximum savings for busy commercial production studios.',
  },
];

export interface AiWalletInfo {
  balance: number;
  lifetimePurchased: number;
  lifetimeUsed: number;
  updatedAt: string | null;
}

export function useAiWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<AiWalletInfo>({
    balance: 0,
    lifetimePurchased: 0,
    lifetimeUsed: 0,
    updatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet({ balance: 0, lifetimePurchased: 0, lifetimeUsed: 0, updatedAt: null });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Read wallet via RLS
      const { data, error } = await supabase
        .from('ai_wallets')
        .select('balance, lifetime_purchased, lifetime_used, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('[useAiWallet] Failed to fetch ai_wallets:', error.message);
      } else if (data) {
        setWallet({
          balance: data.balance ?? 0,
          lifetimePurchased: data.lifetime_purchased ?? 0,
          lifetimeUsed: data.lifetime_used ?? 0,
          updatedAt: data.updated_at,
        });
      } else {
        // If row does not exist yet, balance is 0
        setWallet({ balance: 0, lifetimePurchased: 0, lifetimeUsed: 0, updatedAt: null });
      }
    } catch (err) {
      console.error('[useAiWallet] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();

    // Subscribe to realtime changes on user's wallet
    if (!user) return;

    const channel = supabase
      .channel(`ai_wallet_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setWallet({
              balance: payload.new.balance ?? 0,
              lifetimePurchased: payload.new.lifetime_purchased ?? 0,
              lifetimeUsed: payload.new.lifetime_used ?? 0,
              updatedAt: payload.new.updated_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWallet]);

  const startRecharge = async (packageId: AiPackageId = 'pack_300') => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in or create an account to recharge your AI credits.');
      return;
    }

    try {
      setRechargeLoading(true);
      trackEvent('ai_wallet_recharge_click', { packageId, userId: user.id });

      const apiUrl = Platform.OS === 'web' && typeof window !== 'undefined'
        ? '/api/checkout-session'
        : 'https://0machine.com/api/checkout-session';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai_recharge',
          mode: 'payment',
          packageId,
          userId: user.id,
          userEmail: user.email,
          redirectOrigin: Platform.OS === 'web' && typeof window !== 'undefined'
            ? window.location.origin
            : 'https://planner.0machine.ai',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to initialize AI recharge session.');
      }

      if (Platform.OS === 'web') {
        window.location.href = data.url;
      } else {
        await Linking.openURL(data.url);
      }
    } catch (err: any) {
      console.error('[useAiWallet] Recharge error:', err);
      Alert.alert('Checkout Error', err.message || 'Unable to open Stripe checkout. Please try again.');
    } finally {
      setRechargeLoading(false);
    }
  };

  return {
    wallet,
    balance: wallet.balance,
    loading,
    rechargeLoading,
    refreshWallet: fetchWallet,
    startRecharge,
    packages: AI_RECHARGE_PACKAGES,
  };
}

