import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    Platform, Linking, useWindowDimensions
} from 'react-native';
import { Sparkles, Lock, ExternalLink, Zap, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ProUpgradeModal } from '../components/ProUpgradeModal';

const STUDIO_URL = '/nest/index.html?tool=laserai';

export default function LaserAiScreen() {
    const { isPro, isStarter } = useSubscription();
    const { colors } = useTheme();
    const { t } = useLanguage();
    const { width } = useWindowDimensions();
    const [showProModal, setShowProModal] = useState(false);

    // Free / Starter User Access Control Guard
    if (!isPro) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
                <View style={styles.lockedContainer}>
                    <View style={[styles.lockedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.iconCircle}>
                            <Sparkles size={28} color="#FE7733" />
                        </View>
                        <View style={styles.proBadge}>
                            <Zap size={11} color="#111317" fill="#111317" />
                            <Text style={styles.proBadgeText}>PRO FEATURE</Text>
                        </View>
                        <Text style={[styles.lockedTitle, { color: colors.text }]}>
                            LaserAI Studio & Vectorizer
                        </Text>
                        <Text style={[styles.lockedDesc, { color: colors.sub }]}>
                            Turn text descriptions, photos, and sketches into laser-ready closed-contour DXF and SVG files with separate cut and engrave layers using Google Imagen 3.
                        </Text>

                        <View style={styles.featureList}>
                            <View style={styles.featureItem}>
                                <ShieldCheck size={14} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.text }]}>Text-to-CAD Woodcut & Stencil Generator</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <ShieldCheck size={14} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.text }]}>Smart Raster-to-Vector Auto-Tracer (No mushy edges)</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <ShieldCheck size={14} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.text }]}>Automatic Cut (Red) vs Engrave (Blue) Layer Separation</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <ShieldCheck size={14} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.text }]}>1-Click "+ Add to Nest Sheet" CAM Packing</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.upgradeBtn} 
                            onPress={() => setShowProModal(true)}
                            activeOpacity={0.85}
                        >
                            <Zap size={16} color="#111317" fill="#111317" />
                            <Text style={styles.upgradeBtnText}>Upgrade to Pro to Unlock</Text>
                            <ArrowRight size={16} color="#111317" />
                        </TouchableOpacity>
                    </View>
                </View>
                <ProUpgradeModal visible={showProModal} onClose={() => setShowProModal(false)} />
            </SafeAreaView>
        );
    }

    // Pro User View — Web View (Seamless Dashboard Integration)
    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
                {/* Embedded Studio Top Toolbar */}
                <View style={[styles.topBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Sparkles size={18} color="#FE7733" />
                        <Text style={[styles.topBarTitle, { color: colors.text }]}>
                            LaserAI Studio & Vectorizer
                        </Text>
                        <View style={styles.activeProBadge}>
                            <Text style={styles.activeProBadgeText}>PRO ACTIVE</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.openTabBtn}
                        onPress={() => window.open(STUDIO_URL, '_blank')}
                        activeOpacity={0.8}
                    >
                        <ExternalLink size={13} color="#FFF" />
                        <Text style={styles.openTabText}>Open in New Tab ↗</Text>
                    </TouchableOpacity>
                </View>

                {/* Direct Embedding of Existing LaserAI Studio */}
                <View style={styles.iframeContainer}>
                    <iframe
                        src={STUDIO_URL}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            backgroundColor: '#111317',
                        }}
                        title="0machine LaserAI Studio"
                    />
                </View>
            </SafeAreaView>
        );
    }

    // Native Mobile View
    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
            <View style={styles.lockedContainer}>
                <View style={[styles.lockedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Sparkles size={36} color="#FE7733" />
                    <Text style={[styles.lockedTitle, { color: colors.text }]}>LaserAI Studio</Text>
                    <Text style={[styles.lockedDesc, { color: colors.sub }]}>
                        Launch the full autonomous AI vectorizer and image-to-laser studio in your browser.
                    </Text>
                    <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={() => Linking.openURL('https://planner.0machine.ai' + STUDIO_URL)}
                    >
                        <ExternalLink size={16} color="#111317" />
                        <Text style={styles.upgradeBtnText}>Launch LaserAI Studio ↗</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    topBarTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    activeProBadge: {
        backgroundColor: 'rgba(177, 250, 99, 0.15)',
        borderWidth: 1,
        borderColor: '#B1FA63',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    activeProBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#B1FA63',
    },
    openTabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#23262C',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    openTabText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFF',
    },
    iframeContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#111317',
    },
    lockedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    lockedCard: {
        maxWidth: 520,
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
        textAlign: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(254, 119, 51, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#B1FA63',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 12,
    },
    proBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#111317',
    },
    lockedTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 8,
        textAlign: 'center',
    },
    lockedDesc: {
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    featureList: {
        width: '100%',
        gap: 10,
        marginBottom: 24,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 16,
        borderRadius: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FE7733',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
    },
    upgradeBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111317',
    },
});
