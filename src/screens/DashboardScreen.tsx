import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { useProjects, ProjectRow } from '../hooks/useProjects';
import { useMaterials } from '../hooks/useMaterials';
import { useClients } from '../hooks/useClients';
import { useDesignLibrary } from '../hooks/useDesignLibrary';
import { useMachineProfiles } from '../hooks/useMachineProfiles';
import { supabase } from '../lib/supabase';
import { 
    Plus, Activity, CheckCircle, Clock, TrendingUp, ArrowRight, LogOut, Settings,
    Calculator, FileText, Layers, Zap, Folder, Users, Package, Grid, AlertTriangle
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

const STATUS_LABEL: Record<string, string> = {
    planned: 'Planned', 'in-progress': 'In Progress', completed: 'Completed',
};

function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
    const color = status === 'completed' ? '#10B981' : status === 'in-progress' ? '#F59E0B' : '#3B82F6';
    return (
        <View style={[styles.badge, { borderColor: color, backgroundColor: color + (isDark ? '18' : '10') }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[status] ?? status}</Text>
        </View>
    );
}

function StatCard({ 
    icon, value, label, subtext, color, colors, onPress 
}: { 
    icon: React.ReactNode; value: string | number; label: string; subtext?: string; color: string; colors: any; onPress?: () => void 
}) {
    return (
        <TouchableOpacity 
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                {icon}
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.sub }]}>{label}</Text>
            {subtext && <Text style={[styles.statSub, { color: colors.dim }]}>{subtext}</Text>}
        </TouchableOpacity>
    );
}

function QuickToolCard({
    icon, title, desc, color, colors, onPress
}: {
    icon: React.ReactNode; title: string; desc: string; color: string; colors: any; onPress: () => void
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.75}
            onPress={onPress}
            style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
            <View style={[styles.toolIcon, { backgroundColor: color + '15' }]}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.toolTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.toolDesc, { color: colors.sub }]} numberOfLines={1}>{desc}</Text>
            </View>
            <ArrowRight color={colors.dim} size={16} />
        </TouchableOpacity>
    );
}

