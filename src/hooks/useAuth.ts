import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const UNVERIFIED_STORAGE_KEY = '0machine_unverified_session';

const saveUnverifiedSession = async (sess: Session | null) => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            if (sess) localStorage.setItem(UNVERIFIED_STORAGE_KEY, JSON.stringify(sess));
            else localStorage.removeItem(UNVERIFIED_STORAGE_KEY);
        }
        if (sess) await AsyncStorage.setItem(UNVERIFIED_STORAGE_KEY, JSON.stringify(sess));
        else await AsyncStorage.removeItem(UNVERIFIED_STORAGE_KEY);
    } catch (e) {}
};

const getSavedUnverifiedSession = async (): Promise<Session | null> => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = localStorage.getItem(UNVERIFIED_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        }
        const raw = await AsyncStorage.getItem(UNVERIFIED_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
};

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
                            await saveUnverifiedSession(null);
                            if (isMounted) handleAuthSession(data.session);
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
            if (existingSession) {
                if (isMounted) handleAuthSession(existingSession);
            } else {
                // Check if there is a saved unverified session
                const savedUnverified = await getSavedUnverifiedSession();
                if (savedUnverified && isMounted) {
                    handleAuthSession(savedUnverified);
                } else if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (isMounted && newSession) {
                saveUnverifiedSession(null);
                handleAuthSession(newSession);
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

        if (!error && data?.user) {
            let activeSession = data.session;
            if (!activeSession) {
                activeSession = {
                    access_token: 'unverified_token',
                    token_type: 'bearer',
                    expires_in: 3600 * 24 * 30,
                    refresh_token: '',
                    user: data.user,
                } as Session;
                await saveUnverifiedSession(activeSession);
            } else {
                await saveUnverifiedSession(null);
            }
            handleAuthSession(activeSession);
        }

        return { data, error };
    };

    const verifyOtp = async (email: string, token: string) => {
        // First try type: 'signup'
        let { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        // Fallback to type: 'email' if signup type returns error
        if (error) {
            const fallback = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email',
            });
            if (!fallback.error) {
                data = fallback.data;
                error = null;
            }
        }

        if (data?.session) {
            await saveUnverifiedSession(null);
            handleAuthSession(data.session);
        }
        return { data, error };
    };

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.session) {
            await saveUnverifiedSession(null);
            handleAuthSession(data.session);
        } else if (error && error.message?.toLowerCase().includes('email not confirmed')) {
            // Unverified user attempting login -> check user or re-trigger signUp to get user obj
            const { data: signUpData } = await supabase.auth.signUp({ email, password });
            if (signUpData?.user) {
                const unverifiedSession = {
                    access_token: 'unverified_token',
                    token_type: 'bearer',
                    expires_in: 3600 * 24 * 30,
                    refresh_token: '',
                    user: signUpData.user,
                } as Session;
                await saveUnverifiedSession(unverifiedSession);
                handleAuthSession(unverifiedSession);
                return { error: null };
            }
        }
        return { error };
    };

    const signOut = async () => {
        await saveUnverifiedSession(null);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    const resetPassword = async (email: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.0machine.com';
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback`,
        });
        return { error };
    };

    /** Redirects to Google OAuth — returns to app.0machine.com/auth/callback after login */
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

    const resendVerificationEmail = async (targetEmail?: string) => {
        const emailToSend = targetEmail || user?.email;
        if (!emailToSend) return { error: new Error('No email available to send verification code.') };
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: emailToSend,
        });
        return { error };
    };

    const refreshSession = async () => {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession) {
            await saveUnverifiedSession(null);
            handleAuthSession(refreshedSession);
            return refreshedSession;
        }
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && session) {
            const updatedSession = { ...session, user: currentUser };
            if (currentUser.email_confirmed_at) {
                await saveUnverifiedSession(null);
            }
            handleAuthSession(updatedSession);
            return updatedSession;
        }
        return null;
    };

    // ── Derived user display info from OAuth metadata or email ──────────────
    const isEmailVerified: boolean = !!(user?.email_confirmed_at || (user as any)?.confirmed_at || user?.user_metadata?.email_verified);

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
        verifyOtp,
        signIn,
        signOut,
        resetPassword,
        signInWithGoogle,
        resendVerificationEmail,
        refreshSession,
        displayName,
        avatarUrl,
    };
}

