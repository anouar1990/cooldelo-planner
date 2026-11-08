/**
 * 0machine Nesting Engine — Comprehensive Integration Test Suite
 * Validates CAD/CAM geometry, SVG parsing, hole detection, true-shape nesting,
 * collision detection, multi-sheet overflow, sanitization, and export validity.
 */

import assert from 'assert';
import path from 'path';

// Import core nesting engine modules
import {
    computeBounds,
    computeContourArea,
    computeGeometryArea,
    isPointInPolygon,
    rotateGeometry,
    sampleCubicBezier,
    sampleSvgArc
} from '../core/geometry/index';

import {
    validateGeometry
} from '../core/validation/index';

import {
    sanitizeSvgText
} from '../core/svg/sanitizer';

import {
    parseSvgPathToContours
} from '../core/svg/pathParser';

import {
    SvgImporter
} from '../core/svg/importer';

import {
    expandPartQuantities,
    generateCandidatePositions,
    placePartOnSheet,
    trueShapeNestParts
} from '../nesting/algorithms/trueShapeNesting';

import {
    checkPartCollision,
    checkSheetCollision
} from '../nesting/collision/index';

import {
    calculateNestingScore
} from '../nesting/scoring/index';

import {
    getExplainableScoreBreakdown
} from '../nesting/scoring/scoreBreakdown';

import {
    exportSheetToSvg,
    exportAllSheetsToSvg
} from '../export/svgExporter';

import {
    validatePreExport
} from '../export/exportValidation';

import { Part, Sheet } from '../core/types/index';

