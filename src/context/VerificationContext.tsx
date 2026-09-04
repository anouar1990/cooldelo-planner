import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { ShieldAlert, Mail, CheckCircle2, ArrowRight, X, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../lib/analytics';
import { OTPVerificationModal } from '../components/OTPVerificationModal';

interface VerificationContextType {
    isEmailVerified: boolean;
    requireVerification: (actionName: string, onProceed?: () => void) => boolean;
    openVerificationModal: (actionName?: string) => void;
    closeVerificationModal: () => void;
}

const VerificationContext = createContext<VerificationContextType>({
    isEmailVerified: true,
    requireVerification: () => true,
    openVerificationModal: () => {},
    closeVerificationModal: () => {},
});

export const useRequireVerification = () => useContext(VerificationContext);

interface VerificationProviderProps {
    children: ReactNode;
}

export function VerificationProvider({ children }: VerificationProviderProps) {
    const { user, isEmailVerified, resendVerificationEmail, refreshSession } = useAuth();
    
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingActionName, setPendingActionName] = useState<string>('');
    const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

    const [resending, setResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<string | null>(null);

    const requireVerification = (actionName: string, onProceed?: () => void): boolean => {
        if (isEmailVerified) {
            if (onProceed) onProceed();
            return true;
        }

        // Track analytics event when blocked
        trackEvent('protected_action_blocked', { action_name: actionName });

        setPendingActionName(actionName);
        setPendingCallback(() => onProceed || null);
        setModalVisible(true);
        return false;
    };

    const openVerificationModal = (actionName?: string) => {
        if (actionName) setPendingActionName(actionName);
        setModalVisible(true);
    };

    const closeVerificationModal = () => {
        setModalVisible(false);
        setPendingActionName('');
        setPendingCallback(null);
        setResendStatus(null);
    };

    const handleSuccessVerification = async () => {
        await refreshSession();
        trackEvent('verification_completed', { email: user?.email });
        const cb = pendingCallback;
        closeVerificationModal();
        if (cb) {
            cb();
        }
    };

    const handleResendInModal = async () => {
        if (!user?.email || resending) return;
        setResending(true);
        setResendStatus(null);
        try {
            const { error } = await resendVerificationEmail(user.email);
            if (error) {
                setResendStatus(`Error: ${error.message}`);
            } else {
                trackEvent('verification_email_sent', { email: user.email });
                setResendStatus('Verification code sent to your email.');
            }
        } catch (e: any) {
            setResendStatus(e.message || 'Failed to resend email.');
        } finally {
            setResending(false);
        }
    };

    return (
        <VerificationContext.Provider
            value={{
                isEmailVerified,
                requireVerification,
                openVerificationModal,
                closeVerificationModal,
            }}
        >
            {children}

            {/* Custom Protected Action Verification Modal */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
                onRequestClose={closeVerificationModal}
            >
                <View style={styles.overlay}>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.closeBtn} onPress={closeVerificationModal}>
                            <X color="#8B95A8" size={20} />
                        </TouchableOpacity>

                        <View style={styles.iconBadge}>
                            <ShieldAlert color="#FF6B35" size={32} />
                        </View>

                        <Text style={styles.title}>🔐 Verify your email first</Text>
                        
                        <Text style={styles.description}>
                            Please verify your email to unlock{' '}
                            <Text style={styles.highlight}>{pendingActionName || 'this feature'}</Text>.
                            Check your inbox for the verification link or enter your code.
                        </Text>

                        {resendStatus ? (
                            <View style={[styles.banner, resendStatus.startsWith('Error') ? styles.bannerError : styles.bannerSuccess]}>
                                <Text style={resendStatus.startsWith('Error') ? styles.bannerErrorText : styles.bannerSuccessText}>
                                    {resendStatus}
                                </Text>
                            </View>
                        ) : null}

                        {/* Verification Form Modal forwarding to OTP input */}
                        <OTPVerificationModal
                            visible={modalVisible}
                            email={user?.email || ''}
                            onClose={closeVerificationModal}
                            onSuccess={handleSuccessVerification}
                        />
                    </View>
                </View>
            </Modal>
        </VerificationContext.Provider>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(10, 12, 18, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: '#1C2030',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        padding: 24,
        alignItems: 'center',
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 107, 53, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.25)',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#8B95A8',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    highlight: {
        color: '#FF6B35',
        fontWeight: '700',
    },
    banner: {
        width: '100%',
        borderRadius: 10,
        padding: 10,
        marginBottom: 16,
    },
    bannerError: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    bannerErrorText: {
        color: '#EF4444',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
    bannerSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    bannerSuccessText: {
        color: '#10B981',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '600',
    },
});
