import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Calculator, RotateCcw, Save } from 'lucide-react-native';

const C = {
    bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', primary: '#F59E0B',
};

export default function CostCalculatorScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Calculator color={C.primary} size={24} />
                    <Text style={styles.title}>Project Cost Calculator</Text>
                </View>
                <Text style={styles.subtitle}>Calculate the true cost and profit of your project</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.grid}>
                    {/* Form Component */}
                    <View style={styles.formCard}>
                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Project Name</Text>
                                <TextInput style={styles.input} placeholder="Custom Coaster Set" placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Material Type</Text>
                                <TextInput style={styles.input} placeholder="Birch Plywood" placeholderTextColor={C.sub} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Sheet Cost ($)</Text>
                                <TextInput style={styles.input} placeholder="" placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Sheet Size</Text>
                                <TextInput style={styles.input} placeholder="600x400mm" placeholderTextColor={C.sub} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Material Usage (%)</Text>
                                <TextInput style={styles.input} placeholder="80" placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Laser Time (min)</Text>
                                <TextInput style={styles.input} placeholder="" placeholderTextColor={C.sub} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Electricity Cost ($/hr)</Text>
                                <TextInput style={styles.input} placeholder="0.15" placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Machine Wear ($)</Text>
                                <TextInput style={styles.input} placeholder="" placeholderTextColor={C.sub} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Labor Cost ($)</Text>
                                <TextInput style={styles.input} placeholder="" placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Profit Margin (%)</Text>
                                <TextInput style={styles.input} placeholder="30" placeholderTextColor={C.sub} />
                            </View>
                        </View>
                    </View>

                    {/* Breakdown */}
                    <View style={styles.sidebar}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Cost Breakdown</Text>
                            <View style={styles.costRow}><Text style={styles.costLabel}>Material Cost</Text><Text style={styles.costValue}>$0.00</Text></View>
                            <View style={styles.costRow}><Text style={styles.costLabel}>Electricity</Text><Text style={styles.costValue}>$0.00</Text></View>
                            <View style={styles.costRow}><Text style={styles.costLabel}>Machine Wear</Text><Text style={styles.costValue}>$0.00</Text></View>
                            <View style={styles.costRow}><Text style={styles.costLabel}>Labor</Text><Text style={styles.costValue}>$0.00</Text></View>
                            
                            <View style={styles.divider} />
                            <View style={styles.costRow}>
                                <Text style={styles.totalLabel}>Production Cost</Text>
                                <Text style={styles.totalValue}>$0.00</Text>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={[styles.costRow, { marginBottom: 16 }]}>
                                <Text style={styles.costLabel}>Selling Price</Text>
                                <Text style={[styles.costValue, { color: C.primary, fontSize: 18, fontWeight: '700' }]}>$0.00</Text>
                            </View>
                            <View style={styles.costRow}><Text style={styles.costLabel}>Profit</Text><Text style={[styles.costValue, { fontWeight: '700' }]}>$0.00</Text></View>
                            <View style={styles.costRow}><Text style={styles.costLabel}>Margin</Text><Text style={[styles.costValue, { fontWeight: '700' }]}>0.0%</Text></View>
                        </View>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity style={styles.saveBtn}>
                                <Save color="#fff" size={18} />
                                <Text style={styles.saveBtnText}>Save as Project</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.resetBtn}>
                                <RotateCcw color={C.sub} size={18} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { padding: 24, paddingBottom: 16 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 14, color: C.sub, marginTop: 4 },
    scroll: { padding: 24, paddingTop: 0 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    formCard: { 
        flex: 2, minWidth: 300, backgroundColor: C.surface, borderRadius: 12, padding: 24,
        borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2 
    },
    row: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    inputGroup: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
    input: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F8FAFC', color: C.text },
    sidebar: { flex: 1, minWidth: 260, gap: 16 },
    card: { 
        backgroundColor: C.surface, borderRadius: 12, padding: 20, 
        borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2 
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    costLabel: { color: C.sub, fontSize: 14 },
    costValue: { color: C.text, fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
    totalLabel: { color: C.text, fontSize: 15, fontWeight: '700' },
    totalValue: { color: C.text, fontSize: 16, fontWeight: '800' },
    actionsRow: { flexDirection: 'row', gap: 12 },
    saveBtn: { flex: 1, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 8 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    resetBtn: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface }
});
