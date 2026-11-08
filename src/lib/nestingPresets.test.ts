import {
  NestingPreset,
  STANDARD_NESTING_PRESETS,
  getNestingPresets,
  getPresetById,
  validatePresetDimensions,
} from './nestingPresets';

interface TestCase {
  name: string;
  fn: () => void;
}

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err?.message || err}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Received: ${actual}`);
  }
}

console.log('========================================================');
console.log('NESTING PRESETS TEST SUITE');
console.log('========================================================\n');

// Group 1: STANDARD_NESTING_PRESETS Constant
console.log('--- 1. STANDARD_NESTING_PRESETS Definitions ---');

runTest('Contains exactly 4 presets', () => {
  assertEqual(STANDARD_NESTING_PRESETS.length, 4, 'Preset count');
});

runTest('Contains industrial 1200x800 preset with correct parameters', () => {
  const preset = STANDARD_NESTING_PRESETS.find((p) => p.id === 'laser-bed-industrial');
  assert(!!preset, 'laser-bed-industrial must exist');
  assertEqual(preset!.name, 'Industrial 1200x800', 'Name mismatch');
  assertEqual(preset!.sheetWidth, 1200, 'sheetWidth mismatch');
  assertEqual(preset!.sheetHeight, 800, 'sheetHeight mismatch');
  assertEqual(preset!.defaultSpacing, 3, 'defaultSpacing mismatch');
  assertEqual(preset!.defaultMargin, 5, 'defaultMargin mismatch');
  assertEqual(preset!.category, 'industrial', 'category mismatch');
  assert(preset!.description.length > 0, 'description must not be empty');
});

runTest('Contains medium 900x600 preset with correct parameters', () => {
  const preset = STANDARD_NESTING_PRESETS.find((p) => p.id === 'laser-bed-medium');
  assert(!!preset, 'laser-bed-medium must exist');
  assertEqual(preset!.name, 'Standard 900x600', 'Name mismatch');
  assertEqual(preset!.sheetWidth, 900, 'sheetWidth mismatch');
  assertEqual(preset!.sheetHeight, 600, 'sheetHeight mismatch');
  assertEqual(preset!.defaultSpacing, 2.5, 'defaultSpacing mismatch');
  assertEqual(preset!.defaultMargin, 5, 'defaultMargin mismatch');
  assertEqual(preset!.category, 'industrial', 'category mismatch');
  assert(preset!.description.length > 0, 'description must not be empty');
});

runTest('Contains desktop 600x400 preset with correct parameters', () => {
  const preset = STANDARD_NESTING_PRESETS.find((p) => p.id === 'laser-bed-desktop');
  assert(!!preset, 'laser-bed-desktop must exist');
  assertEqual(preset!.name, 'Desktop 600x400', 'Name mismatch');
  assertEqual(preset!.sheetWidth, 600, 'sheetWidth mismatch');
  assertEqual(preset!.sheetHeight, 400, 'sheetHeight mismatch');
  assertEqual(preset!.defaultSpacing, 2, 'defaultSpacing mismatch');
  assertEqual(preset!.defaultMargin, 3, 'defaultMargin mismatch');
  assertEqual(preset!.category, 'desktop', 'category mismatch');
  assert(preset!.description.length > 0, 'description must not be empty');
});

runTest('Contains compact 300x200 preset with correct parameters', () => {
  const preset = STANDARD_NESTING_PRESETS.find((p) => p.id === 'laser-bed-compact');
  assert(!!preset, 'laser-bed-compact must exist');
  assertEqual(preset!.name, 'Compact 300x200', 'Name mismatch');
  assertEqual(preset!.sheetWidth, 300, 'sheetWidth mismatch');
  assertEqual(preset!.sheetHeight, 200, 'sheetHeight mismatch');
  assertEqual(preset!.defaultSpacing, 1.5, 'defaultSpacing mismatch');
  assertEqual(preset!.defaultMargin, 2, 'defaultMargin mismatch');
  assertEqual(preset!.category, 'compact', 'category mismatch');
  assert(preset!.description.length > 0, 'description must not be empty');
});

// Group 2: Helper Functions: getNestingPresets & getPresetById
console.log('\n--- 2. Helper Functions (getNestingPresets, getPresetById) ---');

runTest('getNestingPresets returns all presets', () => {
  const presets = getNestingPresets();
  assertEqual(presets.length, 4, 'getNestingPresets length');
  assertEqual(presets, STANDARD_NESTING_PRESETS, 'Returns same reference');
});

runTest('getPresetById finds existing presets correctly', () => {
  const industrial = getPresetById('laser-bed-industrial');
  assert(!!industrial, 'Should find industrial');
  assertEqual(industrial?.id, 'laser-bed-industrial', 'ID must match');

  const medium = getPresetById('laser-bed-medium');
  assert(!!medium, 'Should find medium');
  assertEqual(medium?.id, 'laser-bed-medium', 'ID must match');

  const desktop = getPresetById('laser-bed-desktop');
  assert(!!desktop, 'Should find desktop');
  assertEqual(desktop?.id, 'laser-bed-desktop', 'ID must match');

  const compact = getPresetById('laser-bed-compact');
  assert(!!compact, 'Should find compact');
  assertEqual(compact?.id, 'laser-bed-compact', 'ID must match');
});

runTest('getPresetById returns undefined for unknown IDs', () => {
  assertEqual(getPresetById('unknown-bed'), undefined, 'Unknown ID');
  assertEqual(getPresetById(''), undefined, 'Empty ID');
  assertEqual(getPresetById('laser-bed-custom'), undefined, 'Custom bed not in presets');
});

// Group 3: Boundary and Dimension Validation
console.log('\n--- 3. Dimension Validation (validatePresetDimensions) ---');

runTest('Validates all standard presets successfully', () => {
  for (const preset of STANDARD_NESTING_PRESETS) {
    const res = validatePresetDimensions(preset.sheetWidth, preset.sheetHeight);
    assert(res.valid, `Preset ${preset.id} (${preset.sheetWidth}x${preset.sheetHeight}) should be valid`);
    assertEqual(res.error, undefined, `Preset ${preset.id} should have no error`);
  }
});

runTest('Validates boundary limits (50mm and 5000mm)', () => {
  const minBoundary = validatePresetDimensions(50, 50);
  assert(minBoundary.valid, 'Min boundary (50, 50) should be valid');

  const maxBoundary = validatePresetDimensions(5000, 5000);
  assert(maxBoundary.valid, 'Max boundary (5000, 5000) should be valid');

  const mixedBoundary1 = validatePresetDimensions(50, 5000);
  assert(mixedBoundary1.valid, 'Boundary (50, 5000) should be valid');

  const mixedBoundary2 = validatePresetDimensions(5000, 50);
  assert(mixedBoundary2.valid, 'Boundary (5000, 50) should be valid');
});

runTest('Rejects dimensions below 50mm', () => {
  const res1 = validatePresetDimensions(49.99, 500);
  assert(!res1.valid, 'Width 49.99 should be invalid');
  assert(typeof res1.error === 'string' && res1.error.length > 0, 'Error message required');

  const res2 = validatePresetDimensions(500, 49.99);
  assert(!res2.valid, 'Height 49.99 should be invalid');
  assert(typeof res2.error === 'string' && res2.error.length > 0, 'Error message required');

  const res3 = validatePresetDimensions(49, 49);
  assert(!res3.valid, 'Dimensions (49, 49) should be invalid');
});

runTest('Rejects zero and negative dimensions (<= 0)', () => {
  const resZeroWidth = validatePresetDimensions(0, 500);
  assert(!resZeroWidth.valid, 'Width 0 must be invalid');

  const resZeroHeight = validatePresetDimensions(500, 0);
  assert(!resZeroHeight.valid, 'Height 0 must be invalid');

  const resNegWidth = validatePresetDimensions(-100, 500);
  assert(!resNegWidth.valid, 'Negative width must be invalid');

  const resNegHeight = validatePresetDimensions(500, -100);
  assert(!resNegHeight.valid, 'Negative height must be invalid');

  const resBothZero = validatePresetDimensions(0, 0);
  assert(!resBothZero.valid, 'Both zero must be invalid');
});

runTest('Rejects dimensions above 5000mm (> 5000)', () => {
  const res1 = validatePresetDimensions(5000.01, 1000);
  assert(!res1.valid, 'Width 5000.01 should be invalid');
  assert(typeof res1.error === 'string' && res1.error.length > 0, 'Error message required');

  const res2 = validatePresetDimensions(1000, 5001);
  assert(!res2.valid, 'Height 5001 should be invalid');
  assert(typeof res2.error === 'string' && res2.error.length > 0, 'Error message required');

  const res3 = validatePresetDimensions(10000, 10000);
  assert(!res3.valid, 'Massive dimensions should be invalid');
});

runTest('Rejects NaN and non-finite numbers', () => {
  const resNaNWidth = validatePresetDimensions(NaN, 500);
  assert(!resNaNWidth.valid, 'NaN width must be invalid');

  const resNaNHeight = validatePresetDimensions(500, NaN);
  assert(!resNaNHeight.valid, 'NaN height must be invalid');

  const resBothNaN = validatePresetDimensions(NaN, NaN);
  assert(!resBothNaN.valid, 'Both NaN must be invalid');

  const resInfWidth = validatePresetDimensions(Infinity, 500);
  assert(!resInfWidth.valid, 'Infinity width must be invalid');

  const resNegInfHeight = validatePresetDimensions(500, -Infinity);
  assert(!resNegInfHeight.valid, '-Infinity height must be invalid');
});

// Group 4: Immutability
console.log('\n--- 4. Immutability & Const Integrity ---');

runTest('STANDARD_NESTING_PRESETS array is frozen', () => {
  assert(Object.isFrozen(STANDARD_NESTING_PRESETS), 'STANDARD_NESTING_PRESETS must be frozen');

  let mutated = false;
  try {
    (STANDARD_NESTING_PRESETS as any).push({
      id: 'hacked-bed',
      name: 'Hacked',
      description: 'Hacked bed',
      sheetWidth: 100,
      sheetHeight: 100,
      defaultSpacing: 1,
      defaultMargin: 1,
      category: 'compact',
    });
    mutated = true;
  } catch (e) {
    // Expected to throw in strict mode
  }
  assert(!mutated, 'Array mutation should fail');
});

runTest('Each preset object in STANDARD_NESTING_PRESETS is frozen', () => {
  for (const preset of STANDARD_NESTING_PRESETS) {
    assert(Object.isFrozen(preset), `Preset ${preset.id} must be frozen`);

    const originalWidth = preset.sheetWidth;
    try {
      (preset as any).sheetWidth = 9999;
    } catch (e) {
      // Expected to throw in strict mode
    }
    assertEqual(preset.sheetWidth, originalWidth, `Preset ${preset.id} property sheetWidth must not change`);
  }
});

// Summary
console.log('\n========================================================');
console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('SUCCESS: All Nesting Presets tests passed cleanly! 🎉');
}
