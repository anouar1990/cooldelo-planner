import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Platform,
} from 'react-native';
import { Grid, RotateCcw, Info } from 'lucide-react-native';

const C = {
    bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', primary: '#FF6B35',
    green: '#10B981', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6',
};

function n(v: string) { return parseFloat(v) || 0; }

const PRESETS = [
    { label: '600×400', sw: '600', sh: '400' },
    { label: '1200×600', sw: '1200', sh: '600' },
    { label: 'A4 (297×210)', sw: '297', sh: '210' },
    { label: 'A3 (420×297)', sw: '420', sh: '297' },
];

export default function NestingEstimatorScreen() {
    // Sheet
    const [sheetW, setSheetW] = useState('600');
    const [sheetH, setSheetH] = useState('400');
    const [kerf, setKerf] = useState('0.2'); // mm kerf (gap between parts)

    // Part
    const [partW, setPartW] = useState('');
    const [partH, setPartH] = useState('');
    const [partQty, setPartQty] = useState('1');
    const [margin, setMargin] = useState('2'); // border margin mm

    // Rotation — try both orientations
    const [allowRotation, setAllowRotation] = useState(true);

    const result = useMemo(() => {
        const sw = n(sheetW);
        const sh = n(sheetH);
        const pw = n(partW);
        const ph = n(partH);
        const k = n(kerf);
        const m = n(margin);
        const qty = Math.max(1, parseInt(partQty) || 1);

        if (!pw || !ph || !sw || !sh) return null;

        const usableW = sw - 2 * m;
        const usableH = sh - 2 * m;
        if (usableW <= 0 || usableH <= 0) return null;

        // Normal orientation
        const colsN = Math.floor((usableW + k) / (pw + k));
        const rowsN = Math.floor((usableH + k) / (ph + k));
        const perSheetNormal = colsN * rowsN;

        // Rotated orientation
        const colsR = Math.floor((usableW + k) / (ph + k));
        const rowsR = Math.floor((usableH + k) / (pw + k));
        const perSheetRotated = colsR * rowsR;

        let best = perSheetNormal;
        let bestCols = colsN;
        let bestRows = rowsN;
        let rotated = false;
        if (allowRotation && perSheetRotated > perSheetNormal) {
            best = perSheetRotated;
            bestCols = colsR;
            bestRows = rowsR;
            rotated = true;
        }

        if (best === 0) return null;

        const sheetsNeeded = Math.ceil(qty / best);
        const partArea = pw * ph;
        const sheetArea = sw * sh;
        const totalPartsArea = qty * partArea;
        const totalSheetArea = sheetsNeeded * sheetArea;
        const efficiency = (totalPartsArea / totalSheetArea) * 100;
        const waste = 100 - efficiency;

        return {
            perSheet: best, cols: bestCols, rows: bestRows, rotated,
            sheetsNeeded, efficiency, waste,
            partArea, sheetArea,
            totalPartsArea, totalSheetArea,
        };
    }, [sheetW, sheetH, kerf, partW, partH, partQty, margin, allowRotation]);

    const reset = () => {
        setSheetW('600'); setSheetH('400'); setKerf('0.2');
        setPartW(''); setPartH(''); setPartQty('1'); setMargin('2');
    };

    const effColor = result ? (result.efficiency > 70 ? C.green : result.efficiency > 40 ? C.amber : C.red) : C.sub;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <View style={styles.headerIcon}><Grid color={C.primary} size={20} /></View>
                        <Text style={styles.title}>Nesting Estimator</Text>
                    </View>
                    <Text style={styles.subtitle}>Calculate how many parts fit on a sheet</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {/* Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Sheet Size</Text>
                        <Text style={styles.hint}>Select a preset or enter custom dimensions</Text>
                        <View style={styles.presetRow}>
                            {PRESETS.map(p => (
                                <TouchableOpacity key={p.label} onPress={() => { setSheetW(p.sw); setSheetH(p.sh); }}
                                    style={[styles.presetChip, sheetW === p.sw && sheetH === p.sh && styles.presetChipActive]}>
                                    <Text style={[styles.presetText, sheetW === p.sw && sheetH === p.sh && styles.presetTextActive]}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.row}>
                            <Field label="Sheet Width (mm)" value={sheetW} onChange={setSheetW} />
                            <Field label="Sheet Height (mm)" value={sheetH} onChange={setSheetH} />
                        </View>
                        <View style={styles.row}>
                            <Field label="Border Margin (mm)" value={margin} onChange={setMargin} placeholder="2" />
                            <Field label="Kerf / Gap (mm)" value={kerf} onChange={setKerf} placeholder="0.2" />
                        </View>

                        <View style={styles.divider} />
                        <Text style={styles.cardTitle}>Part Dimensions</Text>
                        <View style={styles.row}>
                            <Field label="Part Width (mm)" value={partW} onChange={setPartW} placeholder="50" />
                            <Field label="Part Height (mm)" value={partH} onChange={setPartH} placeholder="50" />
                        </View>
                        <Field label="Quantity Needed" value={partQty} onChange={setPartQty} placeholder="10" />

                        <View style={styles.divider} />
                        <View style={styles.optionRow}>
                            <View style={styles.optionLabel}>
                                <Text style={styles.label}>Allow Part Rotation</Text>
                                <Text style={styles.hint}>Tries both 0° and 90° to maximize fit</Text>
                            </View>
                            <TouchableOpacity onPress={() => setAllowRotation(p => !p)}
                                style={[styles.toggle, allowRotation && styles.toggleOn]}>
                                <View style={[styles.toggleThumb, allowRotation && styles.toggleThumbOn]} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                            <RotateCcw color={C.sub} size={16} />
                            <Text style={styles.resetBtnText}>Reset</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Results */}
                    <View style={styles.sidebar}>
                        {result ? (
                            <>
                                {/* Main result */}
                                <View style={[styles.resultCard, { borderColor: C.primary + '50' }]}>
                                    <Text style={styles.resultCardTitle}>Parts Per Sheet</Text>
                                    <Text style={styles.bigNum}>{result.perSheet}</Text>
                                    <Text style={styles.bigNumSub}>{result.cols} columns × {result.rows} rows{result.rotated ? ' (rotated)' : ''}</Text>
                                </View>

                                {/* Efficiency */}
                                <View style={styles.card}>
                                    <Text style={styles.cardTitle}>Material Efficiency</Text>
                                    <View style={styles.effBar}>
                                        <View style={[styles.effFill, { width: `${Math.min(result.efficiency, 100)}%` as any, backgroundColor: effColor }]} />
                                    </View>
                                    <View style={styles.effRow}>
                                        <View style={[styles.effStat, { backgroundColor: effColor + '15' }]}>
                                            <Text style={[styles.effStatValue, { color: effColor }]}>{result.efficiency.toFixed(1)}%</Text>
                                            <Text style={styles.effStatLabel}>Used</Text>
                                        </View>
                                        <View style={[styles.effStat, { backgroundColor: C.red + '10' }]}>
                                            <Text style={[styles.effStatValue, { color: C.red }]}>{result.waste.toFixed(1)}%</Text>
                                            <Text style={styles.effStatLabel}>Waste</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Sheets needed */}
                                <View style={styles.card}>
                                    <Text style={styles.cardTitle}>Job Summary</Text>
                                    <ResultRow label={`Quantity needed`} value={`${partQty} parts`} />
                                    <ResultRow label="Sheets required" value={`${result.sheetsNeeded} sheet${result.sheetsNeeded !== 1 ? 's' : ''}`} highlight />
                                    <View style={styles.divider} />
                                    <ResultRow label="Part area" value={`${result.partArea.toFixed(0)} mm²`} />
                                    <ResultRow label="Sheet area" value={`${result.sheetArea.toFixed(0)} mm²`} />
                                    <ResultRow label="Total part area" value={`${result.totalPartsArea.toFixed(0)} mm²`} />
                                    <ResultRow label="Total sheet area" value={`${result.totalSheetArea.toFixed(0)} mm²`} />
                                </View>

                                {/* Visual grid */}
                                <View style={styles.card}>
                                    <Text style={styles.cardTitle}>Layout Preview</Text>
                                    <Text style={styles.hint}>Each cell = one part (rectangle nesting)</Text>
                                    <View style={styles.nestGrid}>
                                        {Array.from({ length: Math.min(result.perSheet, 100) }).map((_, i) => (
                                            <View key={i} style={[styles.nestCell, { backgroundColor: C.primary + (i < parseInt(partQty) % result.perSheet || parseInt(partQty) >= result.perSheet ? 'E0' : '40') }]} />
                                        ))}
                                    </View>
                                    <Text style={styles.hint}>Showing 1 sheet · {Math.min(result.perSheet, 100)} parts{result.perSheet > 100 ? ' (capped at 100)' : ''}</Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.emptyResult}>
                                <Grid color={C.sub} size={40} opacity={0.4} />
                                <Text style={styles.emptyTitle}>Enter dimensions</Text>
                                <Text style={styles.emptyText}>Fill in the sheet and part sizes to see how many parts fit per sheet.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={styles.input} value={value} onChangeText={onChange}
                placeholder={placeholder ?? '0'} placeholderTextColor={C.sub}
                keyboardType="decimal-pad" />
        </View>
    );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{label}</Text>
            <Text style={[styles.resultValue, highlight && { color: C.primary, fontWeight: '800', fontSize: 16 }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { padding: 24, paddingBottom: 16 },
    headerIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 13, color: C.sub, marginTop: 4, marginLeft: 52 },
    scroll: { padding: 24, paddingTop: 0, paddingBottom: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    formCard: {
        flex: 1.5, minWidth: 280, backgroundColor: C.surface, borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
    hint: { fontSize: 12, color: C.sub, marginBottom: 12 },
    presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    presetChip: { borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 6 },
    presetChipActive: { backgroundColor: C.primary, borderColor: C.primary },
    presetText: { fontSize: 12, fontWeight: '600', color: C.sub },
    presetTextActive: { color: '#fff' },
    row: { flexDirection: 'row', gap: 12 },
    inputGroup: { flex: 1, marginBottom: 12 },
    label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6 },
    input: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F8FAFC', color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
    optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    optionLabel: { flex: 1 },
    toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: C.border, justifyContent: 'center', paddingHorizontal: 2 },
    toggleOn: { backgroundColor: C.primary },
    toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
    toggleThumbOn: { alignSelf: 'flex-end' },
    resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.border },
    resetBtnText: { color: C.sub, fontSize: 14, fontWeight: '600' },
    sidebar: { flex: 1, minWidth: 260, gap: 16 },
    resultCard: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 2,
        alignItems: 'center', borderColor: C.primary,
        ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(255,107,53,0.12)' } as any }),
    },
    resultCardTitle: { fontSize: 14, fontWeight: '700', color: C.sub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    bigNum: { fontSize: 56, fontWeight: '900', color: C.primary },
    bigNumSub: { fontSize: 13, color: C.sub, marginTop: 4, textAlign: 'center' },
    card: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    effBar: { height: 10, backgroundColor: C.border, borderRadius: 5, overflow: 'hidden', marginVertical: 12 },
    effFill: { height: '100%', borderRadius: 5 },
    effRow: { flexDirection: 'row', gap: 10 },
    effStat: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
    effStatValue: { fontSize: 20, fontWeight: '800' },
    effStatLabel: { fontSize: 11, color: C.sub, marginTop: 2, fontWeight: '600' },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    resultLabel: { fontSize: 14, color: C.sub },
    resultValue: { fontSize: 14, fontWeight: '600', color: C.text },
    nestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginVertical: 10 },
    nestCell: { width: 12, height: 12, borderRadius: 2 },
    emptyResult: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.sub, marginTop: 12 },
    emptyText: { fontSize: 14, color: C.sub, marginTop: 8, textAlign: 'center' },
});
