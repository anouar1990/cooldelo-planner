import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, LogOut, Calculator, Package, Calendar, Zap, FileText, Grid } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

const COLORS = {
    bg: '#0A0C12',
    surface: '#13151F',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    textSub: '#8B95A8',
    text: '#F1F5F9',
};

const ICONS: Record<string, any> = {
    Dashboard: LayoutDashboard,
    'Cost Calculator': Calculator,
    Materials: Package,
    Orders: Calendar,
    'Laser Presets': Zap,
    'Quote Generator': FileText,
    'Nesting Estimator': Grid,
};

export function ResponsiveTabBar({ state, descriptors, navigation }: any) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { signOut, displayName, avatarUrl } = useAuth();
    const initials = displayName.charAt(0).toUpperCase();

    const isDesktop = width > 768;

    const handlePress = (route: any, isFocused: boolean) => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
        }
    };

    if (isDesktop) {
        // DESKTOP SIDEBAR
        return (
            <View style={[styles.sidebar, { paddingTop: Math.max(insets.top, 24) }]}>
                {/* Brand Logo */}
                <View style={styles.brandContainer}>
                    <View style={styles.brandIconWrap}>
                        <Zap color="#FFFFFF" size={18} fill="#FFFFFF" />
                    </View>
                    <View>
                        <Text style={styles.brandLogoText}>0machine</Text>
                        <Text style={styles.brandSub}>PLANNER</Text>
                    </View>
                </View>
                <View style={styles.sidebarLinks}>
                    {state.routes.map((route: any, index: number) => {
                        const isFocused = state.index === index;
                        const Icon = ICONS[route.name] || LayoutDashboard;

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={() => handlePress(route, isFocused)}
                                style={[styles.sidebarLink, isFocused && styles.sidebarLinkActive]}
                                activeOpacity={0.7}
                            >
                                <Icon color={isFocused ? COLORS.primary : COLORS.textSub} size={22} />
                                <Text style={[styles.sidebarLabel, isFocused && styles.sidebarLabelActive]}>
                                    {route.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* User profile pill */}
                <View style={styles.userPill}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.sidebarAvatar} />
                    ) : (
                        <View style={styles.sidebarAvatarFallback}>
                            <Text style={styles.sidebarAvatarInitial}>{initials}</Text>
                        </View>
                    )}
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                        <Text style={styles.userRole}>Pro Member</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={signOut} style={styles.sidebarSignOut}>
                    <LogOut color={COLORS.textSub} size={22} />
                    <Text style={styles.sidebarLabel}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // MOBILE BOTTOM BAR
    return (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.bottomBarInner}>
                {state.routes.map((route: any, index: number) => {
                    const isFocused = state.index === index;
                    const Icon = ICONS[route.name] || LayoutDashboard;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => handlePress(route, isFocused)}
                            style={styles.bottomTab}
                            activeOpacity={0.7}
                        >
                            <Icon color={isFocused ? COLORS.primary : COLORS.textSub} size={24} />
                            <Text style={[styles.bottomLabel, isFocused && styles.bottomLabelActive]}>
                                {route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Desktop
    sidebar: {
        ...Platform.select({
            web: { position: 'fixed' as any },
            default: { position: 'absolute' },
        }),
        top: 0,
        bottom: 0,
        left: 0,
        width: 260,
        backgroundColor: COLORS.surface,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        paddingHorizontal: 20,
        zIndex: 100,
    },
    userPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 10,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sidebarAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    sidebarAvatarFallback: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '25',
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sidebarAvatarInitial: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
    },
    userInfo: { flex: 1, minWidth: 0 },
    userName: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    userRole: {
        fontSize: 11,
        color: COLORS.textSub,
        marginTop: 1,
    },
    brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 32 },
    brandIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    brandLogoText: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 },
    brandSub: { fontSize: 10, fontWeight: '700', color: COLORS.textSub, letterSpacing: 1.5 },
    sidebarLinks: {
        flex: 1,
        gap: 8,
    },
    sidebarLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    sidebarLinkActive: {
        backgroundColor: 'rgba(255,107,53,0.1)',
    },
    sidebarLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSub,
    },
    sidebarLabelActive: {
        color: COLORS.primary,
    },
    sidebarSignOut: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 24,
    },

    // Mobile
    bottomBar: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
    },
    bottomBarInner: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    bottomTab: {
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
    },
    bottomLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textSub,
    },
    bottomLabelActive: {
        color: COLORS.primary,
    },
});
