import React from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ActivityIndicator, Platform, TouchableWithoutFeedback
} from 'react-native';
import { Trash2, AlertTriangle, X } from 'lucide-react-native';

export interface ConfirmDeleteModalProps {
    visible: boolean;
    title?: string;
    itemName?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    loading?: boolean;
    icon?: 'trash' | 'warning';
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export function ConfirmDeleteModal({
    visible,
    title = 'Delete Item',
    itemName,
    message = 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    isDestructive = true,
    loading = false,
    icon = 'trash',
    onConfirm,
    onCancel,
}: ConfirmDeleteModalProps) {
    if (!visible) return null;

    const accentColor = isDestructive ? '#EF4444' : '#FE7733';
    const accentBg = isDestructive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(254, 119, 51, 0.15)';
    const accentBorder = isDestructive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(254, 119, 51, 0.3)';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={loading ? undefined : onCancel}
        >
            <TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalCard}>
                            {/* Close Button */}
                            {!loading && (
                                <TouchableOpacity
                                    onPress={onCancel}
                                    style={styles.closeBtn}
                                    activeOpacity={0.7}
                                    accessibilityLabel="Close modal"
                                >
                                    <X size={18} color="#8B95A8" />
                                </TouchableOpacity>
                            )}

                            {/* Warning / Trash Icon */}
                            <View style={[styles.iconWrap, { backgroundColor: accentBg, borderColor: accentBorder }]}>
                                {icon === 'trash' ? (
                                    <Trash2 size={24} color={accentColor} />
                                ) : (
                                    <AlertTriangle size={24} color={accentColor} />
                                )}
                            </View>

                            {/* Title & Name */}
                            <Text style={styles.title}>{title}</Text>
                            {itemName ? (
                                <View style={styles.itemNameBadge}>
                                    <Text style={styles.itemNameText} numberOfLines={2}>
                                        "{itemName}"
                                    </Text>
                                </View>
                            ) : null}

                            {/* Message */}
                            <Text style={styles.message}>{message}</Text>

                            {/* Action Buttons */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={onCancel}
                                    disabled={loading}
                                    activeOpacity={0.75}
                                >
                                    <Text style={styles.cancelBtnText}>{cancelText}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.confirmBtn,
                                        { backgroundColor: accentColor },
                                        loading && styles.confirmBtnDisabled,
                                    ]}
                                    onPress={onConfirm}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <View style={styles.confirmBtnContent}>
                                            {isDestructive && icon === 'trash' && (
                                                <Trash2 size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                                            )}
                                            <Text style={styles.confirmBtnText}>{confirmText}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        position: Platform.OS === 'web' ? ('fixed' as any) : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(10, 12, 18, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#1A1D21',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 24,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.55,
        shadowRadius: 30,
        elevation: 16,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 6,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#F1F5F9',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    itemNameBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 10,
        maxWidth: '90%',
    },
    itemNameText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FE7733',
        textAlign: 'center',
    },
    message: {
        fontSize: 13,
        lineHeight: 19,
        color: '#8B95A8',
        textAlign: 'center',
        marginBottom: 24,
        maxWidth: 340,
    },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#23262C',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B95A8',
    },
    confirmBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    confirmBtnDisabled: {
        opacity: 0.6,
    },
    confirmBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
