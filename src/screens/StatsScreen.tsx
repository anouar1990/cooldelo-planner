import React from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView
} from 'react-native';
import { useStore } from '../store/useStore';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
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
    const projects = useStore(s => s.projects);
    const materials = useStore(s => s.materials);
    const hourlyRate = useStore(s => s.hourlyRate);

    const totalProjects = projects.length;
    const completed = projects.filter(p => p.status === 'completed');
    const inProgress = projects.filter(p => p.status === 'in-progress');
    const planned = projects.filter(p => p.status === 'planned');
    const completionRate = totalProjects > 0 ? Math.round((completed.length / totalProjects) * 100) : 0;

    const avgHours = completed.length > 0
        ? (completed.reduce((s, p) => s + p.timeElapsed, 0) / completed.length / 3600)
        : 0;

    const projectCosts = projects.map(p => {
        const mat = materials.find(m => m.id === p.materialId);
        const matCost = (p.materialCostPerUnit ?? mat?.costPerUnit ?? 0) * (p.materialQuantity ?? 1);
        const timeCost = (p.timeElapsed / 3600) * hourlyRate;
        return matCost + timeCost;
    });
    const avgCost = totalProjects > 0 ? projectCosts.reduce((a, b) => a + b, 0) / totalProjects : 0;
    const totalRevenue = projectCosts.reduce((a, b) => a + b, 0);

    // Material usage counts
    const matUsage: Record<string, number> = {};
    projects.forEach(p => {
        if (p.materialId) matUsage[p.materialId] = (matUsage[p.materialId] ?? 0) + 1;
    });
    const maxMat = Math.max(...Object.values(matUsage), 1);

    const statusData = [
        { label: 'Planned', count: planned.length, color: C.blue },
        { label: 'In Progress', count: inProgress.length, color: C.amber },
        { label: 'Completed', count: completed.length, color: C.green },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Text style={styles.title}>Stats</Text>
                    <Text style={styles.subtitle}>Your productivity overview</Text>
                </View>

                {/* Overview metrics */}
                <View style={styles.metricsGrid}>
                    <MetricCard label="Avg Cost" value={`$${avgCost.toFixed(2)}`} sub="per project" />
                    <MetricCard label="Avg Hours" value={avgHours.toFixed(1)} sub="on completed" />
                    <MetricCard label="Completion" value={`${completionRate}%`} sub="rate" />
                    <MetricCard label="Active" value={String(inProgress.length)} sub="in progress" />
                </View>

                {/* Status breakdown */}
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
                    {totalProjects === 0 && (
                        <Text style={styles.empty}>No projects yet.</Text>
                    )}
                </View>

                {/* Material breakdown */}
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
                    {Object.keys(matUsage).length === 0 && (
                        <Text style={styles.empty}>No material data yet.</Text>
                    )}
                </View>

                {/* Total */}
                <View style={[styles.card, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Estimated Revenue</Text>
                    <Text style={styles.totalValue}>${totalRevenue.toFixed(2)}</Text>
                </View>

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
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, marginBottom: 8 },
    metricCard: {
        flex: 1, minWidth: '44%', backgroundColor: C.surface,
        borderRadius: 16, padding: 18, alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    metricLabel: { fontSize: 10, fontWeight: '700', color: C.dim, letterSpacing: 1, marginBottom: 8 },
    metricValue: { fontSize: 26, fontWeight: '800', color: C.primary },
    metricSub: { fontSize: 11, color: C.sub, marginTop: 2 },
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
    totalRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '600', color: C.sub },
    totalValue: { fontSize: 24, fontWeight: '800', color: C.primary },
});
