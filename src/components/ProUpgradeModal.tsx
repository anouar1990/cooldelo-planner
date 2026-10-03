import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  useWindowDimensions, Image, Platform, TextInput, ActivityIndicator
} from 'react-native';
import {
  X, Zap, Lock, Sparkles, Check, ShieldCheck, Tag,
  Wrench, Scissors, FileText, ChevronRight
} from 'lucide-react-native';
import { useSubscription, BillingCycle } from '../hooks/useSubscription';

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
  actionTitle?: string;
  description?: string;
}

const C = {
  bg: '#111317',
  surface: '#1A1D21',
  surface2: '#23262C',
  border: 'rgba(255,255,255,0.1)',
  borderPrimary: 'rgba(254,119,51,0.4)',
  primary: '#FE7733',
  primaryGlow: 'rgba(254,119,51,0.15)',
  text: '#FFFFFF',
  sub: '#94A3B8',
  dim: '#64748B',
  green: '#10B981',
};

const HERO_IMAGE_SOURCE = Platform.OS === 'web'
  ? { uri: '/paywall_hero.png' }
  : require('../../assets/paywall_hero.png');

export function ProUpgradeModal({
  visible,
  onClose,
  featureName = 'Premium Feature',
  actionTitle = 'Unlock Full 0machine Workshop',
  description = 'Upgrade to Pro to access advanced nesting, laser presets, DXF design downloads, and PDF invoice generation.',
}: ProUpgradeModalProps) {
  const { width } = useWindowDimensions();
  const { createCheckoutSession, checkoutLoading, applyPromoCode, refetch } = useSubscription();
  const isDesktop = width > 768;

  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'starter'>('pro');

  // Promo Code State
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Restore Purchase State
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
        onClose();
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
      setRestoreStatus('No active subscription found.');
      setTimeout(() => setRestoreStatus(null), 3000);
    } finally {
      setRestoring(false);
    }
  };

  const handleCheckout = () => {
    createCheckoutSession(selectedPlan, cycle);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.modalCard, isDesktop && styles.modalCardDesktop]}>
          {/* Top Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={C.text} size={20} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Hero Image */}
            <View style={styles.heroContainer}>
              <Image
                source={HERO_IMAGE_SOURCE}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroBadge}>
                <Lock color={C.primary} size={12} />
                <Text style={styles.heroBadgeText}>{featureName.toUpperCase()}</Text>
              </View>
            </View>

            {/* Headline Section */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>{actionTitle}</Text>
              <Text style={styles.subtitle}>{description}</Text>
            </View>

            {/* Cycle Toggle */}
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

            {/* Plans */}
            <View style={styles.plansContainer}>
              {/* Pro Card */}
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
                  <Sparkles color="#FFFFFF" size={11} />
                  <Text style={styles.popularRibbonText}>RECOMMENDED</Text>
                </View>

                <View style={styles.planCardHeader}>
                  <View>
                    <Text style={styles.planTitlePro}>Workshop Pro</Text>
                    <Text style={styles.planSubtext}>Full fabrication toolkit</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.priceNumber}>
                      {cycle === 'annual' ? '$149' : '$19'}
                    </Text>
                    <Text style={styles.pricePeriod}>
                      {cycle === 'annual' ? '$12.41/mo' : '/month'}
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitList}>
                  <BenefitRow text="Unlimited Projects & Machines" bold />
                  <BenefitRow text="Nesting Yield & Material Costing" bold />
                  <BenefitRow text="PDF Quotes, Invoices & WhatsApp" bold />
                  <BenefitRow text="500+ Commercial Vector Packs" bold />
                </View>
              </TouchableOpacity>

              {/* Starter Card */}
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
                      {cycle === 'annual' ? '$4.91/mo' : '/month'}
                    </Text>
                  </View>
                </View>

                <View style={styles.benefitList}>
                  <BenefitRow text="Unlimited Projects & Machines" />
                  <BenefitRow text="Material Inventory & Presets" />
                  <BenefitRow text="PDF Quotes & Invoices" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Value Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionHeading}>What You Get with Pro</Text>

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconBadge}>
                  <Zap color={C.primary} size={18} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStepTitle}>TODAY</Text>
                  <Text style={styles.timelineStepDesc}>Instant unlock for Pro tools & DXF library.</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconBadge}>
                  <Scissors color={C.primary} size={18} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStepTitle}>IN YOUR WORKSHOP</Text>
                  <Text style={styles.timelineStepDesc}>Automated job costing, nesting & presets.</Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineIconBadge}>
                  <FileText color={C.primary} size={18} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStepTitle}>GROW YOUR BUSINESS</Text>
                  <Text style={styles.timelineStepDesc}>Send professional PDF quotes & invoices.</Text>
                </View>
              </View>
            </View>

            {/* Promo Accordion */}
            <View style={styles.promoSection}>
              <TouchableOpacity
                style={styles.promoToggleRow}
                onPress={() => setShowPromo(!showPromo)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Tag color={C.primary} size={16} />
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

            {/* Notification Status */}
            {restoreStatus ? (
              <View style={styles.restoreStatusBanner}>
                <Text style={styles.restoreStatusText}>{restoreStatus}</Text>
              </View>
            ) : null}

            {/* Main CTA */}
            <TouchableOpacity
              style={[styles.mainCtaBtn, checkoutLoading && styles.disabledCtaBtn]}
              onPress={handleCheckout}
              disabled={checkoutLoading}
              activeOpacity={0.85}
            >
              {checkoutLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.ctaBtnContent}>
                  <Text style={styles.mainCtaText}>
                    {selectedPlan === 'pro' ? 'Start 0machine Pro' : 'Start Starter Plan'}
                  </Text>
                  <ChevronRight color="#FFFFFF" size={20} />
                </View>
              )}
            </TouchableOpacity>

            {/* Secondary Options */}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.freeOptionText}>Keep using Free</Text>
              </TouchableOpacity>

              <Text style={styles.dotSeparator}>·</Text>

              <TouchableOpacity onPress={handleRestorePurchase} disabled={restoring} activeOpacity={0.7}>
                <Text style={styles.restoreOptionText}>
                  {restoring ? 'Restoring...' : 'Restore purchase'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.securityBadgeRow}>
              <ShieldCheck color={C.green} size={13} />
              <Text style={styles.securityBadgeText}>
                Stripe SSL Secure Checkout · Cancel Anytime
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BenefitRow({ text, bold }: { text: string; bold?: boolean }) {
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.checkCircle, bold && styles.checkCircleBold]}>
        <Check color="#FFFFFF" size={11} strokeWidth={3} />
      </View>
      <Text style={[styles.benefitText, bold && styles.benefitTextBold]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: C.bg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  modalCardDesktop: {
    maxWidth: 540,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 10,
  },

  /* Hero Artwork */
  heroContainer: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 13, 20, 0.88)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderPrimary,
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: C.text,
    letterSpacing: 1,
  },

  /* Title Section */
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.text,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Cycle Toggle */
  cycleToggleWrap: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  activeCycleBtn: {
    backgroundColor: C.primary,
  },
  cycleBtnText: {
    fontSize: 12,
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
    fontSize: 9,
    fontWeight: '900',
  },

  /* Plans */
  plansContainer: {
    gap: 12,
    marginBottom: 18,
  },
  planCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 16,
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
    gap: 4,
    backgroundColor: C.primary,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  popularRibbonText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planTitlePro: {
    fontSize: 18,
    fontWeight: '900',
    color: C.primary,
  },
  planTitleStarter: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text,
  },
  planSubtext: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  priceNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
  },
  priceNumberStarter: {
    fontSize: 26,
    fontWeight: '900',
    color: C.text,
  },
  pricePeriod: {
    fontSize: 11,
    color: C.sub,
  },

  benefitList: {
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleBold: {
    backgroundColor: C.primary,
  },
  benefitText: {
    fontSize: 13,
    color: C.sub,
    flex: 1,
  },
  benefitTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    flex: 1,
  },

  /* Timeline */
  timelineSection: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  timelineIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontSize: 11,
    fontWeight: '900',
    color: C.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  timelineStepDesc: {
    fontSize: 13,
    color: C.sub,
    lineHeight: 18,
  },

  /* Promo Section */
  promoSection: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 14,
    width: '100%',
  },
  promoToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  promoActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  promoForm: {
    marginTop: 10,
  },
  promoInput: {
    flex: 1,
    height: 42,
    backgroundColor: C.surface2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  promoApplyBtn: {
    height: 42,
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  promoStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  promoSuccess: {
    color: C.green,
  },
  promoError: {
    color: '#EF4444',
  },

  restoreStatusBanner: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    width: '100%',
  },
  restoreStatusText: {
    fontSize: 12,
    color: C.text,
    textAlign: 'center',
    fontWeight: '600',
  },

  /* Main CTA */
  mainCtaBtn: {
    width: '100%',
    height: 54,
    backgroundColor: C.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledCtaBtn: {
    opacity: 0.7,
  },
  ctaBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainCtaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  secondaryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  freeOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sub,
    textDecorationLine: 'underline',
  },
  restoreOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.dim,
  },
  dotSeparator: {
    color: C.dim,
    fontSize: 14,
  },

  securityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  securityBadgeText: {
    fontSize: 10,
    color: C.dim,
  },
});

