import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, Image, ScrollView, Linking, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    LayoutDashboard, LogOut, Calculator, Package, Calendar, Zap, 
    FileText, Grid, Library, HelpCircle, Receipt, Factory, 
    Bot, Sliders, Sparkles, Menu, X, Settings,
    PanelLeftClose, PanelLeftOpen, Monitor
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../context/LanguageContext';
import { useRequireVerification } from '../context/VerificationContext';
import { useSidebar } from '../context/SidebarContext';
import Svg, { Circle, Path } from 'react-native-svg';

const COLORS = {
    bg: '#111317',
    surface: '#1A1D21',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FE7733',
    neonLime: '#B1FA63',
    textSub: '#8B95A8',
    text: '#F1F5F9',
};

const ICONS: Record<string, any> = {
    Dashboard: LayoutDashboard,
    'LaserAI Studio': Sparkles,
    'Cost Calculator': Calculator,
    'Laser Tools': Sliders,
    Materials: Package,
    Orders: Calendar,
    'Production': Factory,
    'Laser Presets': Zap,
    'Quote Generator': FileText,
    'Invoice Generator': Receipt,
    'Design Library': Library,
    'Nesting Estimator': Grid,
    'Laser Expert': Bot,
};

export function ResponsiveTabBar({ state, descriptors, navigation }: any) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { signOut, displayName, avatarUrl, isEmailVerified } = useAuth();
    const { openVerificationModal } = useRequireVerification();
    const { isPro } = useSubscription();
    const { t } = useLanguage();
    const { isCollapsed, isHovered, isOpen, setHovered, toggleSidebar } = useSidebar();
    const [showMobileMore, setShowMobileMore] = useState(false);
    const initials = displayName.includes(' ')
        ? displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : displayName.charAt(0).toUpperCase();

    const isDesktop = width > 768;
    const PRO_TABS = ['Design Library', 'LaserAI Studio', 'Laser Tools', 'Nesting Estimator', 'Invoice Generator'];
    const PRIMARY_MOBILE_TABS = ['Dashboard', 'Design Library', 'Cost Calculator', 'Orders'];
    const DESKTOP_FIRST_TABS = ['LaserAI Studio', 'Laser Tools', 'Nesting Estimator'];

    const routeTitleMap: Record<string, string> = {
        'Dashboard': 'nav_dashboard',
        'LaserAI Studio': 'nav_laser_ai',
        'Cost Calculator': 'nav_calculator',
        'Laser Tools': 'nav_laser_tools',
        'Materials': 'nav_materials',
        'Orders': 'nav_orders',
        'Production': 'nav_production',
        'Laser Presets': 'nav_presets',
        'Quote Generator': 'nav_quotes',
        'Invoice Generator': 'nav_invoices',
        'Design Library': 'nav_designs',
        'Nesting Estimator': 'nav_nesting',
    };

    const getRouteTitle = (name: string) => {
        const key = routeTitleMap[name];
        return key ? t(key) : name;
    };

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
        // DESKTOP RAIL / EXPANDABLE SIDEBAR
        return (
            <View 
                nativeID="zero-machine-sidebar"
                {...({ 
                    id: 'zero-machine-sidebar',
                    dataSet: { pinned: String(!isCollapsed) } 
                } as any)}
                style={[
                    styles.sidebar, 
                    { 
                        paddingTop: Math.max(insets.top, 20),
                    } as any
                ]}
            >
                {/* Brand Header */}
                <View style={styles.brandContainer}>
                    {/* Compact logo button shown when collapsed & not hovered */}
                    <TouchableOpacity
                        onPress={toggleSidebar}
                        style={styles.compactLogoBtn}
                        // @ts-ignore
                        dataSet={{ sidebarShow: 'true' }}
                        accessibilityLabel="Pin sidebar open (Ctrl+B)"
                        activeOpacity={0.7}
                    >
                        <PanelLeftOpen color={COLORS.neonLime} size={20} strokeWidth={2.2} />
                    </TouchableOpacity>

                    {/* Full header shown on hover or when pinned */}
                    <View 
                        // @ts-ignore
                        dataSet={{ sidebarHide: 'true' }}
                        style={styles.fullHeaderRow}
                    >
                        <Image 
                            source={{ uri: '/logo.png' }} 
                            style={{ width: 135, height: 34 }} 
                            resizeMode="contain" 
                        />
                        <TouchableOpacity
                            onPress={toggleSidebar}
                            style={styles.collapseToggleBtn}
                            accessibilityLabel={!isCollapsed ? "Unpin to auto-rail" : "Pin sidebar open"}
                            activeOpacity={0.7}
                        >
                            <PanelLeftClose color={!isCollapsed ? COLORS.neonLime : COLORS.textSub} size={18} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Scrollable nav links */}
                <ScrollView
                    style={styles.sidebarScrollArea}
                    contentContainerStyle={styles.sidebarLinks}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {state.routes.map((route: any, index: number) => {
                        const isFocused = state.index === index;
                        const Icon = ICONS[route.name] || LayoutDashboard;
                        const isProTab = PRO_TABS.includes(route.name);
                        const isWhatsAppTab = route.name === 'Quote Generator' || route.name === 'Invoice Generator';
                        const isProHeader = route.name === 'Design Library';
                        const isWorkshopHeader = route.name === 'Cost Calculator';

                        return (
                            <React.Fragment key={route.key}>
                                {/* Only one mini divider after Dashboard in compact mode */}
                                {route.name === 'Design Library' && (
                                    <View 
                                        // @ts-ignore
                                        dataSet={{ sidebarShow: 'true' }} 
                                        style={styles.miniDivider} 
                                    />
                                )}

                                {/* Section titles visible ONLY when expanded, 0 height when collapsed */}
                                {isProHeader && (
                                    <View 
                                        // @ts-ignore
                                        dataSet={{ sidebarBlockHide: 'true' }} 
                                        style={styles.sectionHeader}
                                    >
                                        <Text style={styles.sectionHeaderText}>PRO TOOLS</Text>
                                    </View>
                                )}
                                {isWorkshopHeader && (
                                    <View 
                                        // @ts-ignore
                                        dataSet={{ sidebarBlockHide: 'true' }} 
                                        style={styles.sectionHeader}
                                    >
                                        <Text style={styles.sectionHeaderText}>WORKSHOP TOOLS</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={() => handlePress(route, isFocused)}
                                    style={[
                                        styles.sidebarLink, 
                                        isFocused && styles.sidebarLinkActive
                                    ]}
                                    activeOpacity={0.7}
                                    {...({ title: getRouteTitle(route.name) } as any)}
                                >
                                    <View style={styles.sidebarLinkIconWrap}>
                                        <Icon 
                                            color={isFocused ? COLORS.neonLime : COLORS.textSub} 
                                            size={20} 
                                            strokeWidth={isFocused ? 2.2 : 1.9} 
                                        />
                                    </View>
                                    <View 
                                        // @ts-ignore
                                        dataSet={{ sidebarHide: 'true' }}
                                        style={styles.sidebarLabelContainer}
                                    >
                                        <Text 
                                            style={[styles.sidebarLabel, isFocused && styles.sidebarLabelActive, { flex: 1 }]}
                                            numberOfLines={1}
                                        >
                                            {getRouteTitle(route.name)}
                                        </Text>
                                        {isWhatsAppTab && (
                                            <View style={{ backgroundColor: 'rgba(37,211,102,0.15)', borderColor: 'rgba(37,211,102,0.35)', borderWidth: 1, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginRight: isProTab ? 4 : 0 }}>
                                                <Text style={{ color: '#25D366', fontSize: 9, fontWeight: '800' }}>WA</Text>
                                            </View>
                                        )}
                                        {isProTab && (
                                            <View style={styles.proBadge}>
                                                <Text style={styles.proBadgeText}>PRO</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </React.Fragment>
                        );
                    })}
                </ScrollView>

                {/* Bottom section */}
                <View style={styles.sidebarBottom}>
                    {/* User profile pill */}
                    <TouchableOpacity 
                        style={styles.userPill}
                        onPress={() => navigation.navigate('Dashboard', { screen: 'Settings' })}
                        activeOpacity={0.8}
                        {...({ title: displayName } as any)}
                    >
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.sidebarAvatar} />
                        ) : (
                            <View style={styles.sidebarAvatarFallback}>
                                <Text style={styles.sidebarAvatarInitial}>{initials}</Text>
                            </View>
                        )}
                        <View 
                            // @ts-ignore
                            dataSet={{ sidebarHide: 'true' }}
                            style={styles.userInfo}
                        >
                            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                            {!isEmailVerified ? (
                                <TouchableOpacity 
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        openVerificationModal('0machine profile');
                                    }}
                                    style={styles.unverifiedTag}
                                >
                                    <Text style={styles.unverifiedTagText}>Verify email</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.userRole}>Pro Member</Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => Linking.openURL('https://0machine.com/privacy')} 
                        style={[styles.sidebarLink, { marginBottom: 4 }]}
                        activeOpacity={0.7}
                        {...({ title: "Privacy & Support" } as any)}
                    >
                        <View style={styles.sidebarLinkIconWrap}>
                            <HelpCircle color={COLORS.textSub} size={20} strokeWidth={1.9} />
                        </View>
                        <View 
                            // @ts-ignore
                            dataSet={{ sidebarHide: 'true' }}
                            style={styles.sidebarLabelContainer}
                        >
                            <Text style={styles.sidebarLabel}>Privacy & Support</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={signOut} 
                        style={styles.sidebarSignOut}
                        {...({ title: "Sign Out" } as any)}
                    >
                        <View style={styles.sidebarLinkIconWrap}>
                            <LogOut color={COLORS.textSub} size={20} strokeWidth={1.9} />
                        </View>
                        <View 
                            // @ts-ignore
                            dataSet={{ sidebarHide: 'true' }}
                            style={styles.sidebarLabelContainer}
                        >
                            <Text style={styles.sidebarLabel}>Sign Out</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // MOBILE BOTTOM BAR
    const activeRoute = state.routes[state.index];
    const isSecondaryActive = !PRIMARY_MOBILE_TABS.includes(activeRoute?.name);
    const primaryRoutes = state.routes.filter((r: any) => PRIMARY_MOBILE_TABS.includes(r.name));

    return (
        <>
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                <View style={styles.bottomBarInner}>
                    {primaryRoutes.map((route: any) => {
                        const isFocused = activeRoute?.name === route.name;
                        const Icon = ICONS[route.name] || LayoutDashboard;
                        const isProTab = PRO_TABS.includes(route.name);

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={() => handlePress(route, isFocused)}
                                style={styles.bottomTab}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconBadgeWrapper}>
                                    <Icon color={isFocused ? COLORS.primary : COLORS.textSub} size={22} strokeWidth={isFocused ? 2.2 : 1.8} />
                                    {isProTab && (
                                        <View style={styles.mobileProBadge}>
                                            <Text style={styles.mobileProBadgeText}>PRO</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.bottomLabel, isFocused && styles.bottomLabelActive]} numberOfLines={1}>
                                    {route.name === 'Design Library' ? 'Vault' : route.name === 'LaserAI Studio' ? 'LaserAI' : route.name === 'Cost Calculator' ? 'Calculator' : getRouteTitle(route.name)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    {/* More Tools Button */}
                    <TouchableOpacity
                        onPress={() => setShowMobileMore(true)}
                        style={styles.bottomTab}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconBadgeWrapper}>
                            <Menu color={isSecondaryActive ? COLORS.primary : COLORS.textSub} size={22} strokeWidth={isSecondaryActive ? 2.2 : 1.8} />
                            {isSecondaryActive && (
                                <View style={styles.activeDot} />
                            )}
                        </View>
                        <Text style={[styles.bottomLabel, isSecondaryActive && styles.bottomLabelActive]} numberOfLines={1}>
                            {isSecondaryActive ? (getRouteTitle(activeRoute?.name) || 'Tool') : 'More'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Mobile "More Tools" Sheet Modal */}
            <Modal
                visible={showMobileMore}
                animationType="slide"
                transparent
                onRequestClose={() => setShowMobileMore(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowMobileMore(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
                    >
                        {/* Drag Handle & Header */}
                        <View style={styles.sheetHandle} />
                        <View style={styles.sheetHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Grid size={18} color={COLORS.primary} strokeWidth={2} />
                                <Text style={styles.sheetTitle}>All Workshop Tools</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowMobileMore(false)}
                                style={styles.sheetCloseBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <X size={18} color={COLORS.textSub} strokeWidth={2} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                            {/* Management Tools Section (Mobile Optimized) */}
                            <Text style={styles.sheetSectionTitle}>WORKSHOP MANAGEMENT (MOBILE OPTIMIZED)</Text>
                            <View style={styles.sheetGrid}>
                                {state.routes
                                    .filter((r: any) => !DESKTOP_FIRST_TABS.includes(r.name) && r.name !== 'Dashboard')
                                    .map((route: any) => {
                                        const isFocused = activeRoute?.name === route.name;
                                        const Icon = ICONS[route.name] || LayoutDashboard;
                                        const isWhatsApp = route.name === 'Quote Generator' || route.name === 'Invoice Generator';

                                        return (
                                            <TouchableOpacity
                                                key={route.key}
                                                style={[styles.sheetCard, isFocused && styles.sheetCardActive]}
                                                onPress={() => {
                                                    setShowMobileMore(false);
                                                    navigation.navigate(route.name);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.sheetIconWrap, { backgroundColor: isFocused ? COLORS.primary + '20' : 'rgba(255,255,255,0.05)' }]}>
                                                    <Icon size={18} color={isFocused ? COLORS.primary : '#FFFFFF'} strokeWidth={1.9} />
                                                </View>
                                                <Text style={[styles.sheetCardLabel, isFocused && { color: COLORS.primary }]} numberOfLines={1}>
                                                    {getRouteTitle(route.name)}
                                                </Text>
                                                {isWhatsApp && (
                                                    <View style={styles.sheetWaBadge}>
                                                        <Text style={styles.sheetWaText}>WA</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                            </View>

                            {/* Desktop First CAD / CAM Section */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8 }}>
                                <Monitor size={13} color={COLORS.neonLime} strokeWidth={2.2} />
                                <Text style={styles.sheetSectionTitle}>DESKTOP CAD & ENGINES (PC RECOMMENDED)</Text>
                            </View>
                            <View style={styles.sheetGrid}>
                                {state.routes
                                    .filter((r: any) => DESKTOP_FIRST_TABS.includes(r.name))
                                    .map((route: any) => {
                                        const isFocused = activeRoute?.name === route.name;
                                        const Icon = ICONS[route.name] || LayoutDashboard;

                                        return (
                                            <TouchableOpacity
                                                key={route.key}
                                                style={[styles.sheetCard, isFocused && styles.sheetCardActive]}
                                                onPress={() => {
                                                    setShowMobileMore(false);
                                                    navigation.navigate(route.name);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.sheetIconWrap, { backgroundColor: isFocused ? COLORS.primary + '20' : 'rgba(255,255,255,0.05)' }]}>
                                                    <Icon size={18} color={isFocused ? COLORS.primary : '#FFFFFF'} strokeWidth={1.9} />
                                                </View>
                                                <Text style={[styles.sheetCardLabel, isFocused && { color: COLORS.primary }]} numberOfLines={1}>
                                                    {getRouteTitle(route.name)}
                                                </Text>
                                                <View style={styles.sheetPcBadge}>
                                                    <Text style={styles.sheetPcText}>PC</Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                            </View>

                            {/* Settings & Account */}
                            <View style={styles.sheetFooter}>
                                <TouchableOpacity
                                    style={styles.sheetFooterBtn}
                                    onPress={() => {
                                        setShowMobileMore(false);
                                        navigation.navigate('Dashboard', { screen: 'Settings' });
                                    }}
                                >
                                    <Settings size={16} color={COLORS.textSub} strokeWidth={1.8} />
                                    <Text style={styles.sheetFooterText}>Settings & Profile</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.sheetFooterBtn}
                                    onPress={() => {
                                        setShowMobileMore(false);
                                        signOut();
                                    }}
                                >
                                    <LogOut size={16} color={COLORS.textSub} strokeWidth={1.8} />
                                    <Text style={styles.sheetFooterText}>Sign Out</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // Desktop
    sidebar: {
        ...Platform.select({
            web: { 
                position: 'fixed' as any,
                transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease',
                overflow: 'hidden',
            },
            default: { position: 'absolute' },
        }),
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: COLORS.surface,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
        paddingHorizontal: 12,
        zIndex: 1000,
    },
    fullHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 2,
    },
    sidebarLabelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
        gap: 8,
    },
    userPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        padding: 4,
        marginBottom: 6,
        minHeight: 40,
    },
    userPillCompact: {
        padding: 0,
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        borderWidth: 0,
        marginBottom: 10,
    },
    sidebarAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.neonLime,
    },
    sidebarAvatarFallback: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(177, 250, 99, 0.15)',
        borderWidth: 2,
        borderColor: COLORS.neonLime,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sidebarAvatarInitial: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.neonLime,
    },
    userInfo: { flex: 1, minWidth: 0 },
    userName: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    userRole: {
        fontSize: 11,
        color: COLORS.neonLime,
        fontWeight: '600',
        marginTop: 1,
    },
    brandContainer: { 
        minHeight: 42,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    brandContainerCompact: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0,
    },
    compactLogoBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(177, 250, 99, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(177, 250, 99, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    collapseToggleBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniDivider: {
        width: 24,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'center',
        marginVertical: 6,
    },
    brandIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    brandLogoText: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.2 },
    brandSub: { fontSize: 10, fontWeight: '700', color: COLORS.textSub, letterSpacing: 1.5 },
    sidebarScrollArea: {
        flex: 1,
    },
    sidebarLinks: {
        gap: 5,
        paddingBottom: 8,
    },
    sidebarBottom: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        paddingTop: 8,
        paddingBottom: 8,
        gap: 4,
    },
    sidebarBottomCompact: {
        alignItems: 'center',
        paddingTop: 10,
    },
    sidebarLink: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        paddingHorizontal: 10,
        borderRadius: 10,
        width: '100%',
    },
    sidebarLinkCompact: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 0,
    },
    sidebarLinkIconWrap: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sidebarLinkActive: {
        backgroundColor: 'rgba(177, 250, 99, 0.12)',
        borderColor: 'rgba(177, 250, 99, 0.35)',
        borderWidth: 1,
    },
    sidebarLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSub,
    },
    sidebarLabelActive: {
        color: COLORS.neonLime,
        fontWeight: '700',
    },
    sidebarSignOut: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 8,
    },
    sidebarSignOutCompact: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 16,
    },

    // Mobile
    bottomBar: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 8,
    },
    bottomBarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 4,
    },
    bottomTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingVertical: 6,
        minHeight: 48,
    },
    bottomLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textSub,
        textAlign: 'center',
    },
    bottomLabelActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    activeDot: {
        position: 'absolute',
        top: -2,
        right: -4,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: '#16191E',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        maxHeight: '82%',
        paddingHorizontal: 16,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 12,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    sheetTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    sheetCloseBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    sheetScroll: {
        marginTop: 14,
    },
    sheetSectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    sheetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sheetCard: {
        width: '48.5%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#1E2228',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        minHeight: 48,
    },
    sheetCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(254,119,51,0.08)',
    },
    sheetIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetCardLabel: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    sheetWaBadge: {
        backgroundColor: 'rgba(37,211,102,0.15)',
        borderColor: 'rgba(37,211,102,0.3)',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 1,
    },
    sheetWaText: {
        color: '#25D366',
        fontSize: 8,
        fontWeight: '900',
    },
    sheetPcBadge: {
        backgroundColor: 'rgba(177, 250, 99, 0.12)',
        borderColor: 'rgba(177, 250, 99, 0.3)',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    sheetPcText: {
        color: '#B1FA63',
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    sheetFooter: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        marginBottom: 10,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    sheetFooterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        minHeight: 46,
    },
    sheetFooterText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSub,
    },
    proBadge: {
        backgroundColor: 'rgba(255,107,53,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.3)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 6,
    },
    proBadgeText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    sectionHeaderText: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    iconBadgeWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mobileProBadge: {
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: '#B1FA63',
        borderRadius: 4,
        paddingHorizontal: 3,
        paddingVertical: 1,
    },
    mobileProBadgeText: {
        color: '#111317',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    unverifiedTag: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 2,
        alignSelf: 'flex-start',
    },
    unverifiedTagText: {
        color: '#EF4444',
        fontSize: 10,
        fontWeight: '700',
    },
});
