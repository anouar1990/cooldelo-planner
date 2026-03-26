import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList,
    TouchableOpacity, TextInput, Alert, ScrollView, Modal, useWindowDimensions
} from 'react-native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { useMachineProfiles, MachineProfile } from '../hooks/useMachineProfiles';
import { Plus, Cpu, Zap, Gauge, ChevronLeft, Trash2, Edit2, X, Check } from 'lucide-react-native';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

const TYPE_OPTS: { label: string; value: MachineProfile['type']; emoji: string; color: string }[] = [
    { label: 'Laser', value: 'laser', emoji: '⚡', color: C.primary },
    { label: 'CNC', value: 'cnc', emoji: '🔩', color: C.blue },
    { label: 'Vinyl', value: 'vinyl', emoji: '✂️', color: C.green },
    { label: 'Other', value: 'other', emoji: '🛠️', color: C.amber },
];

const EMPTY: Omit<MachineProfile, 'id' | 'created_at'> = {
    name: '', type: 'laser', speed: undefined, power: undefined, notes: '',
};

export default function MachineProfilesScreen({ navigation }: any) {
    const { machines, loading, addMachine, updateMachine, deleteMachine } = useMachineProfiles();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<MachineProfile | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const { width } = useWindowDimensions();
    const numColumns = width > 1024 ? 3 : width > 768 ? 2 : 1;

    const openAdd = () => { setForm(EMPTY); setEditing(null); setShowModal(true); };
    const openEdit = (m: MachineProfile) => {
        setForm({ name: m.name, type: m.type, speed: m.speed, power: m.power, notes: m.notes ?? '' });
        setEditing(m);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { Alert.alert('Name required'); return; }
        setSaving(true);
        if (editing) {
            await updateMachine(editing.id, form);
        } else {
            await addMachine(form);
        }
        setSaving(false);
        setShowModal(false);
    };

    const handleDelete = (m: MachineProfile) => {
        Alert.alert('Delete Machine', `Remove "${m.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMachine(m.id) },
        ]);
    };

    const typeInfo = (type: MachineProfile['type']) => TYPE_OPTS.find(t => t.value === type) ?? TYPE_OPTS[3];

    return (
        <SafeAreaView style={s.safe}>
            <ResponsiveContainer>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <ChevronLeft color={C.text} size={22} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={s.title}>Machine Profiles</Text>
                        <Text style={s.subtitle}>Save your laser & CNC settings</Text>
                    </View>
                    <TouchableOpacity style={s.addBtn} onPress={openAdd}>
                        <Plus color="#fff" size={20} />
                    </TouchableOpacity>
                </View>

                {machines.length === 0 && !loading ? (
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>🛠️</Text>
                        <Text style={s.emptyTitle}>No machines yet</Text>
                        <Text style={s.emptySub}>Save your laser settings once — use them on every project.</Text>
                        <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
                            <Plus color="#fff" size={16} />
                            <Text style={s.emptyBtnText}>Add Machine</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={machines}
                        key={numColumns}
                        numColumns={numColumns}
                        keyExtractor={m => m.id}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
                        renderItem={({ item: m }) => {
                            const t = typeInfo(m.type);
                            return (
                                <View style={[s.card, { flex: 1 }]}>
                                    <View style={[s.typeTag, { backgroundColor: t.color + '20', borderColor: t.color + '40' }]}>
                                        <Text style={s.typeEmoji}>{t.emoji}</Text>
                                        <Text style={[s.typeLabel, { color: t.color }]}>{t.label}</Text>
                                    </View>
                                    <Text style={s.machineName}>{m.name}</Text>
                                    <View style={s.specs}>
                                        {m.speed != null && (
                                            <View style={s.spec}>
                                                <Gauge color={C.sub} size={13} />
                                                <Text style={s.specText}>{m.speed} mm/s</Text>
                                            </View>
                                        )}
                                        {m.power != null && (
                                            <View style={s.spec}>
                                                <Zap color={C.sub} size={13} />
                                                <Text style={s.specText}>{m.power}% power</Text>
                                            </View>
                                        )}
                                    </View>
                                    {m.notes ? <Text style={s.notes} numberOfLines={2}>{m.notes}</Text> : null}
                                    <View style={s.actions}>
                                        <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(m)}>
                                            <Edit2 color={C.primary} size={15} />
                                            <Text style={[s.actionText, { color: C.primary }]}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(m)}>
                                            <Trash2 color={C.dim} size={15} />
                                            <Text style={[s.actionText, { color: C.dim }]}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </ResponsiveContainer>

            {/* Add/Edit Modal */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHeader}>
                        <Text style={s.modalTitle}>{editing ? 'Edit Machine' : 'New Machine'}</Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <X color={C.sub} size={22} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
                        <View>
                            <Text style={s.label}>MACHINE NAME</Text>
                            <TextInput
                                style={s.input}
                                placeholder="e.g. K40 Laser, Shapeoko 3"
                                placeholderTextColor={C.dim}
                                value={form.name}
                                onChangeText={t => setForm(f => ({ ...f, name: t }))}
                            />
                        </View>

                        <View>
                            <Text style={s.label}>TYPE</Text>
                            <View style={s.typeRow}>
                                {TYPE_OPTS.map(t => (
                                    <TouchableOpacity
                                        key={t.value}
                                        style={[s.typeOpt, form.type === t.value && { borderColor: t.color, backgroundColor: t.color + '15' }]}
                                        onPress={() => setForm(f => ({ ...f, type: t.value }))}
                                    >
                                        <Text>{t.emoji}</Text>
                                        <Text style={[s.typeOptText, form.type === t.value && { color: t.color }]}>{t.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.row2}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>SPEED (mm/s)</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="e.g. 400"
                                    placeholderTextColor={C.dim}
                                    keyboardType="numeric"
                                    value={form.speed?.toString() ?? ''}
                                    // parseFloat preserves decimals (e.g. 400.5 mm/s) — parseInt would truncate
                                    onChangeText={t => setForm(f => ({ ...f, speed: t ? parseFloat(t) : undefined }))}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>POWER (%)</Text>
                                <TextInput
                                    style={s.input}
                                    placeholder="e.g. 80"
                                    placeholderTextColor={C.dim}
                                    keyboardType="numeric"
                                    value={form.power?.toString() ?? ''}
                                    // parseFloat is used for consistency; power is typically integer but floats are valid
                                    onChangeText={t => setForm(f => ({ ...f, power: t ? parseFloat(t) : undefined }))}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={s.label}>NOTES (optional)</Text>
                            <TextInput
                                style={[s.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                                placeholder="Material-specific settings, tips..."
                                placeholderTextColor={C.dim}
                                multiline
                                value={form.notes}
                                onChangeText={t => setForm(f => ({ ...f, notes: t }))}
                            />
                        </View>

                        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                            <Check color="#fff" size={18} />
                            <Text style={s.saveBtnText}>{saving ? 'Saving…' : editing ? 'Update Machine' : 'Save Machine'}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
    back: { width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 12, color: C.sub, marginTop: 2 },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border, gap: 10, marginBottom: 12 },
    typeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    typeEmoji: { fontSize: 13 },
    typeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    machineName: { fontSize: 18, fontWeight: '700', color: C.text },
    specs: { flexDirection: 'row', gap: 16 },
    spec: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    specText: { fontSize: 13, color: C.sub },
    notes: { fontSize: 13, color: C.dim, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: 16, marginTop: 4 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    actionText: { fontSize: 13, fontWeight: '600' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyIcon: { fontSize: 52 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
    emptySub: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    modal: { flex: 1, backgroundColor: C.bg },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle: { fontSize: 20, fontWeight: '800', color: C.text },
    label: { fontSize: 10, fontWeight: '700', color: C.dim, letterSpacing: 1.2, marginBottom: 8 },
    input: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    typeRow: { flexDirection: 'row', gap: 8 },
    typeOpt: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border },
    typeOptText: { fontSize: 11, fontWeight: '600', color: C.sub },
    row2: { flexDirection: 'row', gap: 12 },
    saveBtn: { backgroundColor: C.primary, borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
