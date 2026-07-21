import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Modal, Platform, Alert, useWindowDimensions
} from 'react-native';
import { Zap, Plus, X, Check, Search, Star, Pencil, Trash2, Copy, AlertTriangle, ShieldCheck, Filter, Cpu, Layers } from 'lucide-react-native';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { useMachineProfiles } from '../hooks/useMachineProfiles';
import { useMaterials } from '../hooks/useMaterials';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    amber: '#F59E0B', green: '#10B981', blue: '#3B82F6', purple: '#8B5CF6', teal: '#14B8A6',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

export type SourceType = 'My Machine Test' | 'User Tested' | 'Manufacturer Reference' | 'Material Supplier Reference' | 'Community Tested';
export type OperationType = 'Cut' | 'Engrave' | 'Score';
export type ResultStatusType = 'Successful Cut' | 'Clean Engraving' | 'Partial Cut' | 'Needs Adjustment' | 'Starting Point';

export interface LaserSetting {
    id: string;
    name: string;
    machineBrand: string;
    machineModel: string;
    laserType: 'CO2' | 'Diode' | 'Fiber' | 'MOPA';
    laserPowerWatts: number;
    materialName: string;
    thicknessMm: number;
    operation: OperationType;
    speed: number;       // mm/s
    power: number;       // %
    passes: number;
    frequency: number;   // Hz
    airAssist: boolean;
    focus: string;       // e.g. 'auto' or '2.0mm'
    sourceType: SourceType;
    resultStatus: ResultStatusType;
    notes: string;
    starred: boolean;
}

const SEED_SETTINGS: LaserSetting[] = [
    {
        id: '1',
        name: '3mm Birch Plywood — Vector Cut Test',
        machineBrand: 'OMTech',
        machineModel: 'K40 40W',
        laserType: 'CO2',
        laserPowerWatts: 40,
        materialName: 'Birch Plywood',
        thicknessMm: 3.0,
        operation: 'Cut',
        speed: 20,
        power: 85,
        passes: 1,
        frequency: 1000,
        airAssist: true,
        focus: '50.8mm Lens',
        sourceType: 'My Machine Test',
        resultStatus: 'Successful Cut',
        notes: 'Clean cut with air assist at 15 PSI. Minimal charring on back side.',
        starred: true,
    },
    {
        id: '2',
        name: '3mm Basswood — Diode Cut Reference',
        machineBrand: 'xTool',
        machineModel: 'D1 Pro 20W',
        laserType: 'Diode',
        laserPowerWatts: 20,
        materialName: 'Basswood Plywood',
        thicknessMm: 3.0,
        operation: 'Cut',
        speed: 8,
        power: 100,
        passes: 1,
        frequency: 0,
        airAssist: true,
        focus: 'Pin Focus',
        sourceType: 'Manufacturer Reference',
        resultStatus: 'Starting Point',
        notes: 'Manufacturer starting point reference for 20W diode module with air assist.',
        starred: true,
    },
    {
        id: '3',
        name: '4mm Clear Acrylic — Raster Engraving',
        machineBrand: 'Glowforge',
        machineModel: 'Plus 45W',
        laserType: 'CO2',
        laserPowerWatts: 45,
        materialName: 'Clear Acrylic (Cast)',
        thicknessMm: 4.0,
        operation: 'Engrave',
        speed: 250,
        power: 35,
        passes: 1,
        frequency: 1000,
        airAssist: false,
        focus: 'Auto',
        sourceType: 'Community Tested',
        resultStatus: 'Clean Engraving',
        notes: 'Frost finish on cast acrylic. Keep protective paper on back side during engraving.',
        starred: false,
    },
    {
        id: '4',
        name: '6mm MDF — High Power Vector Cut',
        machineBrand: 'Thunder Laser',
        machineModel: 'Nova 35 80W',
        laserType: 'CO2',
        laserPowerWatts: 80,
        materialName: 'MDF',
        thicknessMm: 6.0,
        operation: 'Cut',
        speed: 25,
        power: 75,
        passes: 1,
        frequency: 1000,
        airAssist: true,
        focus: '2.5 inch Lens',
        sourceType: 'User Tested',
        resultStatus: 'Successful Cut',
        notes: 'Requires strong ventilation. Wipes clean with isopropyl alcohol after cut.',
        starred: false,
    },
];

