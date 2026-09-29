import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Modal, Image, ActivityIndicator, Platform
} from 'react-native';
import { KeyRound, RefreshCw, CheckCircle2, ArrowRight, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface OTPVerificationModalProps {
    visible: boolean;
    email: string;
    onClose: () => void;
    onSuccess?: () => void;
}

const OTP_LENGTH = 8; // 8-digit OTP code sent by custom email template

export function OTPVerificationModal({ visible, email, onClose, onSuccess }: OTPVerificationModalProps) {
    return null;
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(10, 12, 18, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#1C2030',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        padding: 28,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    logoContainer: {
        marginBottom: 16,
        alignItems: 'center',
    },
    logo: {
        width: 160,
        height: 40,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 107, 53, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.25)',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#8B95A8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    emailHighlight: {
        color: '#FFFFFF',
        fontWeight: '700',
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
        color: '#EF4444',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
    statusSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    statusSuccessText: {
        color: '#10B981',
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
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.06)',
    },
    otpInputError: {
        borderColor: '#EF4444',
    },
    verifyBtn: {
        width: '100%',
        height: 52,
        backgroundColor: '#FF6B35',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        shadowColor: '#FF6B35',
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
    resendContainer: {
        alignItems: 'center',
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
        color: '#FF6B35',
        fontSize: 13,
        fontWeight: '700',
    },
    resendBtnTextDisabled: {
        color: '#4B5568',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
