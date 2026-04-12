import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Modal, Platform, Alert,
} from 'react-native';
import { Package, Plus, Pencil, Trash2, X, Check, Layers, DollarSign } from 'lucide-react-native';

const C = {
    bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', primary: '#FF6B35',
    green: '#10B981', amber: '#F59E0B', red: '#EF4444',
};

interface Material {
    id: string;
    name: string;
    type: string; // wood / acrylic / metal / fabric / other
    thickness: string; // mm
    costPerUnit: number; // $/sheet
    sheetWidth: number; // mm
    sheetHeight: number; // mm
    stock: number; // sheets
}

const TYPES = ['Wood', 'Acrylic', 'Metal', 'Leather', 'Fabric', 'Cardboard', 'Other'];
const TYPE_COLORS: Record<string, string> = {
    Wood: '#92400E', Acrylic: '#1D4ED8', Metal: '#374151', Leather: '#78350F',
    Fabric: '#7C3AED', Cardboard: '#B45309', Other: '#6B7280',
};

const SEED: Material[] = [
    { id: '1', name: 'Birch Plywood 3mm', type: 'Wood', thickness: '3', costPerUnit: 18, sheetWidth: 600, sheetHeight: 400, stock: 10 },
    { id: '2', name: 'Clear Acrylic 4mm', type: 'Acrylic', thickness: '4', costPerUnit: 24, sheetWidth: 600, sheetHeight: 300, stock: 5 },
    { id: '3', name: 'MDF 6mm', type: 'Wood', thickness: '6', costPerUnit: 14, sheetWidth: 600, sheetHeight: 400, stock: 8 },
];

const BLANK: Omit<Material, 'id'> = {
    name: '', type: 'Wood', thickness: '3', costPerUnit: 0,
    sheetWidth: 600, sheetHeight: 400, stock: 0,
};

