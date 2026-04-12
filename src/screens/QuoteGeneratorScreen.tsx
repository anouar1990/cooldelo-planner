import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Modal, Platform, Alert,
} from 'react-native';
import { FileText, Plus, X, Check, Trash2, User, Calendar, Hash, Percent } from 'lucide-react-native';

const C = {
    bg: '#F9FAFB', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', primary: '#FF6B35',
    green: '#10B981', amber: '#F59E0B',
};

interface LineItem {
    id: string;
    description: string;
    qty: number;
    unit: number; // unit price
}

interface Quote {
    id: string;
    quoteNumber: string;
    clientName: string;
    projectDescription: string;
    items: LineItem[];
    vatPct: number;
    validDays: number;
    deliveryDate: string;
    notes: string;
    createdAt: string;
    status: 'draft' | 'sent' | 'accepted' | 'declined';
}

const STATUS_COLORS: Record<Quote['status'], { color: string; bg: string }> = {
    draft: { color: C.sub, bg: '#F3F4F6' },
    sent: { color: C.amber, bg: C.amber + '15' },
    accepted: { color: C.green, bg: C.green + '15' },
    declined: { color: '#EF4444', bg: '#EF444415' },
};

function nextQuoteNum(quotes: Quote[]) {
    const max = quotes.reduce((m, q) => {
        const n = parseInt(q.quoteNumber.split('-')[1] ?? '0');
        return n > m ? n : m;
    }, 0);
    return `QT-${String(max + 1).padStart(3, '0')}`;
}

const BLANK_ITEM = (): LineItem => ({ id: Date.now().toString(), description: '', qty: 1, unit: 0 });

