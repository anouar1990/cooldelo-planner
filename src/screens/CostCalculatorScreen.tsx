import React, { useState, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TextInput, TouchableOpacity, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Calculator, RotateCcw, Save, DollarSign, Zap, Wrench, Clock, UploadCloud, FileText, Check } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { trackEvent } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';

import { OnboardingModal } from '../components/OnboardingModal';

const C = {
    bg: '#0F1117', surface: '#1C2030', surface2: '#242840',
    border: 'rgba(255,255,255,0.07)', primary: '#FF6B35',
    green: '#10B981', amber: '#F59E0B', blue: '#3B82F6',
    text: '#FFFFFF', sub: '#8B95A8', dim: '#4B5568',
};

interface Inputs {
    projectName: string;
    materialType: string;
    sheetCost: string;
    sheetWidth: string;
    sheetHeight: string;
    usagePct: string;
    laserTime: string;     // minutes
    electricityRate: string; // $/hr
    machineWear: string;   // $ flat
    laborCost: string;     // $ flat
    profitMargin: string;  // %
    quantity: string;
}

const DEFAULT: Inputs = {
    projectName: '', materialType: '',
    sheetCost: '', sheetWidth: '600', sheetHeight: '400',
    usagePct: '80', laserTime: '', electricityRate: '0.15',
    machineWear: '', laborCost: '', profitMargin: '30',
    quantity: '1',
};

function n(v: string) { return Math.max(0, parseFloat(v) || 0); }

function InputField({ label, value, onChange, placeholder, prefix }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; prefix?: string;
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrap}>
                {prefix ? <Text style={styles.inputPrefix}>{prefix}</Text> : null}
                <TextInput
                    style={[styles.input, prefix ? styles.inputPrefixed : undefined]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder ?? '0'}
                    placeholderTextColor={C.sub}
                    keyboardType="decimal-pad"
                />
            </View>
        </View>
    );
}

