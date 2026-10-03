import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ShieldAlert, MailCheck, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useRequireVerification } from '../context/VerificationContext';
import { trackEvent } from '../lib/analytics';

export function UnverifiedUserBanner() {
    return null;
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(254, 119, 51, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(254, 119, 51, 0.3)',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(254, 119, 51, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        lineHeight: 20,
    },
    subtitle: {
        fontSize: 12,
        color: '#8B95A8',
        lineHeight: 17,
    },
    statusBox: {
        marginTop: 10,
        padding: 8,
        borderRadius: 8,
    },
    statusSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    statusSuccessText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '600',
    },
    statusError: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    statusErrorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 14,
    },
    verifyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FE7733',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    verifyBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    resendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(254, 119, 51, 0.3)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    resendBtnDisabled: {
        opacity: 0.6,
    },
    resendBtnText: {
        color: '#FE7733',
        fontSize: 13,
        fontWeight: '700',
    },
});
