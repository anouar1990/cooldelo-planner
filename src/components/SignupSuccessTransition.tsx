import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, TouchableOpacity, Platform } from 'react-native';
import { Zap, CheckCircle2, Mail, ExternalLink, ArrowRight } from 'lucide-react-native';

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
    success: '#10B981',
};

export function SignupSuccessTransition({ email, isEmailVerified, onComplete }: SignupSuccessTransitionProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.95));
    const [iconSpinAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        // Entry animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Icon spinning animation loop
        Animated.loop(
            Animated.timing(iconSpinAnim, {
                toValue: 1,
                duration: 2500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation loop
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
        const t1 = setTimeout(() => setStepIndex(1), 1000); // 1s: Account created successfully
        const t2 = setTimeout(() => setStepIndex(2), 2000); // 2s: Setting up workshop
        const t3 = setTimeout(() => setStepIndex(3), 3800); // 3.8s: Almost ready

        // Final redirect trigger at max 5s (if verified/authenticated session)
        let t4: NodeJS.Timeout;
        if (isEmailVerified) {
            t4 = setTimeout(() => {
                onComplete();
            }, 4800);
        }

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            if (t4) clearTimeout(t4);
        };
    }, [isEmailVerified]);

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

                {!isEmailVerified ? (
                    /* Email verification required state */
                    <View style={styles.unverifiedContainer}>
                        <View style={styles.unverifiedBadge}>
                            <Mail color={C.primary} size={32} />
                        </View>
                        <Text style={styles.heading}>Check your email</Text>
                        <Text style={styles.subtext}>
                            We've sent a confirmation link to:
                        </Text>
                        <Text style={styles.emailHighlight}>{email}</Text>

                        <Text style={styles.infoText}>
                            Please confirm your email address to launch your workshop. Once verified, you can proceed directly to app.0machine.com.
                        </Text>

                        <TouchableOpacity
                            style={styles.continueBtn}
                            onPress={onComplete}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueBtnText}>I've confirmed my email</Text>
                            <ArrowRight color="#FFFFFF" size={18} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Auto-confirmed / Verified transition timeline */
                    <View style={styles.verifiedContainer}>
                        <Text style={styles.heading}>Account created successfully</Text>
                        <Text style={styles.subtext}>Welcome to 0machine</Text>

                        {/* Animated launch / workshop icon */}
                        <View style={styles.animationCircleWrapper}>
                            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                            <View style={styles.iconCircle}>
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
                                    <ExternalLink color={C.sub} size={16} />
                                    <Text style={styles.statusTextSubtle}>Almost ready... Redirecting to app</Text>
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
        maxWidth: 440,
        backgroundColor: C.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 40,
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
        marginBottom: 28,
    },
    verifiedContainer: {
        alignItems: 'center',
        width: '100%',
    },
    heading: {
        fontSize: 22,
        fontWeight: '700',
        color: C.text,
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    subtext: {
        fontSize: 14,
        color: C.sub,
        textAlign: 'center',
        marginBottom: 32,
    },
    animationCircleWrapper: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
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
    iconCircle: {
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
        gap: 10,
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
    unverifiedContainer: {
        alignItems: 'center',
        width: '100%',
    },
    unverifiedBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emailHighlight: {
        fontSize: 15,
        fontWeight: '700',
        color: C.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    infoText: {
        fontSize: 13,
        color: C.sub,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 28,
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        gap: 8,
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
