import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { CheckCircle2, Zap } from 'lucide-react-native';

interface SignupSuccessTransitionProps {
    email: string;
    onComplete: () => void;
}

const C = {
    bg: '#111317',
    surface: '#1A1D21',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FE7733',
    text: '#FFFFFF',
    sub: '#8B95A8',
    dim: '#4B5568',
    success: '#10B981',
};

export function SignupSuccessTransition({ email, onComplete }: SignupSuccessTransitionProps) {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const [progressPercent, setProgressPercent] = useState(0);
    const [statusText, setStatusText] = useState('Initializing workshop...');

    useEffect(() => {
        // Fade in card animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // 5-second loading bar animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 5000,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();

        // Update progress percentage state
        const listenerId = progressAnim.addListener(({ value }) => {
            const pct = Math.min(100, Math.floor(value * 100));
            setProgressPercent(pct);

            if (pct < 30) {
                setStatusText('Initializing workshop workspace...');
            } else if (pct < 70) {
                setStatusText('Loading material & machine templates...');
            } else if (pct < 95) {
                setStatusText('Finalizing account security...');
            } else {
                setStatusText('Opening 0machine dashboard...');
            }
        });

        // Redirect after 5 seconds
        const timer = setTimeout(() => {
            onComplete();
        }, 5000);

        return () => {
            progressAnim.removeListener(listenerId);
            clearTimeout(timer);
        };
    }, []);

    const barWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* 0machine Logo */}
                <Image
                    source={{ uri: '/logo.png' }}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.iconBadge}>
                    <Zap color={C.primary} size={32} />
                </View>

                <Text style={styles.title}>Account Created Successfully!</Text>
                <Text style={styles.subtitle}>
                    Welcome to 0machine. Preparing your workspace for{' '}
                    <Text style={styles.emailText}>{email}</Text>
                </Text>

                {/* 5-Second Loading Bar (Samta katcharja) */}
                <View style={styles.progressContainer}>
                    <View style={styles.trackBar}>
                        <Animated.View style={[styles.fillBar, { width: barWidth }]} />
                    </View>

                    <View style={styles.progressLabelRow}>
                        <Text style={styles.statusText}>{statusText}</Text>
                        <Text style={styles.percentText}>{progressPercent}%</Text>
                    </View>
                </View>

                {/* Status Timeline Checklist */}
                <View style={styles.checklist}>
                    <View style={styles.checkItem}>
                        <CheckCircle2 color={progressPercent >= 25 ? C.success : C.dim} size={16} />
                        <Text style={[styles.checkText, progressPercent >= 25 && styles.checkTextActive]}>
                            Account & session created
                        </Text>
                    </View>
                    <View style={styles.checkItem}>
                        <CheckCircle2 color={progressPercent >= 65 ? C.success : C.dim} size={16} />
                        <Text style={[styles.checkText, progressPercent >= 65 && styles.checkTextActive]}>
                            Material presets & cost calculators ready
                        </Text>
                    </View>
                    <View style={styles.checkItem}>
                        <CheckCircle2 color={progressPercent >= 98 ? C.success : C.dim} size={16} />
                        <Text style={[styles.checkText, progressPercent >= 98 && styles.checkTextActive]}>
                            Redirecting to app.0machine.com
                        </Text>
                    </View>
                </View>
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
        marginBottom: 20,
    },
    iconBadge: {
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
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: C.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: C.sub,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
    },
    emailText: {
        color: C.text,
        fontWeight: '700',
    },
    progressContainer: {
        width: '100%',
        marginBottom: 24,
    },
    trackBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    fillBar: {
        height: '100%',
        backgroundColor: C.primary,
        borderRadius: 4,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        color: C.sub,
        fontWeight: '500',
    },
    percentText: {
        fontSize: 13,
        color: C.primary,
        fontWeight: '800',
    },
    checklist: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 14,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkText: {
        fontSize: 13,
        color: C.dim,
        fontWeight: '500',
    },
    checkTextActive: {
        color: C.text,
        fontWeight: '600',
    },
});


