import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { Zap, Plus, Search, Star } from 'lucide-react-native';

const C = { bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB', text: '#111827', sub: '#6B7280', primary: '#F59E0B' };

export default function LaserPresetsScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <Zap color={C.primary} size={24} />
                        <Text style={styles.title}>Laser Presets</Text>
                    </View>
                    <Text style={styles.subtitle}>0 presets saved</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                    <Plus color="#fff" size={20} />
                    <Text style={styles.addBtnText}>Add Preset</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <Search color={C.sub} size={18} />
                    <TextInput style={styles.searchInput} placeholder="Search presets..." placeholderTextColor={C.sub} />
                </View>
                <TouchableOpacity style={styles.favBtn}>
                    <Star color={C.sub} size={18} />
                    <Text style={styles.favText}>Favorites</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.emptyState}>
                    <Zap color={C.sub} size={48} opacity={0.5} />
                    <Text style={styles.emptyText}>No presets yet</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { padding: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 14, color: C.sub, marginTop: 4 },
    addBtn: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: 8 },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    toolbar: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingBottom: 24 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 40, gap: 8 },
    searchInput: { flex: 1, color: C.text, fontSize: 14, outlineStyle: 'none' } as any,
    favBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 },
    favText: { color: C.sub, fontSize: 14, fontWeight: '500' },
    content: { flex: 1, padding: 24, paddingTop: 0 },
    emptyState: { flex: 1, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { color: C.sub, fontSize: 15, marginTop: 16, textAlign: 'center' }
});
