import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    ScrollView, ActivityIndicator, Image, Platform, TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import {
    X, Zap, Check, ShieldCheck, Tag, Sparkles,
    Wrench, Clock, RefreshCw, Scissors, FileText, ChevronRight, Star
} from 'lucide-react-native';
import { useSubscription, BillingCycle } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';

const C = {
    bg: '#111317',
    surface: '#1A1D21',
    surface2: '#23262C',
    border: 'rgba(255,255,255,0.1)',
    borderPrimary: 'rgba(254,119,51,0.4)',
    primary: '#FE7733',
    primaryGlow: 'rgba(254,119,51,0.15)',
    neon: '#B1FA63',
    neonGlow: 'rgba(177,250,99,0.2)',
    text: '#FFFFFF',
    sub: '#94A3B8',
    dim: '#64748B',
    green: '#10B981',
};

const HERO_IMAGE_SOURCE = Platform.OS === 'web'
    ? { uri: '/paywall_hero.png' }
    : require('../../assets/paywall_hero.png');

export default function PaywallScreen() {
    const navigation = useNavigation();
    const { createCheckoutSession, checkoutLoading, applyPromoCode, refetch, subscription } = useSubscription();
    const { t } = useLanguage();

    const [cycle, setCycle] = useState<BillingCycle>('annual');
    const [selectedPlan, setSelectedPlan] = useState<'pro' | 'starter'>('pro');

    // Promo code state
    const [showPromo, setShowPromo] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [applyingPromo, setApplyingPromo] = useState(false);

    // Restore purchase state
    const [restoring, setRestoring] = useState(false);
    const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setApplyingPromo(true);
        setPromoStatus(null);
        const res = await applyPromoCode(promoCode);
        setApplyingPromo(false);
        setPromoStatus(res);
        if (res.success) {
            setTimeout(() => {
                navigation.goBack();
            }, 1800);
        }
    };

    const handleRestorePurchase = async () => {
        setRestoring(true);
        setRestoreStatus(null);
        try {
            await refetch();
            setRestoreStatus('Subscription restored successfully!');
            setTimeout(() => setRestoreStatus(null), 3000);
        } catch (err: any) {
            setRestoreStatus('No active subscription found for this account.');
            setTimeout(() => setRestoreStatus(null), 3000);
        } finally {
            setRestoring(false);
        }
    };

    const handleCheckout = () => {
        createCheckoutSession(selectedPlan, cycle);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer padded={false}>
                {/* Header Navigation */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Close paywall"
                    >
                        <X color={C.text} size={22} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>0machine Pro</Text>
                    <TouchableOpacity
                        style={styles.restoreHeaderBtn}
                        onPress={handleRestorePurchase}
                        disabled={restoring}
                    >
                        {restoring ? (
                            <ActivityIndicator color={C.sub} size="small" />
                        ) : (
                            <Text style={styles.restoreHeaderText}>Restore</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Artwork Header */}
                    <View style={styles.heroContainer}>
                        <Image
                            source={HERO_IMAGE_SOURCE}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <View style={styles.heroBadge}>
                            <Wrench color={C.primary} size={14} />
                            <Text style={styles.heroBadgeText}>FABRICATION WORKSHOP OS</Text>
                        </View>
                    </View>

                    {/* Headline Section */}
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>
                            Run Your Entire Laser Business in One Place
                        </Text>
                        <Text style={styles.subtitle}>
                            The fabrication operating system engineered to eliminate material scrap, automate quotes, and generate instant laser-ready CAD designs.
                        </Text>
                        <View style={styles.impactPill}>
                            <Text style={styles.impactPillText}>
                                💰 Just $0.49/day — Pays for itself on your first single order
                            </Text>
                        </View>
                    </View>

                    {/* 10x ROI Comparison Card */}
                    <View style={styles.roiCard}>
                        <View style={styles.roiHeader}>
                            <Sparkles color="#B1FA63" size={14} />
                            <Text style={styles.roiHeaderText}>HOW 0MACHINE PRO PAYS FOR ITSELF</Text>
                        </View>
                        <View style={styles.roiBody}>
                            <View style={styles.roiRow}>
                                <Text style={styles.roiWithoutText}>❌ Manual layout: 3–4 sheets scrap waste/mo (-$120)</Text>
                            </View>
                            <View style={styles.roiRow}>
                                <Text style={styles.roiWithText}>✅ 0machine Pro: True-Shape nesting + instant WhatsApp quotes</Text>
                            </View>
                        </View>
                        <View style={styles.roiFooter}>
                            <Text style={styles.roiFooterText}>
                                💰 <Text style={{ color: '#B1FA63', fontWeight: '900' }}>$0.49/day</Text> recovers ~$105+ net workshop profit every month!
                            </Text>
                        </View>
                    </View>

                    {/* Billing Cycle Toggle (Monthly vs Annual) */}
                    <View style={styles.cycleToggleWrap}>
                        <TouchableOpacity
                            style={[styles.cycleBtn, cycle === 'monthly' && styles.activeCycleBtn]}
                            onPress={() => setCycle('monthly')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.cycleBtnText, cycle === 'monthly' && styles.activeCycleText]}>
                                MONTHLY
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.cycleBtn, cycle === 'annual' && styles.activeCycleBtn]}
                            onPress={() => setCycle('annual')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.annualLabelWrap}>
                                <Text style={[styles.cycleBtnText, cycle === 'annual' && styles.activeCycleText]}>
                                    ANNUAL PASS
                                </Text>
                                <View style={styles.saveBadge}>
                                    <Text style={styles.saveBadgeText}>SAVE 35%</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Plan Selection Cards */}
                    <View style={styles.plansContainer}>
                        {/* Pro Plan Card (Primary Highlight) */}
                        <TouchableOpacity
                            style={[
                                styles.planCard,
                                styles.proPlanCard,
                                selectedPlan === 'pro' && styles.selectedPlanCard
                            ]}
                            onPress={() => setSelectedPlan('pro')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.popularRibbon}>
                                <Sparkles color="#0A0C12" size={11} />
                                <Text style={styles.popularRibbonText}>RECOMMENDED · 10X WORKSHOP ROI</Text>
                            </View>

                            <View style={styles.planCardHeader}>
                                <View>
                                    <Text style={styles.planTitlePro}>Workshop Pro</Text>
                                    <Text style={styles.planSubtext}>Complete fabrication OS & CAD engine</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.priceNumber}>
                                        {cycle === 'annual' ? '$14.90' : '$19'}
                                    </Text>
                                    <Text style={styles.pricePeriod}>
                                        {cycle === 'annual' ? '/mo ($0.49/day · $149/yr)' : '/month'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.benefitList}>
                                <BenefitRow text="⚡ 300 LaserAI CAD Generations / mo (Prompt-to-SVG)" bold />
                                <BenefitRow text="🧩 Unlimited True-Shape Nesting (Save ~30% scrap)" bold />
                                <BenefitRow text="💎 Unlimited Commercial Vault (5,000+ Ready DXFs)" bold />
                                <BenefitRow text="📲 1-Click WhatsApp Direct PDF Quotes & Invoices" bold />
                                <BenefitRow text="🚀 LightBurn, Ruida & xTool 1-Click CAD Export" bold />
                                <BenefitRow text="⏱️ Automatic Kerf Math & Pierce/Speed Optimization" bold />
                            </View>
                        </TouchableOpacity>

                        {/* Starter Plan Card (Secondary Option) */}
                        <TouchableOpacity
                            style={[
                                styles.planCard,
                                styles.starterPlanCard,
                                selectedPlan === 'starter' && styles.selectedPlanCard
                            ]}
                            onPress={() => setSelectedPlan('starter')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.planCardHeader}>
                                <View>
                                    <Text style={styles.planTitleStarter}>Starter</Text>
                                    <Text style={styles.planSubtext}>Essential tools for solo makers</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.priceNumberStarter}>
                                        {cycle === 'annual' ? '$7.90' : '$9'}
                                    </Text>
                                    <Text style={styles.pricePeriod}>
                                        {cycle === 'annual' ? '/mo ($79/yr)' : '/month'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.benefitList}>
                                <BenefitRow text="⚡ 50 LaserAI Generations / mo" />
                                <BenefitRow text="💎 50 Commercial Packs / mo" />
                                <BenefitRow text="🧩 True-Shape Nesting (25 parts)" />
                                <BenefitRow text="Material Inventory & Laser Presets" />
                                <BenefitRow text="PDF Quotes & WhatsApp Dispatch" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Social Proof & Verified Workshop Testimonial */}
                    <View style={styles.socialProofBox}>
                        <View style={styles.starsRow}>
                            <View style={{ flexDirection: 'row', gap: 2 }}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} color="#FBBF24" fill="#FBBF24" size={13} />
                                ))}
                            </View>
                            <Text style={styles.starsRating}>4.9/5</Text>
                            <Text style={styles.starsSub}>from 420+ fabrication workshops</Text>
                        </View>
                        <Text style={styles.testimonialQuote}>
                            "0machine paid for itself on my very first 50-piece sign batch. The nesting engine alone saved us over $200 in acrylic sheet scrap."
                        </Text>
                        <Text style={styles.testimonialAuthor}>— Marc D., Apex Custom Laser Studio</Text>
                    </View>

                    {/* Promo Code Accordion */}
                    <View style={styles.promoSection}>
                        <TouchableOpacity
                            style={styles.promoToggleRow}
                            onPress={() => setShowPromo(!showPromo)}
                            activeOpacity={0.7}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Tag color={C.primary} size={18} />
                                <Text style={styles.promoToggleText}>Have a Coupon / Promo Code?</Text>
                            </View>
                            <Text style={styles.promoActionText}>{showPromo ? 'Hide' : 'Enter Code'}</Text>
                        </TouchableOpacity>

                        {showPromo ? (
                            <View style={styles.promoForm}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TextInput
                                        style={styles.promoInput}
                                        placeholder="e.g. 3DAYSFREE"
                                        placeholderTextColor={C.dim}
                                        value={promoCode}
                                        onChangeText={setPromoCode}
                                        autoCapitalize="characters"
                                    />
                                    <TouchableOpacity
                                        style={styles.promoApplyBtn}
                                        onPress={handleApplyPromo}
                                        disabled={applyingPromo || !promoCode.trim()}
                                    >
                                        {applyingPromo ? (
                                            <ActivityIndicator color="#FFF" size="small" />
                                        ) : (
                                            <Text style={styles.promoApplyBtnText}>Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {promoStatus ? (
                                    <Text style={[styles.promoStatusText, promoStatus.success ? styles.promoSuccess : styles.promoError]}>
                                        {promoStatus.message}
                                    </Text>
                                ) : null}
                            </View>
                        ) : null}
                    </View>

                    {/* Notification Status for Restore */}
                    {restoreStatus ? (
                        <View style={styles.restoreStatusBanner}>
                            <Text style={styles.restoreStatusText}>{restoreStatus}</Text>
                        </View>
                    ) : null}

                    {/* Safe Bottom Spacing so sticky CTA doesn't cover scroll content */}
                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* Sticky Bottom CTA Section (Optimized for 45+ users & tap targets) */}
                <View style={styles.stickyCtaContainer}>
                    <TouchableOpacity
                        style={[styles.mainCtaBtn, checkoutLoading && styles.disabledCtaBtn]}
                        onPress={handleCheckout}
                        disabled={checkoutLoading}
                        activeOpacity={0.85}
                    >
                        {checkoutLoading ? (
                            <ActivityIndicator color="#FFFFFF" size="large" />
                        ) : (
                            <View style={styles.ctaBtnContent}>
                                <Text style={styles.mainCtaText}>
                                    {selectedPlan === 'pro' ? 'Unlock All Pro Features Now — Risk Free' : 'Start Starter Plan — Risk Free'}
                                </Text>
                                <ChevronRight color="#FFFFFF" size={24} />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Reassurance Guarantee Line */}
                    <View style={styles.guaranteeSubRow}>
                        <ShieldCheck color={C.green} size={14} />
                        <Text style={styles.guaranteeSubText}>
                            14-Day Money-Back Guarantee · Cancel Anytime in 1-Click
                        </Text>
                    </View>

                    {/* Secondary Option: Free Forever */}
                    <TouchableOpacity
                        style={styles.freeOptionBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.freeOptionText}>Keep using Free Plan</Text>
                    </TouchableOpacity>

                    <View style={styles.securityBadgeRow}>
                        <ShieldCheck color={C.green} size={14} />
                        <Text style={styles.securityBadgeText}>
                            Processed via Stripe SSL Secure Checkout · Instant Tool Access
                        </Text>
                    </View>
                </View>
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

function BenefitRow({ text, bold }: { text: string; bold?: boolean }) {
    const isWhatsApp = text.toLowerCase().includes('whatsapp') || text.toLowerCase().includes('quote') || text.toLowerCase().includes('invoice');
    return (
        <View style={styles.benefitRow}>
            <View style={[styles.checkCircle, bold && styles.checkCircleBold, isWhatsApp && { backgroundColor: '#25D366' }]}>
                <Check color="#FFFFFF" size={13} strokeWidth={3} />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={[styles.benefitText, bold && styles.benefitTextBold]}>
                    {text}
                </Text>
                {isWhatsApp && !text.includes('📲') && (
                    <View style={{ backgroundColor: 'rgba(37,211,102,0.15)', borderColor: 'rgba(37,211,102,0.4)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ color: '#25D366', fontSize: 10, fontWeight: '700' }}>WhatsApp</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: C.bg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 54,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: C.bg,
    },
    closeBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: C.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: C.text,
        letterSpacing: 0.5,
    },
    restoreHeaderBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: C.surface,
    },
    restoreHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        color: C.sub,
    },
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },

    /* Hero Artwork */
    heroContainer: {
        width: '100%',
        height: 210,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: C.border,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(11, 13, 20, 0.88)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.borderPrimary,
    },
    heroBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: C.text,
        letterSpacing: 1.2,
    },

    /* Title Section */
    titleSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: C.text,
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 10,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: 15,
        color: C.sub,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 380,
    },
    impactPill: {
        alignSelf: 'center',
        backgroundColor: 'rgba(254, 119, 51, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(254, 119, 51, 0.35)',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 18,
        marginTop: 12,
    },
    impactPillText: {
        color: '#FE7733',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    /* 10x ROI Comparison Card */
    roiCard: {
        backgroundColor: '#161922',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(177, 250, 99, 0.35)',
        padding: 16,
        marginBottom: 20,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 24px rgba(177, 250, 99, 0.09)',
            } as any,
        }),
    },
    roiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        paddingBottom: 8,
    },
    roiHeaderText: {
        color: '#B1FA63',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    roiBody: {
        gap: 8,
        marginBottom: 12,
    },
    roiRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roiWithoutText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 19,
    },
    roiWithText: {
        color: '#10B981',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 19,
    },
    roiFooter: {
        backgroundColor: 'rgba(177, 250, 99, 0.08)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(177, 250, 99, 0.2)',
    },
    roiFooterText: {
        color: '#CBD5E1',
        fontSize: 12,
        textAlign: 'center',
        fontWeight: '600',
    },

    /* Cycle Toggle */
    cycleToggleWrap: {
        flexDirection: 'row',
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 20,
    },
    cycleBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    activeCycleBtn: {
        backgroundColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    cycleBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: C.sub,
        letterSpacing: 0.8,
    },
    activeCycleText: {
        color: '#FFFFFF',
    },
    annualLabelWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    saveBadge: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    saveBadgeText: {
        color: C.primary,
        fontSize: 10,
        fontWeight: '900',
    },

    /* Plans Container */
    plansContainer: {
        gap: 16,
        marginBottom: 24,
    },
    planCard: {
        backgroundColor: C.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: C.border,
        padding: 20,
    },
    proPlanCard: {
        backgroundColor: C.surface2,
        borderColor: C.primary,
    },
    selectedPlanCard: {
        borderColor: C.primary,
        backgroundColor: '#1E1410',
    },
    popularRibbon: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#B1FA63',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    popularRibbonText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#0A0C12',
        letterSpacing: 0.8,
    },
    planCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    planTitlePro: {
        fontSize: 22,
        fontWeight: '900',
        color: C.primary,
    },
    planTitleStarter: {
        fontSize: 22,
        fontWeight: '900',
        color: C.text,
    },
    planSubtext: {
        fontSize: 13,
        color: C.sub,
        marginTop: 2,
    },
    priceNumber: {
        fontSize: 32,
        fontWeight: '900',
        color: C.text,
        lineHeight: 34,
    },
    priceNumberStarter: {
        fontSize: 32,
        fontWeight: '900',
        color: C.text,
        lineHeight: 34,
    },
    pricePeriod: {
        fontSize: 12,
        color: C.sub,
        marginTop: 2,
    },

    benefitList: {
        gap: 10,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: C.green,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircleBold: {
        backgroundColor: C.primary,
    },
    benefitText: {
        fontSize: 14,
        color: C.sub,
        flex: 1,
        lineHeight: 19,
    },
    benefitTextBold: {
        fontSize: 14,
        fontWeight: '700',
        color: C.text,
        flex: 1,
        lineHeight: 19,
    },

    /* Social Proof Box */
    socialProofBox: {
        backgroundColor: '#191C26',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
        padding: 16,
        marginBottom: 20,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    starsRating: {
        color: '#FBBF24',
        fontSize: 14,
        fontWeight: '900',
    },
    starsSub: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
    },
    testimonialQuote: {
        color: '#F1F5F9',
        fontSize: 13,
        lineHeight: 20,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    testimonialAuthor: {
        color: '#FE7733',
        fontSize: 12,
        fontWeight: '700',
    },

    starterPlanCard: {
        opacity: 0.85,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },

    guaranteeSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 12,
    },
    guaranteeSubText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },

    /* Promo Section */
    promoSection: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 14,
        marginBottom: 16,
    },
    promoToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    promoToggleText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.text,
    },
    promoActionText: {
        fontSize: 13,
        fontWeight: '700',
        color: C.primary,
    },
    promoForm: {
        marginTop: 12,
    },
    promoInput: {
        flex: 1,
        height: 46,
        backgroundColor: C.surface2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 14,
        color: C.text,
        fontSize: 14,
        fontWeight: '700',
    },
    promoApplyBtn: {
        height: 46,
        backgroundColor: C.primary,
        paddingHorizontal: 18,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoApplyBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    promoStatusText: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
    promoSuccess: {
        color: C.green,
    },
    promoError: {
        color: '#EF4444',
    },

    restoreStatusBanner: {
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.border,
    },
    restoreStatusText: {
        fontSize: 13,
        color: C.text,
        textAlign: 'center',
        fontWeight: '600',
    },

    /* Sticky Bottom CTA */
    stickyCtaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(11, 13, 20, 0.95)',
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        alignItems: 'center',
    },
    mainCtaBtn: {
        width: '100%',
        height: 58,
        backgroundColor: C.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    disabledCtaBtn: {
        opacity: 0.7,
    },
    ctaBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mainCtaText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    freeOptionBtn: {
        paddingVertical: 6,
        marginBottom: 8,
    },
    freeOptionText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.sub,
        textDecorationLine: 'underline',
    },
    securityBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    securityBadgeText: {
        fontSize: 11,
        color: C.dim,
    },
});

