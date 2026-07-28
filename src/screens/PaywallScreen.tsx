import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { X, Zap, Check, ShieldCheck } from 'lucide-react-native';
import { useSubscription, BillingCycle } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';

const C = {
    bg: '#0F1117',
    surface: '#1C2030',
    surface2: '#242840',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    text: '#FFFFFF',
    sub: '#8B95A8',
    green: '#10B981',
};

export default function PaywallScreen() {
    const navigation = useNavigation();
    const { createCheckoutSession, checkoutLoading } = useSubscription();
    const { t } = useLanguage();
    const [cycle, setCycle] = useState<BillingCycle>('annual');

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                        <X color={C.text} size={20} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Your 0Machine Plan</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll}>
                    {/* Hero Header */}
                    <View style={styles.heroWrap}>
                        <Zap color={C.primary} size={36} fill={C.primary} />
                        <Text style={styles.heroTitle}>{t('tagline')}</Text>
                        <Text style={styles.heroSub}>{t('sub_tagline')}</Text>
                    </View>

                    {/* Cycle Toggle */}
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, cycle === 'monthly' && styles.activeToggleBtn]}
                            onPress={() => setCycle('monthly')}
                        >
                            <Text style={[styles.toggleBtnText, cycle === 'monthly' && styles.activeToggleText]}>
                                {t('billing_monthly')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, cycle === 'annual' && styles.activeToggleBtn]}
                            onPress={() => setCycle('annual')}
                        >
                            <Text style={[styles.toggleBtnText, cycle === 'annual' && styles.activeToggleText]}>
                                {t('billing_annual')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Plans */}
                    <View style={styles.plansWrap}>
                        {/* Free Plan */}
                        <View style={styles.planCard}>
                            <Text style={styles.planName}>{t('plan_free')}</Text>
                            <Text style={styles.price}>{t('price_free')}</Text>
                            <View style={styles.benefits}>
                                <Benefit text="3 Projects per Month" />
                                <Benefit text="1 Machine Profile" />
                                <Benefit text="Basic Job Cost Calculator" />
                                <Benefit text="PDF Quote Export" />
                            </View>
                            <TouchableOpacity style={styles.freeBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.freeBtnText}>{t('cta_start_free')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Starter Plan */}
                        <View style={styles.planCard}>
                            <View style={styles.badgeWrap}><Text style={styles.badgeText}>{t('most_popular')}</Text></View>
                            <Text style={styles.planName}>{t('plan_starter')}</Text>
                            <Text style={styles.price}>{cycle === 'annual' ? '$59/yr' : '$9/mo'}</Text>
                            <View style={styles.benefits}>
                                <Benefit text="Unlimited Projects & Machines" />
                                <Benefit text="Material Stock Inventory" />
                                <Benefit text="Laser Presets Library" />
                                <Benefit text="PDF Quotes & Invoices" />
                                <Benefit text="Design Library Access" />
                            </View>
                            <TouchableOpacity
                                style={styles.starterBtn}
                                onPress={() => createCheckoutSession('starter', cycle)}
                                disabled={checkoutLoading}
                            >
                                <Text style={styles.starterBtnText}>{t('cta_upgrade_starter')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Workshop Pro Plan */}
                        <View style={[styles.planCard, styles.proCard]}>
                            <View style={[styles.badgeWrap, { backgroundColor: C.primary }]}><Text style={styles.badgeText}>{t('best_value')}</Text></View>
                            <Text style={[styles.planName, { color: C.primary }]}>{t('plan_pro')}</Text>
                            <Text style={styles.price}>{cycle === 'annual' ? '$149/yr' : '$19/mo'}</Text>
                            <View style={styles.benefits}>
                                <Benefit text="Everything in Starter +" bold />
                                <Benefit text="Nesting Yield Calculator" bold />
                                <Benefit text="1-Click WhatsApp Sharing" bold />
                                <Benefit text="CSV & Excel Data Exports" bold />
                                <Benefit text="Team Workspace (3 Users)" bold />
                                <Benefit text="Commercial Vector Packs" bold />
                            </View>
                            <TouchableOpacity
                                style={styles.proBtn}
                                onPress={() => createCheckoutSession('pro', cycle)}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.proBtnText}>{t('cta_upgrade_pro')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footerWrap}>
                        <ShieldCheck color={C.green} size={16} />
                        <Text style={styles.footerText}>All plans processed via Stripe SSL Secure Checkout. Cancel anytime.</Text>
                    </View>
                </ScrollView>
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

function Benefit({ text, bold }: { text: string; bold?: boolean }) {
    return (
        <View style={styles.benefitRow}>
            <Check color={bold ? C.primary : C.green} size={14} />
            <Text style={[styles.benefitText, bold && { fontWeight: '700', color: C.text }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 54, borderBottomWidth: 1, borderBottomColor: C.border },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800', color: C.text },
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },

    heroWrap: { alignItems: 'center', gap: 8, marginBottom: 8 },
    heroTitle: { fontSize: 20, fontWeight: '900', color: C.text, textAlign: 'center' },
    heroSub: { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 18 },

    toggleRow: { flexDirection: 'row', backgroundColor: C.surface2, borderRadius: 12, padding: 4, alignSelf: 'center', width: '100%', maxWidth: 360 },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeToggleBtn: { backgroundColor: C.primary },
    toggleBtnText: { fontSize: 12, fontWeight: '700', color: C.sub },
    activeToggleText: { color: '#FFF' },

    plansWrap: { gap: 14 },
    planCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, position: 'relative' },
    proCard: { borderColor: C.primary + '80', backgroundColor: '#1C120C' },
    badgeWrap: { position: 'absolute', top: 12, right: 12, backgroundColor: C.surface2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
    planName: { fontSize: 18, fontWeight: '800', color: C.text },
    price: { fontSize: 26, fontWeight: '900', color: C.text, marginTop: 4, marginBottom: 12 },
    benefits: { gap: 8, marginBottom: 16 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    benefitText: { fontSize: 13, color: C.sub },

    freeBtn: { backgroundColor: C.surface2, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    freeBtnText: { color: C.text, fontWeight: '700', fontSize: 14 },
    starterBtn: { backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    starterBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
    proBtn: { backgroundColor: C.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    proBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

    footerWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
    footerText: { fontSize: 12, color: C.sub },
});
