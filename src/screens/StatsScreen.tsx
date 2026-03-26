import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useProjects } from '../hooks/useProjects';
import { useMaterials } from '../hooks/useMaterials';
import { useClients } from '../hooks/useClients';
import { TrendingUp, Clock, DollarSign, Award, Users } from 'lucide-react-native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

function MetricCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }) {
    return (
        <View style={[styles.metricCard, accent && { borderColor: accent + '30' }]}>
            <View style={[styles.metricIcon, { backgroundColor: (accent ?? C.primary) + '18' }]}>{icon}</View>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={[styles.metricValue, { color: accent ?? C.primary }]}>{value}</Text>
            {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
        </View>
    );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(value / max, 1) : 0;
    return (
        <View style={styles.barBg}>
            <View style={[styles.barFg, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
        </View>
    );
}

export default function StatsScreen() {
    const { projects } = useProjects();
    const { materials, hourlyRate } = useMaterials();
    const { clients } = useClients();

    const totalProjects = projects.length;
    const completed = projects.filter(p => p.status === 'completed');
    const inProgress = projects.filter(p => p.status === 'in-progress');
    const planned = projects.filter(p => p.status === 'planned');
    const completionRate = totalProjects > 0 ? Math.round((completed.length / totalProjects) * 100) : 0;

    const totalTimeSeconds = projects.reduce((s, p) => s + (p.time_elapsed || 0), 0);
    const totalHours = (totalTimeSeconds / 3600).toFixed(1);

    const avgHours = completed.length > 0
        ? (completed.reduce((s, p) => s + (p.time_elapsed || 0), 0) / completed.length / 3600)
        : 0;

    const projectCosts = projects.map(p => {
        const mat = materials.find(m => m.id === p.material_id);
        const matCost = (p.material_cost_per_unit ?? mat?.cost_per_unit ?? 0) * (p.material_quantity ?? 1);
        const timeCost = ((p.time_elapsed || 0) / 3600) * hourlyRate;
        return { project: p, cost: matCost + timeCost };
    });

    const totalRevenue = projectCosts.reduce((a, b) => a + b.cost, 0);
    const avgCost = totalProjects > 0 ? totalRevenue / totalProjects : 0;

    // Top 5 projects by cost
    const top5 = [...projectCosts].sort((a, b) => b.cost - a.cost).slice(0, 5);
    const maxCost = top5[0]?.cost ?? 1;

    // Material usage
    const matUsage: Record<string, number> = {};
    projects.forEach(p => { if (p.material_id) matUsage[p.material_id] = (matUsage[p.material_id] ?? 0) + 1; });
    const maxMat = Math.max(...Object.values(matUsage), 1);
    const topMat = materials.reduce((best, m) => {
        const count = matUsage[m.id] ?? 0;
        return count > (matUsage[best?.id ?? ''] ?? 0) ? m : best;
    }, materials[0]);

    const statusData = [
        { label: 'Planned', count: planned.length, color: C.blue },
        { label: 'In Progress', count: inProgress.length, color: C.amber },
        { label: 'Completed', count: completed.length, color: C.green },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <ResponsiveContainer>
                    <View style={styles.header}>
                        <Text style={styles.title}>Stats</Text>
                        <Text style={styles.subtitle}>Your productivity at a glance</Text>
                    </View>

                    {/* Key Metrics */}
                    <View style={styles.metricsGrid}>
                        <MetricCard icon={<DollarSign color={C.primary} size={18} />} label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} sub="all projects" />
                        <MetricCard icon={<TrendingUp color={C.green} size={18} />} label="Completion" value={`${completionRate}%`} sub="rate" accent={C.green} />
                        <MetricCard icon={<Clock color={C.blue} size={18} />} label="Total Time" value={`${totalHours}h`} sub="logged" accent={C.blue} />
                        <MetricCard icon={<DollarSign color={C.amber} size={18} />} label="Avg Cost" value={`$${avgCost.toFixed(0)}`} sub="per project" accent={C.amber} />
                    </View>

                    {/* Highlights */}
                    <View style={styles.highlightRow}>
                        <View style={[styles.highlight, { borderColor: C.green + '30' }]}>
                            <Award color={C.green} size={16} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.highlightLabel}>TOP MATERIAL</Text>
                                <Text style={styles.highlightValue}>{topMat?.name ?? '—'}</Text>
                            </View>
                            <Text style={[styles.highlightCount, { color: C.green }]}>{topMat ? (matUsage[topMat.id] ?? 0) : 0}x</Text>
                        </View>
                        <View style={[styles.highlight, { borderColor: C.blue + '30' }]}>
                            <Users color={C.blue} size={16} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.highlightLabel}>CLIENTS</Text>
                                <Text style={styles.highlightValue}>{clients.length} active</Text>
                            </View>
                            <Text style={[styles.highlightCount, { color: C.blue }]}>{completed.length} done</Text>
                        </View>
                    </View>

                    {/* Status Breakdown */}
                    <Text style={styles.sectionTitle}>STATUS BREAKDOWN</Text>
                    <View style={styles.card}>
                        {statusData.map(s => (
                            <View key={s.label} style={styles.statRow}>
                                <View style={styles.statRowLabel}>
                                    <View style={[styles.dot, { backgroundColor: s.color }]} />
                                    <Text style={styles.statRowText}>{s.label}</Text>
                                </View>
                                <View style={styles.statRowBar}>
                                    <ProgressBar value={s.count} max={totalProjects} color={s.color} />
                                </View>
                                <Text style={[styles.statRowCount, { color: s.color }]}>{s.count}</Text>
                            </View>
                        ))}
                        {totalProjects === 0 && <Text style={styles.empty}>No projects yet.</Text>}
                    </View>

                    {/* Top Projects by Cost */}
                    {top5.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>TOP PROJECTS BY COST</Text>
                            <View style={styles.card}>
                                {top5.map(({ project: p, cost }, i) => (
                                    <View key={p.id} style={[styles.statRow, i > 0 && styles.topRowBorder]}>
                                        <Text style={styles.topRank}>#{i + 1}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.topName} numberOfLines={1}>{p.title}</Text>
                                            <ProgressBar value={cost} max={maxCost} color={C.primary} />
                                        </View>
                                        <Text style={styles.topCost}>${cost.toFixed(0)}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Material Usage */}
                    <Text style={styles.sectionTitle}>MATERIAL USAGE</Text>
                    <View style={styles.card}>
                        {materials.map(m => {
                            const count = matUsage[m.id] ?? 0;
                            return (
                                <View key={m.id} style={styles.statRow}>
                                    <Text style={[styles.statRowText, { width: 130 }]} numberOfLines={1}>{m.name}</Text>
                                    <View style={styles.statRowBar}>
                                        <ProgressBar value={count} max={maxMat} color={C.primary} />
                                    </View>
                                    <Text style={[styles.statRowCount, { color: C.primary }]}>{count}</Text>
                                </View>
                            );
                        })}
                        {Object.keys(matUsage).length === 0 && <Text style={styles.empty}>No material data yet.</Text>}
                    </View>

                    {/* Avg Hours */}
                    {completed.length > 0 && (
                        <View style={[styles.card, styles.avgHoursRow]}>
                            <View>
                                <Text style={styles.avgHoursLabel}>AVG TIME PER COMPLETED PROJECT</Text>
                                <Text style={styles.avgHoursValue}>{avgHours.toFixed(1)} hours</Text>
                            </View>
                            <Clock color={C.blue} size={24} />
                        </View>
                    )}
                </ResponsiveContainer>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { paddingBottom: 40 },
    header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 14, color: C.sub, marginTop: 4 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, marginBottom: 4 },
    metricCard: {
        flex: 1, minWidth: 150, backgroundColor: C.surface,
        borderRadius: 18, padding: 16, gap: 6,
        borderWidth: 1, borderColor: C.border,
    },
    metricIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
    metricLabel: { fontSize: 10, fontWeight: '700', color: C.dim, letterSpacing: 1 },
    metricValue: { fontSize: 24, fontWeight: '800' },
    metricSub: { fontSize: 11, color: C.sub },
    highlightRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginBottom: 4 },
    highlight: { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
    highlightLabel: { fontSize: 9, fontWeight: '700', color: C.dim, letterSpacing: 1 },
    highlightValue: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 },
    highlightCount: { fontSize: 16, fontWeight: '800' },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 1.5, marginLeft: 20, marginTop: 20, marginBottom: 10 },
    card: { backgroundColor: C.surface, marginHorizontal: 16, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border, gap: 14 },
    statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    statRowLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 110 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    statRowText: { fontSize: 13, color: C.sub, fontWeight: '500', flex: 1 },
    statRowBar: { flex: 1 },
    statRowCount: { fontSize: 14, fontWeight: '700', width: 28, textAlign: 'right' },
    barBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' },
    barFg: { height: 6, borderRadius: 3 },
    empty: { fontSize: 14, color: C.dim, textAlign: 'center', paddingVertical: 12 },
    topRowBorder: { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    topRank: { fontSize: 13, fontWeight: '800', color: C.dim, width: 28 },
    topName: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
    topCost: { fontSize: 14, fontWeight: '700', color: C.primary, width: 44, textAlign: 'right' },
    avgHoursRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    avgHoursLabel: { fontSize: 11, fontWeight: '700', color: C.dim, letterSpacing: 1, marginBottom: 4 },
    avgHoursValue: { fontSize: 20, fontWeight: '800', color: C.blue },
});
