import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    Image, ActivityIndicator, Linking, Platform, ScrollView, useWindowDimensions,
    Alert
} from 'react-native';
import { X, Download, FileType2, Tag, Calendar, LayoutGrid, Edit3, Trash2 } from 'lucide-react-native';
import { Design, useDesignLibrary } from '../hooks/useDesignLibrary';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import AdminUploadScreen from '../screens/AdminUploadScreen';

interface Props {
    design: Design;
    visible: boolean;
    onClose: () => void;
    onRefresh?: () => void; // Optional refresh list callback
}

const COLORS = {
    bg: '#0A0C12',
    surface: '#13151F',
    surfaceHover: '#1A1D27',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    textSub: '#8B95A8',
    text: '#F1F5F9',
};

export function AssetDetailsModal({ design, visible, onClose, onRefresh }: Props) {
    const { incrementDownload } = useDesignLibrary();
    const [downloading, setDownloading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const { session } = useAuth();
    const isAdmin = session?.user?.user_metadata?.is_admin === true || session?.user?.user_metadata?.is_admin === 'true';
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    // Parse multi resources
    let driveLink = '';
    let megaLink = '';
    let isMultiLink = false;
    
    const fileVal = design.file_url || '';
    if (fileVal.startsWith('{')) {
        try {
            const parsed = JSON.parse(fileVal);
            driveLink = parsed.drive || '';
            megaLink = parsed.mega || '';
            isMultiLink = !!(driveLink && megaLink);
        } catch {
            driveLink = fileVal;
        }
    } else {
        if (fileVal.includes('mega.nz')) {
            megaLink = fileVal;
        } else {
            driveLink = fileVal;
        }
    }

    const handleDirectDownload = async (url: string) => {
        try {
            setDownloading(true);
            if (Platform.OS === 'web') {
                window.open(url, '_blank');
            } else {
                await Linking.openURL(url);
            }
            await incrementDownload(design.id);
        } catch (err) {
            console.error('Error downloading:', err);
            alert('Failed to open link.');
        } finally {
            setDownloading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to permanently delete this design?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase.from('designs').delete().eq('id', design.id);
                            if (error) throw error;
                            Alert.alert('Success', 'Design deleted successfully!');
                            onClose();
                            if (onRefresh) onRefresh();
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    const handleDownload = async () => {
        const targetUrl = driveLink || megaLink;
        if (!targetUrl) return;

        try {
            setDownloading(true);
            
            // Check if it's an external link (like Google Drive)
            if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                if (Platform.OS === 'web') {
                    window.open(targetUrl, '_blank');
                } else {
                    await Linking.openURL(targetUrl);
                }
                await incrementDownload(design.id);
                return;
            }

            // Get signed URL for the actual file
            const { data, error } = await supabase.storage
                .from('designs')
                .createSignedUrl(targetUrl, 60); // 60 seconds expiry

            if (error) throw error;

            if (data?.signedUrl) {
                // Open URL to download
                if (Platform.OS === 'web') {
                    window.open(data.signedUrl, '_blank');
                } else {
                    await Linking.openURL(data.signedUrl);
                }

                // Increment count
                await incrementDownload(design.id);
            }
        } catch (err) {
            console.error('Error downloading file:', err);
            alert('Failed to download file. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
                
                <View style={[styles.modalContent, isDesktop && styles.modalContentDesktop]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X color={COLORS.textSub} size={24} />
                    </TouchableOpacity>

                    <ScrollView contentContainerStyle={isDesktop ? styles.scrollContentDesktop : styles.scrollContentMobile}>
                        {/* Preview Area */}
                        <View style={[styles.previewArea, isDesktop && { flex: 1.5 }]}>
                            {design.thumbnail_url ? (
                                <Image 
                                    source={{ uri: design.thumbnail_url }} 
                                    style={styles.previewImage} 
                                    resizeMode="contain" 
                                />
                            ) : (
                                <View style={styles.placeholderPreview}>
                                    <FileType2 color={COLORS.textSub} size={64} />
                                    <Text style={styles.placeholderText}>No preview available</Text>
                                </View>
                            )}
                        </View>

                        {/* Details Area */}
                        <View style={[styles.detailsArea, isDesktop && { flex: 1, paddingLeft: 32 }]}>
                            <View style={styles.titleSection}>
                                <Text style={styles.title}>{design.title}</Text>
                                {design.description && (
                                    <Text style={styles.description}>{design.description}</Text>
                                )}
                            </View>

                            <View style={styles.metadataGrid}>
                                <View style={styles.metaItem}>
                                    <FileType2 size={16} color={COLORS.textSub} />
                                    <View style={styles.metaTextContainer}>
                                        <Text style={styles.metaLabel}>File Type</Text>
                                        <Text style={styles.metaValue}>{design.file_type.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={styles.metaItem}>
                                    <LayoutGrid size={16} color={COLORS.textSub} />
                                    <View style={styles.metaTextContainer}>
                                        <Text style={styles.metaLabel}>Category</Text>
                                        <Text style={styles.metaValue}>{design.category || 'Uncategorized'}</Text>
                                    </View>
                                </View>

                                <View style={styles.metaItem}>
                                    <Download size={16} color={COLORS.textSub} />
                                    <View style={styles.metaTextContainer}>
                                        <Text style={styles.metaLabel}>Downloads</Text>
                                        <Text style={styles.metaValue}>{design.downloads_count.toLocaleString()}</Text>
                                    </View>
                                </View>

                                <View style={styles.metaItem}>
                                    <Calendar size={16} color={COLORS.textSub} />
                                    <View style={styles.metaTextContainer}>
                                        <Text style={styles.metaLabel}>Added On</Text>
                                        <Text style={styles.metaValue}>{formatDate(design.created_at)}</Text>
                                    </View>
                                </View>
                            </View>

                            {design.tags && design.tags.length > 0 && (
                                <View style={styles.tagsSection}>
                                    <View style={styles.tagsHeader}>
                                        <Tag size={16} color={COLORS.textSub} />
                                        <Text style={styles.tagsTitle}>Tags</Text>
                                    </View>
                                    <View style={styles.tagsList}>
                                        {design.tags.map((tag, idx) => (
                                            <View key={idx} style={styles.tagBadge}>
                                                <Text style={styles.tagText}>{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View style={styles.actionSection}>
                                {isMultiLink ? (
                                    <View style={{ gap: 12, width: '100%', marginBottom: 12 }}>
                                        {driveLink ? (
                                            <TouchableOpacity 
                                                style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]} 
                                                onPress={() => handleDirectDownload(driveLink)}
                                                disabled={downloading}
                                            >
                                                <Download color="#FFF" size={20} />
                                                <Text style={styles.downloadButtonText}>Download from Google Drive</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                        {megaLink ? (
                                            <TouchableOpacity 
                                                style={[styles.downloadButton, { backgroundColor: '#D9252A' }, downloading && styles.downloadButtonDisabled]} 
                                                onPress={() => handleDirectDownload(megaLink)}
                                                disabled={downloading}
                                            >
                                                <Download color="#FFF" size={20} />
                                                <Text style={styles.downloadButtonText}>Download from Mega</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                ) : (
                                    <TouchableOpacity 
                                        style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]} 
                                        onPress={handleDownload}
                                        disabled={downloading}
                                    >
                                        {downloading ? (
                                            <ActivityIndicator color="#FFF" size="small" />
                                        ) : (
                                            <>
                                                <Download color="#FFF" size={20} />
                                                <Text style={styles.downloadButtonText}>Download {design.file_type.toUpperCase()}</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                                
                                {isAdmin && (
                                    <View style={styles.adminActions}>
                                        <TouchableOpacity 
                                            style={styles.editButton} 
                                            onPress={() => setShowEditModal(true)}
                                        >
                                            <Edit3 color="#00E5FF" size={18} />
                                            <Text style={styles.editButtonText}>Edit Design</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.deleteButton} 
                                            onPress={handleDelete}
                                        >
                                            <Trash2 color="#FF1744" size={18} />
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <Text style={styles.licenseText}>
                                    By downloading this file, you agree to our standard licensing terms.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>

            <Modal 
                visible={showEditModal} 
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <AdminUploadScreen 
                    design={design} 
                    onClose={() => {
                        setShowEditModal(false);
                        onClose();
                        if (onRefresh) onRefresh();
                    }} 
                />
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: '90%',
        maxWidth: 400,
        maxHeight: '90%',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        position: 'relative',
    },
    modalContentDesktop: {
        maxWidth: 1000,
        height: '85%',
    },
    scrollContentMobile: {
        flexDirection: 'column',
    },
    scrollContentDesktop: {
        flexDirection: 'row',
        flex: 1,
        padding: 32,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    previewArea: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#0F1117',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholderPreview: {
        alignItems: 'center',
        gap: 12,
    },
    placeholderText: {
        color: COLORS.textSub,
        fontSize: 14,
    },
    detailsArea: {
        padding: 24,
        paddingBottom: 48,
    },
    titleSection: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: COLORS.textSub,
        lineHeight: 20,
    },
    metadataGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '45%',
        backgroundColor: COLORS.surfaceHover,
        padding: 12,
        borderRadius: 12,
    },
    metaTextContainer: {
        flex: 1,
    },
    metaLabel: {
        fontSize: 11,
        color: COLORS.textSub,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    tagsSection: {
        marginBottom: 32,
    },
    tagsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tagsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    tagText: {
        fontSize: 12,
        color: COLORS.textSub,
    },
    actionSection: {
        marginTop: 'auto',
    },
    downloadButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    downloadButtonDisabled: {
        opacity: 0.7,
    },
    downloadButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    licenseText: {
        fontSize: 11,
        color: COLORS.textSub,
        textAlign: 'center',
    },
    adminActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
        marginBottom: 16,
        width: '100%',
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#00E5FF',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(0,229,255,0.08)',
    },
    editButtonText: {
        color: '#00E5FF',
        fontSize: 14,
        fontWeight: '700',
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#FF1744',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,23,68,0.08)',
    },
    deleteButtonText: {
        color: '#FF1744',
        fontSize: 14,
        fontWeight: '700',
    },
});
