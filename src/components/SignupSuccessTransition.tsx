import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Image, Animated, Easing,
    TouchableOpacity, TextInput, ActivityIndicator, Platform
} from 'react-native';
import { Zap, CheckCircle2, KeyRound, RefreshCw, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface SignupSuccessTransitionProps {
    email: string;
    isEmailVerified: boolean;
    onComplete: () => void;
}

const C = {
    bg: '#0F1117',
    surface: '#1C2030',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    text: '#FFFFFF',
    sub: '#8B95A8',
    dim: '#4B5568',
    success: '#10B981',
    error: '#EF4444',
};

const OTP_LENGTH = 8; // Supports up to 8 digits with paste support for 6-8 digits

export function SignupSuccessTransition({ email, isEmailVerified: initialIsVerified, onComplete }: SignupSuccessTransitionProps) {
    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: C.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 36,
        paddingHorizontal: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 10,
    },
    logo: {
        width: 190,
        height: 48,
        marginBottom: 24,
    },
    otpContainer: {
        alignItems: 'center',
        width: '100%',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 107, 53, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
    },
    heading: {
        fontSize: 22,
        fontWeight: '800',
        color: C.text,
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    subtext: {
        fontSize: 14,
        color: C.sub,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    emailHighlight: {
        fontWeight: '700',
        color: C.text,
    },
    statusBanner: {
        width: '100%',
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
        borderWidth: 1,
    },
    statusError: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    statusErrorText: {
        color: C.error,
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
    statusSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    statusSuccessText: {
        color: C.success,
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 24,
        width: '100%',
    },
    otpInput: {
        width: 38,
        height: 52,
        borderRadius: 10,
        backgroundColor: '#13151F',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    otpInputFilled: {
        borderColor: C.primary,
        backgroundColor: 'rgba(255, 107, 53, 0.06)',
    },
    otpInputError: {
        borderColor: C.error,
    },
    verifyBtn: {
        width: '100%',
        height: 52,
        backgroundColor: C.primary,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    verifyBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    resendContainer: {
        alignItems: 'center',
        gap: 8,
    },
    resendPrompt: {
        fontSize: 13,
        color: C.sub,
    },
    resendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.25)',
    },
    resendBtnDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    resendBtnText: {
        color: C.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    resendBtnTextDisabled: {
        color: C.dim,
    },
    verifiedContainer: {
        alignItems: 'center',
        width: '100%',
    },
    animationCircleWrapper: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
        marginTop: 12,
    },
    pulseRing: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
    },
    iconCircleVerified: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.4)',
    },
    statusBox: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        padding: 16,
        gap: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusTextDone: {
        color: C.text,
        fontSize: 13,
        fontWeight: '600',
    },
    statusTextActive: {
        color: C.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    statusTextSubtle: {
        color: C.sub,
        fontSize: 13,
    },
});

