import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Platform,
} from 'react-native';
import { Grid, RotateCcw, Info, Lock, Zap, Check, AlertCircle } from 'lucide-react-native';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { trackEvent } from '../lib/analytics';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    green: '#10B981', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

function n(v: string) { return Math.max(0, parseFloat(v) || 0); }

const PRESETS = [
    { label: '600×400 mm', sw: '600', sh: '400' },
    { label: '1200×600 mm', sw: '1200', sh: '600' },
    { label: 'A4 (297×210)', sw: '297', sh: '210' },
    { label: 'A3 (420×297)', sw: '420', sh: '297' },
];

export default function NestingEstimatorScreen() {
    const { isFree, isStarter, isPro } = useSubscription();
    const { t } = useLanguage();

    // Inputs
    const [sheetW, setSheetW] = useState('600');
    const [sheetH, setSheetH] = useState('400');
    const [partW, setPartW] = useState('80');
    const [partH, setPartH] = useState('80');
    const [partQty, setPartQty] = useState('24');
    const [spacing, setSpacing] = useState('2');
    const [sheetCost, setSheetCost] = useState('15');
    const [partSellPrice, setPartSellPrice] = useState('3.50');
    const [allowRotation, setAllowRotation] = useState(true);

    const [showProModal, setShowProModal] = useState(false);

    useEffect(() => {
        trackEvent('pro_feature_viewed', { feature: 'nesting' });
    }, []);

    const result = useMemo(() => {
        const sw = n(sheetW);
        const sh = n(sheetH);
        const pw = n(partW);
        const ph = n(partH);
        const sp = n(spacing);
        const qty = Math.max(1, parseInt(partQty) || 1);
        const cost = n(sheetCost);
        const sellPrice = n(partSellPrice);

        if (sw <= 0 || sh <= 0 || pw <= 0 || ph <= 0) return null;

        // Grid calculation
        const colsN = Math.floor((sw + sp) / (pw + sp));
        const rowsN = Math.floor((sh + sp) / (ph + sp));
        const perSheetNormal = colsN * rowsN;

        const colsR = Math.floor((sw + sp) / (ph + sp));
        const rowsR = Math.floor((sh + sp) / (pw + sp));
        const perSheetRotated = colsR * rowsR;

        let bestPerSheet = perSheetNormal;
        let cols = colsN;
        let rows = rowsN;
        let rotated = false;

        if (allowRotation && perSheetRotated > perSheetNormal) {
            bestPerSheet = perSheetRotated;
            cols = colsR;
            rows = rowsR;
            rotated = true;
        }

        if (bestPerSheet <= 0) return null;

        const sheetsNeeded = Math.ceil(qty / bestPerSheet);
        const totalSheetCost = sheetsNeeded * cost;
        const costPerPart = totalSheetCost / qty;
        const totalRevenue = qty * sellPrice;
        const totalProfit = totalRevenue - totalSheetCost;

        const partArea = pw * ph;
        const sheetArea = sw * sh;
        const totalPartArea = qty * partArea;
        const totalSheetArea = sheetsNeeded * sheetArea;
        const usagePct = Math.min(100, (totalPartArea / totalSheetArea) * 100);
        const wastePct = 100 - usagePct;

        return {
            perSheet: bestPerSheet, cols, rows, rotated,
            sheetsNeeded, totalSheetCost, costPerPart,
            totalRevenue, totalProfit, usagePct, wastePct
        };
    }, [sheetW, sheetH, partW, partH, partQty, spacing, sheetCost, partSellPrice, allowRotation]);

    const handleCalculateAction = () => {
        if (!isPro) {
            setShowProModal(true);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{t('nest_title')}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>{t('nest_subtitle')}</Text>
                </View>
                {!isPro && (
                    <View style={styles.tierBadge}>
                        <Lock size={12} color={C.primary} />
                        <Text style={styles.tierBadgeText}>{isStarter ? 'STARTER (PREVIEW)' : 'FREE (PREVIEW)'}</Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Upgrade Notification Banner if not Pro */}
                {!isPro && (
                    <TouchableOpacity style={styles.upgradeBanner} onPress={() => setShowProModal(true)}>
                        <Zap color={C.primary} size={18} fill={C.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bannerTitle}>Unlock Unlimited Nesting Optimization</Text>
                            <Text style={styles.bannerDesc}>
                                {isStarter 
                                    ? 'Upgrade to Workshop Pro ($19/mo) to unlock production nesting calculations and material waste analytics.'
                                    : 'Preview mode. Upgrade to Pro to optimize full workshop sheet yields.'}
                            </Text>
                        </View>
                        <Text style={styles.bannerCTA}>Upgrade Pro →</Text>
                    </TouchableOpacity>
                )}

                {/* Presets */}
                <Text style={styles.sectionLabel}>Quick Sheet Sizes</Text>
                <View style={styles.presetsRow}>
                    {PRESETS.map((p, idx) => (
                        <TouchableOpacity key={idx} style={styles.presetChip} onPress={() => { setSheetW(p.sw); setSheetH(p.sh); }}>
                            <Text style={styles.presetText}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Form inputs */}
                <View style={styles.formGrid}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>📐 Sheet Dimensions</Text>
                        <View style={styles.row}>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Width (mm)</Text>
                                <TextInput style={styles.input} value={sheetW} onChangeText={setSheetW} keyboardType="numeric" />
                            </View>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Height (mm)</Text>
                                <TextInput style={styles.input} value={sheetH} onChangeText={setSheetH} keyboardType="numeric" />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Sheet Cost ($)</Text>
                                <TextInput style={styles.input} value={sheetCost} onChangeText={setSheetCost} keyboardType="decimal-pad" />
                            </View>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Part Spacing (mm)</Text>
                                <TextInput style={styles.input} value={spacing} onChangeText={setSpacing} keyboardType="decimal-pad" />
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>🧩 Part Details</Text>
                        <View style={styles.row}>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Part Width (mm)</Text>
                                <TextInput style={styles.input} value={partW} onChangeText={setPartW} keyboardType="numeric" />
                            </View>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Part Height (mm)</Text>
                                <TextInput style={styles.input} value={partH} onChangeText={setPartH} keyboardType="numeric" />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Target Quantity</Text>
                                <TextInput style={styles.input} value={partQty} onChangeText={setPartQty} keyboardType="number-pad" />
                            </View>
                            <View style={styles.inputWrap}>
                                <Text style={styles.label}>Retail Sell / Part ($)</Text>
                                <TextInput style={styles.input} value={partSellPrice} onChangeText={setPartSellPrice} keyboardType="decimal-pad" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Calculation Results Card */}
                {result && (
                    <View style={styles.resultsCard}>
                        <Text style={styles.resultsTitle}>📊 Layout & Financial Metrics</Text>
                        <View style={styles.metricsGrid}>
                            <MetricBox label="Parts per Sheet" value={`${result.perSheet}`} color={C.primary} />
                            <MetricBox label="Sheets Needed" value={`${result.sheetsNeeded}`} color={C.blue} />
                            <MetricBox label="Material Usage %" value={`${result.usagePct.toFixed(1)}%`} color={C.green} />
                            <MetricBox label="Material Waste %" value={`${result.wastePct.toFixed(1)}%`} color={C.amber} />
                            <MetricBox label="Cost / Part" value={`$${result.costPerPart.toFixed(2)}`} color={C.text} />
                            <MetricBox label="Total Material Cost" value={`$${result.totalSheetCost.toFixed(2)}`} color={C.text} />
                            <MetricBox label="Est. Net Profit" value={`$${result.totalProfit.toFixed(2)}`} color={C.green} bold />
                        </View>

                        {!isPro && (
                            <TouchableOpacity style={styles.lockOverlayBtn} onPress={handleCalculateAction}>
                                <Lock color="#FFF" size={16} />
                                <Text style={styles.lockOverlayText}>Unlock Full Production Nesting (Workshop Pro)</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            <ProUpgradeModal
                visible={showProModal}
                onClose={() => setShowProModal(false)}
                featureName="Production Nesting Calculator"
                actionTitle="Unlock Advanced Nesting Optimization"
                description="Upgrade to Workshop Pro ($19/mo) to calculate full production sheet layouts, material waste %, cost per part, and profit metrics."
            />
        </SafeAreaView>
    );
}

function MetricBox({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
    return (
        <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={[styles.metricValue, { color }, bold && { fontSize: 20, fontWeight: '900' }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10, flexWrap: 'wrap' },
    title: { fontSize: 18, fontWeight: '800', color: C.text, flexShrink: 1 },
    subtitle: { fontSize: 12, color: C.sub, marginTop: 2 },
    tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary + '15', borderWidth: 1, borderColor: C.primary + '40', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
    tierBadgeText: { fontSize: 10, fontWeight: '800', color: C.primary },

    scroll: { padding: 16, gap: 14 },
    upgradeBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E1410', borderWidth: 1, borderColor: C.primary + '50', borderRadius: 14, padding: 14 },
    bannerTitle: { fontSize: 14, fontWeight: '800', color: C.text },
    bannerDesc: { fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 15 },
    bannerCTA: { fontSize: 12, fontWeight: '800', color: C.primary },

    sectionLabel: { fontSize: 12, fontWeight: '700', color: C.sub, textTransform: 'uppercase' },
    presetsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    presetChip: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    presetText: { fontSize: 12, color: C.text, fontWeight: '600' },

    formGrid: { gap: 12 },
    card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 10 },
    cardTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 4 },
    row: { flexDirection: 'row', gap: 10 },
    inputWrap: { flex: 1 },
    label: { fontSize: 11, fontWeight: '600', color: C.sub, marginBottom: 4 },
    input: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: C.text, fontSize: 13, fontWeight: '700' },

    resultsCard: { backgroundColor: C.surface2, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
    resultsTitle: { fontSize: 15, fontWeight: '800', color: C.text },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metricBox: { flex: 1, minWidth: 120, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 10 },
    metricLabel: { fontSize: 11, color: C.sub, fontWeight: '600' },
    metricValue: { fontSize: 17, fontWeight: '800', marginTop: 4 },

    lockOverlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, marginTop: 6 },
    lockOverlayText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
});
