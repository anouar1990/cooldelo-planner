import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// GA4 Measurement ID
export const GA_TRACKING_ID = 'G-8V921YKC8S';

// Ensure this only works on Web and only in production, unless running locally without localhost
const IS_WEB = Platform.OS === 'web';
const IS_PROD = 
    typeof process !== 'undefined' && 
    process.env && 
    process.env.NODE_ENV === 'production';

// Type definitions for window.gtag
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

let cachedSessionId: string | null = null;

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
        } catch (e) {
            // Fallback if localStorage is disabled
        }
    } else {
        try {
            let sid = await AsyncStorage.getItem('0machine_session_id');
            if (!sid) {
                sid = 'sess_app_' + Math.random().toString(36).substring(2, 15);
                await AsyncStorage.setItem('0machine_session_id', sid);
            }
            cachedSessionId = sid;
            return sid;
        } catch (e) {
            // Fallback if AsyncStorage fails
        }
    }

    const fallbackSid = 'sess_fallback_' + Math.random().toString(36).substring(2, 15);
    cachedSessionId = fallbackSid;
    return fallbackSid;
}

/**
 * Log a page view manually.
 */
export const trackPageView = async (pageName: string, pagePath: string = '') => {
    // 1. Web GA4 tracking
    if (IS_WEB && IS_PROD) {
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_title: pageName,
                page_path: pagePath,
                send_to: GA_TRACKING_ID,
            });
        }
    }

    // 2. Custom Supabase Analytics logging
    try {
        const sessionId = await getSessionId();
        await supabase.from('analytics_events').insert({
            event_name: 'pageview',
            page_path: pagePath || pageName,
            referrer: Platform.OS === 'web' ? (document.referrer || 'direct') : `app_${Platform.OS}`,
            session_id: sessionId,
            user_agent: Platform.OS === 'web' ? navigator.userAgent : `App ${Platform.OS}`,
            metadata: { title: pageName }
        });
    } catch (err) {
        console.warn('Failed to log pageview to Supabase analytics:', err);
    }
};

/**
 * Log a generic or custom event (e.g., sign_up, login, purchase, btn_click).
 */
export const trackEvent = async (action: string, params: Record<string, any> = {}) => {
    // 1. Web GA4 tracking
    if (IS_WEB && IS_PROD) {
        if (window.gtag) {
            window.gtag('event', action, {
                ...params,
                send_to: GA_TRACKING_ID,
            });
        }
    }

    // 2. Custom Supabase Analytics logging
    try {
        const sessionId = await getSessionId();
        await supabase.from('analytics_events').insert({
            event_name: action,
            page_path: Platform.OS === 'web' ? window.location.pathname : `app_${Platform.OS}`,
            referrer: Platform.OS === 'web' ? (document.referrer || 'direct') : `app_${Platform.OS}`,
            session_id: sessionId,
            user_agent: Platform.OS === 'web' ? navigator.userAgent : `App ${Platform.OS}`,
            metadata: params
        });
    } catch (err) {
        console.warn(`Failed to log event ${action} to Supabase analytics:`, err);
    }
};