// Also test the browser-adapted SVG importer from public/nest/engine
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ClientSvgImporter = require(path.join(__dirname, '../../../public/nest/engine/svg-importer.js'));

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void) {
    try {
        fn();
        console.log(`  ✓ PASS: ${name}`);
        testsPassed++;
    } catch (err: any) {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    Error: ${err.message}`);
        if (err.stack) {
            console.error(err.stack.split('\n').slice(1, 3).join('\n'));
        }
        testsFailed++;
    }
}

console.log('\n======================================================');
console.log('🚀 0MACHINE NEST ENGINE INTEGRATION TEST SUITE');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// 1. SIMPLE GEOMETRIC SHAPES
// -----------------------------------------------------------------------------
console.log('--- 1. Simple Geometric Shapes & Computational Geometry ---');

runTest('computes accurate bounds for polygon vertices', () => {
    const pts = [
        { x: 10, y: 20 },
        { x: 60, y: 20 },
        { x: 60, y: 70 },
        { x: 10, y: 70 },
    ];
    const bounds = computeBounds(pts);
    assert.strictEqual(bounds.minX, 10);
    assert.strictEqual(bounds.minY, 20);
    assert.strictEqual(bounds.maxX, 60);
    assert.strictEqual(bounds.maxY, 70);
    assert.strictEqual(bounds.width, 50);
    assert.strictEqual(bounds.height, 50);
});

runTest('calculates exact Shoelace area for rectangle and triangle', () => {
    const rect = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 0, y: 50 },
        { x: 0, y: 0 }
    ];
    const rectArea = Math.abs(computeContourArea(rect));
    assert.strictEqual(rectArea, 5000); // 100 * 50

    const triangle = [
        { x: 0, y: 0 },
        { x: 60, y: 0 },
        { x: 30, y: 40 },
        { x: 0, y: 0 }
    ];
    const triArea = Math.abs(computeContourArea(triangle));
    assert.strictEqual(triArea, 1200); // (60 * 40) / 2
});

runTest('point in polygon test using ray-casting', () => {
    const poly = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
    ];
    assert.strictEqual(isPointInPolygon({ x: 50, y: 50 }, poly), true);
    assert.strictEqual(isPointInPolygon({ x: 150, y: 50 }, poly), false);
    assert.strictEqual(isPointInPolygon({ x: -10, y: -10 }, poly), false);
});

// -----------------------------------------------------------------------------
// 2. COMPLEX SVG PATHS & CURVE SAMPLING
// -----------------------------------------------------------------------------
console.log('\n--- 2. Complex SVG Paths & Curves (Bezier & Arcs) ---');

runTest('samples cubic Bezier curve into smooth polyline', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0, y: 50 };
    const p2 = { x: 100, y: 50 };
    const p3 = { x: 100, y: 0 };
    const pts = sampleCubicBezier(p0, p1, p2, p3, 16);
    assert.ok(pts.length >= 16, `Expected at least 16 points, got ${pts.length}`);
    assert.strictEqual(Math.round(pts[pts.length - 1].x), 100);
    assert.strictEqual(Math.round(pts[pts.length - 1].y), 0);
});

runTest('samples elliptical SVG arc', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 100, y: 0 };
    const pts = sampleSvgArc(p0, 50, 50, 0, false, true, p1, 16);
    assert.ok(pts.length >= 8, `Expected at least 8 points, got ${pts.length}`);
    const end = pts[pts.length - 1];
    assert.strictEqual(Math.round(end.x), 100);
    assert.strictEqual(Math.abs(Math.round(end.y)), 0);
});

runTest('parses compound path with M, C, S, Q, A, Z commands', () => {
    const d = 'M 10 10 C 20 20, 40 20, 50 10 S 80 0, 90 10 Q 95 25, 90 40 A 25 25 0 0 1 10 40 Z';
    const subPaths = parseSvgPathToContours(d);
    assert.strictEqual(subPaths.length, 1);
    assert.ok(subPaths[0].length >= 10);
});

// -----------------------------------------------------------------------------
// 3. SVG MULTI-DESIGN GROUPING & DECOMPOSITION
// -----------------------------------------------------------------------------
console.log('\n--- 3. SVG Multi-Design Grouping & Decomposition ---');

runTest('decomposes multiple distinct parts grouped in SVG', () => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500mm" height="500mm" viewBox="0 0 500 500">
      <g id="gear_part">
        <rect x="10" y="10" width="80" height="80" />
      </g>
      <g id="bracket_part">
        <rect x="150" y="10" width="60" height="120" />
      </g>
      <g id="spacer_part">
        <polygon points="300,10 350,10 350,60 300,60" />
      </g>
    </svg>`;

    const importer = new SvgImporter();
    const result = importer.parseSvgString(svg, 'machine_parts.svg');

    assert.strictEqual(result.parts.length, 3);
    assert.ok(result.parts.some(p => p.name && p.name.toLowerCase().includes('gear')));
    assert.ok(result.parts.some(p => p.name && p.name.toLowerCase().includes('bracket')));
    assert.ok(result.parts.some(p => p.name && p.name.toLowerCase().includes('spacer')));
});

// -----------------------------------------------------------------------------
// 4. DIFFERENT QUANTITIES EXPANSION
// -----------------------------------------------------------------------------
console.log('\n--- 4. Quantity Expansion ---');

runTest('expands parts with different quantities into individual instances', () => {
    const parts: Part[] = [
        {
            id: 'part_A',
            sourceFileName: 'a.svg',
            name: 'Part A',
            geometry: { contours: [[]], holes: [], bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10, width: 10, height: 10 }, area: 100 },
            quantity: 3,
            width: 10,
            height: 10,
            area: 100,
            position: { x: 0, y: 0 },
            rotation: 0,
            locked: false,
            selected: false
        },
        {
            id: 'part_B',
            sourceFileName: 'b.svg',
            name: 'Part B',
            geometry: { contours: [[]], holes: [], bounds: { minX: 0, minY: 0, maxX: 20, maxY: 20, width: 20, height: 20 }, area: 400 },
            quantity: 5,
            width: 20,
            height: 20,
            area: 400,
            position: { x: 0, y: 0 },
            rotation: 0,
            locked: false,
            selected: false
        }
    ];

    const expanded = expandPartQuantities(parts);
    assert.strictEqual(expanded.length, 8); // 3 + 5
    assert.strictEqual(expanded.filter(p => p.sourcePartId === 'part_A').length, 3);
    assert.strictEqual(expanded.filter(p => p.sourcePartId === 'part_B').length, 5);
});

