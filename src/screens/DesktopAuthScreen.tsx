// DesktopAuthScreen.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, Platform,
    ActivityIndicator, Alert, useWindowDimensions,
    Image, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ShieldCheck, Zap, Layers } from 'lucide-react-native';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.08)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
    error: '#EF4444', success: '#10B981',
};

type Mode = 'signin' | 'signup';

export default function DesktopAuthScreen() {
    const { signIn, signUp, resetPassword } = useAuth();
    const [mode, setMode] = useState<Mode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const { width, height } = useWindowDimensions();

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
            } else {
                const { data, error } = await signUp(email, password);
                if (error) {
                    setEmailError(error.message);
                } else if (!data?.session) {
                    Alert.alert(
                        'Account created! ✅',
                        'Check your email to confirm your account, then sign in.',
                        [{ text: 'OK', onPress: () => setMode('signin') }]
                    );
                }
            }
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

    // Responsive rules for the split screen layout
    // If width gets a little tight (like a small laptop window), we gracefully stack them or hide the side panel.
    const isSmallDesktop = width < 1000;

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <View style={[styles.container, { minHeight: height }]}>
                    
                    {/* LEFT PANEL: Branding & Graphic (Hidden on tight screens) */}
                    {!isSmallDesktop && (
                        <View style={styles.leftPanel}>
                            <View style={styles.leftContent}>
                                <Text style={styles.brandBadge}>✨ 0machine</Text>
                                <Text style={styles.heroTitle}>Master your fabrication workflows.</Text>
                                <Text style={styles.heroSub}>
                                    The all-in-one planning toolkit specifically engineered for makers, laser-cutting professionals, and CNC shops.
                                </Text>
                                
                                <View style={styles.features}>
                                    <View style={styles.featureItem}>
                                        <Zap color={C.primary} size={20} />
                                        <Text style={styles.featureText}>Instant cost estimations via live material parsing</Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <Layers color={C.primary} size={20} />
                                        <Text style={styles.featureText}>Client matching, machine templates, and time logs</Text>
                                    </View>
                                    <View style={styles.featureItem}>
                                        <ShieldCheck color={C.primary} size={20} />
                                        <Text style={styles.featureText}>Fully encrypted and cloud-synced automatically</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Decorative geometric/acrylic aesthetic shapes */}
                            <View style={styles.decoCircle} />
                            <View style={styles.decoSquare} />
                        </View>
                    )}

                    {/* RIGHT PANEL: Auth Form */}
                    <ScrollView 
                        contentContainerStyle={[styles.rightPanel, isSmallDesktop && { width: '100%' }]} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={[styles.formWrapper, isSmallDesktop && { paddingHorizontal: 40 }]}>
                            {/* Mobile/Tablet Fallback Logo when Left Panel is hidden */}
                            {isSmallDesktop && (
                                <View style={styles.mobileBrand}>
                                    <Text style={styles.mobileBrandIcon}>⚡</Text>
                                    <Text style={styles.mobileBrandText}>0machine <Text style={styles.mobileBrandAccent}>Planner</Text></Text>
                                </View>
                            )}

                            <View style={styles.headerArea}>
                                <Text style={styles.formTitle}>
                                    {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                                </Text>
                                <Text style={styles.formSub}>
                                    {mode === 'signin' 
                                        ? 'Enter your details to access your workspace.' 
                                        : 'Start organizing your laser cut projects today.'}
                                </Text>
                            </View>

                            <View style={styles.tabRow}>
                                <TouchableOpacity style={[styles.tabBtn, mode === 'signin' && styles.tabBtnActive]} onPress={() => { setMode('signin'); clearErrors(); }}>
                                    <LogIn color={mode === 'signin' ? '#fff' : C.sub} size={16} />
                                    <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>Sign In</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.tabBtn, mode === 'signup' && styles.tabBtnActive]} onPress={() => { setMode('signup'); clearErrors(); }}>
                                    <UserPlus color={mode === 'signup' ? '#fff' : C.sub} size={16} />
                                    <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.form}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <View style={[styles.inputContainer, emailError && styles.inputError]}>
                                    <Mail color={C.sub} size={18} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="you@example.com"
                                        placeholderTextColor={C.dim}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={t => { setEmail(t); setEmailError(''); }}
                                    />
                                </View>
                                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                                <Text style={[styles.label, { marginTop: 20 }]}>PASSWORD</Text>
                                <View style={[styles.inputContainer, passwordError && styles.inputError]}>
                                    <Lock color={C.sub} size={18} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Min. 6 characters"
                                        placeholderTextColor={C.dim}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={t => { setPassword(t); setPasswordError(''); }}
                                        onSubmitEditing={mode === 'signin' ? handleSubmit : undefined}
                                        returnKeyType={mode === 'signin' ? 'done' : 'next'}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                        {showPassword ? <EyeOff color={C.sub} size={18} /> : <Eye color={C.sub} size={18} />}
                                    </TouchableOpacity>
                                </View>

                                {mode === 'signup' && (
                                    <>
                                        <Text style={[styles.label, { marginTop: 20 }]}>CONFIRM PASSWORD</Text>
                                        <View style={[styles.inputContainer, passwordError && styles.inputError]}>
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
                                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                                {mode === 'signin' && (
                                    <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                                        <Text style={styles.forgotText}>Forgot password?</Text>
                                    </TouchableOpacity>
                                )}

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
                            </View>

                        </View>
                        <Text style={styles.footerText}>Secured by Supabase Authentication</Text>
                    </ScrollView>

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    flex: { flex: 1 },
    container: { flex: 1, flexDirection: 'row' },
    
    /* LEFT PANEL */
    leftPanel: {
        flex: 1.1,
        backgroundColor: '#151824',
        padding: 60,
        position: 'relative',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRightWidth: 1,
        borderRightColor: C.border,
    },
    leftContent: {
        maxWidth: 500,
        zIndex: 10,
    },
    brandBadge: {
        color: C.primary,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 24,
        textTransform: 'uppercase'
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: C.text,
        lineHeight: 56,
        marginBottom: 20,
    },
    heroSub: {
        fontSize: 18,
        color: C.sub,
        lineHeight: 28,
        marginBottom: 40,
        maxWidth: '90%',
    },
    features: {
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 15,
        color: '#D1D5DB',
        fontWeight: '500',
    },
    decoCircle: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: C.primary,
        opacity: 0.03,
    },
    decoSquare: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 300,
        height: 300,
        transform: [{ rotate: '45deg' }],
        backgroundColor: C.blue,
        opacity: 0.03,
    },

    /* RIGHT PANEL */
    rightPanel: {
        flex: 1,
        minWidth: 400,
        backgroundColor: C.bg,
        justifyContent: 'center',
        paddingVertical: 60,
    },
    formWrapper: {
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 60,
    },
    mobileBrand: { alignItems: 'center', marginBottom: 30 },
    mobileBrandIcon: { fontSize: 48, marginBottom: 8 },
    mobileBrandText: { fontSize: 26, fontWeight: '900', color: C.text },
    mobileBrandAccent: { color: C.primary },
    headerArea: {
        marginBottom: 32,
    },
    formTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: C.text,
        marginBottom: 8,
    },
    formSub: {
        fontSize: 15,
        color: C.sub,
        lineHeight: 22,
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 5,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: C.border,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    tabBtnActive: {
        backgroundColor: C.primary,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.sub,
    },
    tabTextActive: {
        color: '#fff',
    },
    form: {
        gap: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: C.dim,
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 16,
        height: 54,
    },
    inputError: {
        borderColor: C.error,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: C.text,
        fontSize: 15,
    },
    eyeBtn: {
        padding: 4,
    },
    errorText: {
        fontSize: 12,
        color: C.error,
        marginTop: 6,
        marginLeft: 4,
    },
    forgotBtn: {
        alignSelf: 'flex-start',
        marginTop: 16,
    },
    forgotText: {
        color: C.sub,
        fontSize: 13,
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: C.primary,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    submitBtnLoading: {
        opacity: 0.7,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    footerText: {
        textAlign: 'center',
        color: C.dim,
        marginTop: 40,
        fontSize: 12,
    }
});
