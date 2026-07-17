import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    Image, ActivityIndicator, Linking, Platform, ScrollView, useWindowDimensions 
} from 'react-native';
import { X, Download, FileType2, Tag, Calendar, LayoutGrid } from 'lucide-react-native';
import { Design, useDesignLibrary } from '../hooks/useDesignLibrary';
import { supabase } from '../lib/supabase';

interface Props {
    design: Design;
    visible: boolean;
    onClose: () => void;
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

export function AssetDetailsModal({ design, visible, onClose }: Props) {
    const { incrementDownload } = useDesignLibrary();
    const [downloading, setDownloading] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const handleDownload = async () => {
        try {
            setDownloading(true);
            
            // Check if it's an external link (like Google Drive)
            if (design.file_url.startsWith('http://') || design.file_url.startsWith('https://')) {
                if (Platform.OS === 'web') {
                    window.open(design.file_url, '_blank');
                } else {
                    await Linking.openURL(design.file_url);
                }
                await incrementDownload(design.id);
                return;
            }

            // Get signed URL for the actual file
            const { data, error } = await supabase.storage
                .from('designs')
                .createSignedUrl(design.file_url, 60); // 60 seconds expiry

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
                                <Text style={styles.licenseText}>
                                    By downloading this file, you agree to our standard licensing terms.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
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
});
