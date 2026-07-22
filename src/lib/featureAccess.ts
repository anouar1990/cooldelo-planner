export type ProFeatureKey = 'DESIGN_LIBRARY' | 'NESTING' | 'INVOICE_GENERATOR';

export const PRO_ONLY_FEATURES: ProFeatureKey[] = [
    'DESIGN_LIBRARY',
    'NESTING',
    'INVOICE_GENERATOR',
];

export interface FeatureAccessInfo {
    key: ProFeatureKey;
    name: string;
    description: string;
    iconName: string;
}

export const PRO_FEATURE_DETAILS: Record<ProFeatureKey, FeatureAccessInfo> = {
    DESIGN_LIBRARY: {
        key: 'DESIGN_LIBRARY',
        name: 'Design Library',
        description: 'Access 500+ ready-to-cut vector files (.dxf, .svg, .zip) curated for laser cutting & CNC workshops.',
        iconName: 'Library',
    },
    NESTING: {
        key: 'NESTING',
        name: 'Nesting Tool',
        description: 'Optimize sheet layouts, calculate part density, and minimize raw material waste.',
        iconName: 'Grid',
    },
    INVOICE_GENERATOR: {
        key: 'INVOICE_GENERATOR',
        name: 'Invoice Generator',
        description: 'Generate professional PDF invoices with custom business branding, tax rates, and client payment details.',
        iconName: 'Receipt',
    },
};

/**
 * Check if a specific feature is accessible based on user's Pro status.
 */
export function isFeatureAllowed(feature: ProFeatureKey, isPro: boolean): boolean {
    if (isPro) return true;
    return !PRO_ONLY_FEATURES.includes(feature);
}
