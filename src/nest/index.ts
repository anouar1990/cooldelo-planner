/**
 * 0machine Nesting Engine — Core Module
 * Industrial-grade 2D true-shape computational nesting, SVG decomposition,
 * geometry processing, SAT collision detection, multi-sheet allocation, and SVG export.
 */

export * from './core/types';
export * from './core/units';
export * from './core/geometry';
export * from './core/validation';
export * from './core/svg/importer';
export * from './core/svg/importerAbstraction';
export * from './core/svg/pathParser';
export * from './core/svg/sanitizer';

export * from './nesting/algorithms/trueShapeNesting';
export * from './nesting/algorithms/gridPlacement';
export * from './nesting/collision';
export * from './nesting/scoring';
export * from './nesting/scoring/scoreBreakdown';
export * from './nesting/worker/nestingService';

export * from './export/svgExporter';
export * from './export/exportValidation';

