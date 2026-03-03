import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Alert, Image, TextInput, Platform
} from 'react-native';
import { useStore, TimeLog } from '../store/useStore';
import { ChevronLeft, Trash2, Plus, Clock, DollarSign, Package, Cpu, CheckCircle } from 'lucide-react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568', danger: '#EF4444',
};

const STATUS_OPTS: { label: string; value: 'planned' | 'in-progress' | 'completed'; color: string }[] = [
    { label: 'Planned', value: 'planned', color: C.blue },
    { label: 'In Progress', value: 'in-progress', color: C.amber },
    { label: 'Completed', value: 'completed', color: C.green },
];

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>{icon}</View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

export default function ProjectDetailsScreen({ route, navigation }: any) {
    const { id } = route?.params || {};
    const project = useStore(s => s.projects.find(p => p.id === id));
    const materials = useStore(s => s.materials);
    const hourlyRate = useStore(s => s.hourlyRate);
    const updateProject = useStore(s => s.updateProject);
    const deleteProject = useStore(s => s.deleteProject);
    const addTimeLog = useStore(s => s.addTimeLog);
    const deleteTimeLog = useStore(s => s.deleteTimeLog);

    const [addingLog, setAddingLog] = useState(false);
    const [logHours, setLogHours] = useState('');
    const [logMins, setLogMins] = useState('');

    if (!project) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <Text style={{ color: C.sub }}>Project not found.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
                        <Text style={{ color: C.primary }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const mat = materials.find(m => m.id === project.materialId);
    const matCost = (project.materialCostPerUnit ?? mat?.costPerUnit ?? 0) * (project.materialQuantity ?? 1);
    const timeCost = (project.timeElapsed / 3600) * hourlyRate;
    const totalCost = matCost + timeCost;

    const hours = Math.floor(project.timeElapsed / 3600);
    const mins = Math.floor((project.timeElapsed % 3600) / 60);
    const timeStr = project.timeElapsed === 0 ? '—' : `${hours}h ${mins}m`;

    const handleStatusChange = (newStatus: 'planned' | 'in-progress' | 'completed') => {
        updateProject(project.id, { status: newStatus });
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Project',
            `Are you sure you want to delete "${project.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteProject(project.id);
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const handleAddLog = () => {
        const h = parseFloat(logHours) || 0;
        const m = parseFloat(logMins) || 0;
        const durationSeconds = h * 3600 + m * 60;
        if (durationSeconds <= 0) {
            Alert.alert('Invalid', 'Please enter a valid duration.');
            return;
        }
        const now = new Date().toISOString();
        const log: TimeLog = {
            id: uuidv4(),
            start: now,
            end: now,
            durationSeconds,
        };
        addTimeLog(project.id, log);
        setLogHours('');
        setLogMins('');
        setAddingLog(false);
    };

    const handleDeleteLog = (logId: string) => {
        Alert.alert('Remove Entry', 'Remove this time entry?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => deleteTimeLog(project.id, logId) },
        ]);
    };

    const statusColor = C[{ planned: 'blue', 'in-progress': 'amber', completed: 'green' }[project.status] as keyof typeof C] ?? C.sub;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={C.sub} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{project.title}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Trash2 color={C.danger} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Image */}
                {project.imageUri ? (
                    <Image source={{ uri: project.imageUri }} style={styles.image} />
                ) : (
                    <View style={[styles.imageBanner, { backgroundColor: statusColor + '18' }]}>
                        <Text style={styles.bannerEmoji}>✦</Text>
                    </View>
                )}

                {/* Status Pills */}
                <View style={styles.section}>
                    <Text style={styles.label}>STATUS</Text>
                    <View style={styles.pillRow}>
                        {STATUS_OPTS.map(opt => {
                            const active = project.status === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.pill, active && { backgroundColor: opt.color, borderColor: opt.color }]}
                                    onPress={() => handleStatusChange(opt.value)}
                                >
                                    {active && <CheckCircle color="#fff" size={13} />}
                                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Details */}
                <View style={styles.section}>
                    <Text style={styles.label}>DETAILS</Text>
                    <View style={styles.card}>
                        {project.description ? (
                            <Text style={styles.description}>{project.description}</Text>
                        ) : null}
                        <InfoRow
                            icon={<Package color={C.sub} size={16} />}
                            label="Material"
                            value={mat ? `${mat.name} · ${project.materialThickness ?? mat.thickness}mm` : 'None'}
                        />
                        <InfoRow
                            icon={<DollarSign color={C.sub} size={16} />}
                            label="Material Cost"
                            value={`$${matCost.toFixed(2)}`}
                        />
                        <InfoRow
                            icon={<Clock color={C.sub} size={16} />}
                            label="Time Tracked"
                            value={timeStr}
                        />
                        <InfoRow
                            icon={<DollarSign color={C.sub} size={16} />}
                            label="Labor Cost"
                            value={`$${timeCost.toFixed(2)}`}
                        />
                        {project.machine ? (
                            <InfoRow
                                icon={<Cpu color={C.sub} size={16} />}
                                label="Machine"
                                value={project.machine}
                            />
                        ) : null}

                        <View style={styles.totalCostRow}>
                            <Text style={styles.totalCostLabel}>TOTAL COST</Text>
                            <Text style={styles.totalCostValue}>${totalCost.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Time Logs */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>TIME LOGS</Text>
                        <TouchableOpacity onPress={() => setAddingLog(!addingLog)}>
                            <Plus color={C.primary} size={20} />
                        </TouchableOpacity>
                    </View>

                    {/* Add log form */}
                    {addingLog && (
                        <View style={styles.addLogCard}>
                            <Text style={styles.addLogTitle}>Add Time Entry</Text>
                            <View style={styles.logInputRow}>
                                <View style={styles.logInputGroup}>
                                    <Text style={styles.logInputLabel}>HOURS</Text>
                                    <TextInput
                                        style={styles.logInput}
                                        keyboardType="number-pad"
                                        value={logHours}
                                        onChangeText={setLogHours}
                                        placeholder="0"
                                        placeholderTextColor={C.dim}
                                    />
                                </View>
                                <View style={styles.logInputGroup}>
                                    <Text style={styles.logInputLabel}>MINUTES</Text>
                                    <TextInput
                                        style={styles.logInput}
                                        keyboardType="number-pad"
                                        value={logMins}
                                        onChangeText={setLogMins}
                                        placeholder="0"
                                        placeholderTextColor={C.dim}
                                    />
                                </View>
                            </View>
                            <View style={styles.logBtnRow}>
                                <TouchableOpacity style={styles.logCancelBtn} onPress={() => setAddingLog(false)}>
                                    <Text style={styles.logCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.logSaveBtn} onPress={handleAddLog}>
                                    <Text style={styles.logSaveText}>Add Entry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Log list */}
                    <View style={styles.card}>
                        {project.timeLogs.length === 0 ? (
                            <Text style={styles.noLogs}>No time logged yet. Tap + to add an entry.</Text>
                        ) : (
                            project.timeLogs.map((log, i) => {
                                const lh = Math.floor(log.durationSeconds / 3600);
                                const lm = Math.floor((log.durationSeconds % 3600) / 60);
                                const ls = log.durationSeconds % 60;
                                return (
                                    <View key={log.id} style={[styles.logRow, i > 0 && styles.logRowBorder]}>
                                        <View>
                                            <Text style={styles.logDuration}>
                                                {lh > 0 ? `${lh}h ` : ''}{lm > 0 ? `${lm}m ` : ''}{ls > 0 ? `${ls}s` : ''}
                                            </Text>
                                            <Text style={styles.logDate}>
                                                {new Date(log.start).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                                            <Trash2 color={C.danger} size={16} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, marginHorizontal: 12 },
    deleteBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(239,68,68,0.12)', justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingBottom: 60 },
    image: { width: '100%', height: 220, resizeMode: 'cover' },
    imageBanner: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
    bannerEmoji: { fontSize: 40, opacity: 0.5, color: C.text },
    section: { paddingHorizontal: 16, marginTop: 20 },
    label: { fontSize: 11, fontWeight: '700', color: C.dim, letterSpacing: 1.2, marginBottom: 10 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    pillRow: { flexDirection: 'row', gap: 8 },
    pill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    },
    pillText: { fontSize: 13, fontWeight: '600', color: C.sub },
    pillTextActive: { color: '#fff' },
    card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
    description: { fontSize: 14, color: C.sub, lineHeight: 22, marginBottom: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
    infoIcon: { marginRight: 12 },
    infoLabel: { flex: 1, fontSize: 13, color: C.sub },
    infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
    totalCostRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
    totalCostLabel: { fontSize: 11, fontWeight: '700', color: C.dim, letterSpacing: 1 },
    totalCostValue: { fontSize: 22, fontWeight: '800', color: C.primary },
    addLogCard: { backgroundColor: C.surface2, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    addLogTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 14 },
    logInputRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    logInputGroup: { flex: 1 },
    logInputLabel: { fontSize: 10, fontWeight: '700', color: C.dim, letterSpacing: 1, marginBottom: 6 },
    logInput: { backgroundColor: C.surface, borderRadius: 10, padding: 12, color: C.text, fontSize: 16, borderWidth: 1, borderColor: C.border, textAlign: 'center' },
    logBtnRow: { flexDirection: 'row', gap: 10 },
    logCancelBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center' },
    logCancelText: { color: C.sub, fontWeight: '600' },
    logSaveBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center' },
    logSaveText: { color: '#fff', fontWeight: '700' },
    noLogs: { fontSize: 13, color: C.dim, textAlign: 'center', paddingVertical: 12 },
    logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    logRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    logDuration: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
    logDate: { fontSize: 11, color: C.dim },
});
