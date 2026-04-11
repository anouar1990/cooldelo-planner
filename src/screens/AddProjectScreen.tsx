import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    SafeAreaView, ScrollView, Image, Alert, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { trackEvent } from '../lib/analytics';
import { useProjects, ProjectInsert } from '../hooks/useProjects';
import { useMaterials } from '../hooks/useMaterials';
import { X, Camera, ChevronDown } from 'lucide-react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    blue: '#3B82F6', amber: '#F59E0B', green: '#10B981',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

const STATUS_OPTS: { label: string; value: 'planned' | 'in-progress' | 'completed'; color: string }[] = [
    { label: 'Planned', value: 'planned', color: C.blue },
    { label: 'In Progress', value: 'in-progress', color: C.amber },
    { label: 'Completed', value: 'completed', color: C.green },
];

const MATERIAL_TYPES = ['wood', 'acrylic', 'leather', 'mdf', 'stone', 'other'];

export default function AddProjectScreen({ navigation }: any) {
    const { addProject } = useProjects();
    const { materials, hourlyRate } = useMaterials();
    const [isSaving, setIsSaving] = useState(false);

    const [imageUri, setImageUri] = useState<string | undefined>();
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [status, setStatus] = useState<ProjectInsert['status']>('planned');
    const [machine, setMachine] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(materials[0]?.id ?? '');
    const [thickness, setThickness] = useState('');
    const [costPerUnit, setCostPerUnit] = useState('');
    const [quantity, setQuantity] = useState('1');

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow photo access to add a project image.');
                return;
            }
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Please enter a project title.');
            return;
        }
        setIsSaving(true);
        const { error } = await addProject({
            title: title.trim(),
            description: desc || null,
            status,
            image_uri: imageUri,
            machine: machine.trim() || null,
            material_id: selectedMaterial || null,
            material_thickness: thickness ? parseFloat(thickness) : null,
            material_cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : null,
            material_quantity: quantity ? parseFloat(quantity) : 1,
            time_elapsed: 0,
        });
        setIsSaving(false);

        if (error) {
            Alert.alert('Error saving project', error);
        } else {
            trackEvent('btn_click', { action: 'add_project', title: title.trim(), material: selectedMaterial });
            navigation.goBack();
        }
    };

    const mat = materials.find(m => m.id === selectedMaterial);

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                        <X color={C.sub} size={22} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Project</Text>
                    <TouchableOpacity
                        style={[styles.saveBtn, (!title.trim() || isSaving) && styles.saveBtnOff]}
                        onPress={handleSave}
                        disabled={!title.trim() || isSaving}
                    >
                        <Text style={[styles.saveBtnText, (!title.trim() || isSaving) && styles.saveBtnTextOff]}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Image picker */}
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Camera color={C.sub} size={28} />
                                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Title */}
                    <Text style={styles.label}>PROJECT TITLE *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Custom Acrylic Coasters"
                        placeholderTextColor={C.dim}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />

                    {/* Description */}
                    <Text style={styles.label}>DESCRIPTION</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Optional notes, client info..."
                        placeholderTextColor={C.dim}
                        multiline
                        numberOfLines={3}
                        value={desc}
                        onChangeText={setDesc}
                    />

                    {/* Status */}
                    <Text style={styles.label}>STATUS</Text>
                    <View style={styles.chipRow}>
                        {STATUS_OPTS.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.chip, status === opt.value && { backgroundColor: opt.color, borderColor: opt.color }]}
                                onPress={() => setStatus(opt.value)}
                            >
                                <Text style={[styles.chipText, status === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Machine */}
                    <Text style={styles.label}>MACHINE (OPTIONAL)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Glowforge Pro, xTool D1"
                        placeholderTextColor={C.dim}
                        value={machine}
                        onChangeText={setMachine}
                    />

                    {/* Material */}
                    <Text style={styles.label}>MATERIAL</Text>
                    <View style={styles.materialList}>
                        {materials.map(m => (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.materialRow, selectedMaterial === m.id && styles.materialRowSelected]}
                                onPress={() => setSelectedMaterial(m.id)}
                            >
                                <View>
                                    <Text style={[styles.materialName, selectedMaterial === m.id && { color: C.text }]}>{m.name}</Text>
                                    <Text style={styles.materialMeta}>{m.type} · {m.thickness}mm · ${m.cost_per_unit}/sqft</Text>
                                </View>
                                {selectedMaterial === m.id && (
                                    <View style={styles.selectedDot} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Overrides */}
                    <Text style={styles.label}>OVERRIDES (OPTIONAL)</Text>
                    <View style={styles.row2}>
                        <View style={styles.halfGroup}>
                            <Text style={styles.subLabel}>THICKNESS (mm)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={mat ? `${mat.thickness}` : '3.0'}
                                placeholderTextColor={C.dim}
                                keyboardType="decimal-pad"
                                value={thickness}
                                onChangeText={setThickness}
                            />
                        </View>
                        <View style={styles.halfGroup}>
                            <Text style={styles.subLabel}>COST / SQFT ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={mat ? `${mat.cost_per_unit}` : '2.00'}
                                placeholderTextColor={C.dim}
                                keyboardType="decimal-pad"
                                value={costPerUnit}
                                onChangeText={setCostPerUnit}
                            />
                        </View>
                    </View>
                    <Text style={styles.subLabel}>QTY USED (sqft)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1"
                        placeholderTextColor={C.dim}
                        keyboardType="decimal-pad"
                        value={quantity}
                        onChangeText={setQuantity}
                    />

                </ScrollView>
            </ResponsiveContainer>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
    saveBtn: { backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
    saveBtnOff: { backgroundColor: C.surface },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    saveBtnTextOff: { color: C.dim },
    form: { padding: 20, paddingBottom: 60 },
    imagePicker: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, height: 180, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    imagePlaceholderText: { color: C.sub, fontSize: 14, fontWeight: '600' },
    label: { fontSize: 11, fontWeight: '700', color: C.dim, letterSpacing: 1.2, marginBottom: 8, marginTop: 20 },
    subLabel: { fontSize: 10, fontWeight: '600', color: C.dim, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
        color: C.text, fontSize: 15,
    },
    textarea: { height: 90, textAlignVertical: 'top', paddingTop: 13 },
    chipRow: { flexDirection: 'row', gap: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    chipText: { fontSize: 13, fontWeight: '600', color: C.sub },
    chipTextActive: { color: '#fff' },
    materialList: { gap: 8 },
    materialRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: C.surface, borderRadius: 12,
        padding: 14, borderWidth: 1, borderColor: C.border,
    },
    materialRowSelected: { borderColor: C.primary, backgroundColor: 'rgba(255,107,53,0.07)' },
    materialName: { fontSize: 14, fontWeight: '600', color: C.sub, marginBottom: 2 },
    materialMeta: { fontSize: 12, color: C.dim },
    selectedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
    row2: { flexDirection: 'row', gap: 12 },
    halfGroup: { flex: 1 },
});