export default function QuoteGeneratorScreen() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Quote | null>(null);

    // Form state
    const [clientName, setClientName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [items, setItems] = useState<LineItem[]>([BLANK_ITEM()]);
    const [vatPct, setVatPct] = useState('0');
    const [validDays, setValidDays] = useState('30');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [notes, setNotes] = useState('');

    const totals = useMemo(() => {
        const subtotal = items.reduce((s, i) => s + i.qty * i.unit, 0);
        const vat = subtotal * (parseFloat(vatPct) || 0) / 100;
        return { subtotal, vat, total: subtotal + vat };
    }, [items, vatPct]);

    const resetForm = () => {
        setClientName(''); setProjectDesc(''); setItems([BLANK_ITEM()]);
        setVatPct('0'); setValidDays('30'); setDeliveryDate(''); setNotes('');
    };

    const openNew = () => { setEditing(null); resetForm(); setShowModal(true); };
    const openEdit = (q: Quote) => {
        setEditing(q);
        setClientName(q.clientName); setProjectDesc(q.projectDescription);
        setItems(q.items.map(i => ({ ...i }))); setVatPct(q.vatPct.toString());
        setValidDays(q.validDays.toString()); setDeliveryDate(q.deliveryDate); setNotes(q.notes);
        setShowModal(true);
    };

    const saveQuote = () => {
        if (!clientName.trim()) return;
        const validItems = items.filter(i => i.description.trim());
        if (editing) {
            setQuotes(prev => prev.map(q => q.id === editing.id ? {
                ...editing, clientName, projectDescription: projectDesc,
                items: validItems, vatPct: parseFloat(vatPct) || 0,
                validDays: parseInt(validDays) || 30, deliveryDate, notes,
            } : q));
        } else {
            setQuotes(prev => [...prev, {
                id: Date.now().toString(),
                quoteNumber: nextQuoteNum(prev),
                clientName, projectDescription: projectDesc,
                items: validItems, vatPct: parseFloat(vatPct) || 0,
                validDays: parseInt(validDays) || 30, deliveryDate, notes,
                status: 'draft', createdAt: new Date().toISOString().split('T')[0],
            }]);
        }
        setShowModal(false);
    };

    const delQuote = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this quote?')) setQuotes(prev => prev.filter(q => q.id !== id));
        } else {
            Alert.alert('Delete', 'Delete quote?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setQuotes(prev => prev.filter(q => q.id !== id)) }]);
        }
    };

    const setStatus = (id: string, status: Quote['status']) => setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));

    const updItem = (id: string, k: keyof LineItem, v: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i));
    const delItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <View style={styles.headerIcon}><FileText color={C.primary} size={20} /></View>
                        <Text style={styles.title}>Quote Generator</Text>
                    </View>
                    <Text style={styles.subtitle}>{quotes.length} quotes · ${quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.items.reduce((si, i) => si + i.qty * i.unit, 0) * (1 + q.vatPct / 100), 0).toFixed(0)} accepted</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openNew}>
                    <Plus color="#fff" size={18} />
                    <Text style={styles.addBtnText}>New Quote</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {quotes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <FileText color={C.sub} size={40} opacity={0.4} />
                        <Text style={styles.emptyTitle}>No quotes yet</Text>
                        <Text style={styles.emptyText}>Create professional quotes for your clients with line items, VAT, and totals.</Text>
                        <TouchableOpacity style={styles.addBtnLg} onPress={openNew}>
                            <Plus color="#fff" size={18} />
                            <Text style={styles.addBtnText}>Create First Quote</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    quotes.map(q => {
                        const sub = q.items.reduce((s, i) => s + i.qty * i.unit, 0);
                        const total = sub * (1 + q.vatPct / 100);
                        const conf = STATUS_COLORS[q.status];
                        return (
                            <View key={q.id} style={styles.quoteRow}>
                                <View style={styles.quoteMain}>
                                    <View>
                                        <Text style={styles.quoteNum}>{q.quoteNumber}</Text>
                                        <Text style={styles.quoteName}>{q.clientName}</Text>
                                        <Text style={styles.quoteDesc} numberOfLines={1}>{q.projectDescription}</Text>
                                    </View>
                                    <View style={styles.quoteRight}>
                                        <Text style={styles.quoteTotal}>${total.toFixed(2)}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: conf.bg, borderColor: conf.color }]}>
                                            <Text style={[styles.statusText, { color: conf.color }]}>{q.status}</Text>
                                        </View>
                                        <Text style={styles.quoteDate}>{q.createdAt}</Text>
                                    </View>
                                </View>
                                <View style={styles.quoteActions}>
                                    {(['draft', 'sent', 'accepted', 'declined'] as Quote['status'][]).filter(s => s !== q.status).map(s => (
                                        <TouchableOpacity key={s} style={styles.statusBtn} onPress={() => setStatus(q.id, s)}>
                                            <Text style={[styles.statusBtnText, { color: STATUS_COLORS[s].color }]}>→ {s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(q)}><Text style={styles.editBtnText}>Edit</Text></TouchableOpacity>
                                    <TouchableOpacity style={styles.delBtn} onPress={() => delQuote(q.id)}><Text style={styles.delBtnText}>Delete</Text></TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editing ? `Edit ${editing.quoteNumber}` : 'New Quote'}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}><X color={C.sub} size={22} /></TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {/* Client */}
                            <View style={styles.mrow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Client Name</Text>
                                    <TextInput style={styles.minput} value={clientName} onChangeText={setClientName} placeholder="John Smith" placeholderTextColor={C.sub} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Delivery Date</Text>
                                    <TextInput style={styles.minput} value={deliveryDate} onChangeText={setDeliveryDate} placeholder="2026-05-01" placeholderTextColor={C.sub} />
                                </View>
                            </View>
                            <Text style={styles.label}>Project Description</Text>
                            <TextInput style={styles.minput} value={projectDesc} onChangeText={setProjectDesc} placeholder="Custom laser cut coasters..." placeholderTextColor={C.sub} />

                            {/* Line Items */}
                            <Text style={[styles.label, { marginTop: 16 }]}>Line Items</Text>
                            <View style={styles.itemsHeader}>
                                <Text style={[styles.itemHeaderText, { flex: 3 }]}>Description</Text>
                                <Text style={[styles.itemHeaderText, { flex: 1 }]}>Qty</Text>
                                <Text style={[styles.itemHeaderText, { flex: 1 }]}>Unit $</Text>
                                <Text style={[styles.itemHeaderText, { flex: 1 }]}>Total</Text>
                                <View style={{ width: 28 }} />
                            </View>
                            {items.map(item => (
                                <View key={item.id} style={styles.itemRow}>
                                    <TextInput style={[styles.itemInput, { flex: 3 }]} value={item.description}
                                        onChangeText={v => updItem(item.id, 'description', v)} placeholder="Description..." placeholderTextColor={C.sub} />
                                    <TextInput style={[styles.itemInput, { flex: 1 }]} value={item.qty.toString()}
                                        onChangeText={v => updItem(item.id, 'qty', parseInt(v) || 0)} keyboardType="number-pad" placeholder="1" placeholderTextColor={C.sub} />
                                    <TextInput style={[styles.itemInput, { flex: 1 }]} value={item.unit.toString()}
                                        onChangeText={v => updItem(item.id, 'unit', parseFloat(v) || 0)} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.sub} />
                                    <Text style={[styles.itemTotal, { flex: 1 }]}>${(item.qty * item.unit).toFixed(2)}</Text>
                                    <TouchableOpacity onPress={() => delItem(item.id)} style={{ width: 28, alignItems: 'center' }}>
                                        <Trash2 color="#EF4444" size={14} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addItemBtn} onPress={() => setItems(p => [...p, BLANK_ITEM()])}>
                                <Plus color={C.primary} size={14} />
                                <Text style={styles.addItemText}>Add Line Item</Text>
                            </TouchableOpacity>

                            {/* Totals */}
                            <View style={styles.totalsBox}>
                                <View style={styles.mrow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>VAT (%)</Text>
                                        <TextInput style={styles.minput} value={vatPct} onChangeText={setVatPct}
                                            keyboardType="decimal-pad" placeholder="0" placeholderTextColor={C.sub} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>Valid for (days)</Text>
                                        <TextInput style={styles.minput} value={validDays} onChangeText={setValidDays}
                                            keyboardType="number-pad" placeholder="30" placeholderTextColor={C.sub} />
                                    </View>
                                </View>
                                <View style={styles.totalRows}>
                                    <TotalRow label="Subtotal" value={`$${totals.subtotal.toFixed(2)}`} />
                                    {totals.vat > 0 && <TotalRow label={`VAT (${vatPct}%)`} value={`$${totals.vat.toFixed(2)}`} />}
                                    <TotalRow label="TOTAL" value={`$${totals.total.toFixed(2)}`} bold />
                                </View>
                            </View>

                            <Text style={styles.label}>Notes (optional)</Text>
                            <TextInput style={[styles.minput, { height: 72, paddingTop: 10 }]}
                                value={notes} onChangeText={setNotes} placeholder="Payment terms, delivery info..." placeholderTextColor={C.sub} multiline />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={saveQuote}>
                                <Check color="#fff" size={18} />
                                <Text style={styles.saveBtnText}>{editing ? 'Update Quote' : 'Save Quote'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, bold && { fontWeight: '800', color: C.text }]}>{label}</Text>
            <Text style={[styles.totalValue, bold && { fontSize: 18, color: C.primary }]}>{value}</Text>
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
    scroll: { padding: 24, paddingTop: 0, paddingBottom: 40 },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 16 },
    emptyText: { fontSize: 14, color: C.sub, marginTop: 8, textAlign: 'center', maxWidth: 320 },
    quoteRow: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }) },
    quoteMain: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
    quoteNum: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 2 },
    quoteName: { fontSize: 16, fontWeight: '700', color: C.text },
    quoteDesc: { fontSize: 13, color: C.sub, marginTop: 2 },
    quoteRight: { alignItems: 'flex-end', gap: 6 },
    quoteTotal: { fontSize: 18, fontWeight: '800', color: C.primary },
    statusBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    quoteDate: { fontSize: 11, color: C.sub },
    quoteActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, flexWrap: 'wrap' },
    statusBtn: { borderRadius: 6, borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 5 },
    statusBtnText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    editBtn: { borderRadius: 6, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 5 },
    editBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
    delBtn: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#FEF2F2' },
    delBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modal: { backgroundColor: C.surface, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '95%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    modalBody: { padding: 20, maxHeight: 520 },
    modalActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: C.border },
    label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 8, marginTop: 8 },
    mrow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
    minput: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F8FAFC', color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    itemsHeader: { flexDirection: 'row', gap: 6, marginBottom: 4 },
    itemHeaderText: { fontSize: 11, fontWeight: '600', color: C.sub },
    itemRow: { flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' },
    itemInput: { height: 40, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 8, backgroundColor: '#F8FAFC', color: C.text, fontSize: 13, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    itemTotal: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'right' },
    addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    addItemText: { color: C.primary, fontSize: 13, fontWeight: '600' },
    totalsBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 14, marginTop: 8, borderWidth: 1, borderColor: C.border },
    totalRows: { marginTop: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    totalLabel: { fontSize: 14, color: C.sub, fontWeight: '600' },
    totalValue: { fontSize: 14, fontWeight: '700', color: C.text },
    cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.sub },
    saveBtn: { flex: 2, height: 44, borderRadius: 10, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
