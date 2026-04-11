import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { FileText, Plus, Save } from 'lucide-react-native';

const C = { bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB', text: '#111827', sub: '#6B7280', primary: '#F59E0B' };

export default function QuoteGeneratorScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <FileText color={C.primary} size={24} />
                    <Text style={styles.title}>Quote Generator</Text>
                </View>
                <Text style={styles.subtitle}>Create professional quotes for your clients</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.grid}>
                    {/* Form */}
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>New Quote</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Customer Name</Text>
                            <TextInput style={styles.input} placeholder="" placeholderTextColor={C.sub} />
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Project Description</Text>
                            <TextInput style={[styles.input, styles.textArea]} multiline placeholder="" placeholderTextColor={C.sub} />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Quantity</Text>
                                <TextInput style={styles.input} placeholder="1" placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Unit Price ($)</Text>
                                <TextInput style={styles.input} placeholder="" placeholderTextColor={C.sub} />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Delivery Date</Text>
                            <TextInput style={styles.input} placeholder="dd/mm/yyyy" placeholderTextColor={C.sub} />
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>$0.00</Text>
                        </View>

                        <TouchableOpacity style={styles.saveBtn}>
                            <Plus color="#fff" size={18} />
                            <Text style={styles.saveBtnText}>Save Quote</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Saved */}
                    <View style={styles.sidebar}>
                        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Saved Quotes</Text>
                        <View style={styles.emptyState}>
                            <FileText color={C.sub} size={32} opacity={0.5} />
                            <Text style={styles.emptyText}>No quotes yet</Text>
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
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 14, color: C.sub, marginTop: 4 },
    scroll: { padding: 24, paddingTop: 0 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    formCard: { 
        flex: 1.5, minWidth: 300, backgroundColor: C.surface, borderRadius: 12, padding: 24,
        borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2 
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    row: { flexDirection: 'row', gap: 16 },
    label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
    input: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F8FAFC', color: C.text },
    textArea: { height: 100, paddingTop: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: C.border, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 20 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: C.text },
    totalValue: { fontSize: 20, fontWeight: '800', color: C.primary },
    saveBtn: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 8 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    sidebar: { flex: 1, minWidth: 260 },
    emptyState: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', padding: 40, height: 200 },
    emptyText: { color: C.sub, fontSize: 14, marginTop: 12 }
});
