import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView, useWindowDimensions } from 'react-native';
import { X, Zap, Lock, Sparkles, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface ProUpgradeModalProps {
    visible: boolean;
    onClose: () => void;
    featureName: string;
    actionTitle: string;
    description: string;
}

const C = {
    bg: '#0A0C12',
    surface: '#13151F',
    surface2: '#1C2030',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    textSub: '#8B95A8',
    text: '#F1F5F9',
    gold: '#F59E0B',
};

export function ProUpgradeModal({
    visible,
    onClose,
    featureName,
    actionTitle,
    description,
}: ProUpgradeModalProps) {
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const handleUpgradePress = () => {
        onClose();
        navigation.navigate('Paywall');
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                
                <View style={[styles.modalCard, isDesktop && styles.modalCardDesktop]}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X color={C.textSub} size={20} />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        {/* Top Badge Icon */}
                        <View style={styles.iconWrap}>
                            <Zap color={C.primary} size={32} fill={C.primary} />
                            <View style={styles.lockBadge}>
                                <Lock color="#FFF" size={12} />
                            </View>
                        </View>

                        <Text style={styles.badgeText}>PRO FEATURE</Text>
                        <Text style={styles.title}>{actionTitle} 🔒 PRO</Text>
                        <Text style={styles.subText}>{description}</Text>

                        {/* Preserved Data Notice */}
                        <View style={styles.preservedNote}>
                            <Sparkles color={C.gold} size={14} />
                            <Text style={styles.preservedNoteText}>
                                Your work and form entries are saved intact. Upgrade to complete this action.
                            </Text>
                        </View>

                        {/* Price Card */}
                        <View style={styles.priceCard}>
                            <View style={styles.priceHeader}>
                                <Text style={styles.planName}>Pro Workshop</Text>
                                <Text style={styles.priceAmount}>$19<Text style={styles.pricePeriod}>/month</Text></Text>
                            </View>
                            
                            <View style={styles.benefitsList}>
                                <View style={styles.benefitItem}>
                                    <Check color={C.primary} size={14} />
                                    <Text style={styles.benefitText}>Design Library (500+ vector files)</Text>
                                </View>
                                <View style={styles.benefitItem}>
                                    <Check color={C.primary} size={14} />
                                    <Text style={styles.benefitText}>Nesting Tool (layout optimization)</Text>
                                </View>
                                <View style={styles.benefitItem}>
                                    <Check color={C.primary} size={14} />
                                    <Text style={styles.benefitText}>Invoice Generator (custom PDF exports)</Text>
                                </View>
                            </View>
                        </View>

                        {/* CTA Upgrade Button */}
                        <TouchableOpacity
                            style={styles.upgradeBtn}
                            onPress={handleUpgradePress}
                            activeOpacity={0.8}
                        >
                            <Zap color="#FFF" size={18} fill="#FFF" />
                            <Text style={styles.upgradeBtnText}>Upgrade to Pro ($19/mo)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
                            <Text style={styles.secondaryBtnText}>Keep Editing & Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: C.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
        position: 'relative',
    },
    modalCardDesktop: {
        maxWidth: 520,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    content: {
        padding: 28,
        alignItems: 'center',
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: 'rgba(255,107,53,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    lockBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: C.surface,
    },
    badgeText: {
        color: C.primary,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: C.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subText: {
        fontSize: 14,
        color: C.textSub,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    preservedNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.2)',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginBottom: 20,
    },
    preservedNoteText: {
        color: C.gold,
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    priceCard: {
        width: '100%',
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    priceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingBottom: 10,
    },
    planName: {
        fontSize: 15,
        fontWeight: '700',
        color: C.text,
    },
    priceAmount: {
        fontSize: 22,
        fontWeight: '900',
        color: C.primary,
    },
    pricePeriod: {
        fontSize: 13,
        color: C.textSub,
        fontWeight: '500',
    },
    benefitsList: {
        gap: 6,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    benefitText: {
        fontSize: 12,
        color: C.textSub,
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: C.primary,
        borderRadius: 14,
        paddingVertical: 14,
        width: '100%',
        marginBottom: 10,
    },
    upgradeBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 8,
    },
    secondaryBtnText: {
        color: C.textSub,
        fontSize: 13,
        fontWeight: '600',
    },
});
