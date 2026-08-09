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

const OTP_LENGTH = 8; // Supports up to 8-digit OTPs sent by Supabase

export function OTPVerificationModal({ visible, email, onClose, onSuccess }: OTPVerificationModalProps) {
    const { verifyOtp } = useAuth();

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(60);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const inputRefs = useRef<Array<TextInput | null>>([]);

    // 60-second cooldown timer for resend
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (visible && cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [visible, cooldown]);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setOtp(Array(OTP_LENGTH).fill(''));
            setErrorMsg(null);
            setSuccessMsg(null);
            setCooldown(60);
            // Focus first input box after short delay
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 300);
        }
    }, [visible]);

    const handleOtpChange = (text: string, index: number) => {
        setErrorMsg(null);
        setSuccessMsg(null);

        // Handle paste of full OTP code (e.g. 6 or 8 digits)
        if (text.length > 1) {
            const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH).split('');
            if (digits.length > 0) {
                const newOtp = Array(OTP_LENGTH).fill('');
                digits.forEach((digit, i) => {
                    if (i < OTP_LENGTH) newOtp[i] = digit;
                });
                setOtp(newOtp);

                // Focus next empty or last box
                const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
                inputRefs.current[nextIndex]?.focus();

                // If complete 8 or 6 digits pasted, trigger verify
                if (digits.length >= 6) {
                    handleVerify(newOtp.join(''));
                }
                return;
            }
        }

        const digit = text.replace(/[^0-9]/g, '');
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto verify if all 8 digits entered
        if (digit && newOtp.every((d) => d !== '')) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (codeToVerify?: string) => {
        const token = (codeToVerify || otp.join('')).trim();
        if (token.length < 6) {
            setErrorMsg('Please enter your verification code.');
            return;
        }

        setVerifying(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { data, error } = await verifyOtp(email, token);
            if (error) {
                setErrorMsg(error.message || 'Invalid or expired OTP code. Please try again.');
            } else {
                setSuccessMsg('OTP verified successfully! Redirecting...');
                setTimeout(() => {
                    // Redirect to /dashboard if in web browser
                    if (typeof window !== 'undefined' && window.location) {
                        try {
                            window.history.pushState({}, '', '/dashboard');
                        } catch (e) {
                            // ignore if navigation handled by state
                        }
                    }
                    if (onSuccess) onSuccess();
                    onClose();
                }, 800);
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Verification failed. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleResendCode = async () => {
        if (cooldown > 0 || resending) return;

        setResending(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                setErrorMsg(`Resend failed: ${error.message}`);
            } else {
                setSuccessMsg('A new verification code has been sent to your email.');
                setCooldown(60);
                setOtp(Array(OTP_LENGTH).fill(''));
                inputRefs.current[0]?.focus();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to resend verification code.');
        } finally {
            setResending(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X color="#8B95A8" size={20} />
                    </TouchableOpacity>

                    {/* Logo Header */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={{ uri: '/logo.png' }}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Icon */}
                    <View style={styles.iconCircle}>
                        <KeyRound color="#FF6B35" size={32} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Enter Verification Code</Text>

                    {/* Instruction */}
                    <Text style={styles.message}>
                        We sent a verification code to{' '}
                        <Text style={styles.emailHighlight}>{email || 'your email'}</Text>.
                        Enter the code below to activate your account.
                    </Text>

                    {/* Status Messages */}
                    {errorMsg ? (
                        <View style={[styles.statusBanner, styles.statusError]}>
                            <Text style={styles.statusErrorText}>⚠️ {errorMsg}</Text>
                        </View>
                    ) : null}

                    {successMsg ? (
                        <View style={[styles.statusBanner, styles.statusSuccess]}>
                            <Text style={styles.statusSuccessText}>✅ {successMsg}</Text>
                        </View>
                    ) : null}

                    {/* 8-Digit OTP Inputs */}
                    <View style={styles.otpRow}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputFilled : null,
                                    errorMsg ? styles.otpInputError : null,
                                ]}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={OTP_LENGTH}
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                        style={[styles.verifyBtn, verifying && styles.disabledBtn]}
                        onPress={() => handleVerify()}
                        disabled={verifying}
                    >
                        {verifying ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <CheckCircle2 color="#FFFFFF" size={18} />
                                <Text style={styles.verifyBtnText}>Verify & Proceed</Text>
                                <ArrowRight color="#FFFFFF" size={16} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Resend Code Button with Cooldown */}
                    <View style={styles.resendContainer}>
                        <TouchableOpacity
                            style={[
                                styles.resendBtn,
                                (cooldown > 0 || resending) && styles.resendBtnDisabled,
                            ]}
                            onPress={handleResendCode}
                            disabled={cooldown > 0 || resending}
                        >
                            {resending ? (
                                <ActivityIndicator color="#FF6B35" size="small" />
                            ) : (
                                <>
                                    <RefreshCw
                                        color={cooldown > 0 ? '#4B5568' : '#FF6B35'}
                                        size={15}
                                    />
                                    <Text
                                        style={[
                                            styles.resendBtnText,
                                            cooldown > 0 && styles.resendBtnTextDisabled,
                                        ]}
                                    >
                                        {cooldown > 0
                                            ? `Resend code in ${cooldown}s`
                                            : 'Resend code'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
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
        height: 50,
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
