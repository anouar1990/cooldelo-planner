import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Alert, Image, TextInput, Platform, Share, Modal
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { useProjects } from '../hooks/useProjects';
import { useMaterials } from '../hooks/useMaterials'; // Use Supabase-backed materials, not the legacy Zustand store
import { useClients } from '../hooks/useClients';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import {
    ChevronLeft, Trash2, Plus, Clock, DollarSign, Package, Cpu, CheckCircle,
    FileText, Camera, Calendar, Bookmark, BookmarkCheck, User, X, Check, Zap
} from 'lucide-react-native';
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

function ProBadge() {
    return (
        <View style={styles.proBadge}>
            <Zap color={C.primary} size={10} fill={C.primary} />
            <Text style={styles.proBadgeText}>PRO</Text>
        </View>
    );
}

export default function ProjectDetailsScreen({ route, navigation }: any) {
    const { id } = route?.params || {};
    const { projects, updateProject, deleteProject, getProjectTimeLogs, addTimeLog, deleteTimeLog } = useProjects();
    const project = projects.find(p => p.id === id);
    // Use Supabase-backed hook — the legacy useStore had hardcoded defaults and wrong data
    const { materials, hourlyRate } = useMaterials();
    const { clients } = useClients();
    const { isPro } = useSubscription();
    const { session } = useAuth();

    const [logs, setLogs] = useState<any[]>([]);
    const [exporting, setExporting] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [showClientModal, setShowClientModal] = useState(false);

    React.useEffect(() => {
        if (id) {
            getProjectTimeLogs(id).then(res => {
                if (res.data) setLogs(res.data);
            });
        }
    }, [id, getProjectTimeLogs]);

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

    const mat = materials.find(m => m.id === project.material_id);
    const matCost = (project.material_cost_per_unit ?? mat?.cost_per_unit ?? 0) * (project.material_quantity ?? 1);
    const elapsed = project.time_elapsed || 0;
    const timeCost = (elapsed / 3600) * hourlyRate;
    const totalCost = matCost + timeCost;
    const assignedClient = clients.find(c => c.id === (project as any).client_id);

    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const timeStr = elapsed === 0 ? '—' : `${hours}h ${mins}m`;

    const dueDate = (project as any).due_date ? new Date((project as any).due_date) : null;
    const isOverdue = dueDate && dueDate < new Date() && project.status !== 'completed';
    const dueDateStr = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;

    const handleStatusChange = (newStatus: 'planned' | 'in-progress' | 'completed') => {
        updateProject(project.id, { status: newStatus });
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Project',
            `Are you sure you want to delete "${project.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => { deleteProject(project.id); navigation.goBack(); } },
            ]
        );
    };

    const handleAddLog = async () => {
        const h = parseFloat(logHours) || 0;
        const m = parseFloat(logMins) || 0;
        const durationSeconds = h * 3600 + m * 60;
        if (durationSeconds <= 0) { Alert.alert('Invalid', 'Please enter a valid duration.'); return; }
        const now = new Date().toISOString();
        const { data } = await addTimeLog({ project_id: project.id, start_time: now, end_time: now, duration_seconds: durationSeconds });
        if (data) setLogs(prev => [...prev, data]);
        setLogHours(''); setLogMins(''); setAddingLog(false);
    };

    const handleDeleteLog = (logId: string, durationInSeconds: number) => {
        Alert.alert('Remove Entry', 'Remove this time entry?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => { await deleteTimeLog(logId, project.id, durationInSeconds); setLogs(prev => prev.filter(l => l.id !== logId)); } },
        ]);
    };

    // ── PDF Export ──
    const handleExportPDF = async () => {
        if (!isPro) { navigation.navigate('Paywall'); return; }
        setExporting(true);
        const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a;max-width:700px;margin:0 auto}
h1{font-size:28px;font-weight:900;margin-bottom:4px}
.sub{color:#666;font-size:14px;margin-bottom:32px}
.section{margin-bottom:24px}
h2{font-size:13px;font-weight:700;color:#999;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;font-size:14px}
.row span:last-child{font-weight:600}
.total{background:#FF6B35;color:white;padding:16px 20px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;margin-top:24px}
.total-label{font-size:13px;font-weight:700;letter-spacing:0.5px}
.total-value{font-size:24px;font-weight:900}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
  background:${{ planned: '#EFF6FF', 'in-progress': '#FFFBEB', completed: '#ECFDF5' }[project.status as 'planned' | 'in-progress' | 'completed']};
  color:${{ planned: '#1D4ED8', 'in-progress': '#B45309', completed: '#065F46' }[project.status as 'planned' | 'in-progress' | 'completed']}}
}  
footer{margin-top:40px;color:#aaa;font-size:11px;text-align:center}
</style></head><body>
<h1>${project.title}</h1>
<p class="sub">Generated by 0machine Planner · ${new Date().toLocaleDateString()}</p>
<span class="badge">${project.status}</span>
${assignedClient ? `<div class="section"><h2>Client</h2><div class="row"><span>Name</span><span>${assignedClient.name}</span></div>${assignedClient.email ? `<div class="row"><span>Email</span><span>${assignedClient.email}</span></div>` : ''}${assignedClient.phone ? `<div class="row"><span>Phone</span><span>${assignedClient.phone}</span></div>` : ''}</div>` : ''}
<div class="section"><h2>Project Details</h2>
${project.description ? `<div class="row"><span>Description</span><span>${project.description}</span></div>` : ''}
<div class="row"><span>Material</span><span>${mat ? `${mat.name} · ${project.material_thickness ?? mat.thickness}mm` : 'None'}</span></div>
${project.machine ? `<div class="row"><span>Machine</span><span>${project.machine}</span></div>` : ''}
${dueDateStr ? `<div class="row"><span>Due Date</span><span>${dueDateStr}</span></div>` : ''}
</div>
<div class="section"><h2>Cost Breakdown</h2>
<div class="row"><span>Material Cost</span><span>$${matCost.toFixed(2)}</span></div>
<div class="row"><span>Time Logged</span><span>${timeStr}</span></div>
<div class="row"><span>Labor Cost (at $${hourlyRate}/hr)</span><span>$${timeCost.toFixed(2)}</span></div>
</div>
<div class="total"><span class="total-label">TOTAL ESTIMATED COST</span><span class="total-value">$${totalCost.toFixed(2)}</span></div>
<footer>0machine Planner — Made for makers ⚡</footer>
</body></html>`;
        try {
            const { uri } = await Print.printToFileAsync({ html, base64: false });
            await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${project.title} — Project Report` });
        } catch (e) {
            Alert.alert('Export failed', 'Could not generate PDF.');
        }
        setExporting(false);
    };

    // ── Photo Upload ──
    const handlePickPhoto = async () => {
        if (!isPro) { navigation.navigate('Paywall'); return; }
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo library access to add project photos.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8 });
        if (result.canceled || !result.assets[0]) return;
        setUploadingPhoto(true);
        try {
            const asset = result.assets[0];
            const ext = asset.uri.split('.').pop() ?? 'jpg';
            const path = `${session?.user.id}/${id}.${ext}`;
            const resp = await fetch(asset.uri);
            const blob = await resp.blob();
            const { error: uploadErr } = await supabase.storage.from('project-photos').upload(path, blob, { upsert: true, contentType: `image/${ext}` });
            if (uploadErr) throw uploadErr;
            const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(path);
            await updateProject(id, { photo_url: publicUrl });
        } catch (e: any) {
            Alert.alert('Upload failed', e.message ?? 'Could not upload photo.');
        }
        setUploadingPhoto(false);
    };

    // ── Save as Template ──
    const handleSaveTemplate = async () => {
        if (!isPro) { navigation.navigate('Paywall'); return; }
        setTemplateName(project.title);
        setShowTemplateModal(true);
    };

    const confirmSaveTemplate = async () => {
        await updateProject(id, { is_template: true, template_name: templateName.trim() || project.title });
        setShowTemplateModal(false);
        Alert.alert('Saved! 📐', 'Template saved. Find it in Projects → Templates.');
    };

    type StatusKey = 'planned' | 'in-progress' | 'completed';
    const currentStatus: StatusKey = project.status as StatusKey;
    const statusColor = C[{ planned: 'blue', 'in-progress': 'amber', completed: 'green' }[currentStatus] as keyof typeof C] ?? C.sub;
    const isTemplate = !!(project as any).is_template;

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ChevronLeft color={C.sub} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{project.title}</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.headerIconBtn, isTemplate && { backgroundColor: C.primary + '20' }]}
                            onPress={handleSaveTemplate}
                        >
                            {isTemplate ? <BookmarkCheck color={C.primary} size={18} /> : <Bookmark color={C.sub} size={18} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={handleDelete}>
                            <Trash2 color={C.danger} size={18} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Photo Banner */}
                    <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}>
                        {(project as any).photo_url ? (
                            <Image source={{ uri: (project as any).photo_url }} style={styles.image} />
                        ) : (
                            <View style={[styles.imageBanner, { backgroundColor: statusColor + '18' }]}>
                                <Camera color={C.sub} size={28} />
                                <Text style={styles.bannerText}>{uploadingPhoto ? 'Uploading…' : 'Tap to add photo'}</Text>
                                {!isPro && <ProBadge />}
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Due Date */}
                    {dueDateStr && (
                        <View style={[styles.dueDateRow, isOverdue && styles.dueDateOverdue]}>
                            <Calendar color={isOverdue ? C.danger : C.amber} size={14} />
                            <Text style={[styles.dueDateText, isOverdue && { color: C.danger }]}>
                                {isOverdue ? 'Overdue · ' : 'Due '}{dueDateStr}
                            </Text>
                        </View>
                    )}

                    {/* Client */}
                    {assignedClient && (
                        <TouchableOpacity style={styles.clientRow} onPress={() => setShowClientModal(true)}>
                            <User color={C.primary} size={14} />
                            <Text style={styles.clientText}>{assignedClient.name}</Text>
                            {assignedClient.email ? <Text style={styles.clientEmail}>{assignedClient.email}</Text> : null}
                        </TouchableOpacity>
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
                            {project.description ? (<Text style={styles.description}>{project.description}</Text>) : null}
                            <InfoRow icon={<Package color={C.sub} size={16} />} label="Material" value={mat ? `${mat.name} · ${project.material_thickness ?? mat.thickness}mm` : 'None'} />
                            <InfoRow icon={<DollarSign color={C.sub} size={16} />} label="Material Cost" value={`$${matCost.toFixed(2)}`} />
                            <InfoRow icon={<Clock color={C.sub} size={16} />} label="Time Tracked" value={timeStr} />
                            <InfoRow icon={<DollarSign color={C.sub} size={16} />} label="Labor Cost" value={`$${timeCost.toFixed(2)}`} />
                            {project.machine ? (<InfoRow icon={<Cpu color={C.sub} size={16} />} label="Machine" value={project.machine} />) : null}
                            <View style={styles.totalCostRow}>
                                <Text style={styles.totalCostLabel}>TOTAL COST</Text>
                                <Text style={styles.totalCostValue}>${totalCost.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Export PDF Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.exportBtn, exporting && { opacity: 0.6 }]}
                            onPress={handleExportPDF}
                            disabled={exporting}
                        >
                            <FileText color="#fff" size={16} />
                            <Text style={styles.exportBtnText}>{exporting ? 'Generating PDF…' : 'Export as PDF'}</Text>
                            {!isPro && <ProBadge />}
                        </TouchableOpacity>
                    </View>

                    {/* Time Logs */}
                    <View style={styles.section}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>TIME LOGS</Text>
                            <TouchableOpacity onPress={() => setAddingLog(!addingLog)}>
                                <Plus color={C.primary} size={20} />
                            </TouchableOpacity>
                        </View>

                        {addingLog && (
                            <View style={styles.addLogCard}>
                                <Text style={styles.addLogTitle}>Add Time Entry</Text>
                                <View style={styles.logInputRow}>
                                    <View style={styles.logInputGroup}>
                                        <Text style={styles.logInputLabel}>HOURS</Text>
                                        <TextInput style={styles.logInput} keyboardType="number-pad" value={logHours} onChangeText={setLogHours} placeholder="0" placeholderTextColor={C.dim} />
                                    </View>
                                    <View style={styles.logInputGroup}>
                                        <Text style={styles.logInputLabel}>MINUTES</Text>
                                        <TextInput style={styles.logInput} keyboardType="number-pad" value={logMins} onChangeText={setLogMins} placeholder="0" placeholderTextColor={C.dim} />
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

                        <View style={styles.card}>
                            {logs.length === 0 ? (
                                <Text style={styles.noLogs}>No time logged yet. Tap + to add an entry.</Text>
                            ) : (
                                logs.map((log, i) => {
                                    const dur = log.duration_seconds || 0;
                                    const lh = Math.floor(dur / 3600);
                                    const lm = Math.floor((dur % 3600) / 60);
                                    const ls = dur % 60;
                                    return (
                                        <View key={log.id} style={[styles.logRow, i > 0 && styles.logRowBorder]}>
                                            <View>
                                                <Text style={styles.logDuration}>{lh > 0 ? `${lh}h ` : ''}{lm > 0 ? `${lm}m ` : ''}{ls > 0 ? `${ls}s` : ''}</Text>
                                                <Text style={styles.logDate}>{new Date(log.start_time).toLocaleDateString()}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => handleDeleteLog(log.id, dur)}>
                                                <Trash2 color={C.danger} size={16} />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>

                </ScrollView>
            </ResponsiveContainer>

            {/* Template Name Modal */}
            <Modal visible={showTemplateModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Save as Template</Text>
                        <Text style={styles.modalSub}>Give this template a name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={templateName}
                            onChangeText={setTemplateName}
                            placeholder="Template name"
                            placeholderTextColor={C.dim}
                            autoFocus
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowTemplateModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSave} onPress={confirmSaveTemplate}>
                                <Check color="#fff" size={16} />
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, marginHorizontal: 12 },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingBottom: 60 },
    image: { width: '100%', height: 220, resizeMode: 'cover' },
    imageBanner: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center', gap: 6 },
    bannerText: { fontSize: 13, color: C.sub },
    dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12 },
    dueDateOverdue: {},
    dueDateText: { fontSize: 13, fontWeight: '600', color: C.amber },
    clientRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
    clientText: { fontSize: 13, fontWeight: '700', color: C.primary },
    clientEmail: { fontSize: 12, color: C.sub },
    section: { paddingHorizontal: 16, marginTop: 20 },
    label: { fontSize: 11, fontWeight: '700', color: C.dim, letterSpacing: 1.2, marginBottom: 10 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    pillRow: { flexDirection: 'row', gap: 8 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
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
    exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.surface2, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: C.border },
    exportBtnText: { color: C.text, fontWeight: '700', fontSize: 15 },
    proBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.primary + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.primary + '40' },
    proBadgeText: { fontSize: 9, fontWeight: '800', color: C.primary, letterSpacing: 0.5 },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 32 },
    modalBox: { backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
    modalTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
    modalSub: { fontSize: 13, color: C.sub, marginBottom: 20 },
    modalInput: { backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 20 },
    modalBtns: { flexDirection: 'row', gap: 10 },
    modalCancel: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: C.surface2, alignItems: 'center' },
    modalCancelText: { color: C.sub, fontWeight: '600' },
    modalSave: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    modalSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
