import { Platform } from 'react-native';

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

/**
 * Log a page view manually.
 */
export const trackPageView = (pageName: string, pagePath: string = window.location.pathname) => {
    if (!IS_WEB || !IS_PROD) return;

    if (window.gtag) {
        window.gtag('event', 'page_view', {
            page_title: pageName,
            page_path: pagePath,
            send_to: GA_TRACKING_ID,
        });
    }
};

/**
 * Log a generic or custom event (e.g., sign_up, login, purchase, btn_click).
 */
export const trackEvent = (action: string, params: Record<string, any> = {}) => {
    if (!IS_WEB || !IS_PROD) return;

    if (window.gtag) {
        window.gtag('event', action, {
            ...params,
            send_to: GA_TRACKING_ID,
        });
    }
};
