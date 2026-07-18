import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    ScrollView, TextInput, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { ArrowLeft, User, CreditCard, Landmark, Trash2, Save, ExternalLink } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';

const C = {
    bg: '#0F1117',
    surface: '#1C2030',
    surface2: '#242840',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    primaryGlow: 'rgba(255,107,53,0.15)',
    gold: '#F59E0B',
    text: '#FFFFFF',
    sub: '#8B95A8',
    dim: '#4B5568',
    danger: '#EF4444',
    dangerGlow: 'rgba(239,68,68,0.12)',
};

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { user, displayName, signOut } = useAuth();
    const { subscription, isPro, hasActiveTrial, daysLeftInTrial } = useSubscription();

    // Account ID derived from User ID
    const accountId = user?.id ? `ACC-${user.id.substring(0, 8).toUpperCase()}` : 'N/A';

    // Business Profile Fields
    const [bizName, setBizName] = useState('');
    const [bizEmail, setBizEmail] = useState('');
    const [bizPhone, setBizPhone] = useState('');
    const [bizAddress, setBizAddress] = useState('');
    const [bizTaxId, setBizTaxId] = useState('');
    const [bizBank, setBizBank] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBusinessSettings();
    }, [user]);

    const fetchBusinessSettings = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('business_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setBizName(data.name || '');
                setBizEmail(data.email || '');
                setBizPhone(data.phone || '');
                setBizAddress(data.address || '');
                setBizTaxId(data.tax_id || '');
                setBizBank(data.bank_details || '');
            }
        } catch (err: any) {
            console.error('Error fetching business info:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveBusinessSettings = async () => {
        if (!user) return;
        try {
            setSaving(true);
            const payload = {
                user_id: user.id,
                name: bizName.trim(),
                email: bizEmail.trim(),
                phone: bizPhone.trim(),
                address: bizAddress.trim(),
                tax_id: bizTaxId.trim(),
                bank_details: bizBank.trim(),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('business_settings')
                .upsert(payload, { onConflict: 'user_id' });

            if (error) throw error;
            Alert.alert('Success', 'Business settings saved successfully!');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This will erase all your projects, materials, client logs, invoices, and settings. This action is irreversible.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user) return;
                        try {
                            setLoading(true);
                            // Delete from all database tables
                            await supabase.from('projects').delete().eq('user_id', user.id);
                            await supabase.from('materials').delete().eq('user_id', user.id);
                            await supabase.from('clients').delete().eq('user_id', user.id);
                            await supabase.from('machine_profiles').delete().eq('user_id', user.id);
                            await supabase.from('business_settings').delete().eq('user_id', user.id);
                            await supabase.from('user_settings').delete().eq('user_id', user.id);
                            
                            // Log out
                            await signOut();
                            Alert.alert('Account Deleted', 'Your profile and data have been removed.');
                        } catch (err: any) {
                            Alert.alert('Deletion Failed', err.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleManageSubscription = () => {
        // Stripe Customer Portal link
        const acctId = 'acct_1DrskaGNkz6GTxuM';
        const portalUrl = `https://billing.stripe.com/p/login/${acctId}`;
        Linking.openURL(portalUrl).catch(() => {
            Alert.alert('Error', 'Could not open subscription portal link.');
        });
    };

    const getPlanName = () => {
        if (subscription.priceId === 'price_1TuaQPGNkz6GTxuMEEjO6kny') return 'Pro Workshop';
        if (subscription.priceId === 'price_1TuaQVGNkz6GTxuMi59lGKB5') return 'Industrial';
        if (subscription.status === 'active') return 'Pro Member';
        if (hasActiveTrial) return `Free Trial (${daysLeftInTrial} days left)`;
        return 'Free Plan';
    };

    const getPlanPrice = () => {
        if (subscription.priceId === 'price_1TuaQPGNkz6GTxuMEEjO6kny') return '$19/mo';
        if (subscription.priceId === 'price_1TuaQVGNkz6GTxuMi59lGKB5') return '$69/mo';
        if (subscription.status === 'active') return '$9/mo';
        return '$0';
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color={C.text} size={20} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color={C.primary} size="large" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {/* Profile Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <User color={C.primary} size={20} />
                                <Text style={styles.cardTitle}>User Profile</Text>
                            </View>
                            <View style={styles.profileRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileName}>{displayName}</Text>
                                    <Text style={styles.profileEmail}>{user?.email}</Text>
                                    <Text style={styles.accountIdText}>Account ID: {accountId}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Subscription Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <CreditCard color={C.gold} size={20} />
                                <Text style={styles.cardTitle}>Subscription Details</Text>
                            </View>
                            <View style={styles.subInfo}>
                                <View>
                                    <Text style={styles.subPlanLabel}>Active Plan</Text>
                                    <Text style={styles.subPlanValue}>{getPlanName()}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.subPlanLabel}>Price</Text>
                                    <Text style={styles.subPlanValue}>{getPlanPrice()}</Text>
                                </View>
                            </View>

                            <View style={styles.subActions}>
                                <TouchableOpacity 
                                    style={styles.upgradeBtn} 
                                    onPress={() => navigation.navigate('Paywall')}
                                >
                                    <Text style={styles.upgradeBtnText}>Upgrade / Change Plan</Text>
                                </TouchableOpacity>

                                {subscription.status === 'active' && (
                                    <TouchableOpacity 
                                        style={styles.cancelBtn} 
                                        onPress={handleManageSubscription}
                                    >
                                        <Text style={styles.cancelBtnText}>Manage / Cancel Subscription</Text>
                                        <ExternalLink color={C.sub} size={14} style={{ marginLeft: 6 }} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Business Info Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Landmark color="#10B981" size={20} />
                                <Text style={styles.cardTitle}>Business Profile (for PDF Invoices)</Text>
                            </View>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Business Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bizName}
                                    onChangeText={setBizName}
                                    placeholder="Enter your workshop or business name"
                                    placeholderTextColor={C.dim}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Business Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bizEmail}
                                    onChangeText={setBizEmail}
                                    placeholder="invoices@yourbusiness.com"
                                    placeholderTextColor={C.dim}
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bizPhone}
                                    onChangeText={setBizPhone}
                                    placeholder="+1 (555) 019-2834"
                                    placeholderTextColor={C.dim}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Billing Address</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={bizAddress}
                                    onChangeText={setBizAddress}
                                    placeholder="Street address, City, State, ZIP"
                                    placeholderTextColor={C.dim}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Tax ID / VAT Registration</Text>
                                <TextInput
                                    style={styles.input}
                                    value={bizTaxId}
                                    onChangeText={setBizTaxId}
                                    placeholder="US-12345678 or VAT-987654"
                                    placeholderTextColor={C.dim}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Bank details (optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={bizBank}
                                    onChangeText={setBizBank}
                                    placeholder="Bank Name, Routing #, Account #"
                                    placeholderTextColor={C.dim}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.saveBtn} 
                                onPress={saveBusinessSettings}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Save color="#FFF" size={16} style={{ marginRight: 6 }} />
                                        <Text style={styles.saveBtnText}>Save Business Profile</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Danger Zone */}
                        <View style={[styles.card, { borderColor: C.danger + '30' }]}>
                            <View style={styles.cardHeader}>
                                <Trash2 color={C.danger} size={20} />
                                <Text style={[styles.cardTitle, { color: C.danger }]}>Danger Zone</Text>
                            </View>
                            <Text style={styles.dangerText}>
                                Deleting your account will permanently wipe all your data from our database. There is no way to recover your settings or projects once done.
                            </Text>
                            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                                <Trash2 color="#FFF" size={16} style={{ marginRight: 6 }} />
                                <Text style={styles.deleteBtnText}>Delete My Account</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border,
        height: 56,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: C.border,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },
    card: {
        backgroundColor: C.surface, borderRadius: 16,
        borderWidth: 1, borderColor: C.border, padding: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: C.primary + '20', borderWidth: 2, borderColor: C.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 22, fontWeight: '800', color: C.primary },
    profileName: { fontSize: 18, fontWeight: '800', color: C.text },
    profileEmail: { fontSize: 13, color: C.sub, marginTop: 2 },
    accountIdText: { fontSize: 11, color: C.dim, marginTop: 4, letterSpacing: 0.5 },
    
    // Subscription
    subInfo: { 
        flexDirection: 'row', justifyContent: 'space-between', 
        backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12,
        borderWidth: 1, borderColor: C.border,
    },
    subPlanLabel: { fontSize: 11, color: C.sub, fontWeight: '600' },
    subPlanValue: { fontSize: 15, fontWeight: '800', color: C.text, marginTop: 4 },
    subActions: { marginTop: 14, gap: 10 },
    upgradeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12,
    },
    upgradeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    cancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 12,
        borderWidth: 1, borderColor: C.border,
    },
    cancelBtnText: { color: C.sub, fontWeight: '600', fontSize: 13 },

    // Inputs
    inputGroup: { marginBottom: 12 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: C.sub, marginBottom: 6 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: C.border,
        borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, color: C.text,
        fontSize: 14,
    },
    textArea: { height: 60, textAlignVertical: 'top' },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 12, marginTop: 8,
    },
    saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    // Danger
    dangerText: { fontSize: 13, color: C.sub, lineHeight: 18, marginBottom: 14 },
    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.danger, borderRadius: 12, paddingVertical: 12,
    },
    deleteBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
