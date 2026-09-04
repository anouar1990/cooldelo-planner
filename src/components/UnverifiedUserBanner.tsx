import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ShieldAlert, MailCheck, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useRequireVerification } from '../context/VerificationContext';
import { trackEvent } from '../lib/analytics';

export function UnverifiedUserBanner() {
    const { user, isEmailVerified, resendVerificationEmail } = useAuth();
    const { openVerificationModal } = useRequireVerification();

    const [resending, setResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<string | null>(null);

    if (isEmailVerified || !user) return null;

    const handleResend = async () => {
        if (!user.email || resending) return;
        setResending(true);
        setResendStatus(null);
        try {
            const { error } = await resendVerificationEmail(user.email);
            if (error) {
                setResendStatus(`Error: ${error.message}`);
            } else {
                trackEvent('verification_email_sent', { email: user.email });
                setResendStatus('Verification link / code sent! Check your inbox.');
            }
        } catch (err: any) {
            setResendStatus(err.message || 'Failed to resend verification email.');
        } finally {
            setResending(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.iconBadge}>
                    <ShieldAlert color="#FF6B35" size={20} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>🔐 Verify your email to unlock all 0machine features.</Text>
                    <Text style={styles.subtitle}>
                        Verification is required to save projects, customize material inventory, export invoices, and use AI features.
                    </Text>
                </View>
            </View>

            {resendStatus ? (
                <View style={[styles.statusBox, resendStatus.startsWith('Error') ? styles.statusError : styles.statusSuccess]}>
                    <Text style={resendStatus.startsWith('Error') ? styles.statusErrorText : styles.statusSuccessText}>
                        {resendStatus}
                    </Text>
                </View>
            ) : null}

            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() => openVerificationModal('0machine features')}
                    activeOpacity={0.8}
                >
                    <CheckCircle2 color="#FFFFFF" size={15} />
                    <Text style={styles.verifyBtnText}>Verify Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.resendBtn, resending && styles.resendBtnDisabled]}
                    onPress={handleResend}
                    disabled={resending}
                    activeOpacity={0.8}
                >
                    {resending ? (
                        <ActivityIndicator color="#FF6B35" size="small" />
                    ) : (
                        <>
                            <RefreshCw color="#FF6B35" size={14} />
                            <Text style={styles.resendBtnText}>Resend Email</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
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
        backgroundColor: 'rgba(255, 107, 53, 0.15)',
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
        backgroundColor: '#FF6B35',
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
        borderColor: 'rgba(255, 107, 53, 0.3)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    resendBtnDisabled: {
        opacity: 0.6,
    },
    resendBtnText: {
        color: '#FF6B35',
        fontSize: 13,
        fontWeight: '700',
    },
});
