import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, KeyboardAvoidingView,
    Platform, ActivityIndicator, Alert, ScrollView, Image
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../lib/analytics';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react-native';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { EmailConfirmationModal } from '../components/EmailConfirmationModal';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.1)', primary: '#FF6B35',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
    error: '#EF4444', success: '#10B981',
};

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
    const { signIn, signUp, resetPassword } = useAuth();

    const [mode, setMode] = useState<Mode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalEmail, setModalEmail] = useState('');

    const clearErrors = () => { setEmailError(''); setPasswordError(''); };

    const validate = () => {
        clearErrors();
        let valid = true;
        if (!email.includes('@')) { setEmailError('Enter a valid email address.'); valid = false; }
        if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); valid = false; }
        if (mode === 'signup' && password !== confirmPassword) {
            setPasswordError("Passwords don't match.");
            valid = false;
        }
        return valid;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (mode === 'signin') {
                const { error } = await signIn(email, password);
                if (error) setPasswordError(error.message);
                else trackEvent('login', { method: 'email' });
            } else {
                const { data, error } = await signUp(email, password);
                if (error) {
                    setEmailError(error.message);
                } else {
                    trackEvent('signup_completed', { method: 'email' }, `signup_${email}`);
                    setModalEmail(email);
                    setShowConfirmModal(true);
                    setMode('signin');
                    setPassword('');
                    setConfirmPassword('');
                }
            }
        } catch (err: any) {
            setEmailError(err.message || 'An unexpected error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.includes('@')) {
            setEmailError('Enter your email first, then tap Forgot Password.');
            return;
        }
        setLoading(true);
        const { error } = await resetPassword(email);
        setLoading(false);
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Password reset sent', 'Check your email for a reset link.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center' }}>
                        {/* Brand */}
                        <View style={styles.hero}>
                            <Image 
                                source={{ uri: '/logo.png' }} 
                                style={{ width: 200, height: 50, alignSelf: 'center', marginBottom: 8 }} 
                                resizeMode="contain" 
                            />
                            <Text style={styles.tagline}>Laser & CNC project hub</Text>
                        </View>

                        {/* Social Auth */}
                        <SocialAuthButtons onError={(msg) => setPasswordError(msg)} />

                        {successMessage ? (
                            <View style={styles.successBanner}>
                                <Text style={styles.successBannerText}>✅ {successMessage}</Text>
                            </View>
                        ) : null}

                        {/* Tab switcher */}
                        <View style={styles.tabRow}>
                            <TouchableOpacity
                                style={[styles.tabBtn, mode === 'signin' && styles.tabBtnActive]}
                                onPress={() => { setMode('signin'); clearErrors(); }}
                            >
                                <LogIn color={mode === 'signin' ? '#fff' : C.sub} size={16} />
                                <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Sign In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]}
                                onPress={() => { setMode('signup'); clearErrors(); }}
                            >
                                <UserPlus color={mode === 'signup' ? '#fff' : C.sub} size={16} />
                                <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Create Account</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Email */}
                            <Text style={styles.label}>EMAIL</Text>
                            <View style={[styles.inputRow, emailError ? styles.inputError : null]}>
                                <Mail color={C.sub} size={18} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={C.dim}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                                />
                            </View>
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                            {/* Password */}
                            <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
                            <View style={[styles.inputRow, passwordError ? styles.inputError : null]}>
                                <Lock color={C.sub} size={18} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min. 6 characters"
                                    placeholderTextColor={C.dim}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                                    onSubmitEditing={mode === 'signin' ? handleSubmit : undefined}
                                    returnKeyType={mode === 'signin' ? 'done' : 'next'}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    {showPassword ? <EyeOff color={C.sub} size={18} /> : <Eye color={C.sub} size={18} />}
                                </TouchableOpacity>
                            </View>
                            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                            {/* Confirm password (sign up only) */}
                            {mode === 'signup' && (
                                <>
                                    <Text style={[styles.label, { marginTop: 16 }]}>CONFIRM PASSWORD</Text>
                                    <View style={[styles.inputRow, passwordError ? styles.inputError : null]}>
                                        <Lock color={C.sub} size={18} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Repeat password"
                                            placeholderTextColor={C.dim}
                                            secureTextEntry={!showPassword}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            onSubmitEditing={handleSubmit}
                                            returnKeyType="done"
                                        />
                                    </View>
                                </>
                            )}

                            {/* Submit */}
                            <TouchableOpacity
                                style={[styles.submitBtn, loading && styles.submitBtnLoading]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitText}>
                                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Forgot password */}
                            {mode === 'signin' && (
                                <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                                    <Text style={styles.forgotText}>Forgot password?</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.footer}>
                            Your data is securely stored and encrypted via Supabase.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <EmailConfirmationModal
                visible={showConfirmModal}
                email={modalEmail}
                onClose={() => setShowConfirmModal(false)}
                onGoToLogin={() => {
                    setShowConfirmModal(false);
                    setMode('signin');
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
    hero: { alignItems: 'center', marginBottom: 36 },
    heroIcon: { fontSize: 48, marginBottom: 8 },
    brand: { fontSize: 32, fontWeight: '900', color: C.text, letterSpacing: 2 },
    brandSub: { fontSize: 32, fontWeight: '900', color: C.primary, letterSpacing: 2, marginTop: -8 },
    tagline: { fontSize: 14, color: C.sub, marginTop: 8 },
    tabRow: {
        flexDirection: 'row', backgroundColor: C.surface,
        borderRadius: 14, padding: 4, marginBottom: 28,
        borderWidth: 1, borderColor: C.border,
    },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 11 },
    tabBtnActive: { backgroundColor: C.primary },
    tabText: { fontSize: 13, fontWeight: '700', color: C.sub },
    tabTextActive: { color: '#fff' },
    form: { gap: 4 },
    label: { fontSize: 10, fontWeight: '700', color: C.dim, letterSpacing: 1.2, marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, borderRadius: 14,
        borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 52,
    },
    inputError: { borderColor: C.error },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: C.text, fontSize: 15 },
    eyeBtn: { padding: 4 },
    errorText: { fontSize: 12, color: C.error, marginTop: 6, marginLeft: 4 },
    successBanner: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    successBannerText: {
        color: '#10B981',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    submitBtn: {
        backgroundColor: C.primary, borderRadius: 14, height: 54,
        justifyContent: 'center', alignItems: 'center', marginTop: 24,
        shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    submitBtnLoading: { opacity: 0.7 },
    submitText: { fontSize: 16, fontWeight: '800', color: '#fff' },
    forgotBtn: { alignItems: 'center', marginTop: 16 },
    forgotText: { color: C.sub, fontSize: 13, fontWeight: '600' },
    footer: { textAlign: 'center', color: C.dim, fontSize: 11, marginTop: 32, lineHeight: 18 },
});
