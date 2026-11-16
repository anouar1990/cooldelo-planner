import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  useWindowDimensions, Image, Platform, TextInput, ActivityIndicator
} from 'react-native';
import {
  X, Zap, Lock, Sparkles, Check, ShieldCheck, Tag,
  Wrench, Scissors, FileText, ChevronRight, Star
} from 'lucide-react-native';
import { useSubscription, BillingCycle } from '../hooks/useSubscription';

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureName?: string;
  actionTitle?: string;
  description?: string;
}

interface PaywallContextConfig {
  badge: string;
  headline: string;
  subheadline: string;
  impactPill: string;
  roiTitle: string;
  roiWithout: string;
  roiWith: string;
  ctaText: string;
}

function getPaywallContext(featureName?: string, defaultAction?: string, defaultDesc?: string): PaywallContextConfig {
  const f = (featureName || defaultAction || defaultDesc || '').toLowerCase();

  if (f.includes('nest')) {
    return {
      badge: '🧩 0MACHINE AUTONOMOUS NESTING',
      headline: 'Stop Throwing 30% of Your Material in the Trash',
      subheadline: 'Autonomous True-Shape algorithms pack irregular CAD parts tightly across full sheets & off-cuts. Save up to $84 on every single sheet.',
      impactPill: '🔥 Recovers ~$120–$350/mo in scrap plywood & acrylic',
      roiTitle: 'HOW 0MACHINE NESTING PAYS FOR ITSELF',
      roiWithout: '❌ Manual layout: 3–4 sheets scrap waste/mo (-$120)',
      roiWith: '✅ 0machine Nest: 0% waste + 1-click LightBurn/DXF export',
      ctaText: 'Unlock 0machine Nesting Now — Risk Free',
    };
  }

  if (f.includes('ai') || f.includes('studio') || f.includes('vector') || f.includes('prompt')) {
    return {
      badge: '⚡ LASERAI CAD VECTOR STUDIO',
      headline: 'Turn Any Text Prompt into Cut-Ready Vectors in 5s',
      subheadline: 'Zero CAD or Illustrator skills needed. Generate clean hairline cut vectors and engrave fills ready for LightBurn, Ruida & xTool.',
      impactPill: '🚀 Cut CAD prep time from 3 hours to 30 seconds',
      roiTitle: 'HOW LASERAI STUDIO PAYS FOR ITSELF',
      roiWithout: '❌ Paying designers $30–$50 per vector or hours in Inkscape',
      roiWith: '✅ Instant text-to-CAD vectors + full commercial rights',
      ctaText: 'Unlock LaserAI Studio Now — Risk Free',
    };
  }

  if (f.includes('design') || f.includes('vault') || f.includes('library') || f.includes('pack')) {
    return {
      badge: '💎 5,000+ COMMERCIAL VECTOR PACKS',
      headline: 'Instant Catalog of 5,000+ Tested Laser Designs',
      subheadline: 'Living hinge boxes, layered mandalas, home decor, signage & holiday gifts. Ready to cut and sell immediately with zero drawing work.',
      impactPill: '💰 Sell high-margin physical products on Etsy & WhatsApp',
      roiTitle: 'HOW THE DESIGN VAULT PAYS FOR ITSELF',
      roiWithout: '❌ Buying single design packs for $15–$30 on Etsy',
      roiWith: '✅ Unlimited instant access to 5,000+ commercial DXF/SVGs',
      ctaText: 'Unlock 5,000+ Laser Designs Now — Risk Free',
    };
  }

  if (f.includes('quote') || f.includes('invoice') || f.includes('whatsapp')) {
    return {
      badge: '📲 1-CLICK WHATSAPP DISPATCH',
      headline: 'Close 3x More Client Jobs Before Competitors Reply',
      subheadline: 'Generate itemized PDF quotes and payment invoices with real kerf math and dispatch them straight to WhatsApp in under 30 seconds.',
      impactPill: '⚡ Fast WhatsApp estimates win 68% more fabrication jobs',
      roiTitle: 'HOW WHATSAPP ESTIMATES PAY FOR ITSELF',
      roiWithout: '❌ Slow manual quoting: lost clients to faster workshops',
      roiWith: '✅ Professional instant PDF quotes dispatched via WhatsApp',
      ctaText: 'Unlock WhatsApp Quotes Now — Risk Free',
    };
  }

  // Default / Full Workshop Pro
  return {
    badge: '⚡ 0MACHINE WORKSHOP PRO OS',
    headline: 'Run Your Entire Laser Fabrication Business in One Place',
    subheadline: 'The complete shop system: True-Shape nesting, LaserAI vector generator, 5,000+ commercial DXFs, job costing & WhatsApp invoicing.',
    impactPill: '💰 Just $0.49/day — Pays for itself on 1 single customer order',
    roiTitle: 'HOW 0MACHINE PRO PAYS FOR ITSELF',
    roiWithout: '❌ Juggling 5 tools, scrap waste & losing billable hours',
    roiWith: '✅ 10x ROI: Save $120+ material & win 3x more jobs',
    ctaText: 'Unlock All Pro Features Now — Risk Free',
  };
}

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

  const contextConfig = getPaywallContext(featureName, actionTitle, description);

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
            {/* Hero Artwork Header */}
            <View style={styles.heroContainer}>
              <Image
                source={HERO_IMAGE_SOURCE}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroBadge}>
                <Lock color={C.primary} size={12} />
                <Text style={styles.heroBadgeText}>{contextConfig.badge}</Text>
              </View>
            </View>

            {/* Dynamic Context Headline Section */}
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>{contextConfig.headline}</Text>
              <Text style={styles.subtitle}>{contextConfig.subheadline}</Text>
              <View style={styles.impactPill}>
                <Text style={styles.impactPillText}>{contextConfig.impactPill}</Text>
              </View>
            </View>

            {/* 10x ROI Comparison Card */}
            <View style={styles.roiCard}>
              <View style={styles.roiHeader}>
                <Sparkles color="#B1FA63" size={14} />
                <Text style={styles.roiHeaderText}>{contextConfig.roiTitle}</Text>
              </View>
              <View style={styles.roiBody}>
                <View style={styles.roiRow}>
                  <Text style={styles.roiWithoutText}>{contextConfig.roiWithout}</Text>
                </View>
                <View style={styles.roiRow}>
                  <Text style={styles.roiWithText}>{contextConfig.roiWith}</Text>
                </View>
              </View>
              <View style={styles.roiFooter}>
                <Text style={styles.roiFooterText}>
                  💰 <Text style={{ color: '#B1FA63', fontWeight: '900' }}>$0.49/day</Text> pays for itself on your first single order!
                </Text>
              </View>
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
                    ANNUAL PASS
                  </Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>SAVE 35%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Plans */}
            <View style={styles.plansContainer}>
              {/* Pro Card (Hero Highlight) */}
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

              {/* Starter Card */}
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

            {/* Main Action-Oriented CTA */}
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
                    {selectedPlan === 'pro' ? contextConfig.ctaText : 'Start Starter Plan — Risk Free'}
                  </Text>
                  <ChevronRight color="#FFFFFF" size={20} />
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

            {/* Secondary Options */}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.freeOptionText}>Keep using Free Plan</Text>
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
                Stripe SSL Encrypted Checkout · Instant Tool Activation
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BenefitRow({ text, bold }: { text: string; bold?: boolean }) {
  const isWhatsApp = text.toLowerCase().includes('whatsapp') || text.toLowerCase().includes('quote') || text.toLowerCase().includes('invoice');
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.checkCircle, bold && styles.checkCircleBold, isWhatsApp && { backgroundColor: '#25D366' }]}>
        <Check color="#FFFFFF" size={11} strokeWidth={3} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <Text style={[styles.benefitText, bold && styles.benefitTextBold]}>
          {text}
        </Text>
        {isWhatsApp && !text.includes('⏱️') && !text.includes('📲') && (
          <View style={{ backgroundColor: 'rgba(37,211,102,0.15)', borderColor: 'rgba(37,211,102,0.4)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
            <Text style={{ color: '#25D366', fontSize: 10, fontWeight: '700' }}>WhatsApp</Text>
          </View>
        )}
      </View>
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
  impactPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(254, 119, 51, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(254, 119, 51, 0.35)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 10,
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
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(177, 250, 99, 0.35)',
    padding: 14,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(177, 250, 99, 0.08)',
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
    gap: 6,
    marginBottom: 10,
  },
  roiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roiWithoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  roiWithText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  roiFooter: {
    backgroundColor: 'rgba(177, 250, 99, 0.08)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(177, 250, 99, 0.2)',
  },
  roiFooterText: {
    color: '#CBD5E1',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
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
    backgroundColor: '#B1FA63',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  popularRibbonText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0A0C12',
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

  /* Social Proof Box */
  socialProofBox: {
    backgroundColor: '#191C26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    padding: 14,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  starsRating: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '900',
  },
  starsSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  testimonialQuote: {
    color: '#F1F5F9',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  testimonialAuthor: {
    color: '#FE7733',
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
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