// -----------------------------------------------------------------------------
// 5. ROTATED SHAPES
// -----------------------------------------------------------------------------
console.log('\n--- 5. Shape Rotation ---');

runTest('rotates geometry by 90 degrees and inverts dimensions', () => {
    const rectGeom = {
        contours: [[
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 40 },
            { x: 0, y: 40 },
            { x: 0, y: 0 }
        ]],
        holes: [],
        bounds: { minX: 0, minY: 0, maxX: 100, maxY: 40, width: 100, height: 40 },
        area: 4000
    };

    const rotated = rotateGeometry(rectGeom, 90);
    assert.strictEqual(Math.round(rotated.bounds.width), 40);
    assert.strictEqual(Math.round(rotated.bounds.height), 100);
    assert.strictEqual(Math.round(rotated.area), 4000);
});

// -----------------------------------------------------------------------------
// 6. SHAPES CONTAINING HOLES
// -----------------------------------------------------------------------------
console.log('\n--- 6. Shapes Containing Holes (Cutouts) ---');

runTest('detects inner cutouts and subtracts hole area from outer contour', () => {
    // 100x100 outer square with a 40x40 inner hole
    const svgWithHole = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200mm" height="200mm" viewBox="0 0 200 200">
      <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z M 30 30 L 70 30 L 70 70 L 30 70 Z" />
    </svg>`;

    const importer = new SvgImporter();
    const result = importer.parseSvgString(svgWithHole, 'washer.svg');

    assert.strictEqual(result.parts.length, 1);
    const part = result.parts[0];
    assert.strictEqual(part.geometry.contours.length, 1);
    assert.strictEqual(part.geometry.holes.length, 1);

    // Outer area = 10,000, Hole area = 1,600, Net area = 8,400
    assert.strictEqual(Math.round(part.area), 8400);

    const val = validateGeometry(part.geometry);
    assert.strictEqual(val.isValid, true);
});

// -----------------------------------------------------------------------------
// 7. COLLISION DETECTION & SPACING
// -----------------------------------------------------------------------------
console.log('\n--- 7. Collision Detection & Spacing Clearance ---');

runTest('detects true-shape SAT collision and clearance violation', () => {
    const makePart = (id: string, x: number, y: number, w: number = 50, h: number = 50): Part => ({
        id,
        sourceFileName: 'test.svg',
        name: id,
        geometry: {
            contours: [[
                { x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }, { x: 0, y: 0 }
            ]],
            holes: [],
            bounds: { minX: 0, minY: 0, maxX: w, maxY: h, width: w, height: h },
            area: w * h
        },
        quantity: 1,
        width: w,
        height: h,
        area: w * h,
        position: { x, y },
        rotation: 0,
        locked: false,
        selected: false
    });

    const p1 = makePart('p1', 10, 10, 50, 50);
    const p2Overlapping = makePart('p2', 30, 30, 50, 50); // Overlaps p1
    const p3Clear = makePart('p3', 100, 10, 50, 50);      // 40mm away from p1
    const p4TooClose = makePart('p4', 62, 10, 50, 50);   // 2mm away from p1

    // p1 and p2 collide
    assert.strictEqual(checkPartCollision(p1, p2Overlapping, 0), true);

    // p1 and p3 do not collide even with 10mm spacing
    assert.strictEqual(checkPartCollision(p1, p3Clear, 10), false);

    // p4 is 2mm away from p1: no direct overlap (spacing 0), but collides when 5mm spacing required
    assert.strictEqual(checkPartCollision(p1, p4TooClose, 0), false);
    assert.strictEqual(checkPartCollision(p1, p4TooClose, 5), true);
});

runTest('checks sheet boundary collisions against margins', () => {
    const sheet: Sheet = { id: 's1', name: 'Sheet', width: 200, height: 100, margin: 10, spacing: 5 };
    const inside: Part = {
        id: 'in',
        sourceFileName: 'in.svg',
        name: 'In',
        geometry: { contours: [[{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }]], holes: [], bounds: { minX: 0, minY: 0, maxX: 50, maxY: 50, width: 50, height: 50 }, area: 2500 },
        position: { x: 15, y: 15 },
        rotation: 0,
        quantity: 1,
        width: 50,
        height: 50,
        area: 2500,
        locked: false,
        selected: false
    };
    const outOfBounds: Part = {
        id: 'out',
        sourceFileName: 'out.svg',
        name: 'Out',
        geometry: { contours: [[{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }]], holes: [], bounds: { minX: 0, minY: 0, maxX: 50, maxY: 50, width: 50, height: 50 }, area: 2500 },
        position: { x: 180, y: 15 }, // Exceeds 200 - 10 margin
        rotation: 0,
        quantity: 1,
        width: 50,
        height: 50,
        area: 2500,
        locked: false,
        selected: false
    };

    assert.strictEqual(checkSheetCollision(inside, sheet), false);
    assert.strictEqual(checkSheetCollision(outOfBounds, sheet), true);
});

// -----------------------------------------------------------------------------
// 8. MULTI-SHEET PLACEMENT & OVERFLOW
// -----------------------------------------------------------------------------
console.log('\n--- 8. Multi-Sheet Placement & Overflow ---');

runTest('automatically allocates multiple sheets when parts exceed single sheet capacity', () => {
    const smallSheet: Sheet = {
        id: 'small',
        name: 'Small Sheet',
        width: 150,
        height: 150,
        margin: 5,
        spacing: 3,
        materialPricePerSheet: 10.0
    };

    // 4 large parts of 80x80mm cannot fit on one 150x150 sheet (at most 1 per sheet)
    const largeParts: Part[] = [
        {
            id: 'large_p1',
            sourceFileName: 'box.svg',
            name: 'Box 80x80',
            geometry: {
                contours: [[
                    { x: 0, y: 0 }, { x: 80, y: 0 }, { x: 80, y: 80 }, { x: 0, y: 80 }, { x: 0, y: 0 }
                ]],
                holes: [],
                bounds: { minX: 0, minY: 0, maxX: 80, maxY: 80, width: 80, height: 80 },
                area: 6400
            },
            quantity: 4,
            width: 80,
            height: 80,
            area: 6400,
            position: { x: 0, y: 0 },
            rotation: 0,
            locked: false,
            selected: false
        }
    ];

    const result = trueShapeNestParts(largeParts, smallSheet, { multiStartCount: 2 });
    assert.ok(result.sheetCount > 1, `Expected sheetCount > 1, got ${result.sheetCount}`);
    assert.strictEqual(result.totalPartsPlaced, 4);
    assert.strictEqual(result.sheetResults.length, result.sheetCount);
});

// -----------------------------------------------------------------------------
// 9. MALFORMED / MALICIOUS SVG HANDLING
// -----------------------------------------------------------------------------
console.log('\n--- 9. Malformed / Malicious SVG Sanitization ---');

runTest('sanitizes XSS scripts and dangerous tags from SVG', () => {
    const malicious = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <script>alert("hacked")</script>
      <rect x="0" y="0" width="50" height="50" onclick="alert(1)" />
    </svg>`;
    const clean = sanitizeSvgText(malicious);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('onclick'));
});

