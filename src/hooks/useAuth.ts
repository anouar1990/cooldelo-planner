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
            // Fetch existing session
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (isMounted) {
                if (existingSession) {
                    handleAuthSession(existingSession);
                } else {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (isMounted) {
                if (event === 'SIGNED_OUT' || !newSession) {
                    setSession(null);
                    setUser(null);
                    setLoading(false);
                } else if (newSession) {
                    handleAuthSession(newSession);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return { data, error };
        }

        if (data?.session) {
            handleAuthSession(data.session);
            return { data, error: null };
        }

        // If session is null (e.g. email confirm still enabled on Supabase), immediately sign in with password to establish session!
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError && signInData?.session) {
            handleAuthSession(signInData.session);
            return { data: signInData, error: null };
        }

        return { data, error: signInError || error };
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.session) {
            handleAuthSession(data.session);
        }
        return { error };
    };

    const signOut = async () => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                try {
                    localStorage.clear();
                } catch (e) {}
            }
            await supabase.auth.signOut();
        } catch (err) {
            console.warn('Error during sign out:', err);
        } finally {
            setSession(null);
            setUser(null);
        }
    };

    const resetPassword = async (email: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.0machine.com';
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback`,
        });
        return { error };
    };

    /** Redirects to Google OAuth */
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

    const refreshSession = async () => {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession) {
            handleAuthSession(refreshedSession);
            return refreshedSession;
        }
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && session) {
            const updatedSession = { ...session, user: currentUser };
            handleAuthSession(updatedSession);
            return updatedSession;
        }
        return null;
    };

    // ── All authenticated users are verified ──────────────
    const isEmailVerified: boolean = !!user;

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
        isEmailVerified,
        signUp,
        signIn,
        signOut,
        resetPassword,
        signInWithGoogle,
        refreshSession,
        displayName,
        avatarUrl,
    };
}