export default function MaterialsScreen() {
    const [materials, setMaterials] = useState<Material[]>(SEED);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Material | null>(null);
    const [form, setForm] = useState<Omit<Material, 'id'>>(BLANK);

    const openAdd = () => {
        setEditing(null);
        setForm(BLANK);
        setShowModal(true);
    };

    const openEdit = (m: Material) => {
        setEditing(m);
        setForm({ name: m.name, type: m.type, thickness: m.thickness, costPerUnit: m.costPerUnit, sheetWidth: m.sheetWidth, sheetHeight: m.sheetHeight, stock: m.stock });
        setShowModal(true);
    };

    const save = () => {
        if (!form.name.trim()) return;
        if (editing) {
            setMaterials(prev => prev.map(m => m.id === editing.id ? { ...editing, ...form } : m));
        } else {
            setMaterials(prev => [...prev, { id: Date.now().toString(), ...form }]);
        }
        setShowModal(false);
    };

    const del = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this material?')) {
                setMaterials(prev => prev.filter(m => m.id !== id));
            }
        } else {
            Alert.alert('Delete', 'Delete this material?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => setMaterials(prev => prev.filter(m => m.id !== id)) },
            ]);
        }
    };

    const upd = (k: keyof typeof form) => (v: any) => setForm(p => ({ ...p, [k]: v }));

    const totalValue = materials.reduce((s, m) => s + m.costPerUnit * m.stock, 0);

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <View style={styles.headerIcon}><Package color={C.primary} size={20} /></View>
                        <Text style={styles.title}>Material Inventory</Text>
                    </View>
                    <Text style={styles.subtitle}>{materials.length} materials · ${totalValue.toFixed(2)} total value</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <Plus color="#fff" size={18} />
                    <Text style={styles.addBtnText}>Add Material</Text>
                </TouchableOpacity>
            </View>

            {/* Summary bar */}
            <View style={styles.statsBar}>
                <StatChip label="Total SKUs" value={materials.length.toString()} color={C.primary} />
                <StatChip label="Low Stock" value={materials.filter(m => m.stock <= 2).length.toString()} color={C.amber} />
                <StatChip label="Inventory Value" value={`$${totalValue.toFixed(0)}`} color={C.green} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {materials.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package color={C.sub} size={48} opacity={0.4} />
                        <Text style={styles.emptyTitle}>No materials yet</Text>
                        <Text style={styles.emptyText}>Add your first material to start tracking inventory.</Text>
                        <TouchableOpacity style={styles.addBtnLg} onPress={openAdd}>
                            <Plus color="#fff" size={18} />
                            <Text style={styles.addBtnText}>Add First Material</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {materials.map(m => (
                            <MaterialCard key={m.id} material={m} onEdit={() => openEdit(m)} onDelete={() => del(m.id)} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? 'Edit Material' : 'Add Material'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X color={C.sub} size={22} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <ModalField label="Material Name" value={form.name} onChange={upd('name')} placeholder="e.g. Birch Plywood 3mm" />
                            
                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeRow}>
                                {TYPES.map(t => (
                                    <TouchableOpacity key={t} onPress={() => upd('type')(t)}
                                        style={[styles.typeChip, form.type === t && { backgroundColor: C.primary, borderColor: C.primary }]}>
                                        <Text style={[styles.typeChipText, form.type === t && { color: '#fff' }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.mrow}>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Thickness (mm)" value={form.thickness} onChange={upd('thickness')} placeholder="3" numeric />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Cost / Sheet ($)" value={form.costPerUnit.toString()} onChange={v => upd('costPerUnit')(parseFloat(v)||0)} placeholder="18.00" numeric />
                                </View>
                            </View>
                            <View style={styles.mrow}>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Sheet Width (mm)" value={form.sheetWidth.toString()} onChange={v => upd('sheetWidth')(parseFloat(v)||0)} placeholder="600" numeric />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Sheet Height (mm)" value={form.sheetHeight.toString()} onChange={v => upd('sheetHeight')(parseFloat(v)||0)} placeholder="400" numeric />
                                </View>
                            </View>
                            <ModalField label="Stock (sheets)" value={form.stock.toString()} onChange={v => upd('stock')(parseInt(v)||0)} placeholder="10" numeric />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={save}>
                                <Check color="#fff" size={18} />
                                <Text style={styles.saveBtnText}>{editing ? 'Update' : 'Add Material'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function MaterialCard({ material: m, onEdit, onDelete }: { material: Material; onEdit: () => void; onDelete: () => void }) {
    const color = TYPE_COLORS[m.type] ?? C.sub;
    const lowStock = m.stock <= 2;
    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={[styles.typeTag, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                    <Text style={[styles.typeTagText, { color }]}>{m.type}</Text>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
                        <Pencil color={C.sub} size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
                        <Trash2 color={C.red} size={16} />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.cardName}>{m.name}</Text>
            <View style={styles.cardMeta}>
                <View style={styles.metaItem}><Layers color={C.sub} size={13}/><Text style={styles.metaText}>{m.thickness}mm</Text></View>
                <View style={styles.metaItem}><DollarSign color={C.sub} size={13}/><Text style={styles.metaText}>${m.costPerUnit.toFixed(2)}/sheet</Text></View>
            </View>
            <View style={styles.sheetSize}>
                <Text style={styles.sheetSizeText}>{m.sheetWidth}×{m.sheetHeight}mm</Text>
            </View>
            <View style={styles.cardBottom}>
                <Text style={styles.stockLabel}>Stock</Text>
                <View style={[styles.stockBadge, { backgroundColor: lowStock ? C.red + '15' : C.green + '15', borderColor: lowStock ? C.red : C.green }]}>
                    <Text style={[styles.stockValue, { color: lowStock ? C.red : C.green }]}>{m.stock} sheets{lowStock ? ' ⚠' : ''}</Text>
                </View>
            </View>
        </View>
    );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.statChip, { borderColor: color + '30', backgroundColor: color + '10' }]}>
            <Text style={[styles.statChipValue, { color }]}>{value}</Text>
            <Text style={styles.statChipLabel}>{label}</Text>
        </View>
    );
}

function ModalField({ label, value, onChange, placeholder, numeric }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean;
}) {
    return (
        <View style={styles.mField}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={styles.minput} value={value} onChangeText={onChange}
                placeholder={placeholder} placeholderTextColor={C.sub}
                keyboardType={numeric ? 'decimal-pad' : 'default'} />
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
    addBtnLg: { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, height: 48, borderRadius: 10, marginTop: 20 },
    addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    statsBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 20 },
    statChip: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
    statChipValue: { fontSize: 18, fontWeight: '800' },
    statChipLabel: { fontSize: 11, color: C.sub, marginTop: 2, fontWeight: '600' },
    scroll: { padding: 24, paddingTop: 0, paddingBottom: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16 },
    emptyText: { fontSize: 14, color: C.sub, marginTop: 8, textAlign: 'center' },
    card: {
        width: 240, backgroundColor: C.surface, borderRadius: 16, padding: 18,
        borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    typeTag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    typeTagText: { fontSize: 11, fontWeight: '700' },
    cardActions: { flexDirection: 'row', gap: 4 },
    iconBtn: { padding: 6 },
    cardName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 10 },
    cardMeta: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: C.sub, fontSize: 13 },
    sheetSize: { marginBottom: 12 },
    sheetSizeText: { fontSize: 12, color: C.sub },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
    stockLabel: { fontSize: 12, color: C.sub, fontWeight: '600' },
    stockBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    stockValue: { fontSize: 13, fontWeight: '700' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modal: { backgroundColor: C.surface, borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    modalBody: { padding: 20, maxHeight: 400 },
    modalActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: C.border },
    label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 12 },
    mField: { marginBottom: 4 },
    mrow: { flexDirection: 'row', gap: 12 },
    minput: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F8FAFC', color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    typeChip: { borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6 },
    typeChipText: { fontSize: 13, fontWeight: '600', color: C.text },
    cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
    saveBtn: { flex: 2, height: 44, borderRadius: 10, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