runTest('returns graceful errors on invalid or empty SVG without throwing', () => {
    const importer = new SvgImporter();
    const res1 = importer.parseSvgString('', 'empty.svg');
    assert.ok(res1.errors && res1.errors.length > 0);

    const res2 = importer.parseSvgString('<not-svg></not-svg>', 'invalid.svg');
    assert.ok(res2.errors && res2.errors.length > 0);
});

// -----------------------------------------------------------------------------
// 10. EXPORTED LAYOUT VALIDITY
// -----------------------------------------------------------------------------
console.log('\n--- 10. Production SVG Layout Export ---');

runTest('generates valid production SVG with boundary frame and cut layers', () => {
    const sheet: Sheet = { id: 's1', name: 'Sheet 1', width: 600, height: 300, margin: 5, spacing: 3 };
    const parts: Part[] = [
        {
            id: 'part_cut',
            sourceFileName: 'test.svg',
            name: 'Cut Piece',
            geometry: {
                contours: [[
                    { x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }, { x: 0, y: 40 }
                ]],
                holes: [[
                    { x: 10, y: 10 }, { x: 20, y: 10 }, { x: 20, y: 20 }, { x: 10, y: 20 }
                ]],
                bounds: { minX: 0, minY: 0, maxX: 40, maxY: 40, width: 40, height: 40 },
                area: 1500
            },
            position: { x: 10, y: 10 },
            rotation: 0,
            quantity: 1,
            width: 40,
            height: 40,
            area: 1500,
            locked: false,
            selected: false,
            color: '#FE7733'
        }
    ];

    const svg = exportSheetToSvg(parts, sheet);
    assert.ok(svg.includes('<?xml version="1.0"'));
    assert.ok(svg.includes('width="600mm"'));
    assert.ok(svg.includes('height="300mm"'));
    assert.ok(svg.includes('id="sheet-boundary"'));
    assert.ok(svg.includes('id="nested-parts"'));
    assert.ok(svg.includes('#FE7733')); // Outer cut stroke
    assert.ok(svg.includes('#ffd700')); // Inner hole cut stroke

    const preExport = validatePreExport(parts, sheet);
    assert.strictEqual(preExport.isValid, true);
    assert.strictEqual(preExport.partsCount, 1);
});

