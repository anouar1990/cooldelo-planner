import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TextInput, TouchableOpacity, Platform,
} from 'react-native';
import { Calculator, RotateCcw, Save, DollarSign, Zap, Wrench, Clock } from 'lucide-react-native';

const C = {
    bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', primary: '#FF6B35',
    green: '#10B981', amber: '#F59E0B', blue: '#3B82F6',
};

interface Inputs {
    projectName: string;
    materialType: string;
    sheetCost: string;
    sheetWidth: string;
    sheetHeight: string;
    usagePct: string;
    laserTime: string;     // minutes
    electricityRate: string; // $/hr
    machineWear: string;   // $ flat
    laborCost: string;     // $ flat
    profitMargin: string;  // %
    quantity: string;
}

const DEFAULT: Inputs = {
    projectName: '', materialType: '',
    sheetCost: '', sheetWidth: '600', sheetHeight: '400',
    usagePct: '80', laserTime: '', electricityRate: '0.15',
    machineWear: '', laborCost: '', profitMargin: '30',
    quantity: '1',
};

function n(v: string) { return parseFloat(v) || 0; }

function InputField({ label, value, onChange, placeholder, prefix }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; prefix?: string;
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrap}>
                {prefix ? <Text style={styles.inputPrefix}>{prefix}</Text> : null}
                <TextInput
                    style={[styles.input, prefix ? styles.inputPrefixed : undefined]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder ?? '0'}
                    placeholderTextColor={C.sub}
                    keyboardType="decimal-pad"
                />
            </View>
        </View>
    );
}

export default function CostCalculatorScreen() {
    const [f, setF] = useState<Inputs>(DEFAULT);
    const upd = (k: keyof Inputs) => (v: string) => setF(prev => ({ ...prev, [k]: v }));

    const calc = useMemo(() => {
        const qty = Math.max(n(f.quantity), 1);
        // Material cost = sheetCost × (usagePct / 100)
        const materialCost = n(f.sheetCost) * (n(f.usagePct) / 100);
        // Electricity = (laserTime / 60) × electricityRate
        const electricityCost = (n(f.laserTime) / 60) * n(f.electricityRate);
        const machineWear = n(f.machineWear);
        const laborCost = n(f.laborCost);
        const productionCostPerUnit = materialCost + electricityCost + machineWear + laborCost;
        const productionCostTotal = productionCostPerUnit * qty;
        const margin = Math.min(Math.max(n(f.profitMargin), 0), 99.9);
        // Selling price using margin: price = cost / (1 - margin/100)
        const sellingPricePerUnit = margin > 0
            ? productionCostPerUnit / (1 - margin / 100)
            : productionCostPerUnit;
        const sellingPriceTotal = sellingPricePerUnit * qty;
        const profitPerUnit = sellingPricePerUnit - productionCostPerUnit;
        const profitTotal = profitPerUnit * qty;
        const effectiveMargin = sellingPricePerUnit > 0
            ? (profitPerUnit / sellingPricePerUnit) * 100
            : 0;

        return {
            materialCost, electricityCost, machineWear, laborCost,
            productionCostPerUnit, productionCostTotal,
            sellingPricePerUnit, sellingPriceTotal,
            profitPerUnit, profitTotal,
            effectiveMargin, qty,
        };
    }, [f]);

    const reset = () => setF(DEFAULT);
    const fmt = (v: number) => `$${v.toFixed(2)}`;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.headerIcon}>
                        <Calculator color={C.primary} size={20} />
                    </View>
                    <View>
                        <Text style={styles.title}>Cost Calculator</Text>
                        <Text style={styles.subtitle}>Real-time project cost & profit calculation</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {/* ── Form ── */}
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Project Details</Text>

                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Project Name</Text>
                                <TextInput style={styles.input} value={f.projectName}
                                    onChangeText={upd('projectName')} placeholder="Custom Coasters"
                                    placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Material</Text>
                                <TextInput style={styles.input} value={f.materialType}
                                    onChangeText={upd('materialType')} placeholder="Birch Plywood 3mm"
                                    placeholderTextColor={C.sub} />
                            </View>
                        </View>

                        <View style={styles.sectionLabel}>
                            <DollarSign color={C.sub} size={14} />
                            <Text style={styles.sectionLabelText}>Material</Text>
                        </View>
                        <View style={styles.row}>
                            <InputField label="Sheet Cost ($)" value={f.sheetCost} onChange={upd('sheetCost')} placeholder="25.00" prefix="$" />
                            <InputField label="Usage (%)" value={f.usagePct} onChange={upd('usagePct')} placeholder="80" />
                        </View>
                        <View style={styles.row}>
                            <InputField label="Sheet Width (mm)" value={f.sheetWidth} onChange={upd('sheetWidth')} placeholder="600" />
                            <InputField label="Sheet Height (mm)" value={f.sheetHeight} onChange={upd('sheetHeight')} placeholder="400" />
                        </View>

                        <View style={styles.sectionLabel}>
                            <Zap color={C.sub} size={14} />
                            <Text style={styles.sectionLabelText}>Machine & Energy</Text>
                        </View>
                        <View style={styles.row}>
                            <InputField label="Laser Time (min)" value={f.laserTime} onChange={upd('laserTime')} placeholder="45" />
                            <InputField label="Electricity ($/hr)" value={f.electricityRate} onChange={upd('electricityRate')} placeholder="0.15" prefix="$" />
                        </View>
                        <View style={styles.row}>
                            <InputField label="Machine Wear ($)" value={f.machineWear} onChange={upd('machineWear')} placeholder="2.00" prefix="$" />
                            <InputField label="Labor Cost ($)" value={f.laborCost} onChange={upd('laborCost')} placeholder="10.00" prefix="$" />
                        </View>

                        <View style={styles.sectionLabel}>
                            <Clock color={C.sub} size={14} />
                            <Text style={styles.sectionLabelText}>Pricing</Text>
                        </View>
                        <View style={styles.row}>
                            <InputField label="Profit Margin (%)" value={f.profitMargin} onChange={upd('profitMargin')} placeholder="30" />
                            <InputField label="Quantity" value={f.quantity} onChange={upd('quantity')} placeholder="1" />
                        </View>
                    </View>

                    {/* ── Results ── */}
                    <View style={styles.sidebar}>
                        {/* Cost Breakdown */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Cost Breakdown</Text>
                            <Text style={styles.perUnit}>Per unit</Text>
                            <CostRow icon={<DollarSign color={C.sub} size={14}/>} label="Material" value={fmt(calc.materialCost)} />
                            <CostRow icon={<Zap color={C.sub} size={14}/>} label="Electricity" value={fmt(calc.electricityCost)} />
                            <CostRow icon={<Wrench color={C.sub} size={14}/>} label="Machine Wear" value={fmt(calc.machineWear)} />
                            <CostRow icon={<Clock color={C.sub} size={14}/>} label="Labor" value={fmt(calc.laborCost)} />
                            <View style={styles.divider} />
                            <View style={styles.costRow}>
                                <Text style={styles.totalLabel}>Production Cost / unit</Text>
                                <Text style={styles.totalValue}>{fmt(calc.productionCostPerUnit)}</Text>
                            </View>
                            {calc.qty > 1 && (
                                <View style={styles.costRow}>
                                    <Text style={styles.totalLabel}>Production Cost × {calc.qty}</Text>
                                    <Text style={styles.totalValue}>{fmt(calc.productionCostTotal)}</Text>
                                </View>
                            )}
                        </View>

                        {/* Selling Price */}
                        <View style={[styles.card, styles.priceCard]}>
                            <Text style={styles.cardTitle}>Recommended Pricing</Text>
                            <View style={styles.bigPrice}>
                                <Text style={styles.bigPriceLabel}>Selling Price</Text>
                                <Text style={styles.bigPriceValue}>{fmt(calc.sellingPricePerUnit)}<Text style={styles.bigPriceUnit}>/unit</Text></Text>
                                {calc.qty > 1 && <Text style={styles.totalPriceTotal}>Total: {fmt(calc.sellingPriceTotal)}</Text>}
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.profitGrid}>
                                <ProfitStat label="Profit / unit" value={fmt(calc.profitPerUnit)} color={C.green} />
                                <ProfitStat label="Margin" value={`${calc.effectiveMargin.toFixed(1)}%`} color={C.blue} />
                                {calc.qty > 1 && <ProfitStat label="Total Profit" value={fmt(calc.profitTotal)} color={C.green} />}
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                                <RotateCcw color={C.sub} size={18} />
                                <Text style={styles.resetBtnText}>Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function CostRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <View style={styles.costRow}>
            <View style={styles.costRowLeft}>
                {icon}
                <Text style={styles.costLabel}>{label}</Text>
            </View>
            <Text style={styles.costValue}>{value}</Text>
        </View>
    );
}

function ProfitStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.profitStat, { borderColor: color + '30', backgroundColor: color + '10' }]}>
            <Text style={[styles.profitStatValue, { color }]}>{value}</Text>
            <Text style={styles.profitStatLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { padding: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary + '15', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 13, color: C.sub, marginTop: 2 },
    scroll: { padding: 24, paddingTop: 0, paddingBottom: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    formCard: {
        flex: 2, minWidth: 300, backgroundColor: C.surface, borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 },
    sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
    sectionLabelText: { fontSize: 12, fontWeight: '700', color: C.sub, letterSpacing: 0.5, textTransform: 'uppercase' },
    row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
    inputGroup: { flex: 1, marginBottom: 12 },
    label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: '#F8FAFC', overflow: 'hidden' },
    inputPrefix: { paddingHorizontal: 10, fontSize: 14, color: C.sub, backgroundColor: '#F1F3F5', alignSelf: 'stretch', textAlignVertical: 'center', lineHeight: 44 },
    input: { flex: 1, height: 44, paddingHorizontal: 12, color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    inputPrefixed: { borderRadius: 0 },
    sidebar: { flex: 1, minWidth: 260, gap: 16 },
    card: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    priceCard: { borderColor: C.primary + '40', borderWidth: 2 },
    perUnit: { fontSize: 11, fontWeight: '600', color: C.sub, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    costRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    costLabel: { color: C.sub, fontSize: 14 },
    costValue: { color: C.text, fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
    totalLabel: { color: C.text, fontSize: 14, fontWeight: '700' },
    totalValue: { color: C.text, fontSize: 14, fontWeight: '800' },
    bigPrice: { alignItems: 'center', paddingVertical: 12 },
    bigPriceLabel: { fontSize: 13, color: C.sub, fontWeight: '600', marginBottom: 4 },
    bigPriceValue: { fontSize: 36, fontWeight: '900', color: C.primary },
    bigPriceUnit: { fontSize: 16, fontWeight: '600', color: C.sub },
    totalPriceTotal: { fontSize: 14, color: C.sub, marginTop: 4 },
    profitGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    profitStat: { flex: 1, minWidth: 80, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
    profitStatValue: { fontSize: 16, fontWeight: '800' },
    profitStatLabel: { fontSize: 11, color: C.sub, marginTop: 2, fontWeight: '600' },
    actionsRow: { gap: 8 },
    resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    resetBtnText: { color: C.sub, fontSize: 14, fontWeight: '600' },
});