const BLANK_SETTING: Omit<LaserSetting, 'id'> = {
    name: '',
    machineBrand: 'Generic / User Machine',
    machineModel: 'CO2 50W',
    laserType: 'CO2',
    laserPowerWatts: 50,
    materialName: 'Birch Plywood',
    thicknessMm: 3.0,
    operation: 'Cut',
    speed: 20,
    power: 80,
    passes: 1,
    frequency: 1000,
    airAssist: true,
    focus: 'Auto',
    sourceType: 'My Machine Test',
    resultStatus: 'Successful Cut',
    notes: '',
    starred: false,
};

const SOURCE_COLORS: Record<SourceType, string> = {
    'My Machine Test': C.blue,
    'User Tested': C.green,
    'Manufacturer Reference': C.sub,
    'Material Supplier Reference': C.purple,
    'Community Tested': C.teal,
};

export default function LaserPresetsScreen() {
    const { width } = useWindowDimensions();
    const { machines } = useMachineProfiles();
    const { materials } = useMaterials();

    const [settings, setSettings] = useState<LaserSetting[]>(SEED_SETTINGS);
    const [search, setSearch] = useState('');
    const [selectedOp, setSelectedOp] = useState<string>('All');
    const [selectedSource, setSelectedSource] = useState<string>('All');
    const [showStarred, setShowStarred] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<LaserSetting | null>(null);
    const [form, setForm] = useState<Omit<LaserSetting, 'id'>>(BLANK_SETTING);

    const filtered = useMemo(() => {
        return settings.filter(s => {
            if (showStarred && !s.starred) return false;
            if (selectedOp !== 'All' && s.operation !== selectedOp) return false;
            if (selectedSource !== 'All' && s.sourceType !== selectedSource) return false;

            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                s.name.toLowerCase().includes(q) ||
                s.materialName.toLowerCase().includes(q) ||
                s.machineBrand.toLowerCase().includes(q) ||
                s.machineModel.toLowerCase().includes(q) ||
                s.notes.toLowerCase().includes(q)
            );
        });
    }, [settings, search, selectedOp, selectedSource, showStarred]);

    const openAdd = () => {
        setEditing(null);
        setForm(BLANK_SETTING);
        setShowModal(true);
    };

    const openEdit = (s: LaserSetting) => {
        setEditing(s);
        setForm({
            name: s.name,
            machineBrand: s.machineBrand,
            machineModel: s.machineModel,
            laserType: s.laserType,
            laserPowerWatts: s.laserPowerWatts,
            materialName: s.materialName,
            thicknessMm: s.thicknessMm,
            operation: s.operation,
            speed: s.speed,
            power: s.power,
            passes: s.passes,
            frequency: s.frequency,
            airAssist: s.airAssist,
            focus: s.focus,
            sourceType: s.sourceType,
            resultStatus: s.resultStatus,
            notes: s.notes,
            starred: s.starred,
        });
        setShowModal(true);
    };

    const handleSave = () => {
        if (!form.name.trim()) {
            if (Platform.OS === 'web') window.alert('Please enter a setting name.');
            else Alert.alert('Required', 'Please enter a setting name.');
            return;
        }

        if (editing) {
            setSettings(prev => prev.map(s => s.id === editing.id ? { ...editing, ...form } : s));
        } else {
            setSettings(prev => [{ id: Date.now().toString(), ...form }, ...prev]);
        }
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Delete this setting record?')) {
                setSettings(prev => prev.filter(s => s.id !== id));
            }
        } else {
            Alert.alert('Delete Record', 'Are you sure you want to delete this laser setting record?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => setSettings(prev => prev.filter(s => s.id !== id)) }
            ]);
        }
    };

    const handleDuplicate = (s: LaserSetting) => {
        setSettings(prev => [
            {
                ...s,
                id: Date.now().toString(),
                name: `${s.name} (Copy)`,
                sourceType: 'My Machine Test',
                starred: false,
            },
            ...prev,
        ]);
    };

    const toggleStar = (id: string) => {
        setSettings(prev => prev.map(s => s.id === id ? { ...s, starred: !s.starred } : s));
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ResponsiveContainer>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Independent Platform Disclaimer Banner */}
                    <View style={styles.disclaimerCard}>
                        <ShieldCheck color={C.blue} size={18} style={styles.disclaimerIcon} />
                        <Text style={styles.disclaimerText}>
                            <Text style={styles.disclaimerBold}>Independent Platform Notice: </Text>
                            0machine is an independent software platform and is not affiliated with, sponsored by, or endorsed by the manufacturers or brands referenced in this database. Brand and model names are used solely for identification and compatibility reference.
                        </Text>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <View style={styles.titleRow}>
                                <View style={styles.headerIcon}>
                                    <Zap color={C.primary} size={20} fill={C.primary + '40'} />
                                </View>
                                <Text style={styles.title}>Laser Settings Library</Text>
                            </View>
                            <Text style={styles.subtitle}>
                                {settings.length} test records · {settings.filter(s => s.starred).length} starred
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
                            <Plus color="#fff" size={18} />
                            <Text style={styles.addBtnText}>Log Test Setting</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Testing Warning Note */}
                    <View style={styles.warningNote}>
                        <AlertTriangle color={C.amber} size={16} />
                        <Text style={styles.warningText}>
                            Laser settings vary depending on tube age, optics, focus, air assist, and material batch. Always test settings on a small sample piece before full production.
                        </Text>
                    </View>

                    {/* Search and Filters Bar */}
                    <View style={styles.filterSection}>
                        {/* Search Input */}
                        <View style={styles.searchBox}>
                            <Search color={C.sub} size={18} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name, material, brand, model..."
                                placeholderTextColor={C.dim}
                                value={search}
                                onChangeText={setSearch}
                            />
                            {search ? (
                                <TouchableOpacity onPress={() => setSearch('')}>
                                    <X color={C.sub} size={18} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Filter Tabs */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                            <TouchableOpacity
                                style={[styles.filterChip, showStarred && styles.filterChipActive]}
                                onPress={() => setShowStarred(!showStarred)}
                            >
                                <Star color={showStarred ? C.amber : C.sub} size={14} fill={showStarred ? C.amber : 'transparent'} />
                                <Text style={[styles.filterChipText, showStarred && styles.filterChipTextActive]}>Starred</Text>
                            </TouchableOpacity>

                            {['All', 'Cut', 'Engrave', 'Score'].map(op => (
                                <TouchableOpacity
                                    key={op}
                                    style={[styles.filterChip, selectedOp === op && styles.filterChipActive]}
                                    onPress={() => setSelectedOp(op)}
                                >
                                    <Text style={[styles.filterChipText, selectedOp === op && styles.filterChipTextActive]}>{op}</Text>
                                </TouchableOpacity>
                            ))}

                            {['All', 'My Machine Test', 'User Tested', 'Manufacturer Reference', 'Community Tested'].map(src => (
                                <TouchableOpacity
                                    key={src}
                                    style={[styles.filterChip, selectedSource === src && styles.filterChipActive]}
                                    onPress={() => setSelectedSource(src)}
                                >
                                    <Text style={[styles.filterChipText, selectedSource === src && styles.filterChipTextActive]}>{src}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Settings Grid */}
                    {filtered.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Zap color={C.dim} size={48} />
                            <Text style={styles.emptyTitle}>No Settings Found</Text>
                            <Text style={styles.emptySub}>No laser setting records match your search or filter criteria.</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
                                <Plus color="#fff" size={16} />
                                <Text style={styles.emptyBtnText}>Add New Setting</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.grid}>
                            {filtered.map(s => (
                                <View key={s.id} style={styles.card}>
                                    {/* Card Header */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardHeaderLeft}>
                                            <TouchableOpacity onPress={() => toggleStar(s.id)}>
                                                <Star
                                                    color={s.starred ? C.amber : C.dim}
                                                    size={18}
                                                    fill={s.starred ? C.amber : 'transparent'}
                                                />
                                            </TouchableOpacity>
                                            <View style={[styles.badge, { backgroundColor: (SOURCE_COLORS[s.sourceType] || C.sub) + '20', borderColor: (SOURCE_COLORS[s.sourceType] || C.sub) + '40' }]}>
                                                <Text style={[styles.badgeText, { color: SOURCE_COLORS[s.sourceType] || C.sub }]}>
                                                    {s.sourceType}
                                                </Text>
                                            </View>
                                            <View style={[styles.badge, { backgroundColor: C.primary + '15', borderColor: C.primary + '30' }]}>
                                                <Text style={[styles.badgeText, { color: C.primary }]}>{s.operation}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardActions}>
                                            <TouchableOpacity onPress={() => handleDuplicate(s)} style={styles.actionBtn}>
                                                <Copy color={C.sub} size={15} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openEdit(s)} style={styles.actionBtn}>
                                                <Pencil color={C.blue} size={15} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(s.id)} style={styles.actionBtn}>
                                                <Trash2 color="#EF4444" size={15} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Card Title */}
                                    <Text style={styles.cardTitle}>{s.name}</Text>

                                    {/* Compatibility Machine & Material Tag */}
                                    <View style={styles.compatBox}>
                                        <Text style={styles.compatMachineText}>
                                            Machine Ref: <Text style={{ color: C.text, fontWeight: '700' }}>{s.machineBrand} {s.machineModel}</Text> ({s.laserType} {s.laserPowerWatts}W)
                                        </Text>
                                        <Text style={styles.compatMaterialText}>
                                            Material: <Text style={{ color: C.text, fontWeight: '700' }}>{s.materialName} ({s.thicknessMm}mm)</Text>
                                        </Text>
                                    </View>

                                    {/* Parameters Grid */}
                                    <View style={styles.paramGrid}>
                                        <View style={styles.paramItem}>
                                            <Text style={styles.paramLabel}>SPEED</Text>
                                            <Text style={styles.paramVal}>{s.speed} <Text style={styles.unit}>mm/s</Text></Text>
                                        </View>
                                        <View style={styles.paramItem}>
                                            <Text style={styles.paramLabel}>POWER</Text>
                                            <Text style={styles.paramVal}>{s.power}<Text style={styles.unit}>%</Text></Text>
                                        </View>
                                        <View style={styles.paramItem}>
                                            <Text style={styles.paramLabel}>PASSES</Text>
                                            <Text style={styles.paramVal}>{s.passes}</Text>
                                        </View>
                                        <View style={styles.paramItem}>
                                            <Text style={styles.paramLabel}>AIR ASSIST</Text>
                                            <Text style={[styles.paramVal, { color: s.airAssist ? C.green : C.sub }]}>
                                                {s.airAssist ? 'ON' : 'OFF'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Status & Notes */}
                                    {s.notes ? (
                                        <Text style={styles.notesText} numberOfLines={2}>
                                            💡 {s.notes}
                                        </Text>
                                    ) : null}

                                    <View style={styles.cardFooter}>
                                        <Text style={styles.resultStatusText}>
                                            Status: <Text style={{ color: s.resultStatus.includes('Cut') || s.resultStatus.includes('Clean') ? C.green : C.amber, fontWeight: '600' }}>{s.resultStatus}</Text>
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                </ScrollView>
            </ResponsiveContainer>

            {/* Modal for Add / Edit */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editing ? 'Edit Laser Setting' : 'Log New Test Setting'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <X color={C.sub} size={20} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            
                            <Text style={styles.fieldLabel}>Setting Name *</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. 3mm Birch Plywood — Vector Cut Test"
                                placeholderTextColor={C.dim}
                                value={form.name}
                                onChangeText={v => setForm(p => ({ ...p, name: v }))}
                            />

                            {/* Machine Selection / Preset */}
                            <Text style={styles.fieldLabel}>Machine Brand & Model (Reference)</Text>
                            <View style={styles.rowTwo}>
                                <TextInput
                                    style={[styles.modalInput, { flex: 1 }]}
                                    placeholder="Brand (e.g. OMTech, xTool, Glowforge)"
                                    placeholderTextColor={C.dim}
                                    value={form.machineBrand}
                                    onChangeText={v => setForm(p => ({ ...p, machineBrand: v }))}
                                />
                                <TextInput
                                    style={[styles.modalInput, { flex: 1 }]}
                                    placeholder="Model (e.g. K40, D1 Pro 20W)"
                                    placeholderTextColor={C.dim}
                                    value={form.machineModel}
                                    onChangeText={v => setForm(p => ({ ...p, machineModel: v }))}
                                />
                            </View>

                            <View style={styles.rowTwo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Laser Type</Text>
                                    <View style={styles.opRow}>
                                        {['CO2', 'Diode', 'Fiber', 'MOPA'].map((t: any) => (
                                            <TouchableOpacity
                                                key={t}
                                                style={[styles.opChip, form.laserType === t && styles.opChipActive]}
                                                onPress={() => setForm(p => ({ ...p, laserType: t }))}
                                            >
                                                <Text style={[styles.opChipText, form.laserType === t && styles.opChipTextActive]}>{t}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Laser Power (Watts)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. 40, 20, 80"
                                        placeholderTextColor={C.dim}
                                        keyboardType="numeric"
                                        value={form.laserPowerWatts.toString()}
                                        onChangeText={v => setForm(p => ({ ...p, laserPowerWatts: Math.max(0, parseFloat(v) || 0) }))}
                                    />
                                </View>
                            </View>

                            {/* Material & Thickness */}
                            <View style={styles.rowTwo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Material Name</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. Birch Plywood"
                                        placeholderTextColor={C.dim}
                                        value={form.materialName}
                                        onChangeText={v => setForm(p => ({ ...p, materialName: v }))}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Thickness (mm)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. 3.0"
                                        placeholderTextColor={C.dim}
                                        keyboardType="numeric"
                                        value={form.thicknessMm.toString()}
                                        onChangeText={v => setForm(p => ({ ...p, thicknessMm: Math.max(0, parseFloat(v) || 0) }))}
                                    />
                                </View>
                            </View>

                            {/* Operation Type */}
                            <Text style={styles.fieldLabel}>Operation</Text>
                            <View style={styles.opRow}>
                                {['Cut', 'Engrave', 'Score'].map((op: any) => (
                                    <TouchableOpacity
                                        key={op}
                                        style={[styles.opChip, form.operation === op && styles.opChipActive]}
                                        onPress={() => setForm(p => ({ ...p, operation: op }))}
                                    >
                                        <Text style={[styles.opChipText, form.operation === op && styles.opChipTextActive]}>{op}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Parameters */}
                            <View style={styles.rowTwo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Speed (mm/s)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. 20"
                                        placeholderTextColor={C.dim}
                                        keyboardType="numeric"
                                        value={form.speed.toString()}
                                        onChangeText={v => setForm(p => ({ ...p, speed: Math.max(0, parseFloat(v) || 0) }))}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Power (%)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. 80"
                                        placeholderTextColor={C.dim}
                                        keyboardType="numeric"
                                        value={form.power.toString()}
                                        onChangeText={v => setForm(p => ({ ...p, power: Math.min(100, Math.max(0, parseFloat(v) || 0)) }))}
                                    />
                                </View>
                            </View>

                            <View style={styles.rowTwo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Passes</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="e.g. 1"
                                        placeholderTextColor={C.dim}
                                        keyboardType="numeric"
                                        value={form.passes.toString()}
                                        onChangeText={v => setForm(p => ({ ...p, passes: Math.max(1, parseInt(v) || 1) }))}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Air Assist</Text>
                                    <TouchableOpacity
                                        style={[styles.modalInput, { justifyContent: 'center', backgroundColor: form.airAssist ? C.green + '20' : C.surface, borderColor: form.airAssist ? C.green : C.border }]}
                                        onPress={() => setForm(p => ({ ...p, airAssist: !p.airAssist }))}
                                    >
                                        <Text style={{ color: form.airAssist ? C.green : C.sub, fontWeight: '700', textAlign: 'center' }}>
                                            {form.airAssist ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Source Classification */}
                            <Text style={styles.fieldLabel}>Source Classification</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.opRow}>
                                {['My Machine Test', 'User Tested', 'Manufacturer Reference', 'Material Supplier Reference', 'Community Tested'].map((src: any) => (
                                    <TouchableOpacity
                                        key={src}
                                        style={[styles.opChip, form.sourceType === src && styles.opChipActive]}
                                        onPress={() => setForm(p => ({ ...p, sourceType: src }))}
                                    >
                                        <Text style={[styles.opChipText, form.sourceType === src && styles.opChipTextActive]}>{src}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.fieldLabel}>Test Result Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.opRow}>
                                {['Successful Cut', 'Clean Engraving', 'Partial Cut', 'Needs Adjustment', 'Starting Point'].map((res: any) => (
                                    <TouchableOpacity
                                        key={res}
                                        style={[styles.opChip, form.resultStatus === res && styles.opChipActive]}
                                        onPress={() => setForm(p => ({ ...p, resultStatus: res }))}
                                    >
                                        <Text style={[styles.opChipText, form.resultStatus === res && styles.opChipTextActive]}>{res}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Notes */}
                            <Text style={styles.fieldLabel}>Notes & Observations</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="Add notes about lens, tape usage, smoke, edge quality, or test sample..."
                                placeholderTextColor={C.dim}
                                multiline
                                value={form.notes}
                                onChangeText={v => setForm(p => ({ ...p, notes: v }))}
                            />

                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Check color="#fff" size={18} />
                                <Text style={styles.saveBtnText}>Save Setting Record</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: C.bg,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    disclaimerCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.25)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    disclaimerIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    disclaimerText: {
        flex: 1,
        color: C.sub,
        fontSize: 12,
        lineHeight: 18,
    },
    disclaimerBold: {
        color: C.text,
        fontWeight: '700',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: C.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: C.primary + '30',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: C.text,
    },
    subtitle: {
        fontSize: 13,
        color: C.sub,
        marginTop: 4,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    warningNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
    },
    warningText: {
        flex: 1,
        color: C.amber,
        fontSize: 12,
        lineHeight: 16,
    },
    filterSection: {
        marginBottom: 20,
        gap: 12,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: C.border,
        height: 46,
    },
    searchInput: {
        flex: 1,
        color: C.text,
        fontSize: 14,
        marginHorizontal: 10,
        outlineStyle: 'none' as any,
    },
    filterRow: {
        gap: 8,
        paddingVertical: 4,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    filterChipActive: {
        backgroundColor: C.primary + '20',
        borderColor: C.primary,
    },
    filterChipText: {
        color: C.sub,
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: C.primary,
    },
    grid: {
        gap: 16,
    },
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: C.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    badge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 6,
        backgroundColor: C.surface2,
        borderRadius: 8,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: C.text,
        marginBottom: 8,
    },
    compatBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 4,
    },
    compatMachineText: {
        fontSize: 12,
        color: C.sub,
    },
    compatMaterialText: {
        fontSize: 12,
        color: C.sub,
    },
    paramGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: C.bg,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    paramItem: {
        alignItems: 'center',
    },
    paramLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: C.dim,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    paramVal: {
        fontSize: 15,
        fontWeight: '800',
        color: C.text,
    },
    unit: {
        fontSize: 11,
        color: C.sub,
        fontWeight: '600',
    },
    notesText: {
        fontSize: 12,
        color: C.sub,
        lineHeight: 16,
        marginBottom: 10,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 10,
    },
    resultStatusText: {
        fontSize: 12,
        color: C.sub,
    },
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: C.text,
        marginTop: 12,
    },
    emptySub: {
        fontSize: 13,
        color: C.sub,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 20,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.primary,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 600,
        maxHeight: '90%',
        backgroundColor: C.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.border,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: C.text,
    },
    closeBtn: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: C.sub,
        marginBottom: 6,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 10,
        padding: 12,
        color: C.text,
        fontSize: 14,
        outlineStyle: 'none' as any,
    },
    rowTwo: {
        flexDirection: 'row',
        gap: 12,
    },
    opRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
    },
    opChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
    },
    opChipActive: {
        backgroundColor: C.primary + '20',
        borderColor: C.primary,
    },
    opChipText: {
        color: C.sub,
        fontSize: 12,
        fontWeight: '600',
    },
    opChipTextActive: {
        color: C.primary,
        fontWeight: '700',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: C.surface2,
    },
    cancelBtnText: {
        color: C.sub,
        fontWeight: '600',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: C.primary,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
});