// -----------------------------------------------------------------------------
// 11. BROWSER CLIENT-SIDE PARITY
// -----------------------------------------------------------------------------
console.log('\n--- 11. Browser-adapted Client Engine Parity ---');

runTest('client SvgImporter parses complex path with curves and holes', () => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <g id="bracket_plate">
        <path d="M 0 0 L 100 0 C 120 20, 120 80, 100 100 L 0 100 Z M 20 20 L 40 20 L 40 40 L 20 40 Z" />
      </g>
    </svg>`;

    const result = ClientSvgImporter.parseSvgString(svg, 'client_bracket.svg');
    assert.strictEqual(result.parts.length, 1);
    const p = result.parts[0];
    assert.ok(p.name.includes('Bracket Plate') || p.name.includes('bracket_plate'));
    assert.strictEqual(p.holes.length, 1);
    assert.ok(p.area > 0);
});

// -----------------------------------------------------------------------------
// 12. EXISTING NESTING YIELD WORKFLOW PRESERVATION
// -----------------------------------------------------------------------------
console.log('\n--- 12. Existing Nesting Yield Workflow & Metrics ---');

runTest('score breakdown provides transparent explainable 0-100 metrics', () => {
    const sheet: Sheet = { id: 's1', name: 'Sheet', width: 600, height: 300, margin: 5, spacing: 3, materialPricePerSheet: 15 };
    const parts: Part[] = [
        {
            id: 'p1',
            sourceFileName: 'p1.svg',
            name: 'P1',
            geometry: {
                contours: [[{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]],
                holes: [],
                bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 },
                area: 10000
            },
            position: { x: 10, y: 10 },
            rotation: 0,
            quantity: 1,
            width: 100,
            height: 100,
            area: 10000,
            locked: false,
            selected: false
        }
    ];

    const score = calculateNestingScore(parts, sheet);
    assert.ok(score.score > 0);
    assert.ok(score.utilizationPercentage > 0);
    assert.ok(score.wastePercentage < 100);

    const breakdown = getExplainableScoreBreakdown(parts, sheet);
    assert.ok(breakdown.overallScore >= 0 && breakdown.overallScore <= 100);
    assert.strictEqual(breakdown.explanation.length, 4);
});

console.log('\n======================================================');
console.log(`📊 TEST SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED`);
console.log('======================================================\n');

if (testsFailed > 0) {
    process.exit(1);
} else {
    console.log('✨ ALL NEST ENGINE INTEGRATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
}
