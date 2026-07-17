import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UploadCloud, CheckCircle, AlertCircle, Link, FolderPlus, X, Edit3 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { supabase } from '../lib/supabase';

const COLORS = {
    bg: '#0A0C12',
    surface: '#13151F',
    border: 'rgba(255,255,255,0.08)',
    primary: '#FF6B35',
    textSub: '#8B95A8',
    text: '#F1F5F9',
    success: '#10B981',
    error: '#EF4444',
};

interface AdminUploadScreenProps {
    onClose?: () => void;
    design?: any; // Passed when editing
}

export default function AdminUploadScreen({ onClose, design }: AdminUploadScreenProps) {
    const [activeTab, setActiveTab] = useState<'link' | 'zip'>('link');
    const isEditing = !!design;
    
    // Common fields
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    
    // Link fields
    const [title, setTitle] = useState('');
    const [driveUrl, setDriveUrl] = useState('');
    const [megaUrl, setMegaUrl] = useState('');
    const [fileType, setFileType] = useState('zip');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    
    // Zip Upload state
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [logs, setLogs] = useState<{type: 'success'|'error', msg: string}[]>([]);

    useEffect(() => {
        if (design) {
            setTitle(design.title || '');
            setCategory(design.category || '');
            setTags(design.tags ? design.tags.join(', ') : '');
            setFileType(design.file_type || 'zip');
            setThumbnailUrl(design.thumbnail_url || '');
            
            const fileVal = design.file_url || '';
            if (fileVal.startsWith('{')) {
                try {
                    const parsed = JSON.parse(fileVal);
                    setDriveUrl(parsed.drive || '');
                    setMegaUrl(parsed.mega || '');
                } catch {
                    setDriveUrl(fileVal);
                }
            } else {
                if (fileVal.includes('mega.nz')) {
                    setMegaUrl(fileVal);
                } else {
                    setDriveUrl(fileVal);
                }
            }
        }
    }, [design]);

    const addLog = (type: 'success'|'error', msg: string) => {
        setLogs(prev => [...prev, { type, msg }]);
    };

    const handleSaveDesign = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please fill f the Design Title.');
            return;
        }
        if (!driveUrl.trim() && !megaUrl.trim()) {
            Alert.alert('Error', 'Please enter at least one download link (Google Drive or Mega).');
            return;
        }

        try {
            setUploading(true);
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            
            // Build the file url value
            let finalFileUrl = '';
            if (driveUrl.trim() && megaUrl.trim()) {
                finalFileUrl = JSON.stringify({
                    drive: driveUrl.trim(),
                    mega: megaUrl.trim()
                });
            } else {
                finalFileUrl = driveUrl.trim() || megaUrl.trim();
            }

            const designPayload = {
                title: title.trim(),
                category: category.trim() || 'Uncategorized',
                tags: tagsArray,
                file_url: finalFileUrl,
                file_type: fileType.toLowerCase(),
                thumbnail_url: thumbnailUrl.trim() || null,
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('designs')
                    .update(designPayload)
                    .eq('id', design.id);

                if (error) throw error;
                Alert.alert('Success', 'Design updated successfully!');
            } else {
                const { error } = await supabase
                    .from('designs')
                    .insert(designPayload);

                if (error) throw error;
                Alert.alert('Success', 'Design added successfully!');
                
                // Clear fields
                setTitle('');
                setDriveUrl('');
                setMegaUrl('');
                setThumbnailUrl('');
            }

            if (onClose) onClose();
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'Failed to save design');
        } finally {
            setUploading(false);
        }
    };

    const handleUploadZip = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/zip',
                copyToCacheDirectory: false,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            setUploading(true);
            setLogs([]);
            setProgress(0);
            
            const file = result.assets[0];
            setStatusText(`Reading ZIP: ${file.name}`);

            let zipData: ArrayBuffer;

            if (Platform.OS === 'web') {
                const webFile = file.file as File;
                zipData = await webFile.arrayBuffer();
            } else {
                throw new Error("Bulk ZIP upload is currently only supported on the Web Admin panel.");
            }

            const jszip = new JSZip();
            const zip = await jszip.loadAsync(zipData);

            const filesToProcess = Object.keys(zip.files).filter(filename => 
                !zip.files[filename].dir && 
                !filename.startsWith('__MACOSX') && 
                !filename.includes('.DS_Store')
            );

            let processed = 0;
            const total = filesToProcess.length;
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

            for (const filename of filesToProcess) {
                try {
                    setStatusText(`Processing (${processed + 1}/${total}): ${filename}`);
                    
                    const fileObj = zip.files[filename];
                    const blob = await fileObj.async('blob');
                    
                    const ext = filename.split('.').pop()?.toLowerCase() || '';
                    if (!['svg', 'dxf', 'pdf', 'png', 'ai'].includes(ext)) {
                        addLog('error', `Skipped ${filename} (unsupported format)`);
                        processed++;
                        continue;
                    }

                    const storagePath = `library/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const { error: uploadError } = await supabase.storage
                        .from('designs')
                        .upload(storagePath, blob, {
                            contentType: blob.type || 'application/octet-stream',
                            upsert: true
                        });

                    if (uploadError) throw uploadError;

                    const designTitle = filename.split('/').pop()?.replace(`.${ext}`, '').replace(/[-_]/g, ' ') || 'Untitled';

                    const { error: dbError } = await supabase.from('designs').insert({
                        title: designTitle,
                        category: category || 'Uncategorized',
                        tags: tagsArray,
                        file_url: storagePath,
                        file_type: ext,
                        thumbnail_url: ['png', 'svg'].includes(ext) ? storagePath : null,
                    });

                    if (dbError) throw dbError;

                    addLog('success', `Uploaded: ${designTitle}`);
                } catch (err: any) {
                    addLog('error', `Failed ${filename}: ${err.message}`);
                }

                processed++;
                setProgress(processed / total);
            }

            setStatusText('Upload Complete!');
        } catch (err: any) {
            console.error(err);
            setStatusText(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{isEditing ? 'Edit Design' : 'Admin Panel'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {isEditing ? 'Modify design data and resource links' : 'Manage and add files to Design Library'}
                    </Text>
                </View>
                {onClose && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X color={COLORS.text} size={24} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs (Disabled when editing) */}
            {!isEditing && (
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'link' && styles.activeTab]}
                        onPress={() => setActiveTab('link')}
                    >
                        <Link color={activeTab === 'link' ? COLORS.primary : COLORS.textSub} size={18} />
                        <Text style={[styles.tabText, activeTab === 'link' && styles.activeTabText]}>Add Link (Drive/Mega)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'zip' && styles.activeTab]}
                        onPress={() => setActiveTab('zip')}
                    >
                        <UploadCloud color={activeTab === 'zip' ? COLORS.primary : COLORS.textSub} size={18} />
                        <Text style={[styles.tabText, activeTab === 'zip' && styles.activeTabText]}>Bulk ZIP Upload</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {activeTab === 'link' || isEditing ? (
                    <View style={styles.form}>
                        <Text style={styles.label}>Design Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Light up Wall Art 11"
                            placeholderTextColor={COLORS.textSub}
                            value={title}
                            onChangeText={setTitle}
                            editable={!uploading}
                        />

                        <Text style={styles.label}>Category</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Light Up Wall Art"
                            placeholderTextColor={COLORS.textSub}
                            value={category}
                            onChangeText={setCategory}
                            editable={!uploading}
                        />

                        <Text style={styles.label}>Tags (Comma separated)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. wall art, laser cut, 3d"
                            placeholderTextColor={COLORS.textSub}
                            value={tags}
                            onChangeText={setTags}
                            editable={!uploading}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>File Type / Extension *</Text>
                                <View style={styles.pickerContainer}>
                                    {['zip', 'dxf', 'svg', 'pdf', 'png'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.chip, fileType === type && styles.chipActive]}
                                            onPress={() => setFileType(type)}
                                        >
                                            <Text style={[styles.chipText, fileType === type && styles.chipTextActive]}>
                                                {type.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <Text style={styles.label}>Google Drive Link (URL)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://drive.google.com/..."
                            placeholderTextColor={COLORS.textSub}
                            value={driveUrl}
                            onChangeText={setDriveUrl}
                            editable={!uploading}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.label}>Mega Link (URL)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://mega.nz/..."
                            placeholderTextColor={COLORS.textSub}
                            value={megaUrl}
                            onChangeText={setMegaUrl}
                            editable={!uploading}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.label}>Preview Image URL (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://images.unsplash.com/... or leave empty"
                            placeholderTextColor={COLORS.textSub}
                            value={thumbnailUrl}
                            onChangeText={setThumbnailUrl}
                            editable={!uploading}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TouchableOpacity 
                            style={[styles.primaryButton, uploading && styles.buttonDisabled]}
                            onPress={handleSaveDesign}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    {isEditing ? <Edit3 color="#FFF" size={20} /> : <FolderPlus color="#FFF" size={20} />}
                                    <Text style={styles.primaryButtonText}>{isEditing ? 'Update Design' : 'Save Design'}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.form}>
                        {Platform.OS !== 'web' ? (
                            <Text style={styles.errorText}>Bulk ZIP Upload is only supported on the Web platform. Please use the Add Link option on mobile.</Text>
                        ) : (
                            <>
                                <Text style={styles.label}>Default Category (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Light Up Wall Art"
                                    placeholderTextColor={COLORS.textSub}
                                    value={category}
                                    onChangeText={setCategory}
                                    editable={!uploading}
                                />

                                <Text style={styles.label}>Default Tags (Comma separated)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. wall art, laser cut"
                                    placeholderTextColor={COLORS.textSub}
                                    value={tags}
                                    onChangeText={setTags}
                                    editable={!uploading}
                                />

                                <TouchableOpacity 
                                    style={[styles.primaryButton, uploading && styles.buttonDisabled]}
                                    onPress={handleUploadZip}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <UploadCloud color="#FFF" size={20} />
                                            <Text style={styles.primaryButtonText}>Select ZIP File</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {uploading && (
                                    <View style={styles.progressContainer}>
                                        <Text style={styles.progressText}>{statusText}</Text>
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                                        </View>
                                    </View>
                                )}

                                {logs.length > 0 && (
                                    <View style={styles.logsContainer}>
                                        <Text style={styles.logsTitle}>Upload Logs:</Text>
                                        <ScrollView style={styles.logsScroll}>
                                            {logs.map((log, i) => (
                                                <View key={i} style={styles.logRow}>
                                                    {log.type === 'success' ? (
                                                        <CheckCircle size={14} color={COLORS.success} />
                                                    ) : (
                                                        <AlertCircle size={14} color={COLORS.error} />
                                                    )}
                                                    <Text style={[styles.logText, log.type === 'error' && { color: COLORS.error }]}>
                                                        {log.msg}
                                                    </Text>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
        marginTop: 40,
        fontSize: 14,
        lineHeight: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: COLORS.textSub,
    },
    closeButton: {
        padding: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 16,
        gap: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activeTab: {
        borderColor: COLORS.primary + '30',
        backgroundColor: COLORS.primary + '10',
    },
    tabText: {
        color: COLORS.textSub,
        fontSize: 13,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.primary,
    },
    form: {
        padding: 20,
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
    },
    label: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 14,
        color: COLORS.text,
        fontSize: 15,
        marginBottom: 16,
        outlineStyle: 'none',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        color: COLORS.textSub,
        fontSize: 12,
        fontWeight: '700',
    },
    chipTextActive: {
        color: '#FFF',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        gap: 10,
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    progressContainer: {
        marginTop: 24,
    },
    progressText: {
        color: COLORS.textSub,
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    progressBar: {
        height: 6,
        backgroundColor: COLORS.surface,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    logsContainer: {
        marginTop: 32,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        maxHeight: 250,
    },
    logsTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    logsScroll: {
        flexGrow: 0,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    logText: {
        color: COLORS.textSub,
        fontSize: 13,
    },
});
