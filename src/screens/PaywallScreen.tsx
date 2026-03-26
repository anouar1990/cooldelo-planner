import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { X, Zap, Layers, BarChart2, Clock, Shield, CheckCircle } from 'lucide-react-native';
import { useSubscription } from '../hooks/useSubscription';

const C = {
    bg: '#0F1117',
    surface: '#1C2030',
    surface2: '#242840',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    primaryGlow: 'rgba(255,107,53,0.15)',
    gold: '#F59E0B',
    goldGlow: 'rgba(245,158,11,0.12)',
    text: '#FFFFFF',
    sub: '#8B95A8',
    dim: '#4B5568',
};

const FEATURES = [
    {
        icon: Layers,
        color: '#3B82F6',
        title: 'Unlimited Projects',
        desc: 'Create and manage as many projects as you need',
    },
    {
        icon: Zap,
        color: '#F59E0B',
        title: 'Material Catalog',
        desc: 'Full access to add, edit and organize your materials',
    },
    {
        icon: BarChart2,
        color: '#10B981',
        title: 'Advanced Stats',
        desc: 'Revenue tracking, completion rates, and cost analytics',
    },
    {
        icon: Clock,
        color: C.primary,
        title: 'Time Tracking',
        desc: 'Unlimited time logs across all your projects',
    },
    {
        icon: Shield,
        color: '#8B5CF6',
        title: 'Priority Support',
        desc: 'Get help fast when you need it',
    },
];

