import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Modal, Platform, Alert,
} from 'react-native';
import { Calendar, Plus, X, Check, User, Clock, DollarSign, Filter, Search } from 'lucide-react-native';

const C = {
    bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', primary: '#FF6B35',
    green: '#10B981', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6',
};

type Status = 'pending' | 'in-progress' | 'completed' | 'cancelled';

interface Order {
    id: string;
    orderNumber: string;
    clientName: string;
    projectName: string;
    dueDate: string;
    price: number;
    status: Status;
    notes: string;
    createdAt: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
    'pending': { label: 'Pending', color: C.amber, bg: C.amber + '15' },
    'in-progress': { label: 'In Progress', color: C.blue, bg: C.blue + '15' },
    'completed': { label: 'Completed', color: C.green, bg: C.green + '15' },
    'cancelled': { label: 'Cancelled', color: C.red, bg: C.red + '15' },
};

const STATUSES: Status[] = ['pending', 'in-progress', 'completed', 'cancelled'];

const SEED: Order[] = [
    { id: '1', orderNumber: 'ORD-001', clientName: 'John Smith', projectName: 'Custom Coaster Set (x12)', dueDate: '2026-04-20', price: 85, status: 'in-progress', notes: 'Birch 3mm, engraved logos', createdAt: '2026-04-10' },
    { id: '2', orderNumber: 'ORD-002', clientName: 'Sarah Lee', projectName: 'Wedding Decorations', dueDate: '2026-04-28', price: 320, status: 'pending', notes: 'Acrylic 4mm, white paint', createdAt: '2026-04-12' },
];

const BLANK = { clientName: '', projectName: '', dueDate: '', price: '', status: 'pending' as Status, notes: '' };

