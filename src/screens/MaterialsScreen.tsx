import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Package, Plus } from 'lucide-react-native';

const C = { bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB', text: '#111827', sub: '#6B7280', primary: '#F59E0B' };

export default function MaterialsScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <Package color={C.primary} size={24} />
                        <Text style={styles.title}>Material Inventory</Text>
                    </View>
                    <Text style={styles.subtitle}>0 materials tracked</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                    <Plus color="#fff" size={20} />
                    <Text style={styles.addBtnText}>Add Material</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.emptyState}>
                    <Package color={C.sub} size={48} opacity={0.5} />
                    <Text style={styles.emptyText}>No materials yet. Add your first material to start tracking inventory.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 14, color: C.sub, marginTop: 4 },
    addBtn: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: 8 },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    content: { flex: 1, padding: 24, paddingTop: 0 },
    emptyState: { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { color: C.sub, fontSize: 15, marginTop: 16, textAlign: 'center' }
});
