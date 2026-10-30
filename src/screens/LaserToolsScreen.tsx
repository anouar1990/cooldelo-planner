import React, { useState, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, TextInput, Platform, useWindowDimensions,
} from 'react-native';
import {
    Sliders, Download, Grid, Box, RefreshCw, Zap,
    Layers, Copy, Check, Info, FileCode, Wrench, ShieldCheck
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../hooks/useSubscription';
import {
    generateDxfString,
    triggerFileDownload,
    Point,
    LineSegment,
    TextEntity,
    PolylineEntity
} from '../lib/dxf-generator';

const C = {
    bg: '#111317', surface: '#1A1D21', surface2: '#23262C',
    border: 'rgba(255,255,255,0.08)', primary: '#FE7733',
    blue: '#3B82F6', green: '#10B981', amber: '#F59E0B',
    red: '#EF4444', text: '#FFFFFF', sub: '#8B95A8',
};

type ToolTab = 'matrix' | 'box' | 'hinge';

export default function LaserToolsScreen() {
    const { t } = useLanguage();
    const { colors } = useTheme();
    const { isPro } = useSubscription();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [activeTab, setActiveTab] = useState<ToolTab>('matrix');
    const [copied, setCopied] = useState(false);

    // ==========================================
    // 1. KERF & TEST MATRIX STATE
    // ==========================================
    const [matrixMode, setMatrixMode] = useState<'cut' | 'engrave'>('cut');
    const [minSpeed, setMinSpeed] = useState('200');
    const [maxSpeed, setMaxSpeed] = useState('1000');
    const [speedSteps, setSpeedSteps] = useState('5');
    const [minPower, setMinPower] = useState('20');
    const [maxPower, setMaxPower] = useState('100');
    const [powerSteps, setPowerSteps] = useState('5');
    const [cellSize, setCellSize] = useState('12');
    const [includeKerfSlits, setIncludeKerfSlits] = useState(true);

    // ==========================================
    // 2. FINGER JOINT BOX STATE
    // ==========================================
    const [boxWidth, setBoxWidth] = useState('120');   // X
    const [boxDepth, setBoxDepth] = useState('80');    // Y
    const [boxHeight, setBoxHeight] = useState('60');   // Z
    const [materialThick, setMaterialThick] = useState('3.0');
    const [fingerSize, setFingerSize] = useState('12.0');
    const [boxKerf, setBoxKerf] = useState('0.15');
    const [hasLid, setHasLid] = useState(true);

    // ==========================================
    // 3. LIVING HINGE STATE
    // ==========================================
    const [hingeW, setHingeW] = useState('100');
    const [hingeH, setHingeH] = useState('60');
    const [cutLength, setCutLength] = useState('18');
    const [cutSpacing, setCutSpacing] = useState('3.5');
    const [lineGap, setLineGap] = useState('2.5');

    // =========================================================================
    // MATRIX GEOMETRY & GENERATION
    // =========================================================================
    const matrixData = useMemo(() => {
        const sMin = Math.max(10, parseFloat(minSpeed) || 100);
        const sMax = Math.max(sMin + 10, parseFloat(maxSpeed) || 800);
        const sCount = Math.max(2, Math.min(10, parseInt(speedSteps) || 5));

        const pMin = Math.max(5, parseFloat(minPower) || 10);
        const pMax = Math.max(pMin + 5, Math.min(100, parseFloat(maxPower) || 100));
        const pCount = Math.max(2, Math.min(10, parseInt(powerSteps) || 5));

        const cSize = Math.max(6, Math.min(30, parseFloat(cellSize) || 12));
        const gap = 3;

        // Speeds array (Y axis, top to bottom or bottom to top)
        const speeds: number[] = [];
        for (let i = 0; i < sCount; i++) {
            speeds.push(Math.round(sMin + (sMax - sMin) * (i / (sCount - 1))));
        }

        // Powers array (X axis, left to right)
        const powers: number[] = [];
        for (let j = 0; j < pCount; j++) {
            powers.push(Math.round(pMin + (pMax - pMin) * (j / (pCount - 1))));
        }

        const lines: LineSegment[] = [];
        const polylines: PolylineEntity[] = [];
        const texts: TextEntity[] = [];

        const startX = 25; // Margin for Y labels
        const startY = 15; // Margin for X labels

        // Grid cells
        for (let r = 0; r < sCount; r++) {
            const y = startY + r * (cSize + gap);
            for (let c = 0; c < pCount; c++) {
                const x = startX + c * (cSize + gap);

                polylines.push({
                    layer: matrixMode === 'cut' ? 'CUT' : 'ENGRAVE',
                    closed: true,
                    points: [
                        { x, y },
                        { x: x + cSize, y },
                        { x: x + cSize, y: y + cSize },
                        { x, y: y + cSize },
                    ]
                });

                if (matrixMode === 'engrave') {
                    // Add internal hatch lines to represent engraving density
                    const hatchCount = Math.max(1, Math.round((powers[c] / 100) * 8));
                    const step = cSize / (hatchCount + 1);
                    for (let h = 1; h <= hatchCount; h++) {
                        lines.push({
                            layer: 'ENGRAVE',
                            x1: x + 1,
                            y1: y + h * step,
                            x2: x + cSize - 1,
                            y2: y + h * step,
                        });
                    }
                }
            }
        }

        // X Labels (Power %)
        for (let c = 0; c < pCount; c++) {
            const x = startX + c * (cSize + gap) + cSize / 2;
            texts.push({
                text: `${powers[c]}%`,
                x: x - 4,
                y: startY - 4,
                height: 2.8,
                layer: 'ENGRAVE'
            });
        }

        // Y Labels (Speed mm/min)
        for (let r = 0; r < sCount; r++) {
            const y = startY + r * (cSize + gap) + cSize / 2 + 1;
            texts.push({
                text: `${speeds[r]}`,
                x: 2,
                y: y,
                height: 2.8,
                layer: 'ENGRAVE'
            });
        }

        // Title Header Text
        texts.push({
            text: `0machine Matrix [${matrixMode.toUpperCase()}] Speed vs Power`,
            x: startX,
            y: startY - 10,
            height: 3.5,
            layer: 'ENGRAVE'
        });

        // Kerf Feeler Gauge Slits at the bottom
        const totalW = startX + pCount * (cSize + gap);
        let totalH = startY + sCount * (cSize + gap) + 6;

        if (includeKerfSlits) {
            const slitY = totalH + 8;
            const slitH = 14;
            const feelerGaps = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35];

            // Outer gauge box
            polylines.push({
                layer: 'CUT',
                closed: true,
                points: [
                    { x: startX, y: slitY },
                    { x: startX + 68, y: slitY },
                    { x: startX + 68, y: slitY + slitH },
                    { x: startX, y: slitY + slitH },
                ]
            });

            texts.push({
                text: 'KERF FEELER SLITS (mm)',
                x: startX + 4,
                y: slitY + 3,
                height: 2.2,
                layer: 'ENGRAVE'
            });

            feelerGaps.forEach((slitW, idx) => {
                const sx = startX + 8 + idx * 10;
                // Cut slot
                polylines.push({
                    layer: 'CUT',
                    closed: true,
                    points: [
                        { x: sx, y: slitY + 5 },
                        { x: sx + slitW, y: slitY + 5 },
                        { x: sx + slitW, y: slitY + slitH },
                        { x: sx, y: slitY + slitH },
                    ]
                });
                // Slot label
                texts.push({
                    text: `${slitW.toFixed(2)}`,
                    x: sx - 2.5,
                    y: slitY + slitH + 3.5,
                    height: 1.8,
                    layer: 'ENGRAVE'
                });
            });

            totalH = slitY + slitH + 8;
        }

        return {
            lines, polylines, texts,
            width: Math.max(totalW + 10, 85),
            height: totalH + 5,
            speeds, powers, cSize, gap, startX, startY
        };
    }, [minSpeed, maxSpeed, speedSteps, minPower, maxPower, powerSteps, cellSize, matrixMode, includeKerfSlits]);

    // =========================================================================
    // FINGER JOINT BOX GEOMETRY & GENERATION
    // =========================================================================
    const boxData = useMemo(() => {
        const W = Math.max(20, parseFloat(boxWidth) || 100);
        const D = Math.max(20, parseFloat(boxDepth) || 80);
        const H = Math.max(20, parseFloat(boxHeight) || 50);
        const T = Math.max(1, parseFloat(materialThick) || 3.0);
        const F = Math.max(4, parseFloat(fingerSize) || 12.0);
        const K = parseFloat(boxKerf) || 0.15; // Kerf offset

        /**
         * Generates an interlocking finger joint edge path.
         * isMale: If true, tabs extend outward by T. If false, slots indent inward by T.
         */
        function makeFingerEdge(
            p1: Point,
            p2: Point,
            isMale: boolean,
            tabSize: number,
            thickness: number,
            kerf: number
        ): Point[] {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length <= 0) return [p1, p2];

            // Unit vector along edge
            const ux = dx / length;
            const uy = dy / length;

            // Unit normal pointing OUTWARDS (right hand rule for clockwise polyline)
            const nx = -uy;
            const ny = ux;

            // Calculate number of fingers (odd count preferred for symmetric corners)
            let count = Math.max(3, Math.floor(length / tabSize));
            if (count % 2 === 0) count += 1;
            const step = length / count;

            const pts: Point[] = [p1];

            for (let i = 0; i < count; i++) {
                const isTab = i % 2 === 1; // Alternating
                const shouldExtend = isMale ? isTab : !isTab;
                const offsetDist = shouldExtend ? (isMale ? thickness : -thickness) : 0;

                // Adjust for kerf: tabs get wider, slots get narrower so they mate tightly!
                const kerfShift = shouldExtend ? kerf : -kerf;

                const startDist = Math.max(0, i * step - kerfShift);
                const endDist = Math.min(length, (i + 1) * step + kerfShift);

                const baseA = { x: p1.x + ux * startDist, y: p1.y + uy * startDist };
                const baseB = { x: p1.x + ux * endDist, y: p1.y + uy * endDist };

                if (offsetDist !== 0) {
                    pts.push({ x: baseA.x + nx * offsetDist, y: baseA.y + ny * offsetDist });
                    pts.push({ x: baseB.x + nx * offsetDist, y: baseB.y + ny * offsetDist });
                } else {
                    pts.push(baseA);
                    pts.push(baseB);
                }
            }

            pts.push(p2);
            return pts;
        }

        /**
         * Creates a rectangular panel with finger joints on its 4 edges.
         */
        function createBoxPanel(
            x: number, y: number,
            w: number, h: number,
            maleTop: boolean, maleRight: boolean, maleBottom: boolean, maleLeft: boolean,
            label: string
        ): { polyline: PolylineEntity; labelText: TextEntity } {
            const pTL = { x, y };
            const pTR = { x: x + w, y };
            const pBR = { x: x + w, y: y + h };
            const pBL = { x, y: y + h };

            const topEdge = makeFingerEdge(pTL, pTR, maleTop, F, T, K);
            const rightEdge = makeFingerEdge(pTR, pBR, maleRight, F, T, K);
            const bottomEdge = makeFingerEdge(pBR, pBL, maleBottom, F, T, K);
            const leftEdge = makeFingerEdge(pBL, pTL, maleLeft, F, T, K);

            const allPoints = [...topEdge, ...rightEdge, ...bottomEdge, ...leftEdge];

            return {
                polyline: {
                    layer: 'CUT',
                    closed: true,
                    points: allPoints
                },
                labelText: {
                    text: `${label} (${w}×${h}mm)`,
                    x: x + 6,
                    y: y + h / 2,
                    height: 3.5,
                    layer: 'ENGRAVE'
                }
            };
        }

        const polylines: PolylineEntity[] = [];
        const texts: TextEntity[] = [];
        const gap = 12;

        // Arranged in 2 rows of 3 panels for optimal laser sheet nesting:
        // Row 1: Bottom (W×D), Top (W×D), Left (D×H)
        // Row 2: Front (W×H), Back (W×H), Right (D×H)
        let curX = 10;
        let curY = 10;

        // 1. Bottom Panel (W x D)
        const bottom = createBoxPanel(curX, curY, W, D, false, false, false, false, 'BOTTOM');
        polylines.push(bottom.polyline);
        texts.push(bottom.labelText);

        // 2. Top Lid (W x D)
        if (hasLid) {
            const top = createBoxPanel(curX + W + gap, curY, W, D, false, false, false, false, 'TOP LID');
            polylines.push(top.polyline);
            texts.push(top.labelText);
        }

        // 3. Left Panel (D x H)
        const left = createBoxPanel(curX + (hasLid ? (W + gap) * 2 : W + gap), curY, D, H, true, true, true, true, 'LEFT');
        polylines.push(left.polyline);
        texts.push(left.labelText);

        // Row 2
        curY += Math.max(D, H) + gap + 4;

        // 4. Front Panel (W x H)
        const front = createBoxPanel(curX, curY, W, H, true, false, true, false, 'FRONT');
        polylines.push(front.polyline);
        texts.push(front.labelText);

        // 5. Back Panel (W x H)
        const back = createBoxPanel(curX + W + gap, curY, W, H, true, false, true, false, 'BACK');
        polylines.push(back.polyline);
        texts.push(back.labelText);

        // 6. Right Panel (D x H)
        const right = createBoxPanel(curX + (W + gap) * 2, curY, D, H, true, true, true, true, 'RIGHT');
        polylines.push(right.polyline);
        texts.push(right.labelText);

        const totalWidth = curX + (W + gap) * 2 + D + 20;
        const totalHeight = curY + H + 25;

        return {
            lines: [] as LineSegment[],
            polylines,
            texts,
            width: totalWidth,
            height: totalHeight,
        };
    }, [boxWidth, boxDepth, boxHeight, materialThick, fingerSize, boxKerf, hasLid]);

    // =========================================================================
    // LIVING HINGE PATTERN GENERATION
    // =========================================================================
    const hingeData = useMemo(() => {
        const W = Math.max(20, parseFloat(hingeW) || 100);
        const H = Math.max(20, parseFloat(hingeH) || 60);
        const cLen = Math.max(5, parseFloat(cutLength) || 18);
        const cSpace = Math.max(1, parseFloat(cutSpacing) || 3.5);
        const lGap = Math.max(1, parseFloat(lineGap) || 2.5);

        const lines: LineSegment[] = [];
        const polylines: PolylineEntity[] = [];
        const texts: TextEntity[] = [];

        // Outer border
        polylines.push({
            layer: 'CUT',
            closed: true,
            points: [
                { x: 10, y: 10 },
                { x: 10 + W, y: 10 },
                { x: 10 + W, y: 10 + H },
                { x: 10, y: 10 + H },
            ]
        });

        // Alternating cut lines along X axis
        const numColumns = Math.floor((W - 8) / lGap);
        for (let col = 0; col < numColumns; col++) {
            const x = 14 + col * lGap;
            const isOffset = col % 2 === 1;
            const startY = 12 + (isOffset ? (cLen / 2 + cSpace / 2) : 0);

            let y = startY;
            while (y + cLen <= 10 + H - 2) {
                lines.push({
                    x1: x,
                    y1: y,
                    x2: x,
                    y2: y + cLen,
                    layer: 'CUT'
                });
                y += cLen + cSpace;
            }
        }

        texts.push({
            text: `0machine Living Hinge (${W}×${H}mm, gap=${lGap}mm)`,
            x: 12,
            y: 10 + H + 8,
            height: 3,
            layer: 'ENGRAVE'
        });

        return {
            lines,
            polylines,
            texts,
            width: W + 24,
            height: H + 26
        };
    }, [hingeW, hingeH, cutLength, cutSpacing, lineGap]);

    // Current active geometry
    const activeGeometry = activeTab === 'matrix' ? matrixData : activeTab === 'box' ? boxData : hingeData;

    // =========================================================================
    // SVG & DXF EXPORT HANDLERS
    // =========================================================================
    const handleDownloadSvg = () => {
        const { lines, polylines, texts, width: w, height: h } = activeGeometry;
        const svgLines = lines.map(l =>
            `<line x1="${l.x1.toFixed(2)}" y1="${l.y1.toFixed(2)}" x2="${l.x2.toFixed(2)}" y2="${l.y2.toFixed(2)}" stroke="${l.layer === 'CUT' ? '#EF4444' : '#3B82F6'}" stroke-width="0.3"/>`
        ).join('\n  ');

        const svgPolys = polylines.map(p => {
            const pts = p.points.map(pt => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');
            return `<polygon points="${pts}" fill="none" stroke="${p.layer === 'CUT' ? '#EF4444' : '#3B82F6'}" stroke-width="0.4"/>`;
        }).join('\n  ');

        const svgTexts = texts.map(t =>
            `<text x="${t.x.toFixed(2)}" y="${t.y.toFixed(2)}" font-size="${t.height.toFixed(2)}" fill="#3B82F6" font-family="monospace">${t.text}</text>`
        ).join('\n  ');

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" width="${w.toFixed(1)}mm" height="${h.toFixed(1)}mm">
  <!-- Generated by 0machine CAD Tools (Red=Cut, Blue=Engrave) -->
  ${svgPolys}
  ${svgLines}
  ${svgTexts}
</svg>`;

        const filename = `0machine_${activeTab}_${Date.now()}.svg`;
        triggerFileDownload(filename, svg, 'image/svg+xml');
    };

    const handleDownloadDxf = () => {
        const dxfStr = generateDxfString({
            lines: activeGeometry.lines,
            polylines: activeGeometry.polylines,
            texts: activeGeometry.texts
        });
        const filename = `0machine_${activeTab}_${Date.now()}.dxf`;
        triggerFileDownload(filename, dxfStr, 'application/dxf');
    };

    const handleCopyDxf = () => {
        const dxfStr = generateDxfString({
            lines: activeGeometry.lines,
            polylines: activeGeometry.polylines,
            texts: activeGeometry.texts
        });
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(dxfStr);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Laser CAD & Workshop Utilities</Text>
                        <View style={styles.proPill}>
                            <Zap size={11} color="#111317" fill="#111317" />
                            <Text style={styles.proPillText}>CUT-READY</Text>
                        </View>
                    </View>
                    <Text style={[styles.headerSub, { color: colors.sub }]}>
                        Generate parametric boxes, calibrated kerf matrices & bend patterns with instant DXF & SVG export.
                    </Text>
                </View>

                {/* Export Buttons */}
                <View style={styles.exportActions}>
                    <TouchableOpacity style={styles.btnSvg} onPress={handleDownloadSvg}>
                        <Download size={14} color="#FFF" />
                        <Text style={styles.btnText}>Export SVG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnDxf} onPress={handleDownloadDxf}>
                        <FileCode size={14} color="#111317" />
                        <Text style={[styles.btnText, { color: '#111317', fontWeight: '800' }]}>Export DXF</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sub-tabs Selector */}
            <View style={[styles.tabsBar, { borderColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'matrix' && styles.tabBtnActive]}
                    onPress={() => setActiveTab('matrix')}
                >
                    <Grid size={16} color={activeTab === 'matrix' ? C.primary : C.sub} />
                    <Text style={[styles.tabBtnText, activeTab === 'matrix' && styles.tabBtnTextActive]}>
                        🎯 Kerf & Test Matrix
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'box' && styles.tabBtnActive]}
                    onPress={() => setActiveTab('box')}
                >
                    <Box size={16} color={activeTab === 'box' ? C.primary : C.sub} />
                    <Text style={[styles.tabBtnText, activeTab === 'box' && styles.tabBtnTextActive]}>
                        📦 Finger Joint Box Maker
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'hinge' && styles.tabBtnActive]}
                    onPress={() => setActiveTab('hinge')}
                >
                    <Layers size={16} color={activeTab === 'hinge' ? C.primary : C.sub} />
                    <Text style={[styles.tabBtnText, activeTab === 'hinge' && styles.tabBtnTextActive]}>
                        〰️ Living Hinge Pattern
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Main Content Layout */}
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={[styles.mainLayout, isMobile && { flexDirection: 'column' }]}>
                    
                    {/* LEFT CONTROLS PANEL */}
                    <View style={[styles.controlsCard, { backgroundColor: colors.surface, borderColor: colors.border }, isMobile && { width: '100%' }]}>
                        {activeTab === 'matrix' && (
                            <View style={styles.controlGroup}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>🎯 Test Matrix Setup</Text>
                                <Text style={styles.fieldDesc}>
                                    Burn a grid of varying speed & power to calibrate laser power or find exact kerf on scrap material.
                                </Text>

                                {/* Mode Toggle */}
                                <View style={styles.modeToggleRow}>
                                    <TouchableOpacity
                                        style={[styles.modeToggleBtn, matrixMode === 'cut' && styles.modeToggleBtnActive]}
                                        onPress={() => setMatrixMode('cut')}
                                    >
                                        <Text style={[styles.modeToggleText, matrixMode === 'cut' && styles.modeToggleTextActive]}>
                                            Vector Cut Through
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modeToggleBtn, matrixMode === 'engrave' && styles.modeToggleBtnActive]}
                                        onPress={() => setMatrixMode('engrave')}
                                    >
                                        <Text style={[styles.modeToggleText, matrixMode === 'engrave' && styles.modeToggleTextActive]}>
                                            Raster / Engrave
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Speed range */}
                                <Text style={styles.sectionHeader}>Speed Range (mm/min)</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Min Speed</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={minSpeed}
                                            onChangeText={setMinSpeed}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Max Speed</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={maxSpeed}
                                            onChangeText={setMaxSpeed}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Steps</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={speedSteps}
                                            onChangeText={setSpeedSteps}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                {/* Power range */}
                                <Text style={styles.sectionHeader}>Power Range (%)</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Min Power %</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={minPower}
                                            onChangeText={setMinPower}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Max Power %</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={maxPower}
                                            onChangeText={setMaxPower}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Steps</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={powerSteps}
                                            onChangeText={setPowerSteps}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                {/* Cell Size & Kerf Slits */}
                                <View style={styles.inputRow}>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Cell Size (mm)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={cellSize}
                                            onChangeText={setCellSize}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[styles.inputWrap, { flex: 1.5, justifyContent: 'center' }]}>
                                        <TouchableOpacity
                                            style={styles.checkboxRow}
                                            onPress={() => setIncludeKerfSlits(!includeKerfSlits)}
                                        >
                                            <View style={[styles.checkbox, includeKerfSlits && styles.checkboxActive]}>
                                                {includeKerfSlits && <Check size={12} color="#111317" />}
                                            </View>
                                            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Include Feeler Gauge (0.1-0.35mm)</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.infoTip}>
                                    <Info size={14} color={C.blue} />
                                    <Text style={styles.infoTipText}>
                                        Tip: Slits measure real beam kerf. Slip a cut coupon into the slits to see which thickness locks tight.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {activeTab === 'box' && (
                            <View style={styles.controlGroup}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>📦 Parametric Box Dimensions</Text>
                                <Text style={styles.fieldDesc}>
                                    Generates 6 interlocking panels with automatic kerf offset for tight, glue-free press fitting.
                                </Text>

                                {/* Dimensions W, D, H */}
                                <Text style={styles.sectionHeader}>External Size (mm)</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Width (X)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={boxWidth}
                                            onChangeText={setBoxWidth}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Depth (Y)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={boxDepth}
                                            onChangeText={setBoxDepth}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Height (Z)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={boxHeight}
                                            onChangeText={setBoxHeight}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                {/* Material & Joint Parameters */}
                                <Text style={styles.sectionHeader}>Material & Joint Offsets</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Thickness (T)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={materialThick}
                                            onChangeText={setMaterialThick}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Finger Size</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={fingerSize}
                                            onChangeText={setFingerSize}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Kerf Offset (mm)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={boxKerf}
                                            onChangeText={setBoxKerf}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setHasLid(!hasLid)}
                                >
                                    <View style={[styles.checkbox, hasLid && styles.checkboxActive]}>
                                        {hasLid && <Check size={12} color="#111317" />}
                                    </View>
                                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>Include Top Lid (6 panels vs 5 open)</Text>
                                </TouchableOpacity>

                                <View style={styles.infoTip}>
                                    <ShieldCheck size={14} color={C.green} />
                                    <Text style={styles.infoTipText}>
                                        Kerf compensation: Tabs are widened by +{boxKerf}mm so wood fibers snap tightly without glue.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {activeTab === 'hinge' && (
                            <View style={styles.controlGroup}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>〰️ Living Hinge Lattice</Text>
                                <Text style={styles.fieldDesc}>
                                    Lattice spring cuts that enable rigid plywood and acrylic to bend smoothly into 3D curves.
                                </Text>

                                <Text style={styles.sectionHeader}>Hinge Area (mm)</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Hinge Width (W)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={hingeW}
                                            onChangeText={setHingeW}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Hinge Height (H)</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={hingeH}
                                            onChangeText={setHingeH}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <Text style={styles.sectionHeader}>Cut Pattern Spacing</Text>
                                <View style={styles.inputRow}>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Cut Length</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={cutLength}
                                            onChangeText={setCutLength}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Bridge Gap</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={cutSpacing}
                                            onChangeText={setCutSpacing}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.inputWrap}>
                                        <Text style={styles.inputLabel}>Line Gap</Text>
                                        <TextInput
                                            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                                            value={lineGap}
                                            onChangeText={setLineGap}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={styles.infoTip}>
                                    <Info size={14} color={C.blue} />
                                    <Text style={styles.infoTipText}>
                                        Best for 3mm birch plywood: use 2.5mm line spacing and 18mm cut length for a 15mm minimum bend radius.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Copy DXF to Clipboard */}
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyDxf}>
                            {copied ? <Check size={14} color={C.green} /> : <Copy size={14} color={C.sub} />}
                            <Text style={styles.copyBtnText}>{copied ? 'Copied DXF to Clipboard!' : 'Copy DXF Text'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* RIGHT: INTERACTIVE VECTOR PREVIEW */}
                    <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.previewHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={styles.dot} />
                                <Text style={[styles.previewTitle, { color: colors.text }]}>
                                    Vector Preview ({activeGeometry.width.toFixed(0)} × {activeGeometry.height.toFixed(0)} mm)
                                </Text>
                            </View>
                            <View style={styles.legendRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <View style={[styles.legendBox, { backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.legendText}>Cut</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <View style={[styles.legendBox, { backgroundColor: '#3B82F6' }]} />
                                    <Text style={styles.legendText}>Engrave/Mark</Text>
                                </View>
                            </View>
                        </View>

                        {/* Responsive SVG Container for Web & Native */}
                        <View style={styles.canvasContainer}>
                            {Platform.OS === 'web' ? (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: 380,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        padding: '16px',
                                        overflow: 'auto',
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: `
                                            <svg viewBox="0 0 ${activeGeometry.width} ${activeGeometry.height}" style="width: 100%; max-height: 440px; background: #0E1014; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); filter: drop-shadow(0 10px 25px rgba(0,0,0,0.5));">
                                                ${activeGeometry.polylines.map(p => {
                                                    const pts = p.points.map(pt => `${pt.x},${pt.y}`).join(' ');
                                                    return `<polygon points="${pts}" fill="none" stroke="${p.layer === 'CUT' ? '#EF4444' : '#3B82F6'}" stroke-width="0.5"/>`;
                                                }).join('')}
                                                ${activeGeometry.lines.map(l =>
                                                    `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${l.layer === 'CUT' ? '#EF4444' : '#3B82F6'}" stroke-width="0.4"/>`
                                                ).join('')}
                                                ${activeGeometry.texts.map(t =>
                                                    `<text x="${t.x}" y="${t.y}" font-size="${t.height}" fill="#94A3B8" font-family="monospace">${t.text}</text>`
                                                ).join('')}
                                            </svg>
                                        `
                                    }}
                                />
                            ) : (
                                <View style={styles.mobilePlaceholder}>
                                    <Layers size={36} color={C.primary} />
                                    <Text style={styles.mobilePlaceholderTitle}>CAD Layout Ready</Text>
                                    <Text style={styles.mobilePlaceholderDesc}>
                                        {activeGeometry.polylines.length} cut contours · {activeGeometry.lines.length} lines · {activeGeometry.texts.length} annotations
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Telemetry pill */}
                        <View style={styles.previewFooter}>
                            <View style={styles.telemetryItem}>
                                <Text style={styles.telemetryLabel}>Total Contours:</Text>
                                <Text style={styles.telemetryVal}>{activeGeometry.polylines.length + activeGeometry.lines.length}</Text>
                            </View>
                            <View style={styles.telemetryItem}>
                                <Text style={styles.telemetryLabel}>DXF Standard:</Text>
                                <Text style={[styles.telemetryVal, { color: C.green }]}>AutoCAD R12 (Universal)</Text>
                            </View>
                            <View style={styles.telemetryItem}>
                                <Text style={styles.telemetryLabel}>Software:</Text>
                                <Text style={styles.telemetryVal}>LightBurn, RDWorks, GRBL</Text>
                            </View>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderBottomWidth: 1,
        gap: 16,
        flexWrap: 'wrap',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    headerSub: {
        fontSize: 12,
        marginTop: 4,
        maxWidth: 620,
    },
    proPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#B1FA63',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 5,
    },
    proPillText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#111317',
    },
    exportActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    btnSvg: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#23262C',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    btnDxf: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#B1FA63',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    btnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    tabsBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderBottomWidth: 1,
        gap: 8,
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabBtnActive: {
        borderBottomColor: C.primary,
    },
    tabBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.sub,
    },
    tabBtnTextActive: {
        color: C.text,
        fontWeight: '700',
    },
    scroll: {
        padding: 20,
    },
    mainLayout: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'flex-start',
    },
    controlsCard: {
        width: 380,
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
    },
    controlGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    fieldDesc: {
        fontSize: 12,
        color: C.sub,
        lineHeight: 17,
    },
    modeToggleRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 3,
        gap: 4,
    },
    modeToggleBtn: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 6,
    },
    modeToggleBtnActive: {
        backgroundColor: C.primary,
    },
    modeToggleText: {
        fontSize: 11,
        fontWeight: '600',
        color: C.sub,
    },
    modeToggleTextActive: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: C.sub,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 6,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    inputWrap: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: C.sub,
        marginBottom: 4,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
        fontWeight: '600',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: C.sub,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#B1FA63',
        borderColor: '#B1FA63',
    },
    checkboxLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    infoTip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
        marginTop: 4,
    },
    infoTipText: {
        fontSize: 11,
        color: '#93C5FD',
        flex: 1,
        lineHeight: 15,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginTop: 14,
    },
    copyBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: C.sub,
    },
    previewCard: {
        flex: 1,
        minWidth: 320,
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        flexWrap: 'wrap',
        gap: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    legendBox: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 11,
        color: C.sub,
    },
    canvasContainer: {
        backgroundColor: '#0E1014',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        minHeight: 440,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mobilePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        gap: 10,
    },
    mobilePlaceholderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.text,
    },
    mobilePlaceholderDesc: {
        fontSize: 12,
        color: C.sub,
    },
    previewFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
        gap: 10,
    },
    telemetryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    telemetryLabel: {
        fontSize: 11,
        color: C.sub,
    },
    telemetryVal: {
        fontSize: 11,
        fontWeight: '700',
        color: C.text,
    },
});
