import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity,
    Platform, ActivityIndicator, Alert, useWindowDimensions, FlatList
} from 'react-native';
import { FileText, Plus, Trash2, Printer, Check, CreditCard, ChevronRight, Settings, Receipt, Lock, Zap } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigation } from '@react-navigation/native';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const COLORS = {
    bg: '#0A0C12',
    surface: '#13151F',
    surfaceHover: '#1A1D27',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    textSub: '#8B95A8',
    text: '#F1F5F9',
    success: '#10B981',
    error: '#EF4444',
};

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export default function InvoiceGeneratorScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isPro } = useSubscription();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [activeTab, setActiveTab] = useState<'list' | 'new' | 'settings'>('list');
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [showProModal, setShowProModal] = useState(false);

    // Business settings state
    const [businessName, setBusinessName] = useState('');
    const [businessEmail, setBusinessEmail] = useState('');
    const [businessPhone, setBusinessPhone] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [businessTaxId, setBusinessTaxId] = useState('');
    const [businessBankDetails, setBusinessBankDetails] = useState('');
    const [businessLoaded, setBusinessLoaded] = useState(false);

    // New invoice form state
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [taxRate, setTaxRate] = useState('0');
    const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        if (user) {
            fetchBusinessSettings();
            fetchInvoices();
        }
    }, [user]);

    const fetchBusinessSettings = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('business_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setBusinessName(data.name || '');
                setBusinessEmail(data.email || '');
                setBusinessPhone(data.phone || '');
                setBusinessAddress(data.address || '');
                setBusinessTaxId(data.tax_id || '');
                setBusinessBankDetails(data.bank_details || '');
            }
            setBusinessLoaded(true);
        } catch (err: any) {
            console.error('Error fetching business settings:', err.message);
        }
    };

    const fetchInvoices = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (err: any) {
            console.error('Error fetching invoices:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBusinessSettings = async () => {
        if (!user) return;
        if (!businessName.trim()) {
            showAlert('Error', 'Please fill in your Business Name.');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                user_id: user.id,
                name: businessName.trim(),
                email: businessEmail.trim(),
                phone: businessPhone.trim(),
                address: businessAddress.trim(),
                tax_id: businessTaxId.trim(),
                bank_details: businessBankDetails.trim(),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('business_settings')
                .upsert(payload, { onConflict: 'user_id' });

            if (error) throw error;
            showAlert('Success', 'Business Profile settings saved successfully!');
            setActiveTab('list');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItemRow = () => {
        setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItemRow = (index: number) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleUpdateItem = (index: number, key: keyof InvoiceItem, value: any) => {
        setItems(prev => prev.map((item, idx) => {
            if (idx === index) {
                return { ...item, [key]: value };
            }
            return item;
        }));
    };

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
    }, [items]);

    const total = useMemo(() => {
        const rate = parseFloat(taxRate) || 0;
        return subtotal + (subtotal * (rate / 100));
    }, [subtotal, taxRate]);

    const handleGenerateInvoice = async () => {
        if (!user) return;
        if (!isPro) {
            setShowProModal(true);
            return;
        }
        if (!businessName) {
            showAlert('Setup Required', 'Please set up your Business Profile f Settings first.');
            setActiveTab('settings');
            return;
        }
        if (!clientName.trim()) {
            showAlert('Error', 'Please fill f the Client Name.');
            return;
        }
        if (items.some(item => !item.description.trim())) {
            showAlert('Error', 'Please fill f descriptions for all items.');
            return;
        }

        try {
            setLoading(true);

            const invNum = invoiceNumber.trim() || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

            const payload = {
                user_id: user.id,
                invoice_number: invNum,
                client_name: clientName.trim(),
                client_email: clientEmail.trim(),
                client_address: clientAddress.trim(),
                items,
                tax_rate: parseFloat(taxRate) || 0,
                total,
                due_date: dueDate.trim() || null,
                status: 'sent',
                billed: false
            };

            const { data, error } = await supabase
                .from('invoices')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            showAlert('Success', 'Invoice generated successfully! $0.50 has been recorded to your subscription usage.');
            
            // Trigger print immediately on web
            if (Platform.OS === 'web' && data) {
                handlePrintInvoice(data);
            }

            // Clear creator state
            setInvoiceNumber('');
            setClientName('');
            setClientEmail('');
            setClientAddress('');
            setDueDate('');
            setTaxRate('0');
            setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
            
            fetchInvoices();
            setActiveTab('list');
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to generate invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchInvoices();
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to update invoice');
        }
    };

    const handleDeleteInvoice = async (id: string) => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm('Are you sure you want to delete this invoice record?')
            : true;

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchInvoices();
        } catch (err: any) {
            showAlert('Error', err.message || 'Failed to delete invoice');
        }
    };

    const handlePrintInvoice = async (invoice: any) => {
        const itemsHtml = invoice.items.map((item: any) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: left; font-size: 14px;">${item.description}</td>
                <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 14px;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 14px;">$${parseFloat(item.unitPrice).toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-size: 14px; font-weight: 600;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
        `).join('');

        const sub = invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const tax = sub * (parseFloat(invoice.tax_rate) / 100);
        const grand = sub + tax;

        const htmlContent = `
            <html>
                <head>
                    <title>Invoice ${invoice.invoice_number}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; margin: 40px; background: #fff; line-height: 1.5; }
                        .invoice-box { max-width: 800px; margin: auto; padding: 20px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; align-items: flex-start; }
                        .brand-title { font-size: 28px; font-weight: 800; color: #0F172A; text-transform: uppercase; }
                        .meta-info { text-align: right; font-size: 14px; }
                        .details-row { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
                        .details-box { flex: 1; font-size: 14px; }
                        .details-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748B; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; letter-spacing: 0.5px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; margin-top: 20px; }
                        th { background-color: #F8FAFC; padding: 12px; font-size: 12px; font-weight: 700; border-bottom: 2px solid #E2E8F0; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
                        .summary-box { display: flex; flex-direction: column; align-items: flex-end; margin-top: 20px; }
                        .summary-row { display: flex; width: 260px; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569; }
                        .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #0F172A; padding-top: 12px; margin-top: 8px; color: #0F172A; }
                        .footer { margin-top: 80px; font-size: 12px; color: #94A3B8; border-top: 1px dashed #E2E8F0; padding-top: 20px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="invoice-box">
                        <div class="header">
                            <div>
                                <div class="brand-title">${businessName || 'INVOICE'}</div>
                                <div style="font-size: 13px; color: #64748B; margin-top: 6px; white-space: pre-line;">
                                    ${businessAddress}
                                </div>
                            </div>
                            <div class="meta-info">
                                <div style="font-size: 24px; font-weight: 900; color: #94A3B8; letter-spacing: 1px; margin-bottom: 10px;">INVOICE</div>
                                <div><strong>Invoice Number:</strong> ${invoice.invoice_number}</div>
                                <div><strong>Issued On:</strong> ${new Date(invoice.created_at).toLocaleDateString()}</div>
                                ${invoice.due_date ? `<div><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</div>` : ''}
                            </div>
                        </div>

                        <div class="details-row">
                            <div class="details-box">
                                <div class="details-title">Billed To</div>
                                <div><strong>${invoice.client_name}</strong></div>
                                ${invoice.client_email ? `<div style="color: #475569; margin-top: 2px;">${invoice.client_email}</div>` : ''}
                                ${invoice.client_address ? `<div style="color: #475569; margin-top: 4px; white-space: pre-line;">${invoice.client_address}</div>` : ''}
                            </div>
                            <div class="details-box" style="text-align: right;">
                                <div class="details-title">Payment details</div>
                                ${businessTaxId ? `<div><strong>Tax ID / Reg:</strong> ${businessTaxId}</div>` : ''}
                                ${businessEmail ? `<div><strong>Contact Email:</strong> ${businessEmail}</div>` : ''}
                                ${businessPhone ? `<div><strong>Phone:</strong> ${businessPhone}</div>` : ''}
                                ${businessBankDetails ? `<div style="margin-top: 10px; font-size: 12px; color: #64748B; white-space: pre-line; text-align: right;">${businessBankDetails}</div>` : ''}
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align: left; width: 50%;">Description</th>
                                    <th style="text-align: center; width: 10%;">Qty</th>
                                    <th style="text-align: right; width: 20%;">Unit Price</th>
                                    <th style="text-align: right; width: 20%;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <div class="summary-box">
                            <div class="summary-row">
                                <span>Subtotal:</span>
                                <span>$${sub.toFixed(2)}</span>
                            </div>
                            ${tax > 0 ? `
                            <div class="summary-row">
                                <span>Tax (${invoice.tax_rate}%):</span>
                                <span>$${tax.toFixed(2)}</span>
                            </div>
                            ` : ''}
                            <div class="summary-row total-row">
                                <span>Grand Total:</span>
                                <span>$${grand.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="footer">
                            Thank you for your business!<br/>
                            Generated by 0machine Laser cut Planner.
                        </div>
                    </div>
                    ${Platform.OS === 'web' ? `
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                    ` : ''}
                </body>
            </html>
        `;

        if (Platform.OS === 'web') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
            }
        } else {
            try {
                // Generate PDF File using Expo Print
                const { uri } = await Print.printToFileAsync({ html: htmlContent });
                // Share PDF file using Expo Sharing (allows user to save, print, send, etc.)
                await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${invoice.invoice_number}` });
            } catch (err: any) {
                showAlert('Error', err.message || 'Failed to generate PDF');
            }
        }
    };

    const showAlert = (title: string, msg: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${msg}`);
        } else {
            Alert.alert(title, msg);
        }
    };

    const renderInvoiceRow = ({ item }: { item: any }) => {
        return (
            <View style={styles.invoiceCard}>
                <View style={styles.invoiceCardHeader}>
                    <View>
                        <Text style={styles.invoiceNumText}>{item.invoice_number}</Text>
                        <Text style={styles.invoiceClientText}>{item.client_name}</Text>
                    </View>
                    <View style={styles.statusBadgeRow}>
                        <TouchableOpacity 
                            style={[
                                styles.statusBadge, 
                                item.status === 'paid' ? styles.paidBadge : styles.sentBadge
                            ]}
                            onPress={() => handleUpdateStatus(item.id, item.status === 'paid' ? 'sent' : 'paid')}
                        >
                            <Text style={[
                                styles.statusBadgeText,
                                item.status === 'paid' ? { color: COLORS.success } : { color: COLORS.primary }
                            ]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.invoiceCardDetails}>
                    <Text style={styles.invoiceDateText}>Issued: {new Date(item.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.invoiceTotalText}>${parseFloat(item.total).toFixed(2)}</Text>
                </View>

                <View style={styles.invoiceCardActions}>
                    <TouchableOpacity 
                        style={styles.actionIconButton}
                        onPress={() => handlePrintInvoice(item)}
                    >
                        <Printer size={16} color={COLORS.text} />
                        <Text style={styles.actionIconText}>Print / PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionIconButton, { borderColor: COLORS.error + '40' }]}
                        onPress={() => handleDeleteInvoice(item.id)}
                    >
                        <Trash2 size={16} color={COLORS.error} />
                        <Text style={[styles.actionIconText, { color: COLORS.error }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.headerIcon}>
                        <Receipt color={COLORS.primary} size={22} />
                    </View>
                    <View>
                        <Text style={styles.title}>Invoice Generator</Text>
                        <Text style={styles.subtitle}>Create & manage invoices ($0.50 fee per invoice)</Text>
                    </View>
                </View>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'list' && styles.activeTab]}
                    onPress={() => setActiveTab('list')}
                >
                    <FileText color={activeTab === 'list' ? COLORS.primary : COLORS.textSub} size={16} />
                    <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>Invoices List</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'new' && styles.activeTab]}
                    onPress={() => setActiveTab('new')}
                >
                    <Plus color={activeTab === 'new' ? COLORS.primary : COLORS.textSub} size={16} />
                    <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>Create Invoice</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
                    onPress={() => setActiveTab('settings')}
                >
                    <Settings color={activeTab === 'settings' ? COLORS.primary : COLORS.textSub} size={16} />
                    <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Business Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Notification Banner */}
            <View style={styles.billingBanner}>
                <CreditCard color={COLORS.primary} size={16} />
                <Text style={styles.billingBannerText}>
                    Metered pricing enabled. Every generated invoice adds $0.50 to your Stripe monthly invoice.
                </Text>
            </View>

            {loading && invoices.length === 0 ? (
                <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.scroll}>
                    {activeTab === 'list' && (
                        <View style={styles.viewContent}>
                            {invoices.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Receipt color={COLORS.textSub} size={48} />
                                    <Text style={styles.emptyTitle}>No invoices generated yet</Text>
                                    <Text style={styles.emptySubtitle}>Click Create Invoice to get started</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={invoices}
                                    renderItem={renderInvoiceRow}
                                    keyExtractor={item => item.id}
                                    scrollEnabled={false}
                                />
                            )}
                        </View>
                    )}

                    {activeTab === 'new' && (
                        <View style={styles.viewContent}>
                            <View style={styles.formCard}>
                                <Text style={styles.cardTitle}>Recipient details</Text>
                                <View style={styles.row}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Client Name *</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="John Doe" 
                                            placeholderTextColor={COLORS.textSub}
                                            value={clientName}
                                            onChangeText={setClientName}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Client Email</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="client@example.com" 
                                            placeholderTextColor={COLORS.textSub}
                                            value={clientEmail}
                                            onChangeText={setClientEmail}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>
                                <Text style={styles.label}>Client Address</Text>
                                <TextInput 
                                    style={[styles.input, { height: 60 }]} 
                                    placeholder="123 Main St, City, Country" 
                                    placeholderTextColor={COLORS.textSub}
                                    multiline
                                    value={clientAddress}
                                    onChangeText={setClientAddress}
                                />

                                <Text style={[styles.cardTitle, { marginTop: 24 }]}>Invoice Config</Text>
                                <View style={styles.row}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Invoice Number (Optional)</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="INV-2026-0001" 
                                            placeholderTextColor={COLORS.textSub}
                                            value={invoiceNumber}
                                            onChangeText={setInvoiceNumber}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Due Date (Optional)</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="YYYY-MM-DD" 
                                            placeholderTextColor={COLORS.textSub}
                                            value={dueDate}
                                            onChangeText={setDueDate}
                                        />
                                    </View>
                                </View>

                                <View style={styles.itemsHeader}>
                                    <Text style={styles.cardTitle}>Line Items</Text>
                                    <TouchableOpacity style={styles.addRowButton} onPress={handleAddItemRow}>
                                        <Plus size={14} color="#FFF" />
                                        <Text style={styles.addRowButtonText}>Add Row</Text>
                                    </TouchableOpacity>
                                </View>

                                {items.map((item, index) => (
                                    <View key={index} style={styles.itemRow}>
                                        <TextInput 
                                            style={[styles.input, { flex: 3, marginBottom: 0 }]} 
                                            placeholder="Item / service description" 
                                            placeholderTextColor={COLORS.textSub}
                                            value={item.description}
                                            onChangeText={(v) => handleUpdateItem(index, 'description', v)}
                                        />
                                        <TextInput 
                                            style={[styles.input, { flex: 0.8, marginBottom: 0, textAlign: 'center' }]} 
                                            placeholder="Qty" 
                                            placeholderTextColor={COLORS.textSub}
                                            keyboardType="number-pad"
                                            value={item.quantity.toString()}
                                            onChangeText={(v) => handleUpdateItem(index, 'quantity', parseInt(v) || 0)}
                                        />
                                        <TextInput 
                                            style={[styles.input, { flex: 1.2, marginBottom: 0, textAlign: 'right' }]} 
                                            placeholder="Price ($)" 
                                            placeholderTextColor={COLORS.textSub}
                                            keyboardType="decimal-pad"
                                            value={item.unitPrice ? item.unitPrice.toString() : ''}
                                            onChangeText={(v) => handleUpdateItem(index, 'unitPrice', parseFloat(v) || 0)}
                                        />
                                        {items.length > 1 && (
                                            <TouchableOpacity onPress={() => handleRemoveItemRow(index)} style={styles.deleteRowBtn}>
                                                <Trash2 size={16} color={COLORS.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}

                                <View style={styles.divider} />

                                <View style={styles.summaryContainer}>
                                    <View style={styles.summaryInputRow}>
                                        <Text style={styles.label}>Tax rate (%)</Text>
                                        <TextInput 
                                            style={[styles.input, { width: 80, marginBottom: 0, textAlign: 'center', height: 36 }]} 
                                            placeholder="0" 
                                            placeholderTextColor={COLORS.textSub}
                                            keyboardType="decimal-pad"
                                            value={taxRate}
                                            onChangeText={setTaxRate}
                                        />
                                    </View>

                                    <View style={styles.totalsBox}>
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>Subtotal</Text>
                                            <Text style={styles.totalVal}>${subtotal.toFixed(2)}</Text>
                                        </View>
                                        {parseFloat(taxRate) > 0 && (
                                            <View style={styles.totalRow}>
                                                <Text style={styles.totalLabel}>Tax ({taxRate}%)</Text>
                                                <Text style={styles.totalVal}>${(subtotal * (parseFloat(taxRate)/100)).toFixed(2)}</Text>
                                            </View>
                                        )}
                                        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 }]}>
                                            <Text style={[styles.totalLabel, { color: COLORS.text, fontWeight: '800' }]}>Grand Total</Text>
                                            <Text style={[styles.totalVal, { color: COLORS.primary, fontSize: 18, fontWeight: '900' }]}>${total.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                    onPress={handleGenerateInvoice}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Printer color="#FFF" size={18} />
                                            <Text style={styles.primaryButtonText}>Generate & Print Invoice</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {activeTab === 'settings' && (
                        <View style={styles.viewContent}>
                            <View style={styles.formCard}>
                                <Text style={styles.cardTitle}>One-time Business Setup</Text>
                                <Text style={styles.settingsHintText}>
                                    Save your billing details below. They will be displayed at the header of all invoices you generate.
                                </Text>

                                <Text style={styles.label}>Business Name *</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="e.g. 0machine Workshop" 
                                    placeholderTextColor={COLORS.textSub}
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                />

                                <Text style={styles.label}>Business Address *</Text>
                                <TextInput 
                                    style={[styles.input, { height: 60 }]} 
                                    placeholder="e.g. Zone Industrielle, Lot 44, Casablanca, Morocco" 
                                    placeholderTextColor={COLORS.textSub}
                                    multiline
                                    value={businessAddress}
                                    onChangeText={setBusinessAddress}
                                />

                                <View style={styles.row}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Email Address</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="billing@0machine.com" 
                                            placeholderTextColor={COLORS.textSub}
                                            value={businessEmail}
                                            onChangeText={setBusinessEmail}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Phone Number</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="+212 600-000000" 
                                            placeholderTextColor={COLORS.textSub}
                                            value={businessPhone}
                                            onChangeText={setBusinessPhone}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.label}>Tax Registration / VAT ID (Optional)</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="e.g. VAT-123456789" 
                                    placeholderTextColor={COLORS.textSub}
                                    value={businessTaxId}
                                    onChangeText={setBusinessTaxId}
                                />

                                <Text style={styles.label}>Bank Payment Info / Instructions (Optional)</Text>
                                <TextInput 
                                    style={[styles.input, { height: 80 }]} 
                                    placeholder="Bank: Attijariwafa Bank&#10;RIB: 007 123 0000000000 00&#10;Payable within 15 days" 
                                    placeholderTextColor={COLORS.textSub}
                                    multiline
                                    value={businessBankDetails}
                                    onChangeText={setBusinessBankDetails}
                                />

                                <TouchableOpacity 
                                    style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                                    onPress={handleSaveBusinessSettings}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Check color="#FFF" size={18} />
                                            <Text style={styles.primaryButtonText}>Save Business Settings</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}

            <ProUpgradeModal
                visible={showProModal}
                onClose={() => setShowProModal(false)}
                featureName="Invoice Generator"
                actionTitle="Generate Invoice"
                description="Your invoice is ready to generate! Upgrade to Pro ($19/mo) to generate and download professional PDF invoices."
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.bg },
    header: { padding: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    subtitle: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 12 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    activeTab: { borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '10' },
    tabText: { color: COLORS.textSub, fontSize: 13, fontWeight: '600' },
    activeTabText: { color: COLORS.primary },
    billingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,107,53,0.08)', marginHorizontal: 24, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)', marginBottom: 16 },
    billingBannerText: { color: COLORS.text, fontSize: 12, fontWeight: '600', flex: 1 },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    viewContent: { width: '100%', maxWidth: 800, alignSelf: 'center' },
    emptyContainer: { alignItems: 'center', padding: 60, gap: 12, backgroundColor: COLORS.surface, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border, marginTop: 20 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    emptySubtitle: { fontSize: 13, color: COLORS.textSub },
    formCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
    cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
    inputGroup: { flex: 1, marginBottom: 12 },
    label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
    input: { height: 44, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, backgroundColor: COLORS.bg, color: COLORS.text, paddingHorizontal: 12, fontSize: 14, marginBottom: 12, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
    addRowButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    addRowButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    itemRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
    deleteRowBtn: { padding: 8, backgroundColor: COLORS.error + '10', borderRadius: 8, borderWidth: 1, borderColor: COLORS.error + '25' },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
    summaryInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    totalsBox: { width: 280, gap: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 13, color: COLORS.textSub },
    totalVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    primaryButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, gap: 10, marginTop: 24 },
    primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    settingsHintText: { fontSize: 13, color: COLORS.textSub, lineHeight: 18, marginBottom: 20 },
    invoiceCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
    invoiceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    invoiceNumText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
    invoiceClientText: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
    statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
    paidBadge: { borderColor: COLORS.success + '30', backgroundColor: COLORS.success + '10' },
    sentBadge: { borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '10' },
    statusBadgeText: { fontSize: 10, fontWeight: '800' },
    invoiceCardDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
    invoiceDateText: { fontSize: 12, color: COLORS.textSub },
    lockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        maxWidth: 520,
        alignSelf: 'center',
        width: '100%',
    },
    lockedIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(255,107,53,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    lockBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.bg,
    },
    lockedBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    lockedTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    lockedSub: {
        fontSize: 14,
        color: COLORS.textSub,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    priceCard: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    priceAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.text,
    },
    pricePeriod: {
        fontSize: 16,
        color: COLORS.textSub,
        fontWeight: '500',
    },
    priceSub: {
        fontSize: 12,
        color: COLORS.textSub,
        marginTop: 6,
        textAlign: 'center',
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 28,
        width: '100%',
    },
    upgradeBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    invoiceTotalText: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
    invoiceCardActions: { flexDirection: 'row', gap: 12 },
    actionIconButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8 },
    actionIconText: { fontSize: 12, color: COLORS.text, fontWeight: '600' }
});
