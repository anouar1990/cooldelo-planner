/**
 * 0MACHINE NESTING ENGINE — END-TO-END WORKFLOW & REPAIR VERIFICATION SUITE
 * Validates the complete pipeline:
 * SVG Import -> Parsing & Normalization -> Part Inventory & Quantities
 * -> Nesting Optimization -> Spacing & Collision Verification
 * -> Multi-Sheet Overflow & Pagination -> SVG Production Export
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Load Browser/Node compatible Engine modules directly
const SvgImporter = require('../../../public/nest/engine/svg-importer.js');
const GeometryUtil = require('../../../public/nest/engine/geometry.js');
const Nester = require('../../../public/nest/engine/nester.js');

let passCount = 0;
let failCount = 0;

function it(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ✓ PASS: ${name}`);
          passCount++;
        })
        .catch((err) => {
          console.error(`  ✗ FAIL: ${name}`);
          console.error(err);
          failCount++;
        });
    } else {
      console.log(`  ✓ PASS: ${name}`);
      passCount++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    failCount++;
  }
}

async function runAll() {
  console.log('\n======================================================');
  console.log('🧪 0MACHINE NEST PIPELINE REPAIR & E2E VERIFICATION');
  console.log('======================================================\n');

  console.log('--- 1. SVG Import & Topological Part Extraction ---');

  it('correctly parses Spur Gear SVG with topological hole and millimeter scaling', () => {
    const svgPath = path.join(__dirname, '../../../public/nest/samples/sample_gears.svg');
    const svgText = fs.readFileSync(svgPath, 'utf8');
    const result = SvgImporter.parseSvgString(svgText, 'sample_gears.svg');

    assert.ok(result && result.parts && result.parts.length >= 1, 'Should extract at least 1 part');
    const part = result.parts[0];
    assert.strictEqual(part.name, 'sample_gears');
    assert.ok(part.polygon.length >= 8, 'Outer contour should have teeth points');
    assert.ok(part.holes && part.holes.length >= 1, 'Gear must have center hole cutout');
    assert.ok(part.width > 40 && part.width <= 85, `Width ${part.width} should match ~80mm gear`);
    assert.ok(part.height > 40 && part.height <= 85, `Height ${part.height} should match ~80mm gear`);
  });

  it('correctly parses Enclosure Bracket SVG with 4 mounting holes and curved corners', () => {
    const svgPath = path.join(__dirname, '../../../public/nest/samples/sample_enclosure.svg');
    const svgText = fs.readFileSync(svgPath, 'utf8');
    const result = SvgImporter.parseSvgString(svgText, 'sample_enclosure.svg');

    assert.ok(result && result.parts && result.parts.length >= 1, 'Should extract bracket part');
    const part = result.parts[0];
    assert.strictEqual(part.name, 'sample_enclosure');
    assert.ok(part.polygon.length >= 10, 'Outer contour must include arc sampling points');
    assert.strictEqual(part.holes.length, 4, 'Must extract exactly 4 mounting holes');
    assert.ok(Math.abs(part.width - 100) < 2, `Width should be 100mm, got ${part.width}`);
    assert.ok(Math.abs(part.height - 60) < 2, `Height should be 60mm, got ${part.height}`);
  });

  it('correctly keeps disjoint interlocking L-brackets as separate parts even when bounding boxes overlap', () => {
    // Two L-brackets interlocking with overlapping bounding boxes but disjoint polygons
    const svgInterlocking = `
      <svg width="200mm" height="200mm" viewBox="0 0 200 200">
        <!-- L1: Top-Left L-bracket -->
        <path d="M 10 10 L 80 10 L 80 30 L 30 30 L 30 80 L 10 80 Z" />
        <!-- L2: Inverted L-bracket interlocking inside the inner crook of L1 -->
        <path d="M 40 40 L 40 90 L 90 90 L 90 70 L 60 70 L 60 40 Z" />
      </svg>
    `;
    const result = SvgImporter.parseSvgString(svgInterlocking, 'interlocking.svg');
    assert.strictEqual(result.parts.length, 2, 'Must extract exactly 2 separate parts, not merge them');
  });

  console.log('\n--- 2. Data Contract Compatibility with Nester Engine ---');

  it('safely ingests parts into Nester without polygon undefined or TypeErrors', () => {
    const nester = new Nester({ sheetWidth: 500, sheetHeight: 300, spacing: 4, margin: 5 });
    nester.clearParts();

    const gearSvg = fs.readFileSync(path.join(__dirname, '../../../public/nest/samples/sample_gears.svg'), 'utf8');
    const gearResult = SvgImporter.parseSvgString(gearSvg, 'gear.svg');
    const bracketSvg = fs.readFileSync(path.join(__dirname, '../../../public/nest/samples/sample_enclosure.svg'), 'utf8');
    const bracketResult = SvgImporter.parseSvgString(bracketSvg, 'bracket.svg');

    // Emulate app.js parseAndAddSvg logic
    [...gearResult.parts, ...bracketResult.parts].forEach((p: any, idx: number) => {
      const poly = p.polygon || (p.contours && p.contours[0]) || (p.geometry && p.geometry.contours && p.geometry.contours[0]);
      const holes = p.holes || (p.geometry && p.geometry.holes) || [];

      nester.addPart({
        name: p.name,
        polygon: poly,
        holes: holes,
        quantity: 2,
        color: idx === 0 ? '#FE7733' : '#10B981'
      });
    });

    assert.strictEqual(nester.parts.length, 2, 'Should have 2 unique part types loaded');
    const instances = nester.expandInstances();
    assert.strictEqual(instances.length, 4, '2 parts with quantity 2 should produce 4 instances');
  });

  console.log('\n--- 3. Strict Euclidean Spacing & Collision Verification ---');

  it('GeometryUtil.minDistanceBetweenPolygons accurately measures polygon distance', () => {
    const polyA = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }];
    const polyB = [{ x: 55, y: 0 }, { x: 95, y: 0 }, { x: 95, y: 50 }, { x: 55, y: 50 }];
    const polyTouch = [{ x: 50, y: 0 }, { x: 90, y: 0 }, { x: 90, y: 50 }, { x: 50, y: 50 }];

    const dist5 = GeometryUtil.minDistanceBetweenPolygons(polyA, polyB);
    assert.ok(Math.abs(dist5 - 5) < 1e-3, `Distance should be 5mm, got ${dist5}`);

    const dist0 = GeometryUtil.minDistanceBetweenPolygons(polyA, polyTouch);
    assert.ok(dist0 <= 1e-4, `Touching polygons should have 0 distance, got ${dist0}`);
  });

  await it('Nester strictly enforces spacing clearance between all placed parts (no zero gap bug)', async () => {
    const spacingMm = 6;
    const marginMm = 8;
    const nester = new Nester({
      sheetWidth: 300,
      sheetHeight: 200,
      spacing: spacingMm,
      margin: marginMm,
      rotations: 4
    });
    nester.clearParts();

    // Add 4 rectangular blocks
    nester.addPart({
      name: 'TestBlock',
      polygon: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 40 }, { x: 0, y: 40 }],
      quantity: 4,
      color: '#FE7733'
    });

    const result = await nester.startNesting();
    assert.ok(result && result.sheets.length > 0, 'Should complete nesting');
    assert.strictEqual(result.totalPlaced, 4, 'All 4 blocks should be placed');

    const sheet = result.sheets[0];
    assert.strictEqual(sheet.placements.length, 4);

    // Verify sheet margins
    sheet.placements.forEach((p: any) => {
      assert.ok(p.x >= marginMm - 1e-3, `Part x ${p.x} must be >= margin ${marginMm}`);
      assert.ok(p.y >= marginMm - 1e-3, `Part y ${p.y} must be >= margin ${marginMm}`);
      assert.ok(p.bounds.maxX <= 300 - marginMm + 1e-3, `Part maxX ${p.bounds.maxX} must be <= ${300 - marginMm}`);
      assert.ok(p.bounds.maxY <= 200 - marginMm + 1e-3, `Part maxY ${p.bounds.maxY} must be <= ${200 - marginMm}`);
    });

    // Verify pairwise minimum Euclidean distance >= spacingMm
    for (let i = 0; i < sheet.placements.length; i++) {
      for (let j = i + 1; j < sheet.placements.length; j++) {
        const polyA = sheet.placements[i].polygon;
        const polyB = sheet.placements[j].polygon;

        assert.strictEqual(GeometryUtil.clipperIntersect(polyA, polyB), false, `Part ${i} and ${j} must not intersect`);
        const dist = GeometryUtil.minDistanceBetweenPolygons(polyA, polyB);
        assert.ok(
          dist >= spacingMm - 1e-3,
          `Part ${i} and ${j} distance ${dist.toFixed(2)}mm must be >= required spacing ${spacingMm}mm`
        );
      }
    }
  });

  console.log('\n--- 4. Multi-Sheet Placement & Overflow Handling ---');

  await it('allocates multiple sheets when part quantity exceeds single sheet capacity', async () => {
    // A small sheet: 100 x 100 mm. Part is 60 x 60 mm.
    // At most 1 part can fit per sheet due to size + margins (5mm) and spacing (4mm).
    const nester = new Nester({
      sheetWidth: 100,
      sheetHeight: 100,
      margin: 5,
      spacing: 4,
      rotations: 1
    });
    nester.clearParts();

    nester.addPart({
      name: 'Plate',
      polygon: [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 60 }, { x: 0, y: 60 }],
      quantity: 3,
      color: '#38BDF8'
    });

    const result = await nester.startNesting();
    assert.ok(result, 'Should complete multi-sheet nesting');
    assert.strictEqual(result.totalPlaced, 3, 'All 3 parts must be placed');
    assert.strictEqual(result.sheets.length, 3, 'Must allocate exactly 3 sheets');

    result.sheets.forEach((sheet: any, sIdx: number) => {
      assert.strictEqual(sheet.placements.length, 1, `Sheet ${sIdx + 1} should have 1 placement`);
      assert.ok(sheet.placements[0].x >= 5, 'Margin respected');
      assert.ok(sheet.placements[0].y >= 5, 'Margin respected');
    });
  });

  console.log('\n--- 5. Production SVG Export & Pagination ---');

  await it('exports valid production SVG for selected sheet index with cut geometry & holes', async () => {
    const nester = new Nester({ sheetWidth: 200, sheetHeight: 150, margin: 5, spacing: 3 });
    nester.clearParts();

    const gearSvg = fs.readFileSync(path.join(__dirname, '../../../public/nest/samples/sample_gears.svg'), 'utf8');
    const parsed = SvgImporter.parseSvgString(gearSvg, 'gear.svg');
    const gearPart = parsed.parts[0];

    nester.addPart({
      name: gearPart.name,
      polygon: gearPart.polygon,
      holes: gearPart.holes,
      quantity: 2,
      color: '#FE7733'
    });

    await nester.startNesting();

    // Export sheet 0
    const svgSheet0 = nester.exportSVG(0);
    assert.ok(svgSheet0 && svgSheet0.length > 50, 'SVG export must not be empty');
    assert.ok(svgSheet0.includes('<svg xmlns="http://www.w3.org/2000/svg"'), 'Must have root SVG element');
    assert.ok(svgSheet0.includes('viewBox="0 0 200 150"'), 'Must match sheet dimensions');
    assert.ok(svgSheet0.includes('fill-rule="evenodd"'), 'Hole cutouts must use evenodd fill-rule');
    assert.ok(svgSheet0.includes('<rect x="0" y="0" width="200" height="150"'), 'Must render sheet boundary rect');

    // Attempt invalid sheet index
    const invalidSheet = nester.exportSVG(999);
    assert.strictEqual(invalidSheet, null, 'Out of bounds sheet index should return null');
  });

  console.log('\n======================================================');
  console.log(`📊 TEST SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('✨ ALL WORKFLOW E2E TESTS PASSED PERFECTLY!\n');
  }
}

runAll().catch((e) => {
  console.error(e);
  process.exit(1);
});

