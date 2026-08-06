import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, ActivityIndicator, Platform } from 'react-native';
import { Mail, RefreshCw, LogIn } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface EmailConfirmationModalProps {
    visible: boolean;
    email: string;
    onClose: () => void;
    onGoToLogin: () => void;
}

export function EmailConfirmationModal({ visible, email, onClose, onGoToLogin }: EmailConfirmationModalProps) {
    const [resending, setResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<string | null>(null);

    const handleResend = async () => {
        if (!email) return;
        setResending(true);
        setResendStatus(null);
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.0machine.com';
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${origin}/auth/callback`,
                }
            });
            if (error) {
                setResendStatus(`Error: ${error.message}`);
            } else {
                setResendStatus('Confirmation email resent successfully! ✅');
            }
        } catch (err: any) {
            setResendStatus(err.message || 'Failed to resend confirmation email.');
        } finally {
            setResending(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.modalCard}>
                {/* Header Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={{ uri: '/logo.png' }}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Icon */}
                <View style={styles.iconCircle}>
                    <Mail color="#FF6B35" size={32} />
                </View>

                {/* Title */}
                <Text style={styles.title}>Confirm Your Email</Text>

                {/* Message */}
                <Text style={styles.message}>
                    We've sent a confirmation email to <Text style={styles.emailHighlight}>{email || 'your inbox'}</Text>.{'\n\n'}
                    Please click the verification link to activate your account.{'\n'}
                    If you don't see the email, please check your Spam or Junk folder.
                </Text>

                {resendStatus ? (
                    <View style={[styles.statusBanner, resendStatus.startsWith('Error') && styles.statusError]}>
                        <Text style={[styles.statusText, resendStatus.startsWith('Error') && styles.statusErrorText]}>
                            {resendStatus}
                        </Text>
                    </View>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => {
                            onClose();
                            onGoToLogin();
                        }}
                    >
                        <LogIn color="#FFFFFF" size={18} />
                        <Text style={styles.loginBtnText}>Go to Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.resendBtn, resending && styles.disabledBtn]}
                        onPress={handleResend}
                        disabled={resending}
                    >
                        {resending ? (
                            <ActivityIndicator color="#FF6B35" size="small" />
                        ) : (
                            <>
                                <RefreshCw color="#FF6B35" size={16} />
                                <Text style={styles.resendBtnText}>Resend Email</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
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
        padding: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 460,
        backgroundColor: '#1C2030',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    logoContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    logo: {
        width: 160,
        height: 40,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 107, 53, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.25)',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#8B95A8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    emailHighlight: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    statusBanner: {
        width: '100%',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
    },
    statusError: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    statusText: {
        color: '#10B981',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
    statusErrorText: {
        color: '#EF4444',
    },
    buttonGroup: {
        width: '100%',
        gap: 12,
    },
    loginBtn: {
        width: '100%',
        height: 50,
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    loginBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    resendBtn: {
        width: '100%',
        height: 48,
        backgroundColor: 'rgba(255, 107, 53, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    resendBtnText: {
        color: '#FF6B35',
        fontSize: 14,
        fontWeight: '700',
    },
    disabledBtn: {
        opacity: 0.6,
    },
});