export default function PaywallScreen() {
    const navigation = useNavigation();
    const { startCheckout, checkoutLoading, error, hasActiveTrial, daysLeftInTrial, isPro } = useSubscription();

    // Determine the state of the user's trial
    const trialExpired = !hasActiveTrial && !isPro;

    // Subtle glow animation on the CTA button
    const glowAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    const shadowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.75],
    });

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                {/* Close button */}
                <View style={styles.closeRow}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                        <X color={C.sub} size={18} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Hero */}
                    <View style={styles.heroSection}>
                        {trialExpired ? (
                            <>
                                <View style={[styles.badgeRow, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)' }]}>
                                    <Text style={[styles.badge, { color: '#EF4444' }]}>TRIAL ENDED</Text>
                                </View>
                                <Text style={styles.heroTitle}>Upgrade to continue using Pro</Text>
                                <Text style={styles.heroSub}>
                                    Your 3-day free trial has expired. Subscribe to keep your premium features.
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.badgeRow}>
                                    <Zap color={C.gold} size={14} fill={C.gold} />
                                    <Text style={styles.badge}>
                                        {hasActiveTrial ? `${daysLeftInTrial} DAYS LEFT` : '3 DAYS FREE'}
                                    </Text>
                                </View>
                                <Text style={styles.heroTitle}>0machine Pro ⚡</Text>
                                <Text style={styles.heroSub}>
                                    {hasActiveTrial
                                        ? 'Subscribe now so you don’t lose access when your trial ends.'
                                        : 'Full access to every Pro feature.'}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Pricing card */}
                    <View style={styles.pricingCard}>
                        {!trialExpired && (
                            <View style={styles.trialBadge}>
                                <Text style={styles.trialBadgeText}>
                                    {hasActiveTrial ? 'TRIAL ACTIVE' : '🎉 3-DAY FREE TRIAL'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.priceRow}>
                            <Text style={styles.currency}>$</Text>
                            <Text style={styles.price}>9</Text>
                            <View style={styles.priceRight}>
                                <Text style={styles.pricePeriod}>/month</Text>
                                <Text style={styles.priceSub}>
                                    {trialExpired ? 'billed monthly' : 'after trial ends'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <Text style={styles.pricingNote}>
                            Secure payment via Stripe · Cancel anytime
                        </Text>
                    </View>

                    {/* Features */}
                    <Text style={styles.sectionTitle}>EVERYTHING INCLUDED</Text>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={styles.featureRow}>
                            <View style={[styles.featureIconWrap, { backgroundColor: `${f.color}18` }]}>
                                <f.icon color={f.color} size={18} />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureName}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                            <CheckCircle color={f.color} size={16} opacity={0.7} />
                        </View>
                    ))}

                    {/* Free plan comparison */}
                    <View style={styles.freeNote}>
                        <Text style={styles.freeNoteText}>
                            Free plan includes 3 projects and basic time tracking.
                        </Text>
                    </View>

                    {/* Error */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                </ScrollView>

                {/* Sticky CTA */}
                <View style={styles.ctaWrap}>
                    <Animated.View style={[styles.ctaShadow, { shadowOpacity }]}>
                        <TouchableOpacity
                            style={styles.ctaBtn}
                            onPress={() => startCheckout()}
                            disabled={checkoutLoading}
                            activeOpacity={0.85}
                        >
                            {checkoutLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Zap color="#FFF" size={18} fill="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.ctaText}>
                                        {trialExpired ? 'Subscribe for $9/mo' : 'Subscribe to Pro'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    closeRow: { paddingHorizontal: 16, paddingTop: 8, alignItems: 'flex-end' },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    scroll: { paddingHorizontal: 20, paddingBottom: 20 },

    // Hero
    heroSection: { alignItems: 'center', paddingTop: 12, paddingBottom: 28 },
    badgeRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: C.goldGlow, borderWidth: 1, borderColor: `${C.gold}50`,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
    },
    badge: { fontSize: 12, fontWeight: '800', color: C.gold, letterSpacing: 2 },
    heroTitle: { fontSize: 32, fontWeight: '800', color: C.text, textAlign: 'center', lineHeight: 38 },
    heroSub: { fontSize: 15, color: C.sub, textAlign: 'center', marginTop: 10, lineHeight: 22 },

    // Pricing
    pricingCard: {
        backgroundColor: C.primaryGlow, borderRadius: 20,
        borderWidth: 1, borderColor: `${C.primary}40`,
        padding: 20, marginBottom: 24,
    },
    priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
    currency: { fontSize: 22, fontWeight: '800', color: C.primary, marginTop: 6 },
    price: { fontSize: 64, fontWeight: '900', color: C.primary, lineHeight: 70 },
    priceRight: { justifyContent: 'center', marginLeft: 4 },
    pricePeriod: { fontSize: 18, fontWeight: '600', color: C.text, marginTop: 20 },
    priceSub: { fontSize: 12, color: C.sub, marginTop: 2 },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 14 },
    pricingNote: { fontSize: 13, color: C.dim, textAlign: 'center' },

    // Features
    sectionTitle: {
        fontSize: 11, fontWeight: '700', color: C.dim,
        letterSpacing: 1.5, marginBottom: 14, marginTop: 4,
    },
    featureRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: C.surface, borderRadius: 14,
        padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: C.border,
    },
    featureIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    featureText: { flex: 1 },
    featureName: { fontSize: 14, fontWeight: '700', color: C.text },
    featureDesc: { fontSize: 12, color: C.sub, marginTop: 2 },

    // Free note
    freeNote: { marginTop: 16, padding: 14, backgroundColor: C.surface2, borderRadius: 12 },
    freeNoteText: { fontSize: 13, color: C.dim, textAlign: 'center' },

    // Error
    errorBox: { marginTop: 12, padding: 12, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10 },
    errorText: { fontSize: 13, color: '#EF4444', textAlign: 'center' },

    // CTA
    ctaWrap: { padding: 20, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
    ctaShadow: {
        borderRadius: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
        shadowRadius: 16, elevation: 12,
    },
    ctaBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.primary, borderRadius: 16,
        paddingVertical: 16, paddingHorizontal: 24,
    },
    ctaText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
    ctaNote: { fontSize: 12, color: C.dim, textAlign: 'center', marginTop: 10 },
    trialBadge: {
        alignSelf: 'center', backgroundColor: C.goldGlow,
        borderWidth: 1, borderColor: `${C.gold}50`,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14,
    },
    trialBadgeText: { fontSize: 12, fontWeight: '800', color: C.gold, letterSpacing: 1 },
});
