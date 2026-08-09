import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { X, Zap, Lock, Sparkles, Check, ShieldCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSubscription, BillingCycle } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
  actionTitle?: string;
  description?: string;
}

const C = {
  bg: '#0A0C12',
  surface: '#13151F',
  surface2: '#1C2030',
  border: 'rgba(255,255,255,0.08)',
  primary: '#FF6B35',
  textSub: '#8B95A8',
  text: '#F1F5F9',
  gold: '#F59E0B',
  green: '#10B981',
};

import { TextInput, ActivityIndicator } from 'react-native';
import { Tag } from 'lucide-react-native';

export function ProUpgradeModal({
  visible,
  onClose,
  featureName = 'Premium Feature',
  actionTitle = 'Unlock Full Workshop Power',
  description = 'Upgrade your plan to get access to advanced laser tools, design files, nesting, and exports.',
}: ProUpgradeModalProps) {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { createCheckoutSession, checkoutLoading, applyPromoCode } = useSubscription();
  const { t } = useLanguage();
  const isDesktop = width > 768;
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    setPromoStatus(null);
    const res = await applyPromoCode(promoCode);
    setApplyingPromo(false);
    setPromoStatus(res);
    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  const handleChoosePlan = (plan: 'starter' | 'pro') => {
    createCheckoutSession(plan, cycle);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.modalCard, isDesktop && styles.modalCardDesktop]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={C.textSub} size={20} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header Icon & Title */}
            <View style={styles.iconWrap}>
              <Zap color={C.primary} size={28} fill={C.primary} />
              <View style={styles.lockBadge}>
                <Lock color="#FFF" size={10} />
              </View>
            </View>

            <Text style={styles.badgeText}>{featureName.toUpperCase()}</Text>
            <Text style={styles.title}>{actionTitle}</Text>
            <Text style={styles.subText}>{description}</Text>

            {/* Promo Code Box */}
            <View style={styles.promoCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Tag color={C.primary} size={14} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>Have a Promo / Coupon Code?</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="e.g. 1MONTHFREE or FREE30"
                  placeholderTextColor={C.textSub}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.promoBtn}
                  onPress={handleApplyPromo}
                  disabled={applyingPromo || !promoCode.trim()}
                >
                  {applyingPromo ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.promoBtnText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {promoStatus ? (
                <Text style={[styles.promoMsgText, promoStatus.success ? styles.promoSuccessText : styles.promoErrorText]}>
                  {promoStatus.message}
                </Text>
              ) : null}
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

            {/* Plans Grid */}
            <View style={styles.plansContainer}>
              {/* Starter Plan Card */}
              <View style={styles.planCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.planName}>{t('plan_starter')}</Text>
                  <Text style={styles.planPrice}>
                    {cycle === 'annual' ? '$59' : '$9'}
                    <Text style={styles.planPeriod}>{cycle === 'annual' ? '/yr' : '/mo'}</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: C.green, fontWeight: '700', marginTop: 2 }}>
                    🎁 1 Month Free Trial with code 1MONTHFREE
                  </Text>
                </View>
                <View style={styles.benefits}>
                  <Benefit text="Unlimited Projects & Machines" />
                  <Benefit text="PDF Quotes & Invoices" />
                  <Benefit text="Material Inventory Stock" />
                  <Benefit text="Laser Presets Library" />
                  <Benefit text="Design Library Access" />
                </View>
                <TouchableOpacity
                  style={styles.starterBtn}
                  onPress={() => handleChoosePlan('starter')}
                  disabled={checkoutLoading}
                >
                  <Text style={styles.starterBtnText}>{t('cta_upgrade_starter')}</Text>
                </TouchableOpacity>
              </View>

              {/* Workshop Pro Plan Card */}
              <View style={[styles.planCard, styles.proPlanCard]}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{t('best_value')}</Text>
                </View>
                <View style={styles.cardHeader}>
                  <Text style={[styles.planName, { color: C.primary }]}>{t('plan_pro')}</Text>
                  <Text style={styles.planPrice}>
                    {cycle === 'annual' ? '$149' : '$19'}
                    <Text style={styles.planPeriod}>{cycle === 'annual' ? '/yr' : '/mo'}</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: C.primary, fontWeight: '700', marginTop: 2 }}>
                    🎁 1 Month Free Trial with code 1MONTHFREE
                  </Text>
                </View>
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
                  onPress={() => handleChoosePlan('pro')}
                  disabled={checkoutLoading}
                >
                  <Text style={styles.proBtnText}>{t('cta_upgrade_pro')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerNote}>
              <ShieldCheck color={C.green} size={14} />
              <Text style={styles.footerNoteText}>Secure checkout processed via Stripe · Cancel anytime</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', padding: 12,
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    width: '100%', maxWidth: 520, maxHeight: '92%', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, position: 'relative',
  },
  modalCardDesktop: { maxWidth: 640 },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6, backgroundColor: C.surface2, borderRadius: 16 },
  content: { alignItems: 'center', paddingBottom: 16 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary + '20',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative', marginTop: 4,
  },
  lockBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: C.primary,
    borderRadius: 8, padding: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 1.2, marginBottom: 2 },
  title: { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 4 },
  subText: { fontSize: 12, color: C.textSub, textAlign: 'center', marginBottom: 10, lineHeight: 16 },
  
  promoCard: {
    width: '100%',
    backgroundColor: C.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    marginBottom: 12,
  },
  promoInput: {
    flex: 1,
    height: 38,
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
  },
  promoBtn: {
    height: 38,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  promoMsgText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  promoSuccessText: {
    color: C.green,
  },
  promoErrorText: {
    color: '#EF4444',
  },

  toggleRow: {
    flexDirection: 'row', backgroundColor: C.surface2, borderRadius: 10, padding: 3,
    marginBottom: 12, width: '100%', maxWidth: 340,
  },
  toggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 7 },
  activeToggleBtn: { backgroundColor: C.primary },
  toggleBtnText: { fontSize: 11, fontWeight: '700', color: C.textSub },
  activeToggleText: { color: '#FFF' },

  plansContainer: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 12, flexWrap: 'wrap' },
  planCard: {
    flex: 1, minWidth: 200, backgroundColor: C.surface2, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 12, justifyContent: 'space-between',
  },
  proPlanCard: { borderColor: C.primary + '60', backgroundColor: '#1E1410' },
  popularBadge: {
    alignSelf: 'flex-start', backgroundColor: C.primary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6,
  },
  popularBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  cardHeader: { marginBottom: 8 },
  planName: { fontSize: 15, fontWeight: '800', color: C.text },
  planPrice: { fontSize: 20, fontWeight: '900', color: C.text, marginTop: 2 },
  planPeriod: { fontSize: 11, fontWeight: '600', color: C.textSub },
  benefits: { gap: 6, marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitText: { fontSize: 11, color: C.textSub },

  starterBtn: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  starterBtnText: { color: C.text, fontWeight: '700', fontSize: 12 },
  proBtn: {
    backgroundColor: C.primary, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  proBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  footerNoteText: { fontSize: 10, color: C.textSub },
});
