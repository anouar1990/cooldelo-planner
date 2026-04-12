import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Modal, Platform, Alert,
} from 'react-native';
import { Zap, Plus, X, Check, Search, Star, Pencil, Trash2, Copy } from 'lucide-react-native';

const C = {
    bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', primary: '#FF6B35',
    amber: '#F59E0B', green: '#10B981', blue: '#3B82F6',
};

interface Preset {
    id: string;
    name: string;
    material: string;
    speed: number;      // mm/s
    power: number;      // %
    frequency: number;  // Hz
    passes: number;
    airAssist: boolean;
    focus: string;      // 'auto' or mm value
    notes: string;
    starred: boolean;
}

const SEED: Preset[] = [
    { id: '1', name: '3mm Birch Plywood — Cut', material: 'Birch Plywood 3mm', speed: 20, power: 85, frequency: 1000, passes: 1, airAssist: true, focus: 'auto', notes: 'Clean cut, slight smoke. Use masking tape.', starred: true },
    { id: '2', name: '4mm Clear Acrylic — Cut', material: 'Clear Acrylic 4mm', speed: 15, power: 90, frequency: 1500, passes: 1, airAssist: true, focus: 'auto', notes: 'Remove protective film first.', starred: true },
    { id: '3', name: 'Birch Plywood — Engrave', material: 'Birch Plywood 3mm', speed: 200, power: 40, frequency: 500, passes: 1, airAssist: false, focus: 'auto', notes: 'Good contrast, medium depth.', starred: false },
    { id: '4', name: 'Leather 2mm — Engrave', material: 'Real Leather 2mm', speed: 150, power: 25, frequency: 500, passes: 1, airAssist: false, focus: 'auto', notes: 'Ventilate well, low power to avoid burns.', starred: false },
];

const BLANK: Omit<Preset, 'id'> = {
    name: '', material: '', speed: 20, power: 80, frequency: 1000, passes: 1,
    airAssist: true, focus: 'auto', notes: '', starred: false,
};

export default function LaserPresetsScreen() {
    const [presets, setPresets] = useState<Preset[]>(SEED);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Preset | null>(null);
    const [form, setForm] = useState<Omit<Preset, 'id'>>(BLANK);
    const [search, setSearch] = useState('');
    const [showStarred, setShowStarred] = useState(false);

    const upd = (k: keyof typeof form) => (v: any) => setForm(p => ({ ...p, [k]: v }));
    const updN = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: parseFloat(v) || 0 }));
    const updI = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: parseInt(v) || 0 }));

    const filtered = useMemo(() => presets.filter(p => {
        if (showStarred && !p.starred) return false;
        if (!search) return true;
        return p.name.toLowerCase().includes(search.toLowerCase()) || p.material.toLowerCase().includes(search.toLowerCase());
    }), [presets, search, showStarred]);

    const openAdd = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
    const openEdit = (p: Preset) => {
        setEditing(p);
        setForm({ name: p.name, material: p.material, speed: p.speed, power: p.power, frequency: p.frequency, passes: p.passes, airAssist: p.airAssist, focus: p.focus, notes: p.notes, starred: p.starred });
        setShowModal(true);
    };

    const save = () => {
        if (!form.name.trim()) return;
        if (editing) {
            setPresets(prev => prev.map(p => p.id === editing.id ? { ...editing, ...form } : p));
        } else {
            setPresets(prev => [...prev, { id: Date.now().toString(), ...form }]);
        }
        setShowModal(false);
    };

    const del = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this preset?')) setPresets(prev => prev.filter(p => p.id !== id));
        } else {
            Alert.alert('Delete', 'Delete preset?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setPresets(prev => prev.filter(p => p.id !== id)) }]);
        }
    };

    const duplicate = (p: Preset) => setPresets(prev => [...prev, { ...p, id: Date.now().toString(), name: p.name + ' (copy)', starred: false }]);
    const toggleStar = (id: string) => setPresets(prev => prev.map(p => p.id === id ? { ...p, starred: !p.starred } : p));

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <View style={styles.headerIcon}><Zap color={C.primary} size={20} fill={C.primary + '40'} /></View>
                        <Text style={styles.title}>Laser Presets</Text>
                    </View>
                    <Text style={styles.subtitle}>{presets.length} presets saved · {presets.filter(p => p.starred).length} starred</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <Plus color="#fff" size={18} />
                    <Text style={styles.addBtnText}>Add Preset</Text>
                </TouchableOpacity>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <Search color={C.sub} size={16} />
                    <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
                        placeholder="Search by name or material..." placeholderTextColor={C.sub} />
                </View>
                <TouchableOpacity
                    style={[styles.starFilter, showStarred && { backgroundColor: C.amber, borderColor: C.amber }]}
                    onPress={() => setShowStarred(p => !p)}>
                    <Star color={showStarred ? '#fff' : C.sub} size={16} fill={showStarred ? '#fff' : 'none'} />
                    <Text style={[styles.starFilterText, showStarred && { color: '#fff' }]}>Starred</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Zap color={C.sub} size={40} opacity={0.4} />
                        <Text style={styles.emptyTitle}>{search ? 'No presets match your search' : 'No presets yet'}</Text>
                        {!search && <Text style={styles.emptyText}>Save your laser settings to quickly reuse them across projects.</Text>}
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filtered.map(p => (
                            <PresetCard key={p.id} preset={p}
                                onEdit={() => openEdit(p)}
                                onDelete={() => del(p.id)}
                                onDuplicate={() => duplicate(p)}
                                onToggleStar={() => toggleStar(p.id)} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? 'Edit Preset' : 'New Preset'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}><X color={C.sub} size={22} /></TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <MField label="Preset Name" value={form.name} onChange={upd('name')} placeholder="3mm Birch — Cut" />
                            <MField label="Material" value={form.material} onChange={upd('material')} placeholder="Birch Plywood 3mm" />
                            <View style={styles.mrow}>
                                <View style={{ flex: 1 }}><MField label="Speed (mm/s)" value={form.speed.toString()} onChange={updN('speed')} placeholder="20" numeric /></View>
                                <View style={{ flex: 1 }}><MField label="Power (%)" value={form.power.toString()} onChange={updN('power')} placeholder="80" numeric /></View>
                            </View>
                            <View style={styles.mrow}>
                                <View style={{ flex: 1 }}><MField label="Frequency (Hz)" value={form.frequency.toString()} onChange={updI('frequency')} placeholder="1000" numeric /></View>
                                <View style={{ flex: 1 }}><MField label="Passes" value={form.passes.toString()} onChange={updI('passes')} placeholder="1" numeric /></View>
                            </View>
                            <MField label="Focus" value={form.focus} onChange={upd('focus')} placeholder="auto" />
                            <Text style={styles.label}>Air Assist</Text>
                            <View style={styles.toggleRow}>
                                <TouchableOpacity onPress={() => upd('airAssist')(true)} style={[styles.toggleBtn, form.airAssist && styles.toggleActive]}>
                                    <Text style={[styles.toggleText, form.airAssist && styles.toggleActiveText]}>On</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => upd('airAssist')(false)} style={[styles.toggleBtn, !form.airAssist && styles.toggleActive]}>
                                    <Text style={[styles.toggleText, !form.airAssist && styles.toggleActiveText]}>Off</Text>
                                </TouchableOpacity>
                            </View>
                            <MField label="Notes (optional)" value={form.notes} onChange={upd('notes')} placeholder="Additional tips..." multiline />
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={save}>
                                <Check color="#fff" size={18} />
                                <Text style={styles.saveBtnText}>{editing ? 'Update' : 'Save Preset'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function PresetCard({ preset: p, onEdit, onDelete, onDuplicate, onToggleStar }: {
    preset: Preset; onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onToggleStar: () => void;
}) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <TouchableOpacity onPress={onToggleStar}>
                    <Star color={p.starred ? C.amber : C.sub} size={18} fill={p.starred ? C.amber : 'none'} />
                </TouchableOpacity>
                <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={onDuplicate} style={styles.iconBtn}><Copy color={C.sub} size={14} /></TouchableOpacity>
                    <TouchableOpacity onPress={onEdit} style={styles.iconBtn}><Pencil color={C.sub} size={14} /></TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={styles.iconBtn}><Trash2 color={'#EF4444'} size={14} /></TouchableOpacity>
                </View>
            </View>
            <Text style={styles.cardMaterial}>{p.material}</Text>
            <View style={styles.paramsGrid}>
                <Param label="Speed" value={`${p.speed} mm/s`} />
                <Param label="Power" value={`${p.power}%`} color={p.power > 70 ? '#EF4444' : p.power > 40 ? C.amber : C.green} />
                <Param label="Freq" value={`${p.frequency} Hz`} />
                <Param label="Passes" value={p.passes.toString()} />
                <Param label="Air" value={p.airAssist ? 'On ✓' : 'Off'} color={p.airAssist ? C.green : C.sub} />
                <Param label="Focus" value={p.focus} />
            </View>
            {p.notes ? <Text style={styles.cardNotes}>{p.notes}</Text> : null}
        </View>
    );
}

