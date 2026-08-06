import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const ensureUserProfile = async (authUser: User) => {
        try {
            const { data } = await supabase
                .from('user_settings')
                .select('user_id')
                .eq('user_id', authUser.id)
                .maybeSingle();

            if (!data) {
                await supabase.from('user_settings').insert({
                    user_id: authUser.id,
                    plan: 'free',
                    subscription_status: 'free',
                });
            }
        } catch (e) {
            console.warn('Error auto-creating user_settings profile:', e);
        }
    };

    const handleAuthSession = (currentSession: Session | null) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
            ensureUserProfile(currentUser);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            // 1. Handle PKCE code exchange if redirected from email confirmation link with ?code=...
            if (typeof window !== 'undefined' && window.location) {
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                if (code) {
                    try {
                        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                        if (!error && data.session) {
                            if (isMounted) handleAuthSession(data.session);
                            // Clean code from URL
                            const cleanUrl = window.location.origin + window.location.pathname;
                            window.history.replaceState({}, document.title, cleanUrl);
                            return;
                        }
                    } catch (codeErr) {
                        console.warn('Error exchanging code for session:', codeErr);
                    }
                }
            }

            // 2. Fetch existing session
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (isMounted) {
                handleAuthSession(existingSession);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (isMounted) {
                handleAuthSession(newSession);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (email: string, password: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.0machine.com';
        const redirectTo = `${origin}/auth/callback`;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo,
            },
        });
        return { data, error };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.0machine.com';
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback`,
        });
        return { error };
    };

    /** Redirects to Google OAuth — returns to app.0machine.com after login */
    const signInWithGoogle = async () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.0machine.com';
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        return { error };
    };

    // ── Derived user display info from OAuth metadata or email ──────────────
    const displayName: string =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        (user?.email ? user.email.split('@')[0] : 'User');

    const avatarUrl: string | null =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        null;

    return {
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        signInWithGoogle,
        displayName,
        avatarUrl,
    };
}
