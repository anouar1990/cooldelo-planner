import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import {
  Monitor,
  Laptop,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Eye,
  Sliders,
  Calculator,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface DesktopRecommendedViewProps {
  toolName: string;
  category?: string;
  description?: string;
  benefits?: string[];
  onContinueAnyway?: () => void;
}

const COLORS = {
  bg: '#111317',
  surface: '#1A1D21',
  surface2: '#23262C',
  border: 'rgba(255,255,255,0.08)',
  primary: '#FE7733',
  neonLime: '#B1FA63',
  green: '#10B981',
  text: '#F1F5F9',
  sub: '#8B95A8',
  dim: '#4B5568',
};

export function DesktopRecommendedView({
  toolName,
  category = 'CAD / CAM PRODUCTION ENGINE',
  description,
  benefits = [
    'Precision mouse & keyboard vector manipulation',
    'Drag & drop large DXF, SVG & LightBurn vector files',
    'High-resolution multi-sheet nesting algorithms',
    'Direct export to LightBurn, RDWorks & EzCad lasers',
  ],
  onContinueAnyway,
}: DesktopRecommendedViewProps) {
  const navigation = useNavigation<any>();
  const [copied, setCopied] = useState(false);

  const getDesktopUrl = () => {
    if (typeof window !== 'undefined' && window.location?.href) {
      return window.location.href;
    }
    return 'https://app.0machine.com';
  };

  const handleCopyLink = async () => {
    const url = getDesktopUrl();
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendToWhatsApp = () => {
    const url = getDesktopUrl();
    const msg = `🖥️ *0MACHINE LASER TOOL*\n\nHere is the desktop link for *${toolName}*:\n🔗 ${url}\n\nOpen this on your workshop PC or laptop for full CAD/CAM precision.`;
    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/?text=${encoded}`;

    if (Platform.OS === 'web') {
      window.open(waUrl, '_blank');
    } else {
      Linking.openURL(waUrl);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        {/* Glow Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.glowBadge}>
            <Laptop size={13} color={COLORS.neonLime} strokeWidth={2.2} />
            <Text style={styles.glowBadgeText}>DESKTOP RECOMMENDED</Text>
          </View>
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        {/* Hero Monitor Graphic */}
        <View style={styles.iconCircle}>
          <View style={styles.iconInnerGlow}>
            <Monitor size={42} color={COLORS.primary} strokeWidth={1.8} />
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{toolName}</Text>
        <Text style={styles.description}>
          {description ||
            `For precision vector geometry, DXF/SVG generation, and machine sheet nesting, this tool is optimized for PC & laptop screens.`}
        </Text>

        {/* Key Reasons / Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsHeader}>WHY USE DESKTOP FOR THIS TOOL?</Text>
          {benefits.map((b, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <View style={styles.benefitBullet}>
                <Check size={12} color={COLORS.neonLime} strokeWidth={2.5} />
              </View>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionsWrap}>
          {/* Copy Link Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, copied && styles.primaryBtnCopied]}
            onPress={handleCopyLink}
            activeOpacity={0.85}
          >
            {copied ? (
              <Check size={17} color="#0B0D13" strokeWidth={2.5} />
            ) : (
              <Copy size={17} color="#0B0D13" strokeWidth={2.2} />
            )}
            <Text style={styles.primaryBtnText}>
              {copied ? 'Link Copied! Open on PC' : 'Copy Desktop Link'}
            </Text>
          </TouchableOpacity>

          {/* Send to WhatsApp */}
          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleSendToWhatsApp}
            activeOpacity={0.85}
          >
            <Share2 size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.whatsAppBtnText}>Send Link to My WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Jump to Mobile Management Tools */}
        <View style={styles.managementSection}>
          <Text style={styles.managementTitle}>ON MOBILE? USE WORKSHOP MANAGEMENT INSTEAD:</Text>
          <View style={styles.mobileShortcuts}>
            <TouchableOpacity
              style={styles.shortcutPill}
              onPress={() => navigation.navigate('Cost Calculator')}
              activeOpacity={0.75}
            >
              <Calculator size={14} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.shortcutText}>Calculator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutPill}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.75}
            >
              <Calendar size={14} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.shortcutText}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutPill}
              onPress={() => navigation.navigate('Quote Generator')}
              activeOpacity={0.75}
            >
              <FileText size={14} color={COLORS.neonLime} strokeWidth={2} />
              <Text style={styles.shortcutText}>Quotes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue Anyway Option (Never hard-block) */}
        {onContinueAnyway && (
          <TouchableOpacity
            style={styles.continueLink}
            onPress={onContinueAnyway}
            activeOpacity={0.7}
          >
            <Eye size={14} color={COLORS.sub} />
            <Text style={styles.continueLinkText}>Preview on mobile anyway</Text>
            <ArrowRight size={13} color={COLORS.sub} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
    alignItems: 'center',
    ...(Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    }) as any),
  },
  badgeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  glowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(177, 250, 99, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(177, 250, 99, 0.3)',
  },
  glowBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.neonLime,
    letterSpacing: 0.8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.sub,
    letterSpacing: 0.6,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(254, 119, 51, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(254, 119, 51, 0.25)',
  },
  iconInnerGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(254, 119, 51, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: COLORS.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  benefitsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.sub,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(177, 250, 99, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionsWrap: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.neonLime,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnCopied: {
    backgroundColor: '#10B981',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0D13',
    letterSpacing: -0.2,
  },
  whatsAppBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#25D366',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsAppBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  managementSection: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  managementTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.sub,
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  mobileShortcuts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  shortcutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  continueLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  continueLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sub,
    textDecorationLine: 'underline',
  },
});
