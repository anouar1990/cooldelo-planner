import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList,
    TouchableOpacity, Alert, useWindowDimensions
} from 'react-native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { useProjects } from '../hooks/useProjects';
import { useMaterials } from '../hooks/useMaterials';
import { ChevronLeft, Copy, Bookmark, Trash2, Clock, DollarSign } from 'lucide-react-native';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

export default function TemplatesScreen({ navigation }: any) {
    const { projects, updateProject, deleteProject } = useProjects();
    const { materials, hourlyRate } = useMaterials();
    const { width } = useWindowDimensions();
    const numColumns = width > 1024 ? 3 : width > 768 ? 2 : 1;

    // Templates = projects with is_template = true
    const templates = projects.filter((p: any) => p.is_template);

    const useTemplate = (t: any) => {
        // Navigate to AddProject pre-filled with template data
        navigation.navigate('AddProject', {
            prefill: {
                title: t.title,
                material_id: t.material_id,
                machine: t.machine,
                material_quantity: t.material_quantity,
                material_cost_per_unit: t.material_cost_per_unit,
                notes: t.notes,
                client_id: t.client_id,
            }
        });
    };

    const removeTemplate = (t: any) => {
        Alert.alert('Remove Template', `Remove "${t.title}" from templates? The project will remain.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => updateProject(t.id, { is_template: false, template_name: null }) },
        ]);
    };

    const getCost = (p: any) => {
        const mat = materials.find((m: any) => m.id === p.material_id);
        const matCost = (p.material_cost_per_unit ?? mat?.cost_per_unit ?? 0) * (p.material_quantity ?? 1);
        const timeCost = ((p.time_elapsed || 0) / 3600) * hourlyRate;
        return matCost + timeCost;
    };

    return (
        <SafeAreaView style={s.safe}>
            <ResponsiveContainer>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <ChevronLeft color={C.text} size={22} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={s.title}>Templates</Text>
                        <Text style={s.subtitle}>Saved project templates</Text>
                    </View>
                </View>

                {templates.length === 0 ? (
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>📐</Text>
                        <Text style={s.emptyTitle}>No templates yet</Text>
                        <Text style={s.emptySub}>
                            Open any project → tap <Text style={{ color: C.primary }}>⋮ Save as Template</Text> to save it here for reuse.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={templates}
                        key={numColumns}
                        numColumns={numColumns}
                        keyExtractor={(t: any) => t.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
                        columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
                        renderItem={({ item: t }) => {
                            const mat = materials.find((m: any) => m.id === t.material_id);
                            const cost = getCost(t);
                            const hours = Math.floor((t.time_elapsed || 0) / 3600);
                            const mins = Math.floor(((t.time_elapsed || 0) % 3600) / 60);
                            return (
                                <View style={[s.card, { flex: 1 }]}>
                                    <View style={s.cardBadge}>
                                        <Bookmark color={C.primary} size={12} fill={C.primary} />
                                        <Text style={s.cardBadgeText}>TEMPLATE</Text>
                                    </View>
                                    <Text style={s.cardTitle}>{t.template_name || t.title}</Text>
                                    {mat ? <Text style={s.cardMat}>{mat.name} · {mat.thickness}mm</Text> : null}

                                    <View style={s.cardMeta}>
                                        <View style={s.metaItem}>
                                            <DollarSign color={C.sub} size={12} />
                                            <Text style={s.metaText}>${cost.toFixed(2)} est.</Text>
                                        </View>
                                        {(t.time_elapsed ?? 0) > 0 && (
                                            <View style={s.metaItem}>
                                                <Clock color={C.sub} size={12} />
                                                <Text style={s.metaText}>{hours}h {mins}m</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={s.cardActions}>
                                        <TouchableOpacity style={s.useBtn} onPress={() => useTemplate(t)}>
                                            <Copy color="#fff" size={14} />
                                            <Text style={s.useBtnText}>Use Template</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={s.removeBtn} onPress={() => removeTemplate(t)}>
                                            <Trash2 color={C.dim} size={14} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
    back: { width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 12, color: C.sub, marginTop: 2 },
    card: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border, gap: 8, marginBottom: 12 },
    cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: C.primary + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    cardBadgeText: { fontSize: 9, fontWeight: '800', color: C.primary, letterSpacing: 0.5 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    cardMat: { fontSize: 13, color: C.sub },
    cardMeta: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: C.sub },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    useBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 10 },
    useBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    removeBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyIcon: { fontSize: 52 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
    emptySub: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 22 },
});
