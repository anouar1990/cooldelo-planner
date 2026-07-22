import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { X, Zap, Layers, BarChart2, Clock, Shield, CheckCircle } from 'lucide-react-native';
import { useSubscription, HOBBY_PRICE_ID, PRO_PRICE_ID, BIZ_PRICE_ID } from '../hooks/useSubscription';

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
        title: 'Project Tracking',
        desc: 'Organize your laser cuts, costs, and materials in one place',
    },
    {
        icon: Zap,
        color: '#F59E0B',
        title: 'Material Inventory',
        desc: 'Log plywood, acrylic sheets and get stock shortage alerts',
    },
    {
        icon: BarChart2,
        color: '#10B981',
        title: 'Cost & Profit Analytics',
        desc: 'Calculate exact profit margins and recommended sale prices',
    },
    {
        icon: Clock,
        color: C.primary,
        title: 'Laser Settings Presets',
        desc: 'Load speed and power profiles for different materials instantly',
    },
    {
        icon: Shield,
        color: '#8B5CF6',
        title: 'Quote & Invoice PDFs',
        desc: 'Send professional invoices directly to your clients',
    },
];

export default function PaywallScreen() {
    const navigation = useNavigation();
    const { startCheckout, checkoutLoading, error, hasActiveTrial, daysLeftInTrial, isPro } = useSubscription();
    const [selectedPlan, setSelectedPlan] = useState<'hobby' | 'pro' | 'biz'>('pro');

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

    const getPriceId = () => {
        if (selectedPlan === 'hobby') return HOBBY_PRICE_ID;
        if (selectedPlan === 'biz') return BIZ_PRICE_ID;
        return PRO_PRICE_ID;
    };

    const getPlanPriceText = () => {
        if (selectedPlan === 'hobby') return '$9/mo';
        if (selectedPlan === 'biz') return '$69/mo';
        return '$19/mo';
    };

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
                        <View style={styles.badgeRow}>
                            <Zap color={C.gold} size={14} fill={C.gold} />
                            <Text style={styles.badge}>PRO WORKSHOP ACCESS</Text>
                        </View>
                        <Text style={styles.heroTitle}>Unlock 0machine Pro ⚡</Text>
                        <Text style={styles.heroSub}>
                            Upgrade to Pro ($19/mo) to unlock Design Library, Nesting Tool, and Invoice Generator.
                        </Text>
                    </View>

                    {/* Plans list */}
                    <View style={styles.plansContainer}>
                        {[
                            {
                                id: 'pro',
                                name: 'Pro Workshop',
                                price: '$19',
                                desc: 'Design Library + Nesting Tool + Invoice Generator + Unlimited Projects & Analytics',
                                popular: true,
                            },
                            {
                                id: 'hobby',
                                name: 'Hobbyist',
                                price: '$9',
                                desc: 'Core Planner tools for small workshops & hobbyists',
                                popular: false,
                            },
                            {
                                id: 'biz',
                                name: 'Industrial',
                                price: '$69',
                                desc: 'Multi-user team (5), custom invoice branding, unlimited machine profiles, priority support',
                                popular: false,
                            },
                        ].map((plan) => {
                            const isSelected = selectedPlan === plan.id;
                            return (
                                <TouchableOpacity
                                    key={plan.id}
                                    style={[
                                        styles.planCard,
                                        isSelected && styles.planCardSelected,
                                        plan.popular && styles.planCardPopularBorder,
                                    ]}
                                    onPress={() => setSelectedPlan(plan.id as any)}
                                    activeOpacity={0.8}
                                >
                                    {plan.popular && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                                        </View>
                                    )}
                                    <View style={styles.planHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.planName, isSelected && { color: C.primary }]}>
                                                {plan.name}
                                            </Text>
                                            <Text style={styles.planDesc}>{plan.desc}</Text>
                                        </View>
                                        <View style={styles.planPriceInfo}>
                                            <Text style={styles.planPrice}>{plan.price}</Text>
                                            <Text style={styles.planPeriod}>/mo</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Security note */}
                    <Text style={styles.pricingNote}>
                        🔒 Secure checkout via Stripe & PayPal · Cancel anytime
                    </Text>

                    {/* Features overview */}
                    <Text style={styles.sectionTitle}>FEATURES OVERVIEW</Text>
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

                </ScrollView>

                {/* Sticky CTA */}
                <View style={styles.ctaWrap}>
                    <Animated.View style={[styles.ctaShadow, { shadowOpacity }]}>
                        <TouchableOpacity
                            style={styles.ctaBtn}
                            onPress={() => startCheckout(getPriceId())}
                            disabled={checkoutLoading}
                            activeOpacity={0.85}
                        >
                            {checkoutLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Zap color="#FFF" size={18} fill="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.ctaText}>
                                        Subscribe - {getPlanPriceText()}
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
    heroSection: { alignItems: 'center', paddingTop: 12, paddingBottom: 20 },
    badgeRow: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: C.goldGlow, borderWidth: 1, borderColor: `${C.gold}50`,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16,
    },
    badge: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 2 },
    heroTitle: { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center', lineHeight: 36 },
    heroSub: { fontSize: 14, color: C.sub, textAlign: 'center', marginTop: 8, lineHeight: 20 },

    // Plans list
    plansContainer: { gap: 12, marginBottom: 16 },
    planCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: C.border,
        position: 'relative',
    },
    planCardSelected: {
        borderColor: C.primary,
        backgroundColor: 'rgba(255,107,53,0.06)',
    },
    planCardPopularBorder: {
        borderColor: 'rgba(245,158,11,0.4)',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        backgroundColor: C.gold,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    popularBadgeText: {
        color: C.bg,
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    planName: {
        fontSize: 16,
        fontWeight: '800',
        color: C.text,
    },
    planDesc: {
        fontSize: 11,
        color: C.sub,
        marginTop: 4,
        paddingRight: 10,
        lineHeight: 15,
    },
    planPriceInfo: {
        alignItems: 'flex-end',
    },
    planPrice: {
        fontSize: 22,
        fontWeight: '900',
        color: C.text,
    },
    planPeriod: {
        fontSize: 10,
        color: C.sub,
    },
    pricingNote: { fontSize: 13, color: C.dim, textAlign: 'center', marginBottom: 20 },

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
});
