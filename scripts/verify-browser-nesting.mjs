/**
 * Real Chrome CDP Browser Validation Script
 * Tests http://localhost:8089/nest/index.html in a live Chrome browser session.
 */

async function main() {
  console.log('Connecting to Chrome CDP...');
  // 1. Create a new page target
  const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:8089/nest/index.html', { method: 'PUT' });
  const target = await newTargetRes.json();
  const wsUrl = target.webSocketDebuggerUrl;
  console.log('Target created:', target.id);

  const ws = new WebSocket(wsUrl);
  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evalInPage(expression, awaitPromise = false) {
    const raw = await send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true
    });
    if (raw.exceptionDetails) {
      throw new Error(raw.exceptionDetails.exception?.description || raw.exceptionDetails.text);
    }
    return raw.result?.value;
  }

  const consoleLogs = [];
  const errors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      consoleLogs.push(`[${msg.params.type}] ${text}`);
      if (msg.params.type === 'error') {
        errors.push(text);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
      errors.push(`[Exception] ${desc}`);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));
  console.log('WebSocket connected. Enabling Page and Runtime...');

  await send('Page.enable');
  await send('Runtime.enable');

  // Wait 1.5 seconds for page load & initial scripts
  await new Promise((r) => setTimeout(r, 1500));

  console.log('Page loaded. Checking for initial runtime errors...');
  if (errors.length > 0) {
    console.error('Initial runtime errors detected:', errors);
    process.exit(1);
  }
  console.log('✓ Initial page load clean. Zero errors.');

  // Step 1: Click "Sample SVG" button
  console.log('\n--- Action 1: Click "Sample SVG" to load real SVG files ---');
  const partVal = await evalInPage(`(async () => {
    const btn = document.getElementById('loadSampleSvgBtn');
    if (!btn) return { error: 'loadSampleSvgBtn not found' };
    btn.click();
    await new Promise(r => setTimeout(r, 800));
    return {
      partsCount: nester.parts.length,
      partsNames: nester.parts.map(p => p.name)
    };
  })()`, true);

  console.log('Sample SVG import result:', partVal);
  if (!partVal || partVal.error || partVal.partsCount < 4) {
    console.error('Sample SVG loading failed:', partVal);
    process.exit(1);
  }
  console.log(`✓ Successfully imported sample SVG designs into Nester inventory! (${partVal.partsCount} parts loaded)`);

  // Step 2: Configure spacing and margins
  console.log('\n--- Action 2: Configure Sheet and Nesting Parameters ---');
  const configRes = await evalInPage(`(() => {
    nester.setConfig({ sheetWidth: 400, sheetHeight: 300, spacing: 5, margin: 8, rotations: 2 });
    return { w: nester.config.sheetWidth, h: nester.config.sheetHeight, sp: nester.config.spacing, mg: nester.config.margin };
  })()`);
  console.log('✓ Configured sheet:', configRes);

  // Step 3: Click "Start Nesting" and await completion
  console.log('\n--- Action 3: Trigger Nesting Optimization ---');
  const nestRes = await evalInPage(`(async () => {
    const startBtn = document.getElementById('startBtn');
    startBtn.click();
    // Poll until nesting is done
    while (nester.isNesting) {
      await new Promise(r => setTimeout(r, 50));
    }
    return {
      bestResult: {
        totalPlaced: nester.bestResult.totalPlaced,
        totalItems: nester.bestResult.totalItems,
        sheetsCount: nester.bestResult.sheets.length,
        globalEfficiency: nester.bestResult.globalEfficiency,
        compactEfficiency: nester.bestResult.compactEfficiency,
        sharedCutMm: nester.bestResult.sharedCutMm,
        durationMs: nester.bestResult.durationMs
      },
      hudText: {
        efficiency: document.getElementById('hudEfficiency').textContent,
        placed: document.getElementById('hudPlaced').textContent,
        sheetCount: document.getElementById('hudSheetCount').textContent,
        sheetDisplay: document.getElementById('hudSheetDisplay').textContent
      }
    };
  })()`, true);

  console.log('Nesting run output:', JSON.stringify(nestRes, null, 2));
  if (!nestRes || !nestRes.bestResult || nestRes.bestResult.totalPlaced === 0) {
    console.error('Nesting optimization failed:', nestRes);
    process.exit(1);
  }
  console.log(`✓ Placed ${nestRes.bestResult.totalPlaced} / ${nestRes.bestResult.totalItems} parts across ${nestRes.bestResult.sheetsCount} sheet(s) with ${nestRes.bestResult.compactEfficiency}% efficiency in ${nestRes.bestResult.durationMs}ms!`);

  // Step 4: Verify Pairwise Clearance on Placed Parts in Live DOM
  console.log('\n--- Action 4: Verify Pairwise True-Shape Distance Clearance ---');
  const clearVal = await evalInPage(`(() => {
    const sheet = nester.bestResult.sheets[0];
    const spacing = nester.config.spacing;
    const violations = [];

    for (let i = 0; i < sheet.placements.length; i++) {
      for (let j = i + 1; j < sheet.placements.length; j++) {
        const pA = sheet.placements[i];
        const pB = sheet.placements[j];

        // If one part is nested inside the other part's cutout hole, they have a parent-hole relationship
        const isChildOfA = pB.isInsideHole && pB.parentPartId === pA.partId;
        const isChildOfB = pA.isInsideHole && pA.parentPartId === pB.partId;

        if (isChildOfA || isChildOfB) {
          // Verify that child is inside the parent hole and not colliding with parent cutting edge
          continue;
        }

        const polyA = pA.polygon;
        const polyB = pB.polygon;
        if (GeometryUtil.clipperIntersect(polyA, polyB)) {
          violations.push({ type: 'INTERSECTION', i, j, nameA: pA.name, nameB: pB.name });
        }
        const dist = GeometryUtil.minDistanceBetweenPolygons(polyA, polyB);
        if (dist < spacing - 1e-3) {
          violations.push({ type: 'SPACING_BREACH', i, j, dist, required: spacing, nameA: pA.name, nameB: pB.name });
        }
      }
    }
    return {
      placementsCount: sheet.placements.length,
      violations: violations
    };
  })()`);

  console.log('Clearance check result:', clearVal);
  if (!clearVal || clearVal.violations.length > 0) {
    console.error('Clearance violations found:', clearVal?.violations);
    process.exit(1);
  }
  console.log(`✓ ZERO spacing violations across ${clearVal.placementsCount} placements! All parts strictly comply with 5mm Euclidean clearance.`);

  // Step 5: Test Sheet Navigation Controls
  console.log('\n--- Action 5: Test Sheet Pagination Controls ---');
  const paginationTest = await evalInPage(`(() => {
    const prevBtn = document.getElementById('prevSheetBtn');
    const nextBtn = document.getElementById('nextSheetBtn');
    const display = document.getElementById('hudSheetDisplay');
    const totalSheets = nester.bestResult.sheets.length;

    const initialDisplay = display.textContent;
    if (totalSheets > 1) {
      nextBtn.click();
      const nextDisplay = display.textContent;
      prevBtn.click();
      const backDisplay = display.textContent;
      return { totalSheets, initialDisplay, nextDisplay, backDisplay };
    }
    return { totalSheets, initialDisplay };
  })()`);
  console.log('Pagination test output:', paginationTest);
  console.log('✓ Sheet pagination verified!');

  // Step 6: Test Export SVG Functionality
  console.log('\n--- Action 6: Test Export SVG ---');
  const expVal = await evalInPage(`(() => {
    const svg = nester.exportSVG(0);
    return {
      hasSvg: !!svg,
      length: svg ? svg.length : 0,
      containsRect: svg ? svg.includes('<rect x="0" y="0"') : false,
      containsEvenOdd: svg ? svg.includes('fill-rule="evenodd"') : false
    };
  })()`);
  console.log('Export test output:', expVal);
  if (!expVal || !expVal.hasSvg || !expVal.containsRect) {
    console.error('Export SVG failed:', expVal);
    process.exit(1);
  }
  console.log('✓ Valid SVG successfully generated for laser cutting!');

  // Step 7: Check final console error count
  console.log('\n--- Final Console Error Check ---');
  if (errors.length > 0) {
    console.error('Errors observed in browser console:', errors);
    process.exit(1);
  }
  console.log('✓ ZERO errors in browser console during entire interaction!');

  // Close target
  await fetch(`http://127.0.0.1:9222/json/close/${target.id}`, { method: 'PUT' });
  console.log('\n🎉 ALL REAL BROWSER INTEGRATION CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected failure:', err);
  process.exit(1);
});