function nextOrderNum(orders: Order[]) {
    const max = orders.reduce((m, o) => {
        const n = parseInt(o.orderNumber.split('-')[1] ?? '0');
        return n > m ? n : m;
    }, 0);
    return `ORD-${String(max + 1).padStart(3, '0')}`;
}

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>(SEED);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Order | null>(null);
    const [form, setForm] = useState(BLANK);
    const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
    const [search, setSearch] = useState('');

    const upd = (k: keyof typeof form) => (v: any) => setForm(p => ({ ...p, [k]: v }));

    const openAdd = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
    const openEdit = (o: Order) => {
        setEditing(o);
        setForm({ clientName: o.clientName, projectName: o.projectName, dueDate: o.dueDate, price: o.price.toString(), status: o.status, notes: o.notes });
        setShowModal(true);
    };

    const save = () => {
        if (!form.clientName.trim() || !form.projectName.trim()) return;
        const price = parseFloat(form.price) || 0;
        if (editing) {
            setOrders(prev => prev.map(o => o.id === editing.id ? { ...editing, ...form, price } : o));
        } else {
            const num = nextOrderNum(orders);
            setOrders(prev => [...prev, { id: Date.now().toString(), orderNumber: num, ...form, price, createdAt: new Date().toISOString().split('T')[0] }]);
        }
        setShowModal(false);
    };

    const del = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this order?')) setOrders(prev => prev.filter(o => o.id !== id));
        } else {
            Alert.alert('Delete', 'Delete order?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setOrders(prev => prev.filter(o => o.id !== id)) }]);
        }
    };

    const changeStatus = (id: string, s: Status) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o));

    const filtered = useMemo(() => orders.filter(o => {
        const matchStatus = filterStatus === 'all' || o.status === filterStatus;
        const matchSearch = !search || o.clientName.toLowerCase().includes(search.toLowerCase()) || o.projectName.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    }), [orders, filterStatus, search]);

    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.price, 0);
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').reduce((s, o) => s + o.price, 0);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <View style={styles.headerIcon}><Calendar color={C.primary} size={20} /></View>
                        <Text style={styles.title}>Orders</Text>
                    </View>
                    <Text style={styles.subtitle}>{orders.length} total orders</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <Plus color="#fff" size={18} />
                    <Text style={styles.addBtnText}>New Order</Text>
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.statsBar}>
                {(['all', ...STATUSES] as const).map(s => {
                    const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
                    const conf = s === 'all' ? { color: C.primary, bg: C.primary + '10' } : { color: STATUS_CONFIG[s].color, bg: STATUS_CONFIG[s].bg };
                    return (
                        <TouchableOpacity key={s} onPress={() => setFilterStatus(s)}
                            style={[styles.filterPill, filterStatus === s && { backgroundColor: conf.color, borderColor: conf.color }]}>
                            <Text style={[styles.filterPillText, filterStatus === s && { color: '#fff' }]}>
                                {s === 'all' ? 'All' : STATUS_CONFIG[s].label} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Revenue bar */}
            <View style={styles.revenueBar}>
                <RevChip label="Earned" value={`$${totalRevenue.toFixed(0)}`} color={C.green} />
                <RevChip label="Pending" value={`$${pending.toFixed(0)}`} color={C.amber} />
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <Search color={C.sub} size={16} />
                <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
                    placeholder="Search orders..." placeholderTextColor={C.sub} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Calendar color={C.sub} size={40} opacity={0.4} />
                        <Text style={styles.emptyTitle}>No orders found</Text>
                    </View>
                ) : (
                    filtered.map(o => <OrderRow key={o.id} order={o} onEdit={() => openEdit(o)} onDelete={() => del(o.id)} onStatusChange={(s) => changeStatus(o.id, s)} />)
                )}
            </ScrollView>

            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? 'Edit Order' : 'New Order'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}><X color={C.sub} size={22} /></TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <ModalField label="Client Name" value={form.clientName} onChange={upd('clientName')} placeholder="John Smith" />
                            <ModalField label="Project / Description" value={form.projectName} onChange={upd('projectName')} placeholder="Custom Coaster Set x12" />
                            <View style={styles.mrow}>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Price ($)" value={form.price} onChange={upd('price')} placeholder="85.00" numeric />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ModalField label="Due Date" value={form.dueDate} onChange={upd('dueDate')} placeholder="2026-04-30" />
                                </View>
                            </View>
                            <Text style={styles.label}>Status</Text>
                            <View style={styles.statusRow}>
                                {STATUSES.map(s => {
                                    const conf = STATUS_CONFIG[s];
                                    return (
                                        <TouchableOpacity key={s} onPress={() => upd('status')(s)}
                                            style={[styles.statusChip, form.status === s && { backgroundColor: conf.color, borderColor: conf.color }]}>
                                            <Text style={[styles.statusChipText, form.status === s && { color: '#fff' }]}>{conf.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <ModalField label="Notes (optional)" value={form.notes} onChange={upd('notes')} placeholder="Any special requirements..." multiline />
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={save}>
                                <Check color="#fff" size={18} />
                                <Text style={styles.saveBtnText}>{editing ? 'Update' : 'Create Order'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function OrderRow({ order: o, onEdit, onDelete, onStatusChange }: { order: Order; onEdit: () => void; onDelete: () => void; onStatusChange: (s: Status) => void }) {
    const [expanded, setExpanded] = useState(false);
    const conf = STATUS_CONFIG[o.status];
    return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded(p => !p)} style={styles.orderRow}>
            <View style={[styles.orderBar, { backgroundColor: conf.color }]} />
            <View style={styles.orderBody}>
                <View style={styles.orderTop}>
                    <View>
                        <Text style={styles.orderNum}>{o.orderNumber}</Text>
                        <Text style={styles.orderName}>{o.projectName}</Text>
                    </View>
                    <View style={styles.orderRight}>
                        <Text style={styles.orderPrice}>${o.price.toFixed(2)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: conf.bg, borderColor: conf.color }]}>
                            <Text style={[styles.statusText, { color: conf.color }]}>{conf.label}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.orderMeta}>
                    <View style={styles.metaItem}><User color={C.sub} size={12}/><Text style={styles.metaText}>{o.clientName}</Text></View>
                    {o.dueDate ? <View style={styles.metaItem}><Clock color={C.sub} size={12}/><Text style={styles.metaText}>Due {o.dueDate}</Text></View> : null}
                </View>
                {expanded && (
                    <View style={styles.expanded}>
                        {o.notes ? <Text style={styles.expandedNotes}>{o.notes}</Text> : null}
                        <View style={styles.expandedActions}>
                            <View style={styles.statusQuick}>
                                {STATUSES.filter(s => s !== o.status).map(s => (
                                    <TouchableOpacity key={s} style={styles.quickBtn} onPress={() => { onStatusChange(s); }}>
                                        <Text style={[styles.quickBtnText, { color: STATUS_CONFIG[s].color }]}>→ {STATUS_CONFIG[s].label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.rowActions}>
                                <TouchableOpacity style={styles.editBtn} onPress={onEdit}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.delBtn} onPress={onDelete}><Text style={styles.delBtnText}>Delete</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

function RevChip({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.revChip, { backgroundColor: color + '10', borderColor: color + '30' }]}>
            <Text style={[styles.revValue, { color }]}>{value}</Text>
            <Text style={styles.revLabel}>{label}</Text>
        </View>
    );
}

function ModalField({ label, value, onChange, placeholder, numeric, multiline }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; numeric?: boolean; multiline?: boolean;
}) {
    return (
        <View style={styles.mField}>
            <Text style={styles.label}>{label}</Text>
            <TextInput style={[styles.minput, multiline && { height: 80, paddingTop: 10 }]}
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
    statsBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 12, flexWrap: 'wrap' },
    filterPill: { borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.surface },
    filterPillText: { fontSize: 13, fontWeight: '600', color: C.sub },
    revenueBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 12 },
    revChip: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
    revValue: { fontSize: 20, fontWeight: '800' },
    revLabel: { fontSize: 11, color: C.sub, marginTop: 2, fontWeight: '600' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24, marginBottom: 16, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 40 },
    searchInput: { flex: 1, color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: C.sub, marginTop: 12 },
    orderRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    orderBar: { width: 4, alignSelf: 'stretch' },
    orderBody: { flex: 1, padding: 14 },
    orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    orderNum: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 2 },
    orderName: { fontSize: 15, fontWeight: '700', color: C.text },
    orderRight: { alignItems: 'flex-end', gap: 6 },
    orderPrice: { fontSize: 16, fontWeight: '800', color: C.text },
    statusBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 11, fontWeight: '700' },
    orderMeta: { flexDirection: 'row', gap: 14 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { color: C.sub, fontSize: 12 },
    expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
    expandedNotes: { fontSize: 13, color: C.sub, marginBottom: 12 },
    expandedActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    statusQuick: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    quickBtn: { borderRadius: 6, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 5 },
    quickBtnText: { fontSize: 12, fontWeight: '600' },
    rowActions: { flexDirection: 'row', gap: 8 },
    editBtn: { borderRadius: 6, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6 },
    editBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
    delBtn: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.red + '15' },
    delBtnText: { fontSize: 13, fontWeight: '600', color: C.red },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modal: { backgroundColor: C.surface, borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    modalBody: { padding: 20, maxHeight: 420 },
    modalActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: C.border },
    label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 12 },
    mField: { marginBottom: 4 },
    mrow: { flexDirection: 'row', gap: 12 },
    minput: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F8FAFC', color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    statusChip: { borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 6 },
    statusChipText: { fontSize: 13, fontWeight: '600', color: C.text },
    cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
    saveBtn: { flex: 2, height: 44, borderRadius: 10, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
