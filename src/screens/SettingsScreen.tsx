import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    ScrollView, TextInput, ActivityIndicator, Alert, Linking, Modal, Image, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { ArrowLeft, User, CreditCard, Landmark, Trash2, Save, ExternalLink, Sun, Moon, Download, Upload, Cpu, Globe, Shield } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWorkshop, WorkshopType } from '../context/WorkshopContext';
import { ProUpgradeModal } from '../components/ProUpgradeModal';
import { supabase } from '../lib/supabase';
import { downloadCsv } from '../lib/exportCsv';

const WORKSHOP_TYPES: WorkshopType[] = [
    'Laser Cutting',
    'CNC Fabrication',
    '3D Printing',
    'Engraving',
    'Mixed Workshop',
];

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { user, displayName, signOut } = useAuth();
    const { subscription, isFree, isStarter, isPro } = useSubscription();
    const { theme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const { profile, updateProfile, exportBackupData, importBackupData } = useWorkshop();

    const [showProModal, setShowProModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [importInput, setImportInput] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);

    // Form fields mapped to WorkshopProfile
    const [workshopName, setWorkshopName] = useState(profile.workshopName);
    const [ownerName, setOwnerName] = useState(profile.ownerName);
    const [companyName, setCompanyName] = useState(profile.companyName);
    const [email, setEmail] = useState(profile.email);
    const [phone, setPhone] = useState(profile.phone);
    const [country, setCountry] = useState(profile.country);
    const [city, setCity] = useState(profile.city);
    const [address, setAddress] = useState(profile.address);
    const [taxId, setTaxId] = useState(profile.taxId);
    const [currency, setCurrency] = useState(profile.currency);
    const [workshopType, setWorkshopType] = useState<WorkshopType>(profile.workshopType);
    const [logoUrl, setLogoUrl] = useState(profile.logoUrl);

    // Machine fields
    const [machineName, setMachineName] = useState(profile.machine.name);
    const [machineBrand, setMachineBrand] = useState(profile.machine.brand);
    const [machineModel, setMachineModel] = useState(profile.machine.model);
    const [machinePower, setMachinePower] = useState(profile.machine.powerWatts.toString());
    const [machineArea, setMachineArea] = useState(profile.machine.workingArea);

    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [disclaimerChecked, setDisclaimerChecked] = useState(false);

    useEffect(() => {
        setWorkshopName(profile.workshopName);
        setOwnerName(profile.ownerName);
        setCompanyName(profile.companyName);
        setEmail(profile.email);
        setPhone(profile.phone);
        setCountry(profile.country);
        setCity(profile.city);
        setAddress(profile.address);
        setTaxId(profile.taxId);
        setCurrency(profile.currency);
        setWorkshopType(profile.workshopType);
        setLogoUrl(profile.logoUrl);
        setMachineName(profile.machine.name);
        setMachineBrand(profile.machine.brand);
        setMachineModel(profile.machine.model);
        setMachinePower(profile.machine.powerWatts.toString());
        setMachineArea(profile.machine.workingArea);
    }, [profile]);

    const handleSave = () => {
        setSaving(true);
        updateProfile({
            workshopName: workshopName.trim(),
            ownerName: ownerName.trim(),
            companyName: companyName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            country: country.trim(),
            city: city.trim(),
            address: address.trim(),
            taxId: taxId.trim(),
            currency: currency.trim() || '$',
            workshopType,
            logoUrl: logoUrl.trim(),
            machine: {
                name: machineName.trim(),
                brand: machineBrand.trim(),
                model: machineModel.trim(),
                powerWatts: parseFloat(machinePower) || 0,
                workingArea: machineArea.trim(),
            },
        });

        setTimeout(() => {
            setSaving(false);
            if (Platform.OS === 'web') window.alert('Workshop settings saved successfully!');
            else Alert.alert('Saved', 'Workshop settings saved successfully!');
        }, 300);
    };

    const handleExportBackup = () => {
        const jsonData = exportBackupData();
        downloadCsv(`0Machine_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`, jsonData);
    };

    const handleImportBackup = () => {
        if (!importInput.trim()) return;
        const success = importBackupData(importInput);
        if (success) {
            setShowImportModal(false);
            setImportInput('');
            if (Platform.OS === 'web') window.alert('Backup data imported successfully!');
            else Alert.alert('Import Success', 'Backup data imported successfully!');
        } else {
            if (Platform.OS === 'web') window.alert('Invalid JSON backup file format.');
            else Alert.alert('Import Error', 'Invalid JSON backup file format.');
        }
    };

    const accountId = user?.id ? `ACC-${user.id.substring(0, 8).toUpperCase()}` : 'N/A';

    const executeAccountDeletion = async () => {
        if (!user) return;
        try {
            setIsDeleteModalVisible(false);
            await supabase.from('projects').delete().eq('user_id', user.id);
            await supabase.from('materials').delete().eq('user_id', user.id);
            await supabase.from('clients').delete().eq('user_id', user.id);
            await supabase.from('machine_profiles').delete().eq('user_id', user.id);
            await supabase.from('business_settings').delete().eq('user_id', user.id);
            await signOut();
            if (Platform.OS === 'web') window.alert('Your profile and data have been removed.');
            else Alert.alert('Account Deleted', 'Your profile and data have been removed.');
        } catch (err: any) {
            Alert.alert('Deletion Failed', err.message);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#FFFFFF" size={20} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Workshop Settings</Text>
                    <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Save color="#FFF" size={16} />}
                        <Text style={styles.saveHeaderBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* General Information */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <User color="#FF6B35" size={20} />
                            <Text style={styles.cardTitle}>General Workshop Profile</Text>
                        </View>

                        {/* Logo Preview & Input */}
                        <Text style={styles.label}>Workshop Logo URL</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            {logoUrl ? (
                                <Image source={{ uri: logoUrl }} style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#FF6B35' }} />
                            ) : (
                                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FF6B3520', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF6B35' }}>
                                    <Text style={{ color: '#FF6B35', fontWeight: '800', fontSize: 18 }}>{workshopName ? workshopName.charAt(0) : 'W'}</Text>
                                </View>
                            )}
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                value={logoUrl}
                                onChangeText={setLogoUrl}
                                placeholder="https://example.com/logo.png"
                                placeholderTextColor="#8B95A8"
                            />
                        </View>

                        <Text style={styles.label}>Workshop Name</Text>
                        <TextInput style={styles.input} value={workshopName} onChangeText={setWorkshopName} placeholder="Atlas FabWorks" placeholderTextColor="#8B95A8" />

                        <Text style={styles.label}>Owner / Managing Engineer Name</Text>
                        <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="John Doe" placeholderTextColor="#8B95A8" />

                        <Text style={styles.label}>Workshop Type</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                            {WORKSHOP_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setWorkshopType(type)}
                                    style={{
                                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
                                        backgroundColor: workshopType === type ? '#FF6B35' : '#242840',
                                        borderColor: workshopType === type ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Primary Currency</Text>
                        <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="$ / € / DH / £" placeholderTextColor="#8B95A8" />
                    </View>

                    {/* Company Details */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Landmark color="#3B82F6" size={20} />
                            <Text style={styles.cardTitle}>Company & Billing Info</Text>
                        </View>

                        <Text style={styles.label}>Company Legal Name</Text>
                        <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Atlas Technologies SARL" placeholderTextColor="#8B95A8" />

                        <Text style={styles.label}>VAT / Tax ID Number</Text>
                        <TextInput style={styles.input} value={taxId} onChangeText={setTaxId} placeholder="MA-987654321" placeholderTextColor="#8B95A8" />

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="contact@fab.com" placeholderTextColor="#8B95A8" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+212 600-000000" placeholderTextColor="#8B95A8" />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>City</Text>
                                <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Casablanca" placeholderTextColor="#8B95A8" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Country</Text>
                                <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Morocco" placeholderTextColor="#8B95A8" />
                            </View>
                        </View>

                        <Text style={styles.label}>Street Address</Text>
                        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Boulevard Mohamed V" placeholderTextColor="#8B95A8" />
                    </View>

                    {/* Machine Specs */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Cpu color="#10B981" size={20} />
                            <Text style={styles.cardTitle}>Primary Laser & CNC Machine</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Machine Name</Text>
                                <TextInput style={styles.input} value={machineName} onChangeText={setMachineName} placeholder="Nova 51" placeholderTextColor="#8B95A8" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Brand</Text>
                                <TextInput style={styles.input} value={machineBrand} onChangeText={setMachineBrand} placeholder="Thunder Laser" placeholderTextColor="#8B95A8" />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Laser Power (Watts)</Text>
                                <TextInput style={styles.input} value={machinePower} onChangeText={setMachinePower} keyboardType="numeric" placeholder="130" placeholderTextColor="#8B95A8" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Working Area</Text>
                                <TextInput style={styles.input} value={machineArea} onChangeText={setMachineArea} placeholder="1300x900 mm" placeholderTextColor="#8B95A8" />
                            </View>
                        </View>
                    </View>

                    {/* Preferences & Languages */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Globe color="#8B5CF6" size={20} />
                            <Text style={styles.cardTitle}>Preferences & Language</Text>
                        </View>

                        <Text style={styles.label}>Application Language</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                            {[
                                { code: 'en', label: 'English 🇺🇸' },
                                { code: 'fr', label: 'Français 🇫🇷' },
                                { code: 'es', label: 'Español 🇪🇸' },
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.code}
                                    onPress={() => setLanguage(item.code as any)}
                                    style={{
                                        flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center',
                                        backgroundColor: language === item.code ? '#FF6B35' : '#242840',
                                        borderColor: language === item.code ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Backup & Restore */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Download color="#F59E0B" size={20} />
                            <Text style={styles.cardTitle}>Backup & Restore Data</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#8B95A8', marginBottom: 14, lineHeight: 18 }}>
                            Export full JSON backups of your materials, orders, invoices, and profile to restore anytime.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={handleExportBackup} style={{ flex: 1, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: '#F59E0B', borderRadius: 10, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                <Download color="#F59E0B" size={16} />
                                <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 12 }}>Export Backup JSON</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setShowImportModal(true)} style={{ flex: 1, backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 10, paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                                <Upload color="#3B82F6" size={16} />
                                <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 12 }}>Restore Backup</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Subscription Details */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <CreditCard color="#F59E0B" size={20} />
                            <Text style={styles.cardTitle}>Subscription Details</Text>
                        </View>
                        <View style={styles.subInfo}>
                            <View>
                                <Text style={styles.subPlanLabel}>Active Plan</Text>
                                <Text style={styles.subPlanValue}>{subscription.plan === 'pro' ? 'Workshop Pro' : subscription.plan === 'starter' ? 'Starter' : 'Free Plan'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.subPlanLabel}>Billing</Text>
                                <Text style={styles.subPlanValue}>{subscription.plan === 'pro' ? '$19/mo' : '$0 Free'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Danger Zone */}
                    <View style={[styles.card, { borderColor: '#EF4444' + '30' }]}>
                        <View style={styles.cardHeader}>
                            <Trash2 color="#EF4444" size={20} />
                            <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Danger Zone</Text>
                        </View>
                        <Text style={styles.dangerText}>
                            Deleting your account will permanently wipe all your data from our database. There is no way to recover your settings or projects once done.
                        </Text>
                        <TouchableOpacity 
                            style={styles.deleteBtn} 
                            onPress={() => {
                                setDisclaimerChecked(false);
                                setIsDeleteModalVisible(true);
                            }}
                        >
                            <Trash2 color="#FFF" size={16} style={{ marginRight: 6 }} />
                            <Text style={styles.deleteBtnText}>Delete My Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Custom Delete Confirmation Modal */}
                <Modal
                    visible={isDeleteModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>⚠️ Permanent Account Deletion</Text>
                            
                            <Text style={styles.modalWarningText}>
                                This action is permanent and absolute. 
                                {"\n\n"}
                                All of your projects, materials logs, client lists, invoices, machine profiles, templates, and settings will be deleted forever.
                                {"\n\n"}
                                For security and privacy reasons, we do not keep backups of deleted profiles. Your data <Text style={{ fontWeight: 'bold', color: '#FFF' }}>cannot be recovered</Text> under any circumstances.
                            </Text>

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setDisclaimerChecked(!disclaimerChecked)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.checkbox, disclaimerChecked && styles.checkboxActive]}>
                                    {disclaimerChecked && <View style={styles.checkboxCheck} />}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                    I understand my data will be deleted forever, and I release 0Machine from any liability.
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.modalActions}>
                                <TouchableOpacity 
                                    style={styles.modalCancelBtn} 
                                    onPress={() => setIsDeleteModalVisible(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[
                                        styles.modalDeleteBtn, 
                                        !disclaimerChecked && { opacity: 0.4 }
                                    ]} 
                                    onPress={executeAccountDeletion}
                                    disabled={!disclaimerChecked}
                                >
                                    <Text style={styles.modalDeleteText}>Delete Permanently</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <ProUpgradeModal
                    visible={showProModal}
                    onClose={() => setShowProModal(false)}
                    featureName="CSV & Excel Data Export"
                    actionTitle="Export Projects, Materials & Clients"
                    description="Upgrade to Pro ($19/mo) to download your full workshop data in Excel/CSV format for accounting, tax reporting, and offline backups!"
                />

            </ResponsiveContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0F1117' },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
        height: 56,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#1C2030', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    saveHeaderBtn: {
        backgroundColor: '#FF6B35', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    saveHeaderBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    card: {
        backgroundColor: '#1C2030', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    label: { fontSize: 12, fontWeight: '700', color: '#8B95A8', marginBottom: 6 },
    input: {
        backgroundColor: '#0F1117', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, color: '#FFFFFF',
        fontSize: 14, marginBottom: 14,
    },
    textArea: { height: 60, textAlignVertical: 'top' },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 12, marginTop: 8,
    },
    saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    subInfo: {
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    subPlanLabel: { fontSize: 11, color: '#8B95A8', fontWeight: '600' },
    subPlanValue: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },

    dangerText: { fontSize: 13, color: '#8B95A8', lineHeight: 18, marginBottom: 14 },
    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 12,
    },
    deleteBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#1C2030',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 24,
        width: '100%',
        maxWidth: 440,
        gap: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    modalWarningText: {
        fontSize: 13,
        color: '#8B95A8',
        lineHeight: 19,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 12,
        marginVertical: 4,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#8B95A8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        borderColor: '#FF6B35',
        backgroundColor: '#FF6B35',
    },
    checkboxCheck: {
        width: 8,
        height: 8,
        backgroundColor: '#FFF',
        borderRadius: 1.5,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 11,
        color: '#FFFFFF',
        lineHeight: 15,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    modalCancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelText: {
        color: '#8B95A8',
        fontWeight: '700',
        fontSize: 14,
    },
    modalDeleteBtn: {
        flex: 2,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDeleteText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
});
