import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, FolderOpen, BarChart2, LogOut } from 'lucide-react-native';
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
    Projects: FolderOpen,
    Stats: BarChart2,
};

export function ResponsiveTabBar({ state, descriptors, navigation }: any) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { signOut } = useAuth();

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
                <View style={styles.brandContainer}>
                    <Text style={styles.brandLogo}>⚡ <Text style={styles.brandAccent}>0</Text>machine</Text>
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
    brandContainer: {
        marginBottom: 40,
        paddingHorizontal: 12,
    },
    brandLogo: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.text,
        letterSpacing: 1,
    },
    brandAccent: {
        color: COLORS.primary,
    },
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