function Param({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <View style={styles.param}>
            <Text style={styles.paramLabel}>{label}</Text>
            <Text style={[styles.paramValue, color ? { color } : {}]}>{value}</Text>
        </View>
    );
}

function MField({ label, value, onChange, placeholder, numeric, multiline }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean; multiline?: boolean;
}) {
    return (
        <View style={styles.mField}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={[styles.minput, multiline && { height: 72, paddingTop: 10 }]}
                value={value} onChangeText={onChange} placeholder={placeholder}
                placeholderTextColor={C.sub} keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} />
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 13, color: C.sub, marginTop: 4, marginLeft: 52 },
    addBtn: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: 10 },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    toolbar: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 16 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 40, gap: 8 },
    searchInput: { flex: 1, color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    starFilter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    starFilterText: { fontSize: 13, fontWeight: '600', color: C.sub },
    scroll: { padding: 24, paddingTop: 0, paddingBottom: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.sub, marginTop: 12 },
    emptyText: { fontSize: 14, color: C.sub, marginTop: 8, textAlign: 'center' },
    card: {
        width: 260, backgroundColor: C.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    cardName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
    cardActions: { flexDirection: 'row', gap: 2 },
    iconBtn: { padding: 5 },
    cardMaterial: { fontSize: 12, color: C.sub, marginBottom: 12 },
    paramsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    param: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 64 },
    paramLabel: { fontSize: 10, color: C.sub, fontWeight: '600', marginBottom: 2 },
    paramValue: { fontSize: 13, fontWeight: '700', color: C.text },
    cardNotes: { fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 18 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modal: { backgroundColor: C.surface, borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    modalBody: { padding: 20, maxHeight: 440 },
    modalActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: C.border },
    label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 12 },
    mField: { marginBottom: 4 },
    mrow: { flexDirection: 'row', gap: 12 },
    minput: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F8FAFC', color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    toggleBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    toggleActive: { backgroundColor: C.primary, borderColor: C.primary },
    toggleText: { fontSize: 14, fontWeight: '600', color: C.sub },
    toggleActiveText: { color: '#fff' },
    cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
    saveBtn: { flex: 2, height: 44, borderRadius: 10, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
