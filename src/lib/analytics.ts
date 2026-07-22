import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// GA4 Measurement ID
export const GA_TRACKING_ID = process.env.EXPO_PUBLIC_GA_TRACKING_ID || 'G-8V921YKC8S';

const IS_WEB = Platform.OS === 'web';
const IS_PROD = 
    typeof process !== 'undefined' && 
    process.env && 
    process.env.NODE_ENV === 'production';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
        fbq?: (...args: any[]) => void;
        pintrk?: (...args: any[]) => void;
        ttq?: any;
        snaptr?: (...args: any[]) => void;
    }
}

let cachedSessionId: string | null = null;
const firedEventsCache = new Set<string>();

/**
 * Capture and store UTM parameters from URL query params in browser storage.
 */
export function captureUTMs() {
    if (!IS_WEB || typeof window === 'undefined') return;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const utms: Record<string, string> = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
            const val = urlParams.get(key);
            if (val) utms[key] = val;
        });

        if (Object.keys(utms).length > 0) {
            localStorage.setItem('0machine_utm', JSON.stringify(utms));
        }
    } catch (e) {
        // Ignore storage errors
    }
}

/**
 * Retrieve saved UTM parameters.
 */
export function getSavedUTMs(): Record<string, string> {
    if (!IS_WEB || typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem('0machine_utm');
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

/**
 * Gets or initializes an anonymous unique session ID for tracking.
 */
async function getSessionId(): Promise<string> {
    if (cachedSessionId) return cachedSessionId;

    if (Platform.OS === 'web') {
        try {
            let sid = localStorage.getItem('0machine_session_id');
            if (!sid) {
                sid = 'sess_app_' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('0machine_session_id', sid);
            }
            cachedSessionId = sid;
            return sid;
        } catch (e) {}
    } else {
        try {
            let sid = await AsyncStorage.getItem('0machine_session_id');
            if (!sid) {
                sid = 'sess_app_' + Math.random().toString(36).substring(2, 15);
                await AsyncStorage.setItem('0machine_session_id', sid);
            }
            cachedSessionId = sid;
            return sid;
        } catch (e) {}
    }

    const fallbackSid = 'sess_fallback_' + Math.random().toString(36).substring(2, 15);
    cachedSessionId = fallbackSid;
    return fallbackSid;
}

/**
 * Track a page view manually across GA4, Meta, Pinterest, TikTok, Snapchat & Supabase.
 */
export const trackPageView = async (pageName: string, pagePath: string = '') => {
    captureUTMs();
    const path = pagePath || pageName;

    if (IS_WEB) {
        // GA4
        if (window.gtag) {
            window.gtag('event', 'page_view', { page_title: pageName, page_path: path });
        }
        // Meta
        if (window.fbq) {
            window.fbq('track', 'PageView');
        }
        // Pinterest
        if (window.pintrk) {
            window.pintrk('track', 'PageVisit');
        }
        // TikTok
        if (window.ttq && typeof window.ttq.page === 'function') {
            window.ttq.page();
        }
        // Snapchat
        if (window.snaptr) {
            window.snaptr('track', 'PAGE_VIEW');
        }
    }

    try {
        const sessionId = await getSessionId();
        const utms = getSavedUTMs();
        await supabase.from('analytics_events').insert({
            event_name: 'pageview',
            page_path: path,
            referrer: Platform.OS === 'web' ? (document.referrer || 'direct') : `app_${Platform.OS}`,
            session_id: sessionId,
            user_agent: Platform.OS === 'web' ? navigator.userAgent : `App ${Platform.OS}`,
            metadata: { title: pageName, ...utms }
        });
    } catch (err) {
        console.warn('Failed to log pageview to Supabase analytics:', err);
    }
};

/**
 * Unified event tracker mapping internal funnel events to GA4, Meta, Pinterest, TikTok & Snapchat.
 */
export const trackEvent = async (action: string, params: Record<string, any> = {}, dedupeKey?: string) => {
    if (dedupeKey) {
        if (firedEventsCache.has(dedupeKey)) return;
        firedEventsCache.add(dedupeKey);
    }

    const utms = getSavedUTMs();
    const payload = { ...utms, ...params };

    if (IS_WEB) {
        // 1. GA4 Mapping
        if (window.gtag) {
            let gaEventName = action;
            if (action === 'subscription_paid') gaEventName = 'purchase';
            window.gtag('event', gaEventName, { ...payload, send_to: GA_TRACKING_ID });
        }

        // 2. Meta Pixel Mapping
        if (window.fbq) {
            if (action === 'signup_completed') {
                window.fbq('track', 'CompleteRegistration', payload);
            } else if (action === 'pro_feature_viewed') {
                window.fbq('track', 'ViewContent', { content_name: params.feature || 'pro_feature' });
            } else if (action === 'checkout_started') {
                window.fbq('track', 'InitiateCheckout', payload);
            } else if (action === 'subscription_paid') {
                window.fbq('track', 'Purchase', { value: params.amount || 19, currency: params.currency || 'USD' });
            } else {
                window.fbq('trackCustom', action, payload);
            }
        }

        // 3. Pinterest Tag Mapping
        if (window.pintrk) {
            if (action === 'signup_completed') {
                window.pintrk('track', 'Signup', payload);
            } else if (action === 'checkout_started') {
                window.pintrk('track', 'Checkout', payload);
            } else if (action === 'subscription_paid') {
                window.pintrk('track', 'Purchase', { value: params.amount || 19, currency: params.currency || 'USD' });
            } else {
                window.pintrk('track', 'PageVisit', payload);
            }
        }

        // 4. TikTok Pixel Mapping
        if (window.ttq && typeof window.ttq.track === 'function') {
            if (action === 'signup_completed') {
                window.ttq.track('CompleteRegistration', payload);
            } else if (action === 'pro_feature_viewed') {
                window.ttq.track('ViewContent', { content_name: params.feature || 'pro_feature' });
            } else if (action === 'checkout_started') {
                window.ttq.track('InitiateCheckout', payload);
            } else if (action === 'subscription_paid') {
                window.ttq.track('CompletePayment', { value: params.amount || 19, currency: params.currency || 'USD' });
            }
        }

        // 5. Snapchat Pixel Mapping
        if (window.snaptr) {
            if (action === 'signup_completed') {
                window.snaptr('track', 'SIGN_UP', payload);
            } else if (action === 'pro_feature_viewed') {
                window.snaptr('track', 'VIEW_CONTENT', payload);
            } else if (action === 'checkout_started') {
                window.snaptr('track', 'START_CHECKOUT', payload);
            } else if (action === 'subscription_paid') {
                window.snaptr('track', 'PURCHASE', { price: params.amount || 19, currency: params.currency || 'USD' });
            }
        }
    }

    // 6. Supabase Logging for Admin Conversion Funnel
    try {
        const sessionId = await getSessionId();
        await supabase.from('analytics_events').insert({
            event_name: action,
            page_path: Platform.OS === 'web' ? window.location.pathname : `app_${Platform.OS}`,
            referrer: Platform.OS === 'web' ? (document.referrer || 'direct') : `app_${Platform.OS}`,
            session_id: sessionId,
            user_agent: Platform.OS === 'web' ? navigator.userAgent : `App ${Platform.OS}`,
            metadata: payload,
        });
    } catch (err) {
        console.warn(`Failed to log event ${action} to Supabase analytics:`, err);
    }
};
