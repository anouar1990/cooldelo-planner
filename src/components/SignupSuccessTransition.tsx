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
    const { verifyOtp, resendVerificationEmail } = useAuth();
    const [isVerified, setIsVerified] = useState(initialIsVerified);
    const [stepIndex, setStepIndex] = useState(0);

    // Animations
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.95));
    const [iconSpinAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));

    // OTP State
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(60);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const inputRefs = useRef<Array<TextInput | null>>([]);

    // 60-second resend cooldown timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!isVerified && cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isVerified, cooldown]);

    // Initial animations and timeline execution once verified
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        if (isVerified) {
            // Icon spin loop
            Animated.loop(
                Animated.timing(iconSpinAnim, {
                    toValue: 1,
                    duration: 2500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            // Pulse ring loop
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Step timeline
            const t1 = setTimeout(() => setStepIndex(1), 800);   // Account created successfully
            const t2 = setTimeout(() => setStepIndex(2), 1800);  // Setting up workshop...
            const t3 = setTimeout(() => setStepIndex(3), 3200);  // Almost ready...

            // Final redirect trigger at ~4.5s
            const t4 = setTimeout(() => {
                onComplete();
            }, 4500);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                clearTimeout(t4);
            };
        }
    }, [isVerified]);

    const handleOtpChange = (text: string, index: number) => {
        setErrorMsg(null);
        setSuccessMsg(null);

        // Handle paste of 6 to 8 digits
        if (text.length > 1) {
            const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH).split('');
            if (digits.length > 0) {
                const newOtp = Array(OTP_LENGTH).fill('');
                digits.forEach((digit, i) => {
                    if (i < OTP_LENGTH) newOtp[i] = digit;
                });
                setOtp(newOtp);

                const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
                inputRefs.current[nextIndex]?.focus();

                if (digits.length >= 6) {
                    handleVerify(digits.join(''));
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

        // Auto submit when filled
        const nonBlank = newOtp.filter(d => d !== '').join('');
        if (digit && (nonBlank.length === 6 || nonBlank.length === 8)) {
            handleVerify(nonBlank);
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
            setErrorMsg('Please enter your 6 or 8-digit verification code.');
            return;
        }

        setVerifying(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { data, error } = await verifyOtp(email, token);
            if (error) {
                if (error.message?.toLowerCase().includes('expired')) {
                    setErrorMsg('Verification code expired. Please request a new code.');
                } else if (error.message?.toLowerCase().includes('invalid')) {
                    setErrorMsg('Invalid code. Please check your email and try again.');
                } else {
                    setErrorMsg(error.message || 'Verification failed. Please try again.');
                }
            } else {
                setSuccessMsg('Email verified successfully!');
                setTimeout(() => {
                    setIsVerified(true);
                }, 600);
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Network error during verification. Please check your connection.');
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
            const { error } = await resendVerificationEmail(email);
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

    const spin = iconSpinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* 0machine exact logo */}
                <Image
                    source={{ uri: '/logo.png' }}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {!isVerified ? (
                    /* OTP Verification Screen */
                    <View style={styles.otpContainer}>
                        <View style={styles.iconCircle}>
                            <KeyRound color={C.primary} size={32} />
                        </View>
                        <Text style={styles.heading}>Check your email</Text>
                        <Text style={styles.subtext}>
                            We sent a verification code to{' '}
                            <Text style={styles.emailHighlight}>{email}</Text>
                        </Text>

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

                        {/* OTP Inputs */}
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

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[styles.verifyBtn, verifying && styles.disabledBtn]}
                            onPress={() => handleVerify()}
                            disabled={verifying}
                            activeOpacity={0.8}
                        >
                            {verifying ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <CheckCircle2 color="#FFFFFF" size={18} />
                                    <Text style={styles.verifyBtnText}>Verify Email</Text>
                                    <ArrowRight color="#FFFFFF" size={16} />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Resend Code Button */}
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
                            <TouchableOpacity
                                style={[
                                    styles.resendBtn,
                                    (cooldown > 0 || resending) && styles.resendBtnDisabled,
                                ]}
                                onPress={handleResendCode}
                                disabled={cooldown > 0 || resending}
                                activeOpacity={0.7}
                            >
                                {resending ? (
                                    <ActivityIndicator color={C.primary} size="small" />
                                ) : (
                                    <>
                                        <RefreshCw
                                            color={cooldown > 0 ? C.dim : C.primary}
                                            size={14}
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
                ) : (
                    /* Verified Success Transition Screen */
                    <View style={styles.verifiedContainer}>
                        <Text style={styles.heading}>Account created successfully</Text>
                        <Text style={styles.subtext}>Welcome to 0machine</Text>

                        {/* Animated launch / workshop icon */}
                        <View style={styles.animationCircleWrapper}>
                            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                            <View style={styles.iconCircleVerified}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Zap color={C.primary} size={36} />
                                </Animated.View>
                            </View>
                        </View>

                        {/* Timeline messages */}
                        <View style={styles.statusBox}>
                            {stepIndex >= 1 && (
                                <View style={styles.statusRow}>
                                    <CheckCircle2 color={C.success} size={16} />
                                    <Text style={styles.statusTextDone}>Account created successfully</Text>
                                </View>
                            )}

                            {stepIndex >= 2 && (
                                <View style={styles.statusRow}>
                                    <Zap color={C.primary} size={16} />
                                    <Text style={styles.statusTextActive}>Setting up your workshop...</Text>
                                </View>
                            )}

                            {stepIndex >= 3 && (
                                <View style={styles.statusRow}>
                                    <CheckCircle2 color={C.sub} size={16} />
                                    <Text style={styles.statusTextSubtle}>Redirecting to app.0machine.com</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </Animated.View>
        </View>
    );
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

