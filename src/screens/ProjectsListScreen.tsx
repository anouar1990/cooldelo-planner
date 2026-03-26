import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    SafeAreaView, TextInput, Image, ScrollView, useWindowDimensions
} from 'react-native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
// useStore removed — not used in this screen; projects come from useProjects (Supabase-backed)
import { useProjects, ProjectRow } from '../hooks/useProjects';
import { useMaterials, MaterialRow } from '../hooks/useMaterials';
import { useSubscription } from '../hooks/useSubscription';
import { Plus, Search, X, Clock, DollarSign, Layers, ChevronRight, Zap, Cpu, User, Copy, Bookmark } from 'lucide-react-native';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

const STATUS_LABEL: Record<string, string> = {
    planned: 'Planned', 'in-progress': 'In Progress', completed: 'Completed',
};
const STATUS_COLOR: Record<string, string> = {
    planned: C.blue, 'in-progress': C.amber, completed: C.green,
};

// Material type → color + emoji
const MAT_META: Record<string, { color: string; emoji: string }> = {
    wood: { color: '#B45309', emoji: '🪵' },
    acrylic: { color: '#7C3AED', emoji: '✨' },
    leather: { color: '#92400E', emoji: '🟫' },
    mdf: { color: '#6B7280', emoji: '📦' },
    stone: { color: '#4B5563', emoji: '🪨' },
    other: { color: C.sub, emoji: '⬡' },
};

const FILTERS = ['All', 'Planned', 'In Progress', 'Completed'];
const TABS = ['Projects', 'Materials'];

