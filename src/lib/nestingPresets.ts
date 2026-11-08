export interface NestingPreset {
  id: string;
  name: string;
  description: string;
  sheetWidth: number; // in mm
  sheetHeight: number; // in mm
  defaultSpacing: number; // in mm
  defaultMargin: number; // in mm
  category: 'industrial' | 'desktop' | 'compact';
}

export const STANDARD_NESTING_PRESETS: readonly NestingPreset[] = Object.freeze([
  Object.freeze({
    id: 'laser-bed-industrial',
    name: 'Industrial 1200x800',
    description: 'Industrial bed format for high-capacity cutting jobs (1200 x 800 mm)',
    sheetWidth: 1200,
    sheetHeight: 800,
    defaultSpacing: 3,
    defaultMargin: 5,
    category: 'industrial' as const,
  }),
  Object.freeze({
    id: 'laser-bed-medium',
    name: 'Standard 900x600',
    description: 'Standard workshop laser cutting bed (900 x 600 mm)',
    sheetWidth: 900,
    sheetHeight: 600,
    defaultSpacing: 2.5,
    defaultMargin: 5,
    category: 'industrial' as const,
  }),
  Object.freeze({
    id: 'laser-bed-desktop',
    name: 'Desktop 600x400',
    description: 'Desktop laser cutter bed for medium production and prototyping (600 x 400 mm)',
    sheetWidth: 600,
    sheetHeight: 400,
    defaultSpacing: 2,
    defaultMargin: 3,
    category: 'desktop' as const,
  }),
  Object.freeze({
    id: 'laser-bed-compact',
    name: 'Compact 300x200',
    description: 'Compact laser cutter bed for craft and hobbyist work (300 x 200 mm)',
    sheetWidth: 300,
    sheetHeight: 200,
    defaultSpacing: 1.5,
    defaultMargin: 2,
    category: 'compact' as const,
  }),
]);

/**
 * Returns all standard nesting presets.
 */
export function getNestingPresets(): readonly NestingPreset[] {
  return STANDARD_NESTING_PRESETS;
}

/**
 * Retrieves a nesting preset by its unique ID.
 */
export function getPresetById(id: string): NestingPreset | undefined {
  return STANDARD_NESTING_PRESETS.find((preset) => preset.id === id);
}

/**
 * Validates dimensions for laser bed / sheet presets.
 * Sheet width and height must be positive numbers between 50 and 5000 mm.
 */
export function validatePresetDimensions(
  width: number,
  height: number
): { valid: boolean; error?: string } {
  if (typeof width !== 'number' || Number.isNaN(width) || !Number.isFinite(width)) {
    return { valid: false, error: 'Width must be a valid finite number' };
  }

  if (typeof height !== 'number' || Number.isNaN(height) || !Number.isFinite(height)) {
    return { valid: false, error: 'Height must be a valid finite number' };
  }

  if (width <= 0) {
    return { valid: false, error: 'Width must be greater than 0' };
  }

  if (height <= 0) {
    return { valid: false, error: 'Height must be greater than 0' };
  }

  if (width < 50 || width > 5000) {
    return { valid: false, error: `Width must be between 50 and 5000 mm (received ${width})` };
  }

  if (height < 50 || height > 5000) {
    return { valid: false, error: `Height must be between 50 and 5000 mm (received ${height})` };
  }

  return { valid: true };
}
