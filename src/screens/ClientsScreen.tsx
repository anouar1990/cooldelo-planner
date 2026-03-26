import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, FlatList,
    TouchableOpacity, TextInput, Alert, ScrollView, Modal, Linking, useWindowDimensions
} from 'react-native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { useClients, Client } from '../hooks/useClients';
import { Plus, ChevronLeft, Trash2, Edit2, X, Check, Mail, Phone, User } from 'lucide-react-native';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

const EMPTY = { name: '', email: '', phone: '', notes: '' };

export default function ClientsScreen({ navigation }: any) {
    const { clients, loading, addClient, updateClient, deleteClient } = useClients();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Client | null>(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const { width } = useWindowDimensions();
    const numColumns = width > 1024 ? 3 : width > 768 ? 2 : 1;

    const openAdd = () => { setForm(EMPTY); setEditing(null); setShowModal(true); };
    const openEdit = (c: Client) => {
        setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', notes: c.notes ?? '' });
        setEditing(c);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { Alert.alert('Name required'); return; }
        setSaving(true);
        const payload = {
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            notes: form.notes.trim() || undefined,
        };
        if (editing) await updateClient(editing.id, payload);
        else await addClient(payload);
        setSaving(false);
        setShowModal(false);
    };

    const handleDelete = (c: Client) => {
        Alert.alert('Delete Client', `Remove "${c.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteClient(c.id) },
        ]);
    };

    const initials = (name: string) => name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');

    return (
        <SafeAreaView style={s.safe}>
            <ResponsiveContainer>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <ChevronLeft color={C.text} size={22} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={s.title}>Clients</Text>
                        <Text style={s.subtitle}>{clients.length} client{clients.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity style={s.addBtn} onPress={openAdd}>
                        <Plus color="#fff" size={20} />
                    </TouchableOpacity>
                </View>

                {clients.length === 0 && !loading ? (
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>👤</Text>
                        <Text style={s.emptyTitle}>No clients yet</Text>
                        <Text style={s.emptySub}>Add clients to assign them to projects and track client revenue.</Text>
                        <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
                            <Plus color="#fff" size={16} />
                            <Text style={s.emptyBtnText}>Add Client</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={clients}
                        key={numColumns}
                        numColumns={numColumns}
                        keyExtractor={c => c.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 10 }}
                        columnWrapperStyle={numColumns > 1 ? { gap: 10 } : undefined}
                        renderItem={({ item: c }) => (
                            <View style={[s.card, { flex: 1 }]}>
                                <View style={s.cardLeft}>
                                    <View style={s.avatar}>
                                        <Text style={s.avatarText}>{initials(c.name)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.clientName} numberOfLines={1}>{c.name}</Text>
                                        {c.email ? (
                                            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${c.email}`)}>
                                                <Text style={s.clientContact} numberOfLines={1}>{c.email}</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                        {c.phone ? (
                                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                                                <Text style={s.clientContact} numberOfLines={1}>{c.phone}</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>
                                <View style={s.cardActions}>
                                    <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(c)}>
                                        <Edit2 color={C.primary} size={16} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.iconBtn} onPress={() => handleDelete(c)}>
                                        <Trash2 color={C.dim} size={16} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                )
                }
            </ResponsiveContainer>

            {/* Add/Edit Modal */}
            <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={s.modal}>
                    <View style={s.modalHeader}>
                        <Text style={s.modalTitle}>{editing ? 'Edit Client' : 'New Client'}</Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <X color={C.sub} size={22} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
                        {([
                            { key: 'name', label: 'NAME *', icon: <User color={C.sub} size={16} />, placeholder: 'Client name', keyboard: 'default' },
                            { key: 'email', label: 'EMAIL', icon: <Mail color={C.sub} size={16} />, placeholder: 'client@example.com', keyboard: 'email-address' },
                            { key: 'phone', label: 'PHONE', icon: <Phone color={C.sub} size={16} />, placeholder: '+1 555 000 0000', keyboard: 'phone-pad' },
                        ] as any[]).map(f => (
                            <View key={f.key}>
                                <Text style={s.label}>{f.label}</Text>
                                <View style={s.inputRow}>
                                    {f.icon}
                                    <TextInput
                                        style={s.inputField}
                                        placeholder={f.placeholder}
                                        placeholderTextColor={C.dim}
                                        keyboardType={f.keyboard}
                                        autoCapitalize={f.key === 'name' ? 'words' : 'none'}
                                        value={(form as any)[f.key]}
                                        onChangeText={t => setForm(prev => ({ ...prev, [f.key]: t }))}
                                    />
                                </View>
                            </View>
                        ))}

                        <View>
                            <Text style={s.label}>NOTES (optional)</Text>
                            <TextInput
                                style={[s.inputRow, { height: 80, textAlignVertical: 'top', paddingTop: 12, alignItems: 'flex-start' }]}
                                placeholder="Any additional notes..."
                                placeholderTextColor={C.dim}
                                multiline
                                value={form.notes}
                                onChangeText={t => setForm(f => ({ ...f, notes: t }))}
                            />
                        </View>

                        <TouchableOpacity
                            style={[s.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <Check color="#fff" size={18} />
                            <Text style={s.saveBtnText}>{saving ? 'Saving…' : editing ? 'Update Client' : 'Save Client'}</Text>
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
    card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary + '20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.primary + '40' },
    avatarText: { fontSize: 15, fontWeight: '800', color: C.primary },
    clientName: { fontSize: 16, fontWeight: '700', color: C.text },
    clientContact: { fontSize: 12, color: C.primary, marginTop: 2 },
    cardActions: { flexDirection: 'row', gap: 4 },
    iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center' },
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
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12 },
    inputField: { flex: 1, color: C.text, fontSize: 15 },
    saveBtn: { backgroundColor: C.primary, borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