export default function CostCalculatorScreen() {
    const [f, setF] = useState<Inputs>(DEFAULT);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasDone = localStorage.getItem('0machine_onboarded');
            if (!hasDone) {
                setShowOnboarding(true);
            }
        }
    }, []);
    const upd = (k: keyof Inputs) => (v: string) => setF(prev => ({ ...prev, [k]: v }));

    // SVG Analyzer State
    const [fileName, setFileName] = useState('');
    const [rawSvgText, setRawSvgText] = useState('');
    const [targetWidth, setTargetWidth] = useState('300'); // physical target width in mm
    const [cutSpeed, setCutSpeed] = useState('30'); // speed in mm/s
    const [analyzing, setAnalyzing] = useState(false);
    
    const [totalLengthMm, setTotalLengthMm] = useState(0); 
    const [estimatedTimeMin, setEstimatedTimeMin] = useState(0); 

    const parsePathDataLength = (d: string): number => {
        let len = 0;
        const commands = d.match(/([a-df-z][^a-df-z]*)/gi) || [];
        let curX = 0, curY = 0, startX = 0, startY = 0;
        for (const cmd of commands) {
            const type = cmd[0];
            const nums = (cmd.slice(1).match(/[-+]?(?:\d*\.\d+|\d+)/g) || []).map(Number);
            if (type === 'M' || type === 'm') {
                if (nums.length >= 2) {
                    curX = type === 'M' ? nums[0] : curX + nums[0];
                    curY = type === 'M' ? nums[1] : curY + nums[1];
                    startX = curX; startY = curY;
                }
            } else if (type === 'L' || type === 'l') {
                for (let i = 0; i < nums.length - 1; i += 2) {
                    const nx = type === 'L' ? nums[i] : curX + nums[i];
                    const ny = type === 'L' ? nums[i+1] : curY + nums[i+1];
                    len += Math.hypot(nx - curX, ny - curY);
                    curX = nx; curY = ny;
                }
            } else if (type === 'H' || type === 'h') {
                for (const nVal of nums) {
                    const nx = type === 'H' ? nVal : curX + nVal;
                    len += Math.abs(nx - curX);
                    curX = nx;
                }
            } else if (type === 'V' || type === 'v') {
                for (const nVal of nums) {
                    const ny = type === 'V' ? nVal : curY + nVal;
                    len += Math.abs(ny - curY);
                    curY = ny;
                }
            } else if (type === 'Z' || type === 'z') {
                len += Math.hypot(startX - curX, startY - curY);
                curX = startX; curY = startY;
            } else if (type.toUpperCase() === 'C' || type.toUpperCase() === 'S' || type.toUpperCase() === 'Q' || type.toUpperCase() === 'T' || type.toUpperCase() === 'A') {
                if (nums.length >= 2) {
                    const endX = type === type.toUpperCase() ? nums[nums.length - 2] : curX + nums[nums.length - 2];
                    const endY = type === type.toUpperCase() ? nums[nums.length - 1] : curY + nums[nums.length - 1];
                    len += Math.hypot(endX - curX, endY - curY) * 1.15;
                    curX = endX; curY = endY;
                }
            }
        }
        return len;
    };

    const recalculateSVG = (text: string, widthMm: number, speedMms: number) => {
        if (!text) return;
        try {
            let viewBoxWidth = 800;
            const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/i);
            if (viewBoxMatch) {
                const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
                if (parts.length >= 4 && parts[2] > 0) {
                    viewBoxWidth = parts[2];
                }
            } else {
                const widthMatch = text.match(/width=["']([^"']+)["']/i);
                if (widthMatch) {
                    const w = parseFloat(widthMatch[1]);
                    if (!isNaN(w) && w > 0) viewBoxWidth = w;
                }
            }

            let totalLengthPx = 0;

            // 1. Paths
            const pathMatches = text.matchAll(/<path[^>]*\sd=["']([^"']+)["']/gi);
            for (const match of pathMatches) {
                totalLengthPx += parsePathDataLength(match[1]);
            }

            // 2. Circles
            const circleMatches = text.matchAll(/<circle[^>]*\sr=["']([^"']+)["']/gi);
            for (const match of circleMatches) {
                const r = parseFloat(match[1]) || 0;
                totalLengthPx += 2 * Math.PI * r;
            }

            // 3. Rectangles
            const rectMatches = text.matchAll(/<rect[^>]*\swidth=["']([^"']+)["'][^>]*\sheight=["']([^"']+)["']/gi);
            for (const match of rectMatches) {
                const w = parseFloat(match[1]) || 0;
                const h = parseFloat(match[2]) || 0;
                totalLengthPx += 2 * (w + h);
            }

            // 4. Lines
            const lineMatches = text.matchAll(/<line[^>]*\sx1=["']([^"']+)["'][^>]*\sy1=["']([^"']+)["'][^>]*\sx2=["']([^"']+)["'][^>]*\sy2=["']([^"']+)["']/gi);
            for (const match of lineMatches) {
                const x1 = parseFloat(match[1]) || 0; const y1 = parseFloat(match[2]) || 0;
                const x2 = parseFloat(match[3]) || 0; const y2 = parseFloat(match[4]) || 0;
                totalLengthPx += Math.hypot(x2 - x1, y2 - y1);
            }

            // 5. Polygons / Polylines
            const polyMatches = text.matchAll(/<(polygon|polyline)[^>]*\spoints=["']([^"']+)["']/gi);
            for (const match of polyMatches) {
                const isPolygon = match[1].toLowerCase() === 'polygon';
                const coords = match[2].trim().split(/[\s,]+/).map(Number).filter(v => !isNaN(v));
                let polyLen = 0;
                for (let j = 0; j < coords.length - 3; j += 2) {
                    polyLen += Math.hypot(coords[j+2] - coords[j], coords[j+3] - coords[j+1]);
                }
                if (isPolygon && coords.length >= 4) {
                    const len = coords.length;
                    polyLen += Math.hypot(coords[len-2] - coords[0], coords[len-1] - coords[1]);
                }
                totalLengthPx += polyLen;
            }

            const scale = widthMm / Math.max(viewBoxWidth, 1);
            const finalLengthMm = totalLengthPx * scale;
            setTotalLengthMm(finalLengthMm);

            const timeSeconds = finalLengthMm / Math.max(speedMms, 0.1);
            const timeMinutes = timeSeconds / 60;
            setEstimatedTimeMin(timeMinutes);

        } catch (err) {
            console.error('Error recalculating SVG:', err);
        }
    };

    React.useEffect(() => {
        if (rawSvgText) {
            recalculateSVG(rawSvgText, parseFloat(targetWidth) || 300, parseFloat(cutSpeed) || 30);
        }
    }, [targetWidth, cutSpeed, rawSvgText]);

    const handlePickSVG = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/svg+xml',
                copyToCacheDirectory: true,
            });
            
            if (result.canceled || !result.assets || result.assets.length === 0) return;
            
            const file = result.assets[0];
            setFileName(file.name);
            setAnalyzing(true);
            
            if (Platform.OS === 'web') {
                const webFile = file.file as File;
                const text = await webFile.text();
                setRawSvgText(text);
            } else {
                const text = await FileSystem.readAsStringAsync(file.uri);
                setRawSvgText(text);
            }
        } catch (err: any) {
            console.error(err);
            if (Platform.OS === 'web') {
                window.alert('Failed to read SVG file: ' + err.message);
            } else {
                Alert.alert('Error', 'Failed to read SVG file');
            }
        } finally {
            setAnalyzing(false);
        }
    };

    const handleApplyTime = () => {
        if (estimatedTimeMin <= 0) return;
        setF(prev => ({
            ...prev,
            laserTime: Math.ceil(estimatedTimeMin).toString()
        }));
        
        if (Platform.OS === 'web') {
            window.alert(`Applied ${Math.ceil(estimatedTimeMin)} minutes of laser cut time to the pricing calculator below!`);
        } else {
            Alert.alert('Success', `Applied ${Math.ceil(estimatedTimeMin)} minutes of laser cut time.`);
        }
    };

    const calc = useMemo(() => {
        const qty = Math.max(n(f.quantity), 1);
        // Material cost = sheetCost × (usagePct / 100)
        const materialCost = n(f.sheetCost) * (n(f.usagePct) / 100);
        // Electricity = (laserTime / 60) × electricityRate
        const electricityCost = (n(f.laserTime) / 60) * n(f.electricityRate);
        const machineWear = n(f.machineWear);
        const laborCost = n(f.laborCost);
        const productionCostPerUnit = materialCost + electricityCost + machineWear + laborCost;
        const productionCostTotal = productionCostPerUnit * qty;
        const margin = Math.min(Math.max(n(f.profitMargin), 0), 99.9);
        // Selling price using margin: price = cost / (1 - margin/100)
        const sellingPricePerUnit = margin > 0
            ? productionCostPerUnit / (1 - margin / 100)
            : productionCostPerUnit;
        const sellingPriceTotal = sellingPricePerUnit * qty;
        const profitPerUnit = sellingPricePerUnit - productionCostPerUnit;
        const profitTotal = profitPerUnit * qty;
        const effectiveMargin = sellingPricePerUnit > 0
            ? (profitPerUnit / sellingPricePerUnit) * 100
            : 0;

        return {
            materialCost, electricityCost, machineWear, laborCost,
            productionCostPerUnit, productionCostTotal,
            sellingPricePerUnit, sellingPriceTotal,
            profitPerUnit, profitTotal,
            effectiveMargin, qty,
        };
    }, [f]);

    const { user } = useAuth();

    useEffect(() => {
        if (calc && calc.productionCostTotal > 0) {
            trackEvent('activated', { feature: 'cost_calculator' }, `activated_${user?.id || 'guest'}`);
        }
    }, [calc?.productionCostTotal, user?.id]);

    const reset = () => setF(DEFAULT);
    const fmt = (v: number) => `$${v.toFixed(2)}`;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.headerIcon}>
                        <Calculator color={C.primary} size={20} />
                    </View>
                    <View>
                        <Text style={styles.title}>Cost Calculator</Text>
                        <Text style={styles.subtitle}>Real-time project cost & profit calculation</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* ── SVG File Analyzer Card ── */}
                <View style={styles.analyzerCard}>
                    <View style={styles.analyzerHeader}>
                        <View style={styles.analyzerTitleRow}>
                            <UploadCloud color={C.primary} size={18} />
                            <Text style={styles.analyzerTitle}>SVG Vector File Analyzer (Auto-Estimate)</Text>
                        </View>
                        <Text style={styles.analyzerSubtitle}>
                            Upload a vector design file to automatically compute its cut path length and estimate cutting time.
                        </Text>
                    </View>

                    <View style={styles.analyzerBody}>
                        {/* Drop / picker zone */}
                        <TouchableOpacity style={styles.uploadZone} onPress={handlePickSVG}>
                            {analyzing ? (
                                <ActivityIndicator color={C.primary} size="small" />
                            ) : fileName ? (
                                <View style={styles.uploadZoneContent}>
                                    <FileText color={C.green} size={24} />
                                    <Text style={styles.fileNameText}>{fileName}</Text>
                                    <Text style={styles.changeFileText}>Change design file</Text>
                                </View>
                            ) : (
                                <View style={styles.uploadZoneContent}>
                                    <UploadCloud color={C.sub} size={28} />
                                    <Text style={styles.uploadZoneText}>Click to select SVG vector file</Text>
                                    <Text style={styles.uploadZoneHint}>optimized for Web browser</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {fileName ? (
                            <View style={styles.analyzerParams}>
                                <View style={styles.paramGroup}>
                                    <Text style={styles.paramLabel}>Design Width (mm)</Text>
                                    <TextInput
                                        style={styles.paramInput}
                                        value={targetWidth}
                                        onChangeText={setTargetWidth}
                                        keyboardType="decimal-pad"
                                        placeholder="300"
                                    />
                                    <Text style={styles.paramHint}>Used to scale paths correctly</Text>
                                </View>

                                <View style={styles.paramGroup}>
                                    <Text style={styles.paramLabel}>Cut Speed (mm/s)</Text>
                                    <TextInput
                                        style={styles.paramInput}
                                        value={cutSpeed}
                                        onChangeText={setCutSpeed}
                                        keyboardType="decimal-pad"
                                        placeholder="30"
                                    />
                                    <Text style={styles.paramHint}>Laser head speed for cutting</Text>
                                </View>

                                <View style={styles.metricsGroup}>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Total Cut Length:</Text>
                                        <Text style={styles.metricValue}>
                                            {(totalLengthMm / 1000).toFixed(2)} meters <Text style={styles.metricUnit}>({Math.round(totalLengthMm)} mm)</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.metricRow}>
                                        <Text style={styles.metricLabel}>Est. Cut Time:</Text>
                                        <Text style={[styles.metricValue, { color: C.primary }]}>
                                            {estimatedTimeMin.toFixed(1)} mins <Text style={styles.metricUnit}>({Math.ceil(estimatedTimeMin * 60)} secs)</Text>
                                        </Text>
                                    </View>

                                    <TouchableOpacity style={styles.applyBtn} onPress={handleApplyTime}>
                                        <Check color="#FFF" size={14} />
                                        <Text style={styles.applyBtnText}>Apply to Calculator</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.grid}>
                    {/* ── Form ── */}
                    <View style={styles.formCard}>
                        <Text style={styles.cardTitle}>Project Details</Text>

                        <View style={styles.row}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Project Name</Text>
                                <TextInput style={styles.input} value={f.projectName}
                                    onChangeText={upd('projectName')} placeholder="Custom Coasters"
                                    placeholderTextColor={C.sub} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Material</Text>
                                <TextInput style={styles.input} value={f.materialType}
                                    onChangeText={upd('materialType')} placeholder="Birch Plywood 3mm"
                                    placeholderTextColor={C.sub} />
                            </View>
                        </View>

                        <View style={styles.sectionLabel}>
                            <DollarSign color={C.sub} size={14} />
                            <Text style={styles.sectionLabelText}>Material</Text>
                        </View>
                        <View style={styles.row}>
                            <InputField label="Sheet Cost ($)" value={f.sheetCost} onChange={upd('sheetCost')} placeholder="25.00" prefix="$" />
                            <InputField label="Usage (%)" value={f.usagePct} onChange={upd('usagePct')} placeholder="80" />
                        </View>
                        <View style={styles.row}>
                            <InputField label="Sheet Width (mm)" value={f.sheetWidth} onChange={upd('sheetWidth')} placeholder="600" />
                            <InputField label="Sheet Height (mm)" value={f.sheetHeight} onChange={upd('sheetHeight')} placeholder="400" />
                        </View>

                        <View style={styles.sectionLabel}>
                            <Zap color={C.sub} size={14} />
                            <Text style={styles.sectionLabelText}>Machine & Energy</Text>
                        </View>
                        <View style={styles.row}>
                            <InputField label="Laser Time (min)" value={f.laserTime} onChange={upd('laserTime')} placeholder="45" />
                            <InputField label="Electricity ($/hr)" value={f.electricityRate} onChange={upd('electricityRate')} placeholder="0.15" prefix="$" />
                        </View>
                        <View style={styles.row}>
                            <InputField label="Machine Wear ($)" value={f.machineWear} onChange={upd('machineWear')} placeholder="2.00" prefix="$" />
                            <InputField label="Labor Cost ($)" value={f.laborCost} onChange={upd('laborCost')} placeholder="10.00" prefix="$" />
                        </View>

                        <View style={styles.sectionLabel}>
                            <Clock color={C.sub} size={14} />
                            <Text style={styles.sectionLabelText}>Pricing</Text>
                        </View>
                        <View style={styles.row}>
                            <InputField label="Profit Margin (%)" value={f.profitMargin} onChange={upd('profitMargin')} placeholder="30" />
                            <InputField label="Quantity" value={f.quantity} onChange={upd('quantity')} placeholder="1" />
                        </View>
                    </View>

                    {/* ── Results ── */}
                    <View style={styles.sidebar}>
                        {/* Cost Breakdown */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Cost Breakdown</Text>
                            <Text style={styles.perUnit}>Per unit</Text>
                            <CostRow icon={<DollarSign color={C.sub} size={14}/>} label="Material" value={fmt(calc.materialCost)} />
                            <CostRow icon={<Zap color={C.sub} size={14}/>} label="Electricity" value={fmt(calc.electricityCost)} />
                            <CostRow icon={<Wrench color={C.sub} size={14}/>} label="Machine Wear" value={fmt(calc.machineWear)} />
                            <CostRow icon={<Clock color={C.sub} size={14}/>} label="Labor" value={fmt(calc.laborCost)} />
                            <View style={styles.divider} />
                            <View style={styles.costRow}>
                                <Text style={styles.totalLabel}>Production Cost / unit</Text>
                                <Text style={styles.totalValue}>{fmt(calc.productionCostPerUnit)}</Text>
                            </View>
                            {calc.qty > 1 && (
                                <View style={styles.costRow}>
                                    <Text style={styles.totalLabel}>Production Cost × {calc.qty}</Text>
                                    <Text style={styles.totalValue}>{fmt(calc.productionCostTotal)}</Text>
                                </View>
                            )}
                        </View>

                        {/* Selling Price */}
                        <View style={[styles.card, styles.priceCard]}>
                            <Text style={styles.cardTitle}>Recommended Pricing</Text>
                            <View style={styles.bigPrice}>
                                <Text style={styles.bigPriceLabel}>Selling Price</Text>
                                <Text style={styles.bigPriceValue}>{fmt(calc.sellingPricePerUnit)}<Text style={styles.bigPriceUnit}>/unit</Text></Text>
                                {calc.qty > 1 && <Text style={styles.totalPriceTotal}>Total: {fmt(calc.sellingPriceTotal)}</Text>}
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.profitGrid}>
                                <ProfitStat label="Profit / unit" value={fmt(calc.profitPerUnit)} color={C.green} />
                                <ProfitStat label="Margin" value={`${calc.effectiveMargin.toFixed(1)}%`} color={C.blue} />
                                {calc.qty > 1 && <ProfitStat label="Total Profit" value={fmt(calc.profitTotal)} color={C.green} />}
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                                <RotateCcw color={C.sub} size={18} />
                                <Text style={styles.resetBtnText}>Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <OnboardingModal
                visible={showOnboarding}
                onComplete={(data) => {
                    setShowOnboarding(false);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('0machine_onboarded', 'true');
                    }
                    // Auto-fill calculator with initial stock material & project
                    setF(prev => ({
                        ...prev,
                        projectName: 'Sample Laser Sign Project',
                        materialType: data.material === 'birch_3mm' ? 'Birch Plywood 3mm' : 'Cast Acrylic 3mm',
                        sheetCost: data.material === 'birch_3mm' ? '12.00' : '18.50',
                        laserTime: '15',
                        machineWear: '2.50',
                        laborCost: '10.00',
                    }));
                }}
            />
        </SafeAreaView>
    );
}

function CostRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <View style={styles.costRow}>
            <View style={styles.costRowLeft}>
                {icon}
                <Text style={styles.costLabel}>{label}</Text>
            </View>
            <Text style={styles.costValue}>{value}</Text>
        </View>
    );
}

function ProfitStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.profitStat, { borderColor: color + '30', backgroundColor: color + '10' }]}>
            <Text style={[styles.profitStatValue, { color }]}>{value}</Text>
            <Text style={styles.profitStatLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    header: { padding: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary + '15', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 13, color: C.sub, marginTop: 2 },
    scroll: { padding: 24, paddingTop: 0, paddingBottom: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    formCard: {
        flex: 2, minWidth: 300, backgroundColor: C.surface, borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 16 },
    sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
    sectionLabelText: { fontSize: 12, fontWeight: '700', color: C.sub, letterSpacing: 0.5, textTransform: 'uppercase' },
    row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
    inputGroup: { flex: 1, marginBottom: 12 },
    label: { fontSize: 12, fontWeight: '600', color: C.text, marginBottom: 6 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, backgroundColor: C.surface, overflow: 'hidden' },
    inputPrefix: { paddingHorizontal: 10, fontSize: 14, color: C.sub, backgroundColor: C.surface2, alignSelf: 'stretch', textAlignVertical: 'center', lineHeight: 44 },
    input: { flex: 1, height: 44, paddingHorizontal: 12, color: C.text, fontSize: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) },
    inputPrefixed: { borderRadius: 0 },
    sidebar: { flex: 1, minWidth: 260, gap: 16 },
    card: {
        backgroundColor: C.surface, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: C.border,
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    priceCard: { borderColor: C.primary + '40', borderWidth: 2 },
    perUnit: { fontSize: 11, fontWeight: '600', color: C.sub, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    costRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    costLabel: { color: C.sub, fontSize: 14 },
    costValue: { color: C.text, fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
    totalLabel: { color: C.text, fontSize: 14, fontWeight: '700' },
    totalValue: { color: C.text, fontSize: 14, fontWeight: '800' },
    bigPrice: { alignItems: 'center', paddingVertical: 12 },
    bigPriceLabel: { fontSize: 13, color: C.sub, fontWeight: '600', marginBottom: 4 },
    bigPriceValue: { fontSize: 36, fontWeight: '900', color: C.primary },
    bigPriceUnit: { fontSize: 16, fontWeight: '600', color: C.sub },
    totalPriceTotal: { fontSize: 14, color: C.sub, marginTop: 4 },
    profitGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    profitStat: { flex: 1, minWidth: 80, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center' },
    profitStatValue: { fontSize: 16, fontWeight: '800' },
    profitStatLabel: { fontSize: 11, color: C.sub, marginTop: 2, fontWeight: '600' },
    actionsRow: { gap: 8 },
    resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    resetBtnText: { color: C.sub, fontSize: 14, fontWeight: '600' },
    analyzerCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 24,
        width: '100%',
        ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any }),
    },
    analyzerHeader: {
        marginBottom: 20,
    },
    analyzerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    analyzerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: C.text,
    },
    analyzerSubtitle: {
        fontSize: 13,
        color: C.sub,
        lineHeight: 18,
    },
    analyzerBody: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    uploadZone: {
        flex: 1,
        minWidth: 260,
        borderWidth: 2,
        borderColor: C.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.01)',
    },
    uploadZoneContent: {
        alignItems: 'center',
        gap: 10,
    },
    uploadZoneText: {
        color: C.text,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    uploadZoneHint: {
        color: C.sub,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fileNameText: {
        color: C.green,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    changeFileText: {
        color: C.primary,
        fontSize: 12,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    analyzerParams: {
        flex: 1.2,
        minWidth: 280,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: C.border,
        gap: 16,
    },
    paramGroup: {
        gap: 6,
    },
    paramLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: C.text,
    },
    paramInput: {
        height: 40,
        backgroundColor: C.surface2,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        color: C.text,
        fontSize: 14,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
    },
    paramHint: {
        fontSize: 11,
        color: C.sub,
    },
    metricsGroup: {
        marginTop: 8,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 16,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: C.sub,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '800',
        color: C.text,
    },
    metricUnit: {
        fontSize: 11,
        fontWeight: '500',
        color: C.sub,
    },
    applyBtn: {
        backgroundColor: C.green,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    applyBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
