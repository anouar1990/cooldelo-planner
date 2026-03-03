import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput,
    TouchableOpacity, SafeAreaView, ScrollView
} from 'react-native';
import { useStore } from '../store/useStore';
import { X, CheckCircle } from 'lucide-react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const COLORS = {
    background: '#0B0C10',
    surface: '#1A2332',
    surfaceMid: '#1F2E40',
    border: 'rgba(102, 252, 241, 0.08)',
    accentCyan: '#66FCF1',
    accentTeal: '#45A29E',
    textMain: '#FFFFFF',
    textSecondary: '#8A9DB0',
    textDim: '#4A5E72',
};

export default function NewProjectScreen({ navigation }: any) {
    const addProject = useStore((state) => state.addProject);
    const materials = useStore((state) => state.materials);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(materials[0]?.id || '');

    const selectedMat = materials.find(m => m.id === selectedMaterial);

    const handleSave = () => {
        if (!title.trim()) return;
        const newProject = {
            id: uuidv4(),
            title: title.trim(),
            description: description.trim(),
            status: 'active' as const,
            materialsUsed: selectedMaterial ? [{ materialId: selectedMaterial, quantity: 1 }] : [],
            timeElapsed: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        addProject(newProject);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                    <X color={COLORS.textSecondary} size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Project</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Title */}
                <Text style={styles.label}>PROJECT TITLE *</Text>
                <TextInput
                    style={[styles.input, title.trim() && styles.inputActive]}
                    placeholder="e.g. Acrylic Business Cards"
                    placeholderTextColor={COLORS.textDim}
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                />

                {/* Description */}
                <Text style={styles.label}>NOTES / CLIENT INFO</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Optional description or client notes..."
                    placeholderTextColor={COLORS.textDim}
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                />

                {/* Material selector */}
                <Text style={styles.label}>MATERIAL</Text>
                <View style={styles.materialList}>
                    {materials.map((mat) => {
                        const isSelected = selectedMaterial === mat.id;
                        return (
                            <TouchableOpacity
                                key={mat.id}
                                style={[styles.materialRow, isSelected && styles.materialRowSelected]}
                                onPress={() => setSelectedMaterial(mat.id)}
                                activeOpacity={0.75}
                            >
                                <View style={styles.materialInfo}>
                                    <Text style={[styles.materialName, isSelected && { color: COLORS.textMain }]}>
                                        {mat.name}
                                    </Text>
                                    <Text style={styles.materialMeta}>
                                        {mat.type} · {mat.thickness}mm · ${mat.costPerUnit.toFixed(2)}/sqft
                                    </Text>
                                </View>
                                {isSelected && (
                                    <CheckCircle color={COLORS.accentCyan} size={20} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Preview card */}
                {selectedMat && (
                    <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>COST PREVIEW</Text>
                        <Text style={styles.previewDetail}>Material: <Text style={styles.previewValue}>{selectedMat.name}</Text></Text>
                        <Text style={styles.previewDetail}>Thickness: <Text style={styles.previewValue}>{selectedMat.thickness}mm</Text></Text>
                        <Text style={styles.previewDetail}>Rate: <Text style={styles.previewValue}>${selectedMat.costPerUnit.toFixed(2)} / sqft</Text></Text>
                        <Text style={styles.previewDetail}>Base material cost: <Text style={[styles.previewValue, { color: COLORS.accentCyan }]}>${selectedMat.costPerUnit.toFixed(2)}</Text></Text>
                    </View>
                )}

            </ScrollView>

            {/* Create button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createBtn, !title.trim() && styles.createBtnDisabled]}
                    onPress={handleSave}
                    disabled={!title.trim()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.createBtnText}>
                        {title.trim() ? `Create "${title.trim()}"` : 'Enter a project title'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textMain },
    content: { padding: 20, paddingBottom: 40 },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textDim,
        letterSpacing: 1.2,
        marginBottom: 8,
        marginTop: 24,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: COLORS.textMain,
        fontSize: 16,
    },
    inputActive: {
        borderColor: 'rgba(102, 252, 241, 0.3)',
    },
    textArea: { height: 90, textAlignVertical: 'top', paddingTop: 14 },
    materialList: { gap: 8 },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
    },
    materialRowSelected: {
        borderColor: COLORS.accentCyan,
        backgroundColor: 'rgba(102, 252, 241, 0.06)',
    },
    materialInfo: { flex: 1 },
    materialName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 3,
    },
    materialMeta: {
        fontSize: 12,
        color: COLORS.textDim,
    },
    previewCard: {
        backgroundColor: COLORS.surfaceMid,
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(102, 252, 241, 0.1)',
        gap: 6,
    },
    previewTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.accentTeal,
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    previewDetail: { fontSize: 13, color: COLORS.textSecondary },
    previewValue: { fontWeight: '600', color: COLORS.textMain },
    footer: {
        padding: 20,
        paddingBottom: 34,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    createBtn: {
        backgroundColor: COLORS.accentCyan,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: COLORS.accentCyan,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    createBtnDisabled: {
        backgroundColor: COLORS.surface,
        shadowOpacity: 0,
        elevation: 0,
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.background,
    },
});
