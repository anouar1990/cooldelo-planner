import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react-native';
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

// Ensure this component is only accessible to Admins in production.
export default function AdminUploadScreen() {
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [logs, setLogs] = useState<{type: 'success'|'error', msg: string}[]>([]);

    const addLog = (type: 'success'|'error', msg: string) => {
        setLogs(prev => [...prev, { type, msg }]);
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
                // On web, file.file is the actual File object
                const webFile = file.file as File;
                zipData = await webFile.arrayBuffer();
            } else {
                // On native, we might need expo-file-system to read it as base64, then convert
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
                    
                    // Determine file type
                    const ext = filename.split('.').pop()?.toLowerCase() || '';
                    if (!['svg', 'dxf', 'pdf', 'png', 'ai'].includes(ext)) {
                        addLog('error', `Skipped ${filename} (unsupported format)`);
                        processed++;
                        continue;
                    }

                    // Upload to Storage
                    const storagePath = `library/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const { error: uploadError } = await supabase.storage
                        .from('designs')
                        .upload(storagePath, blob, {
                            contentType: blob.type || 'application/octet-stream',
                            upsert: true
                        });

                    if (uploadError) throw uploadError;

                    // Generate a thumbnail URL (for images/svgs we can use the file url directly if public, 
                    // but for a SaaS, storage is usually private. We'll use a signed URL strategy later, 
                    // but for thumbnail we might need a public bucket or pre-generated thumbnails).
                    // For now, we'll store the storage path.

                    // Insert to DB
                    const title = filename.split('/').pop()?.replace(`.${ext}`, '').replace(/[-_]/g, ' ') || 'Untitled';

                    const { error: dbError } = await supabase.from('designs').insert({
                        title,
                        category: category || 'Uncategorized',
                        tags: tagsArray,
                        file_url: storagePath,
                        file_type: ext,
                        thumbnail_url: ['png', 'svg'].includes(ext) ? storagePath : null, // Assuming we can use the file as preview
                    });

                    if (dbError) throw dbError;

                    addLog('success', `Uploaded: ${title}`);
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

    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Admin Bulk Upload is only supported on the Web platform.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Upload</Text>
                <Text style={styles.headerSubtitle}>Bulk import designs from a ZIP file.</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Default Category (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Ramadan"
                    placeholderTextColor={COLORS.textSub}
                    value={category}
                    onChangeText={setCategory}
                    editable={!uploading}
                />

                <Text style={styles.label}>Default Tags (Comma separated)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. laser, vector, decor"
                    placeholderTextColor={COLORS.textSub}
                    value={tags}
                    onChangeText={setTags}
                    editable={!uploading}
                />

                <TouchableOpacity 
                    style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                    onPress={handleUploadZip}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <UploadCloud color="#FFF" size={24} />
                            <Text style={styles.uploadButtonText}>Select ZIP File</Text>
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
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
        marginTop: 100,
        fontSize: 16,
    },
    header: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSub,
    },
    form: {
        padding: 20,
        maxWidth: 600,
    },
    label: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        color: COLORS.text,
        fontSize: 16,
        marginBottom: 20,
        outlineStyle: 'none',
    },
    uploadButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    uploadButtonDisabled: {
        opacity: 0.7,
    },
    uploadButtonText: {
        color: '#FFF',
        fontSize: 16,
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
        maxHeight: 300,
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
