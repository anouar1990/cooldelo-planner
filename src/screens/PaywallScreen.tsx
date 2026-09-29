import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    ScrollView, ActivityIndicator, Image, Platform, TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import {
    X, Zap, Check, ShieldCheck, Tag, Sparkles,
    Wrench, Clock, RefreshCw, Scissors, FileText, ChevronRight
} from 'lucide-react-native';
import { useSubscription, BillingCycle } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';

const C = {
    bg: '#0B0D14',
    surface: '#151924',
    surface2: '#1F2434',
    border: 'rgba(255,255,255,0.1)',
    borderPrimary: 'rgba(255,107,53,0.4)',
    primary: '#FF6B35',
    primaryGlow: 'rgba(255,107,53,0.15)',
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

                    {/* Headline Section (Large 45+ readable typography) */}
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>
                            Unlock the Full 0machine Workshop
                        </Text>
                        <Text style={styles.subtitle}>
                            The all-in-one planning toolkit engineered for laser cutting, CNC, and woodworking business owners.
                        </Text>
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
                                    ANNUAL
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
                                <Sparkles color="#FFFFFF" size={12} />
                                <Text style={styles.popularRibbonText}>RECOMMENDED FOR WORKSHOPS</Text>
                            </View>

                            <View style={styles.planCardHeader}>
                                <View>
                                    <Text style={styles.planTitlePro}>Workshop Pro</Text>
                                    <Text style={styles.planSubtext}>Unlimited fabrication power</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.priceNumber}>
                                        {cycle === 'annual' ? '$149' : '$19'}
                                    </Text>
                                    <Text style={styles.pricePeriod}>
                                        {cycle === 'annual' ? '$12.41/mo billed yearly' : 'per month'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.benefitList}>
                                <BenefitRow text="Unlimited Projects & Machine Profiles" bold />
                                <BenefitRow text="Nesting Yield & Material Cost Calculator" bold />
                                <BenefitRow text="PDF Quotes, Invoices & 1-Click WhatsApp Sharing" bold />
                                <BenefitRow text="500+ Commercial DXF/SVG Design Library" bold />
                                <BenefitRow text="Team Workspace (3 Users) & CSV/Excel Exports" bold />
                            </View>
                        </TouchableOpacity>

                        {/* Starter Plan Card (Secondary Option) */}
                        <TouchableOpacity
                            style={[
                                styles.planCard,
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
                                        {cycle === 'annual' ? '$59' : '$9'}
                                    </Text>
                                    <Text style={styles.pricePeriod}>
                                        {cycle === 'annual' ? '$4.91/mo billed yearly' : 'per month'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.benefitList}>
                                <BenefitRow text="Unlimited Projects & Machines" />
                                <BenefitRow text="Material Inventory & Laser Presets" />
                                <BenefitRow text="PDF Quote & Invoice Generator" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Timeline / Value Progression Section */}
                    <View style={styles.timelineSection}>
                        <Text style={styles.sectionHeading}>What Happens When You Join Pro</Text>

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineIconBadge}>
                                <Zap color={C.primary} size={20} />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineStepTitle}>TODAY</Text>
                                <Text style={styles.timelineStepDesc}>
                                    Instant unlock for all Pro features & 500+ commercial laser design files.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineIconBadge}>
                                <Scissors color={C.primary} size={20} />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineStepTitle}>IN YOUR DAILY WORKSHOP</Text>
                                <Text style={styles.timelineStepDesc}>
                                    Automate job costing, nesting, material stock, and cut time estimates.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineIconBadge}>
                                <FileText color={C.primary} size={20} />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineStepTitle}>GROW YOUR BUSINESS</Text>
                                <Text style={styles.timelineStepDesc}>
                                    Send crisp PDF quotes & invoices to clients via WhatsApp or Email.
                                </Text>
                            </View>
                        </View>
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
                                    {selectedPlan === 'pro' ? 'Start 0machine Pro' : 'Start Starter Plan'}
                                </Text>
                                <ChevronRight color="#FFFFFF" size={24} />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Secondary Option: Free Forever */}
                    <TouchableOpacity
                        style={styles.freeOptionBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.freeOptionText}>Keep using Free Forever</Text>
                    </TouchableOpacity>

                    <View style={styles.securityBadgeRow}>
                        <ShieldCheck color={C.green} size={14} />
                        <Text style={styles.securityBadgeText}>
                            Processed via Stripe SSL Secure Checkout · Cancel Anytime
                        </Text>
                    </View>
                </View>
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

function BenefitRow({ text, bold }: { text: string; bold?: boolean }) {
    return (
        <View style={styles.benefitRow}>
            <View style={[styles.checkCircle, bold && styles.checkCircleBold]}>
                <Check color="#FFFFFF" size={13} strokeWidth={3} />
            </View>
            <Text style={[styles.benefitText, bold && styles.benefitTextBold]}>
                {text}
            </Text>
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
        backgroundColor: C.primary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    popularRibbonText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#FFFFFF',
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

    /* Timeline Section */
    timelineSection: {
        backgroundColor: C.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        padding: 20,
        marginBottom: 20,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: C.text,
        marginBottom: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        marginBottom: 16,
    },
    timelineIconBadge: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: C.primaryGlow,
        borderWidth: 1,
        borderColor: C.borderPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    timelineContent: {
        flex: 1,
    },
    timelineStepTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: C.primary,
        letterSpacing: 1,
        marginBottom: 2,
    },
    timelineStepDesc: {
        fontSize: 14,
        color: C.sub,
        lineHeight: 20,
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