export default function ProjectsListScreen({ navigation }: any) {
    const { projects, refetch: projectsRefetch, loading: pLoading } = useProjects();
    const { materials, hourlyRate, refetch: materialsRefetch, loading: mLoading } = useMaterials();
    const { isPro } = useSubscription();
    const { width } = useWindowDimensions();
    const numColumns = width > 1024 ? 3 : width > 768 ? 2 : 1;

    const FREE_PROJECT_LIMIT = 3;

    const [tab, setTab] = useState<'Projects' | 'Materials'>('Projects');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('All');
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        if (tab === 'Projects') {
            await projectsRefetch();
        } else {
            await materialsRefetch();
        }
        setRefreshing(false);
    };

    const filtered = React.useMemo(() => {
        return projects.filter(p => {
            const matchQ = p.title.toLowerCase().includes(query.toLowerCase());
            const matchF =
                filter === 'All' ||
                (filter === 'Planned' && p.status === 'planned') ||
                (filter === 'In Progress' && p.status === 'in-progress') ||
                (filter === 'Completed' && p.status === 'completed');
            return matchQ && matchF;
        });
    }, [projects, query, filter]);

    // --- Project card ---
    const renderCard = ({ item: p }: { item: ProjectRow }) => {
        const mat = materials.find(m => m.id === p.material_id);
        const matColor = mat ? (MAT_META[mat.type]?.color ?? C.sub) : C.sub;
        const matCost = (p.material_cost_per_unit ?? mat?.cost_per_unit ?? 0) * (p.material_quantity ?? 1);
        const elapsed = p.time_elapsed || 0;
        const timeCost = (elapsed / 3600) * hourlyRate;
        const totalCost = (matCost + timeCost).toFixed(2);
        const hours = Math.floor(elapsed / 3600);
        const mins = Math.floor((elapsed % 3600) / 60);
        const timeStr = elapsed === 0 ? '—' : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        type StatusKey = 'planned' | 'in-progress' | 'completed';
        const st: StatusKey = p.status as StatusKey;
        const color = STATUS_COLOR[st] ?? C.sub;

        return (
            <TouchableOpacity
                style={[styles.card, { flex: 1, marginHorizontal: numColumns > 1 ? 8 : 0 }]}
                onPress={() => navigation.navigate('ProjectDetails', { id: p.id })}
                activeOpacity={0.78}
            >
                {/* Banner */}
                {p.image_uri ? (
                    <Image source={{ uri: p.image_uri }} style={styles.cardImage} />
                ) : (
                    <View style={[styles.cardImagePlaceholder, { backgroundColor: color + '22' }]}>
                        <Text style={styles.cardImageEmoji}>
                            {mat ? (MAT_META[mat.type]?.emoji ?? '✦') : '✦'}
                        </Text>
                    </View>
                )}

                <View style={styles.cardBody}>
                    {/* Title + status */}
                    <View style={styles.cardTop}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                        <View style={[styles.badge, { borderColor: color, backgroundColor: color + '18' }]}>
                            <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[p.status]}</Text>
                        </View>
                    </View>

                    {/* Material type chip + name */}
                    {mat && (
                        <View style={styles.matRow}>
                            <View style={[styles.matTypePill, { backgroundColor: matColor + '20', borderColor: matColor + '50' }]}>
                                <Text style={[styles.matTypeText, { color: matColor }]}>
                                    {mat.type.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.matName}>{mat.name} · {mat.thickness}mm</Text>
                        </View>
                    )}

                    {p.description ? (
                        <Text style={styles.cardDesc} numberOfLines={2}>{p.description}</Text>
                    ) : null}

                    {/* Metadata row */}
                    <View style={styles.cardMeta}>
                        <View style={styles.metaItem}>
                            <Clock color={C.dim} size={13} />
                            <Text style={styles.metaText}>{timeStr}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <DollarSign color={C.dim} size={13} />
                            <Text style={styles.metaText}>${totalCost}</Text>
                        </View>
                        {p.machine ? (
                            <Text style={styles.metaMachine}>{p.machine}</Text>
                        ) : null}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // --- Materials section ---
    const renderMaterials = () => {
        if (materials.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>No materials added yet.</Text>
                    <Text style={styles.emptySub}>Tap + to add your first material.</Text>
                </View>
            );
        }

        // Group by type
        const groups = materials.reduce((acc, m) => {
            if (!acc[m.type]) acc[m.type] = [];
            acc[m.type].push(m);
            return acc;
        }, {} as Record<string, MaterialRow[]>);

        return (
            <ScrollView contentContainerStyle={styles.matSection} showsVerticalScrollIndicator={false}>
                <Text style={styles.matSectionHint}>
                    Material library used across all your projects.
                </Text>
                {Object.entries(groups).map(([type, mats]) => {
                    const meta = MAT_META[type] ?? MAT_META.other;
                    return (
                        <View key={type} style={styles.matGroup}>
                            {/* Group header */}
                            <View style={styles.matGroupHeader}>
                                <Text style={styles.matGroupEmoji}>{meta.emoji}</Text>
                                <Text style={[styles.matGroupTitle, { color: meta.color }]}>
                                    {type.toUpperCase()}
                                </Text>
                            </View>

                            {(mats as MaterialRow[]).map(m => {
                                const usedInProjects = projects.filter(p => p.material_id === m.id).length;
                                return (
                                    <View key={m.id} style={styles.matCard}>
                                        <View style={styles.matCardLeft}>
                                            <Text style={styles.matCardName}>{m.name}</Text>
                                            <View style={styles.matCardDetails}>
                                                <View style={styles.matDetail}>
                                                    <Text style={styles.matDetailLabel}>THICKNESS</Text>
                                                    <Text style={styles.matDetailValue}>{m.thickness} mm</Text>
                                                </View>
                                                <View style={styles.matDetailDivider} />
                                                <View style={styles.matDetail}>
                                                    <Text style={styles.matDetailLabel}>COST / SQFT</Text>
                                                    <Text style={[styles.matDetailValue, { color: C.primary }]}>
                                                        ${m.cost_per_unit.toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View style={styles.matDetailDivider} />
                                                <View style={styles.matDetail}>
                                                    <Text style={styles.matDetailLabel}>PROJECTS</Text>
                                                    <Text style={styles.matDetailValue}>{usedInProjects}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View style={[styles.matColorBar, { backgroundColor: meta.color }]} />
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
                {/* Spacer for FAB */}
                <View style={{ height: 100 }} />
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Projects</Text>
                </View>

                {/* Pro Tools Quick Access */}
                {isPro && (
                    <View style={styles.proToolsRow}>
                        <TouchableOpacity style={styles.proTool} onPress={() => navigation.navigate('Clients')}>
                            <User color={C.primary} size={16} />
                            <Text style={styles.proToolText}>Clients</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.proTool} onPress={() => navigation.navigate('Templates')}>
                            <Bookmark color={C.primary} size={16} />
                            <Text style={styles.proToolText}>Templates</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.proTool} onPress={() => navigation.navigate('MachineProfiles')}>
                            <Cpu color={C.primary} size={16} />
                            <Text style={styles.proToolText}>Machines</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tab switcher */}
                <View style={styles.tabRow}>
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                            onPress={() => {
                                if (t === 'Materials' && !isPro) {
                                    navigation.navigate('Paywall');
                                    return;
                                }
                                setTab(t as any);
                            }}
                        >
                            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t}</Text>
                            {t === 'Materials' && !isPro && (
                                <Zap color="#F59E0B" size={11} fill="#F59E0B" style={{ marginLeft: 4 }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Projects tab */}
                {tab === 'Projects' && (
                    <>
                        {/* Search */}
                        <View style={styles.searchRow}>
                            <Search color={C.sub} size={18} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search projects..."
                                placeholderTextColor={C.dim}
                                value={query}
                                onChangeText={setQuery}
                            />
                            {query ? (
                                <TouchableOpacity onPress={() => setQuery('')}>
                                    <X color={C.sub} size={18} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Status filters */}
                        <View style={styles.filterRow}>
                            {FILTERS.map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[styles.filterChip, filter === f && styles.filterChipActive]}
                                    onPress={() => setFilter(f)}
                                >
                                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <FlatList
                            data={filtered}
                            key={numColumns} // Force re-render on grid size change
                            numColumns={numColumns}
                            keyExtractor={p => p.id}
                            renderItem={renderCard}
                            contentContainerStyle={styles.list}
                            columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
                            showsVerticalScrollIndicator={false}
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>📂</Text>
                                    <Text style={styles.emptyTitle}>No projects found</Text>
                                    <Text style={styles.emptySub}>
                                        {query ? 'Try a different search term.' : 'Tap + to add your first project.'}
                                    </Text>
                                </View>
                            }
                        />
                    </>
                )}

                {/* Materials tab */}
                {tab === 'Materials' && renderMaterials()}
            </ResponsiveContainer>

            {/* FAB */}
            {tab === 'Projects' ? (
                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.8}
                    onPress={() => {
                        if (!isPro && projects.length >= FREE_PROJECT_LIMIT) {
                            navigation.navigate('Paywall');
                            return;
                        }
                        navigation.navigate('AddProject');
                    }}
                >
                    <Plus color="#FFF" size={24} />
                </TouchableOpacity>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 4 },
    title: { fontSize: 28, fontWeight: '800', color: C.text },
    tabRow: {
        flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 0,
        backgroundColor: C.surface, borderRadius: 12, padding: 4,
        borderWidth: 1, borderColor: C.border,
    },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
    tabBtnActive: { backgroundColor: C.primary },
    tabBtnText: { fontSize: 13, fontWeight: '700', color: C.sub },
    tabBtnTextActive: { color: '#fff' },
    searchRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, marginHorizontal: 16, marginVertical: 10,
        borderRadius: 12, paddingHorizontal: 14, height: 46,
        borderWidth: 1, borderColor: C.border,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: C.text, fontSize: 15 },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10, flexWrap: 'wrap' },
    filterChip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    },
    filterChipActive: { backgroundColor: C.primary, borderColor: C.primary },
    filterText: { fontSize: 12, fontWeight: '600', color: C.sub },
    filterTextActive: { color: '#fff' },
    list: { paddingHorizontal: 0, paddingBottom: 120 },
    card: {
        backgroundColor: C.surface, borderRadius: 16, marginBottom: 16,
        overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    },
    cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
    cardImagePlaceholder: { width: '100%', height: 80, justifyContent: 'center', alignItems: 'center' },
    cardImageEmoji: { fontSize: 28, color: '#fff', opacity: 0.6 },
    cardBody: { padding: 14 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
    badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    matRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    matTypePill: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
    matTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    matName: { fontSize: 12, color: C.sub },
    cardDesc: { fontSize: 13, color: C.sub, lineHeight: 20, marginBottom: 8 },
    cardMeta: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 13, color: C.sub },
    metaMachine: { fontSize: 12, color: C.dim, marginLeft: 'auto' },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: C.sub, textAlign: 'center' },
    // Materials tab
    matSection: { paddingHorizontal: 16, paddingTop: 16 },
    matSectionHint: { fontSize: 13, color: C.sub, marginBottom: 20 },
    matGroup: { marginBottom: 24 },
    matGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    matGroupEmoji: { fontSize: 18 },
    matGroupTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    matCard: {
        backgroundColor: C.surface, borderRadius: 14, marginBottom: 8,
        borderWidth: 1, borderColor: C.border, flexDirection: 'row', overflow: 'hidden',
    },
    matCardLeft: { flex: 1, padding: 14 },
    matCardName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 10 },
    matCardDetails: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    matDetail: { alignItems: 'flex-start', gap: 3 },
    matDetailLabel: { fontSize: 9, fontWeight: '700', color: C.dim, letterSpacing: 1 },
    matDetailValue: { fontSize: 14, fontWeight: '700', color: C.text },
    matDetailDivider: { width: 1, height: 28, backgroundColor: C.border },
    matColorBar: { width: 5, alignSelf: 'stretch' },
    fab: {
        position: 'absolute', bottom: 32, right: 24,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
        shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
    },
    proToolsRow: {
        flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10,
    },
    proTool: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: C.surface, borderRadius: 12, paddingVertical: 9,
        borderWidth: 1, borderColor: C.primary + '30',
    },
    proToolText: {
        fontSize: 12, fontWeight: '700', color: C.primary,
    },
});
