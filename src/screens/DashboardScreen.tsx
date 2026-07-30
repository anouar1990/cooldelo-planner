import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, useWindowDimensions } from 'react-native';
import { 
    Plus, Activity, CheckCircle, Clock, TrendingUp, ArrowRight, LogOut, Settings,
    Calculator, FileText, Layers, Zap, Folder, Users, Package, Grid, AlertTriangle, Download, DollarSign, MapPin
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWorkshop } from '../context/WorkshopContext';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { downloadCsv, objectsToCsv } from '../lib/exportCsv';

function StatusBadge({ status, isDark }: { status: string; isDark: boolean }) {
    const color = status === 'completed' || status === 'delivered' ? '#10B981' : status === 'in-progress' ? '#F59E0B' : '#3B82F6';
    return (
        <View style={[styles.badge, { borderColor: color, backgroundColor: color + (isDark ? '18' : '10') }]}>
            <Text style={[styles.badgeText, { color }]}>{status.toUpperCase()}</Text>
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
            activeOpacity={onPress ? 0.75 : 1}
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
    const { signOut } = useAuth();
    const { isFree, isStarter, isPro } = useSubscription();
    const { language, setLanguage, t } = useLanguage();
    const { colors } = useTheme();
    const { profile, stats, orders, materials, exportBackupData } = useWorkshop();

    const [showProModal, setShowProModal] = useState(false);

    const initials = profile.workshopName ? profile.workshopName.charAt(0).toUpperCase() : 'W';

    const navigateTab = (tabName: string) => {
        const parent = navigation.getParent();
        if (parent) {
            parent.navigate(tabName);
        } else {
            navigation.navigate(tabName);
        }
    };

    const handleExportCSV = () => {
        if (!isPro) {
            setShowProModal(true);
            return;
        }
        const csvString = exportBackupData();
        downloadCsv(`0Machine_Workshop_Report_${new Date().toISOString().slice(0,10)}.json`, csvString);
    };

    const { width } = useWindowDimensions();
    const isMobile = width < 640;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <ResponsiveContainer>
                    {/* Header */}
                    <View style={[styles.header, isMobile && styles.headerMobile]}>
                        <View style={[styles.headerUser, isMobile && { width: '100%' }]}>
                            {profile.logoUrl ? (
                                <Image source={{ uri: profile.logoUrl }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '25', borderColor: colors.primary }]}>
                                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initials}</Text>
                                </View>
                            )}
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <Text style={[styles.brand, { color: colors.text }]}>{profile.workshopName}</Text>
                                    <View style={{
                                        backgroundColor: isPro ? '#FF6B35' : isStarter ? '#3B82F6' : '#242840',
                                        borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                                    }}>
                                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFF' }}>
                                            {isPro ? 'WORKSHOP PRO' : isStarter ? 'STARTER' : 'FREE PLAN'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.subtitle, { color: colors.sub }]} numberOfLines={1}>
                                    Owner: {profile.ownerName} · <MapPin size={12} color={colors.sub} /> {profile.city}, {profile.country}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.headerActions, isMobile && styles.headerActionsMobile]}>
                            {/* Language Switcher */}
                            <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 2 }}>
                                {(['en', 'fr', 'es'] as const).map(l => (
                                    <TouchableOpacity
                                        key={l}
                                        onPress={() => setLanguage(l)}
                                        style={{
                                            paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
                                            backgroundColor: language === l ? colors.primary : 'transparent',
                                        }}
                                    >
                                        <Text style={{ fontSize: 10, fontWeight: '800', color: language === l ? '#FFF' : colors.sub }}>
                                            {l.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <TouchableOpacity 
                                    style={[styles.topIconBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]} 
                                    onPress={handleExportCSV}
                                >
                                    <Download color={colors.primary} size={16} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.topIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Settings')}>
                                    <Settings color={colors.sub} size={16} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.topIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={signOut}>
                                    <LogOut color={colors.sub} size={16} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Synchronized Live Metrics Grid */}
                    <View style={styles.statsGrid}>
                        <StatCard 
                            icon={<Folder color="#3B82F6" size={20} />} 
                            value={stats.totalProjects} 
                            label="Total Projects" 
                            subtext={`${stats.inProgressProjects} Active · ${stats.completedProjects} Done · ${stats.deliveredProjects} Delivered`} 
                            color="#3B82F6" 
                            colors={colors}
                            onPress={() => navigateTab('Orders')}
                        />
                        <StatCard 
                            icon={<Package color="#10B981" size={20} />} 
                            value={stats.totalMaterials} 
                            label="Materials Logged" 
                            subtext={`$${stats.inventoryValue.toFixed(0)} Value · ${stats.lowStockCount} Low Stock ⚠`} 
                            color="#10B981" 
                            colors={colors}
                            onPress={() => navigateTab('Materials')}
                        />
                        <StatCard 
                            icon={<FileText color="#FF6B35" size={20} />} 
                            value={`$${stats.totalRevenue.toFixed(0)}`} 
                            label="Revenue Issued" 
                            subtext={`${stats.paidInvoicesCount} Paid · ${stats.pendingInvoicesCount} Pending`} 
                            color="#FF6B35" 
                            colors={colors}
                            onPress={() => navigateTab('Invoice Generator')}
                        />
                        <StatCard 
                            icon={<Users color="#8B5CF6" size={20} />} 
                            value={stats.totalClients} 
                            label="Active Clients" 
                            subtext={`+${stats.newClientsThisMonth} New this month`} 
                            color="#8B5CF6" 
                            colors={colors}
                            onPress={() => navigateTab('Orders')}
                        />
                    </View>

                    {/* Revenue Breakdown Widget */}
                    <View style={[styles.revenueWidget, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.revWidgetHeader}>
                            <View style={styles.revIconWrap}>
                                <TrendingUp color="#10B981" size={18} />
                            </View>
                            <Text style={[styles.revWidgetTitle, { color: colors.text }]}>Revenue Analytics & Order Value</Text>
                        </View>
                        <View style={styles.revWidgetRow}>
                            <View style={styles.revWidgetStat}>
                                <Text style={[styles.revWidgetValue, { color: '#10B981' }]}>{profile.currency}{stats.monthlyRevenue}</Text>
                                <Text style={[styles.revWidgetLabel, { color: colors.sub }]}>Monthly Revenue</Text>
                            </View>
                            <View style={styles.revWidgetStat}>
                                <Text style={[styles.revWidgetValue, { color: '#3B82F6' }]}>{profile.currency}{stats.weeklyRevenue}</Text>
                                <Text style={[styles.revWidgetLabel, { color: colors.sub }]}>Weekly Avg</Text>
                            </View>
                            <View style={styles.revWidgetStat}>
                                <Text style={[styles.revWidgetValue, { color: '#FF6B35' }]}>{profile.currency}{stats.averageOrderValue}</Text>
                                <Text style={[styles.revWidgetLabel, { color: colors.sub }]}>Avg Order Value</Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Workshop Actions */}
                    <View style={styles.sectionRow}>
                        <Text style={[styles.sectionTitle, { color: colors.sub }]}>{t('dash_quick_start')}</Text>
                    </View>
                    <View style={styles.toolsGrid}>
                        <QuickToolCard
                            icon={<Calculator color="#FF6B35" size={20} />}
                            title={t('calc_title')}
                            desc="Material, machine time & labor margin"
                            color="#FF6B35"
                            colors={colors}
                            onPress={() => navigateTab('Cost Calculator')}
                        />
                        <QuickToolCard
                            icon={<FileText color="#10B981" size={20} />}
                            title={t('nav_invoices')}
                            desc="Export professional PDF quotes & invoices"
                            color="#10B981"
                            colors={colors}
                            onPress={() => navigateTab('Invoice Generator')}
                        />
                        <QuickToolCard
                            icon={<Layers color="#8B5CF6" size={20} />}
                            title={t('nest_title')}
                            desc="Sheet layout & material waste optimizer"
                            color="#8B5CF6"
                            colors={colors}
                            onPress={() => navigateTab('Nesting Estimator')}
                        />
                        <QuickToolCard
                            icon={<Zap color="#F59E0B" size={20} />}
                            title={t('preset_title')}
                            desc="Speed, power & frequency presets"
                            color="#F59E0B"
                            colors={colors}
                            onPress={() => navigateTab('Laser Presets')}
                        />
                        <QuickToolCard
                            icon={<Folder color="#EC4899" size={20} />}
                            title={t('design_title')}
                            desc="Laser cut SVG/DXF templates"
                            color="#EC4899"
                            colors={colors}
                            onPress={() => navigateTab('Design Library')}
                        />
                        <QuickToolCard
                            icon={<Package color="#3B82F6" size={20} />}
                            title={t('mat_title')}
                            desc="Track wood, acrylic, MDF & metal stock"
                            color="#3B82F6"
                            colors={colors}
                            onPress={() => navigateTab('Materials')}
                        />
                    </View>

                    {/* Recent Orders & Jobs */}
                    <View style={styles.sectionRow}>
                        <Text style={[styles.sectionTitle, { color: colors.sub }]}>RECENT WORKSHOP ORDERS</Text>
                        <TouchableOpacity onPress={() => navigateTab('Orders')}>
                            <Text style={[styles.seeAll, { color: colors.primary }]}>View All →</Text>
                        </TouchableOpacity>
                    </View>

                    {orders.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={styles.emptyIcon}>🔦</Text>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>No active orders yet</Text>
                            <Text style={[styles.emptySub, { color: colors.sub }]}>
                                Head over to Orders Tracker to log your first client order.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.recentList}>
                            {orders.slice(0, 5).map(o => (
                                <TouchableOpacity 
                                    key={o.id} 
                                    style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]} 
                                    onPress={() => navigateTab('Orders')} 
                                    activeOpacity={0.75}
                                >
                                    <View style={[styles.rowBar, { backgroundColor: o.status === 'completed' || o.status === 'delivered' ? '#10B981' : o.status === 'in-progress' ? '#F59E0B' : '#3B82F6' }]} />
                                    <View style={styles.rowBody}>
                                        <View style={styles.rowTop}>
                                            <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{o.projectName}</Text>
                                            <StatusBadge status={o.status} isDark={colors.isDark} />
                                        </View>
                                        <Text style={[styles.rowMeta, { color: colors.sub }]} numberOfLines={1}>
                                            {o.orderNumber} · {o.clientName} · ${o.price}
                                        </Text>
                                    </View>
                                    <ArrowRight color={colors.dim} size={16} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ResponsiveContainer>
            </ScrollView>

            <ProUpgradeModal
                visible={showProModal}
                onClose={() => setShowProModal(false)}
                featureName="CSV & Excel Data Export"
                actionTitle="Export Projects, Materials & Clients"
                description="Upgrade to Pro ($19/mo) to download formatted CSV reports for accounting, tax reporting, and offline backups!"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { paddingBottom: 32 },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
    headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerActionsMobile: { justifyContent: 'space-between', width: '100%' },
    avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#FF6B35' },
    avatarFallback: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 16, fontWeight: '800' },
    brand: { fontSize: 20, fontWeight: '800' },
    subtitle: { fontSize: 12, marginTop: 2 },
    topIconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
    revenueWidget: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
    revWidgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    revIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#10B98120', justifyContent: 'center', alignItems: 'center' },
    revWidgetTitle: { fontSize: 13, fontWeight: '700' },
    revWidgetRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    revWidgetStat: { flex: 1, alignItems: 'center' },
    revWidgetValue: { fontSize: 18, fontWeight: '800' },
    revWidgetLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },
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