export default function DashboardScreen({ navigation }: any) {
    const { signOut, displayName, avatarUrl, session } = useAuth();
    const { colors, theme } = useTheme();
    const { projects } = useProjects();
    const { materials, hourlyRate } = useMaterials();
    const { clients } = useClients();
    const { designs } = useDesignLibrary();
    const { machines } = useMachineProfiles();

    const [invoicesCount, setInvoicesCount] = useState<number>(0);
    const [invoicesTotal, setInvoicesTotal] = useState<number>(0);

    useEffect(() => {
        if (!session?.user?.id) return;
        supabase
            .from('invoices')
            .select('id, total_amount')
            .eq('user_id', session.user.id)
            .then(({ data, error }) => {
                if (!error && data) {
                    setInvoicesCount(data.length);
                    const total = data.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
                    setInvoicesTotal(total);
                }
            });
    }, [session?.user?.id]);

    // Avatar: first letter of displayName for initials fallback
    const initials = displayName ? displayName.charAt(0).toUpperCase() : 'M';

    const { active, done, planned, totalCost, totalStockValue, recent } = React.useMemo(() => {
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

        let stockVal = 0;
        for (const m of materials) {
            stockVal += m.cost_per_unit ?? 0;
        }

        const recentList = [...projects].sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ).slice(0, 5);

        return {
            active: activeCount,
            done: doneCount,
            planned: plannedCount,
            totalCost: sumCost,
            totalStockValue: stockVal,
            recent: recentList
        };
    }, [projects, materials, hourlyRate]);

    const navigate = (p: ProjectRow) => {
        navigation.navigate('ProjectDetails', { id: p.id });
    };

    const navigateTab = (tabName: string) => {
        const parent = navigation.getParent();
        if (parent) {
            parent.navigate(tabName);
        } else {
            navigation.navigate(tabName);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <ResponsiveContainer>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerUser}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '25', borderColor: colors.primary }]}>
                                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initials}</Text>
                                </View>
                            )}
                            <View>
                                <Text style={[styles.brand, { color: colors.text }]}>⚡ <Text style={{ color: colors.primary }}>0machine</Text></Text>
                                <Text style={[styles.subtitle, { color: colors.sub }]}>Workshop Dashboard · {displayName}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={[styles.topIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Settings')}>
                                <Settings color={colors.sub} size={18} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.topIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={signOut}>
                                <LogOut color={colors.sub} size={18} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Synchronized Live Metrics Grid */}
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon={<Activity color={colors.primary} size={20} />}
                            value={projects.length}
                            label="Active Projects"
                            subtext={`${active} In Progress · ${done} Done`}
                            color={colors.primary}
                            colors={colors}
                            onPress={() => navigateTab('Projects')}
                        />
                        <StatCard
                            icon={<Package color="#F59E0B" size={20} />}
                            value={materials.length}
                            label="Materials Stock"
                            subtext={materials.length > 0 ? `$${totalStockValue.toFixed(0)} total stock value` : 'Wood, acrylic & MDF'}
                            color="#F59E0B"
                            colors={colors}
                            onPress={() => navigateTab('Materials')}
                        />
                        <StatCard
                            icon={<FileText color="#10B981" size={20} />}
                            value={invoicesCount}
                            label="Invoices Issued"
                            subtext={invoicesTotal > 0 ? `$${invoicesTotal.toFixed(0)} billed` : 'Custom PDF invoices'}
                            color="#10B981"
                            colors={colors}
                            onPress={() => navigateTab('Invoice Generator')}
                        />
                        <StatCard
                            icon={<Users color="#3B82F6" size={20} />}
                            value={clients.length}
                            label="Clients Ledger"
                            subtext="Active customer profiles"
                            color="#3B82F6"
                            colors={colors}
                            onPress={() => navigation.navigate('Clients')}
                        />
                    </View>

                    {/* Quick Tools Navigation Hub */}
                    <View style={styles.sectionRow}>
                        <Text style={[styles.sectionTitle, { color: colors.sub }]}>WORKSHOP TOOLKITS</Text>
                    </View>
                    <View style={styles.toolsGrid}>
                        <QuickToolCard
                            icon={<Calculator color="#FF6B35" size={20} />}
                            title="Cost & Profit Calculator"
                            desc="Material, machine time & labor margin"
                            color="#FF6B35"
                            colors={colors}
                            onPress={() => navigateTab('Cost Calculator')}
                        />
                        <QuickToolCard
                            icon={<FileText color="#10B981" size={20} />}
                            title="Invoice & Quote Generator"
                            desc="Export professional PDF quotes & invoices"
                            color="#10B981"
                            colors={colors}
                            onPress={() => navigateTab('Invoice Generator')}
                        />
                        <QuickToolCard
                            icon={<Layers color="#8B5CF6" size={20} />}
                            title="Nesting Yield Estimator"
                            desc="Sheet layout & material waste optimizer"
                            color="#8B5CF6"
                            colors={colors}
                            onPress={() => navigateTab('Nesting Estimator')}
                        />
                        <QuickToolCard
                            icon={<Zap color="#F59E0B" size={20} />}
                            title="Laser Presets"
                            desc={`${machines.length > 0 ? machines.length + ' machines registered' : 'Speed, power & frequency presets'}`}
                            color="#F59E0B"
                            colors={colors}
                            onPress={() => navigateTab('Laser Presets')}
                        />
                        <QuickToolCard
                            icon={<Folder color="#EC4899" size={20} />}
                            title="Design Vector Library"
                            desc={`${designs.length} laser cut SVG/DXF templates`}
                            color="#EC4899"
                            colors={colors}
                            onPress={() => navigateTab('Design Library')}
                        />
                        <QuickToolCard
                            icon={<Package color="#3B82F6" size={20} />}
                            title="Material Stock Inventory"
                            desc="Track wood, acrylic, MDF & metal stock"
                            color="#3B82F6"
                            colors={colors}
                            onPress={() => navigateTab('Materials')}
                        />
                    </View>

                    {/* Recent Projects Activity */}
                    <View style={styles.sectionRow}>
                        <Text style={[styles.sectionTitle, { color: colors.sub }]}>RECENT PROJECTS & JOBS</Text>
                        <TouchableOpacity onPress={() => navigateTab('Projects')}>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>View All →</Text>
                        </TouchableOpacity>
                    </View>

                    {recent.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={styles.emptyIcon}>🔦</Text>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No active projects yet</Text>
                            <Text style={[styles.emptySub, { color: colors.sub }]}>
                                Head over to Projects or launch the Cost Calculator to start your first job.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.recentList}>
                            {recent.map(p => {
                                const mat = materials.find(m => m.id === p.material_id);
                                return (
                                    <TouchableOpacity 
                                        key={p.id} 
                                        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]} 
                                        onPress={() => navigate(p)} 
                                        activeOpacity={0.75}
                                    >
                                        <View style={[styles.rowBar, { backgroundColor: p.status === 'completed' ? '#10B981' : p.status === 'in-progress' ? '#F59E0B' : '#3B82F6' }]} />
                                        <View style={styles.rowBody}>
                                            <View style={styles.rowTop}>
                                                <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{p.title}</Text>
                                                <StatusBadge status={p.status} isDark={colors.isDark} />
                                            </View>
                                            <Text style={[styles.rowMeta, { color: colors.sub }]} numberOfLines={1}>
                                                {mat ? `${mat.name} · ${p.material_thickness || mat.thickness}mm` : 'No material'}
                                                {p.machine ? ` · ${p.machine}` : ''}
                                            </Text>
                                        </View>
                                        <ArrowRight color={colors.dim} size={16} />
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
    safe: { flex: 1 },
    scroll: { paddingBottom: 32 },
    header: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#FF6B35' },
    avatarFallback: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 16, fontWeight: '800' },
    brand: { fontSize: 22, fontWeight: '800' },
    subtitle: { fontSize: 13, marginTop: 2 },
    topIconBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
    statCard: {
        flex: 1, minWidth: '45%',
        borderRadius: 16, padding: 16, alignItems: 'flex-start',
        borderWidth: 1, gap: 4,
    },
    statIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: '800' },
    statLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
    statSub: { fontSize: 10, marginTop: 2 },

    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
    seeAll: { fontSize: 13, fontWeight: '700' },

    toolsGrid: { paddingHorizontal: 16, gap: 10 },
    toolCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 16, borderWidth: 1, gap: 12,
    },
    toolIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    toolTitle: { fontSize: 14, fontWeight: '700' },
    toolDesc: { fontSize: 12, marginTop: 2 },

    emptyState: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, marginHorizontal: 16, borderRadius: 16, borderWidth: 1 },
    emptyIcon: { fontSize: 40, marginBottom: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

    recentList: { width: '100%', maxWidth: 800, alignSelf: 'center' },
    row: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginBottom: 8, paddingRight: 14,
        borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    },
    rowBar: { width: 5, alignSelf: 'stretch' },
    rowBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    rowTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
    rowMeta: { fontSize: 12 },
    badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
