import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useProjects, ProjectRow } from '../hooks/useProjects';
import { useMaterials } from '../hooks/useMaterials';
import { Plus, Activity, CheckCircle, Clock, TrendingUp, ArrowRight, LogOut } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

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

function StatusBadge({ status }: { status: string }) {
    const color = STATUS_COLOR[status] ?? C.sub;
    return (
        <View style={[styles.badge, { borderColor: color, backgroundColor: color + '18' }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[status] ?? status}</Text>
        </View>
    );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string | number; label: string; color: string }) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                {icon}
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

export default function DashboardScreen({ navigation }: any) {
    const { signOut, displayName, avatarUrl } = useAuth();
    const { projects } = useProjects();
    const { materials, hourlyRate } = useMaterials();

    // Avatar: first letter of displayName for initials fallback
    const initials = displayName.charAt(0).toUpperCase();

    const { active, done, planned, totalCost, recent } = React.useMemo(() => {
        let activeCount = 0;
        let doneCount = 0;
        let plannedCount = 0;
        let sumCost = 0;

        const matMap = new Map(materials.map(m => [m.id, m]));

        for (const p of projects) {
            if (p.status === 'in-progress') activeCount++;
            else if (p.status === 'completed') doneCount++;
            else if (p.status === 'planned') plannedCount++;

            const mat = p.material_id ? matMap.get(p.material_id) : undefined;
            const matCost = (p.material_cost_per_unit ?? mat?.cost_per_unit ?? 0) * (p.material_quantity ?? 1);
            const timeCost = ((p.time_elapsed || 0) / 3600) * hourlyRate;
            sumCost += matCost + timeCost;
        }

        const recentList = [...projects].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ).slice(0, 5);

        return {
            active: activeCount,
            done: doneCount,
            planned: plannedCount,
            totalCost: sumCost,
            recent: recentList
        };
    }, [projects, materials, hourlyRate]);

    const navigate = (p: ProjectRow) => {
        navigation.navigate('ProjectDetails', { id: p.id });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <ResponsiveContainer>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerUser}>
                            {/* Avatar */}
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarFallback}>
                                    <Text style={styles.avatarInitial}>{initials}</Text>
                                </View>
                            )}
                            <View>
                                <Text style={styles.brand}>ZeroCut <Text style={styles.brandAccent}>PLANNER</Text></Text>
                                <Text style={styles.subtitle}>Welcome, {displayName}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
                            <LogOut color="#8B95A8" size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon={<Activity color={C.primary} size={20} />}
                            value={projects.length}
                            label="Total"
                            color={C.primary}
                        />
                        <StatCard
                            icon={<Clock color={C.amber} size={20} />}
                            value={active}
                            label="In Progress"
                            color={C.amber}
                        />
                        <StatCard
                            icon={<CheckCircle color={C.green} size={20} />}
                            value={done}
                            label="Completed"
                            color={C.green}
                        />
                        <StatCard
                            icon={<TrendingUp color={C.blue} size={20} />}
                            value={`$${totalCost.toFixed(0)}`}
                            label="Total Cost"
                            color={C.blue}
                        />
                    </View>

                    {/* Recent Projects */}
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>RECENT PROJECTS</Text>
                        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Projects')}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {recent.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🔦</Text>
                            <Text style={styles.emptyTitle}>No projects yet</Text>
                            <Text style={styles.emptySub}>Head over to the Projects tab to start your first laser cutting project.</Text>
                        </View>
                    ) : (
                        <View style={styles.recentList}>
                            {recent.map(p => {
                                const mat = materials.find(m => m.id === p.material_id);
                                return (
                                    <TouchableOpacity key={p.id} style={styles.row} onPress={() => navigate(p)} activeOpacity={0.75}>
                                        <View style={[styles.rowBar, { backgroundColor: STATUS_COLOR[p.status] ?? C.sub }]} />
                                        <View style={styles.rowBody}>
                                            <View style={styles.rowTop}>
                                                <Text style={styles.rowTitle} numberOfLines={1}>{p.title}</Text>
                                                <StatusBadge status={p.status} />
                                            </View>
                                            <Text style={styles.rowMeta} numberOfLines={1}>
                                                {mat ? `${mat.name} · ${p.material_thickness || mat.thickness}mm` : 'No material'}
                                                {p.machine ? ` · ${p.machine}` : ''}
                                            </Text>
                                        </View>
                                        <ArrowRight color={C.dim} size={16} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ResponsiveContainer>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { paddingBottom: 32 },
    header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: C.primary },
    avatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary + '30', borderWidth: 2, borderColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 16, fontWeight: '800', color: C.primary },
    brand: { fontSize: 22, fontWeight: '800', color: C.text },
    brandAccent: { color: C.primary },
    subtitle: { fontSize: 13, color: C.sub, marginTop: 2 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 8 },
    statCard: {
        flex: 1, minWidth: '44%', backgroundColor: C.surface,
        borderRadius: 16, padding: 16, alignItems: 'center',
        borderWidth: 1, borderColor: C.border, gap: 6,
    },
    statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 11, color: C.sub, fontWeight: '600', letterSpacing: 0.5 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 28, marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 1.5 },
    seeAll: { fontSize: 13, color: C.primary, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
    emptySub: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 22 },
    recentList: { width: '100%', maxWidth: 800, alignSelf: 'center' },
    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 8,
        borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    },
    rowBar: { width: 4, alignSelf: 'stretch' },
    rowBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    rowTitle: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
    rowMeta: { fontSize: 12, color: C.sub },
    badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    signOutBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.07)',
        justifyContent: 'center', alignItems: 'center',
    },
});
