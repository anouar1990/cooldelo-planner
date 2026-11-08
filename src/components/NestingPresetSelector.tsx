import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import {
  Check,
  Factory,
  Laptop,
  Sparkles,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react-native';
import { NestingPreset } from '../lib/nestingPresets';
export type { NestingPreset };

export interface NestingPresetSelectorProps {
  selectedPresetId?: string;
  onSelectPreset: (preset: NestingPreset) => void;
  className?: string;
  presets?: NestingPreset[];
  style?: StyleProp<ViewStyle>;
  categoryFilter?: 'all' | 'industrial' | 'desktop' | 'compact';
  onCategoryFilterChange?: (category: 'all' | 'industrial' | 'desktop' | 'compact') => void;
  showCategoryFilters?: boolean;
  disabled?: boolean;
}

export interface NestingPresetCardProps {
  preset: NestingPreset;
  isSelected: boolean;
  onSelect: (preset: NestingPreset) => void;
  disabled?: boolean;
  width?: number | string;
  style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Design System Tokens (Compliant with Vercel UI & Lasercut Planner Dark Theme)
// ---------------------------------------------------------------------------
const THEME = {
  bg: '#111317',
  surface: '#1A1D21',
  surfaceElevated: '#20242A',
  border: 'rgba(255, 255, 255, 0.08)',
  borderHover: 'rgba(255, 255, 255, 0.22)',
  borderSelected: '#FE7733',
  primary: '#FE7733',
  primaryGlow: 'rgba(254, 119, 51, 0.15)',
  primaryMuted: 'rgba(254, 119, 51, 0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B95A8',
  textMuted: '#64748B',
  badgeBg: 'rgba(255, 255, 255, 0.05)',
  badgeBorder: 'rgba(255, 255, 255, 0.10)',
  focusRing: '#FE7733',
  categories: {
    industrial: {
      label: 'Industrial',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.30)',
      text: '#F59E0B',
      indicator: '#F59E0B',
    },
    desktop: {
      label: 'Desktop',
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.30)',
      text: '#818CF8',
      indicator: '#818CF8',
    },
    compact: {
      label: 'Compact',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.30)',
      text: '#10B981',
      indicator: '#10B981',
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Default Nesting Presets
// ---------------------------------------------------------------------------
export const DEFAULT_NESTING_PRESETS: NestingPreset[] = [
  {
    id: 'industrial-full-sheet',
    name: 'Standard Industrial Sheet',
    description: 'Full-size 2440 × 1220 mm flatbed for high-volume CNC and laser routing',
    sheetWidth: 2440,
    sheetHeight: 1220,
    defaultSpacing: 4,
    defaultMargin: 10,
    category: 'industrial',
  },
  {
    id: 'industrial-mid-bed',
    name: 'Industrial Mid Bed',
    description: '1300 × 900 mm bed standard for industrial CO2 sheet processing',
    sheetWidth: 1300,
    sheetHeight: 900,
    defaultSpacing: 3,
    defaultMargin: 8,
    category: 'industrial',
  },
  {
    id: 'industrial-heavy-bed',
    name: 'Heavy Workshop Bed',
    description: '1200 × 800 mm Euro-pallet sized laser cutter bed for thick stock',
    sheetWidth: 1200,
    sheetHeight: 800,
    defaultSpacing: 3,
    defaultMargin: 5,
    category: 'industrial',
  },
  {
    id: 'desktop-pro-6040',
    name: 'Desktop Pro 6040',
    description: '600 × 400 mm format optimized for high-end studio & maker lasers',
    sheetWidth: 600,
    sheetHeight: 400,
    defaultSpacing: 2,
    defaultMargin: 5,
    category: 'desktop',
  },
  {
    id: 'desktop-standard-5030',
    name: 'Desktop Maker 5030',
    description: '500 × 300 mm common bed size for boutique maker lasers',
    sheetWidth: 500,
    sheetHeight: 300,
    defaultSpacing: 2,
    defaultMargin: 4,
    category: 'desktop',
  },
  {
    id: 'desktop-square-4040',
    name: 'Square Maker 4040',
    description: '400 × 400 mm square format popular in diode and fiber setups',
    sheetWidth: 400,
    sheetHeight: 400,
    defaultSpacing: 2,
    defaultMargin: 4,
    category: 'desktop',
  },
  {
    id: 'compact-a3',
    name: 'A3 Precut Sheet',
    description: '420 × 297 mm precut sheet for architectural models & art crafts',
    sheetWidth: 420,
    sheetHeight: 297,
    defaultSpacing: 2,
    defaultMargin: 4,
    category: 'compact',
  },
  {
    id: 'compact-a4',
    name: 'A4 Precut Sheet',
    description: '297 × 210 mm benchtop craft sheet for precision jewelry & prototyping',
    sheetWidth: 297,
    sheetHeight: 210,
    defaultSpacing: 1.5,
    defaultMargin: 3,
    category: 'compact',
  },
];

// ---------------------------------------------------------------------------
// Category Pill Component
// ---------------------------------------------------------------------------
interface CategoryPillProps {
  category: NestingPreset['category'];
}

function CategoryPill({ category }: CategoryPillProps) {
  const meta = THEME.categories[category];

  const renderIcon = () => {
    switch (category) {
      case 'industrial':
        return <Factory size={11} color={meta.text} strokeWidth={2.2} />;
      case 'desktop':
        return <Laptop size={11} color={meta.text} strokeWidth={2.2} />;
      case 'compact':
        return <Sparkles size={11} color={meta.text} strokeWidth={2.2} />;
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.categoryPill,
        {
          backgroundColor: meta.bg,
          borderColor: meta.border,
        },
      ]}
    >
      {renderIcon()}
      <Text style={[styles.categoryPillText, { color: meta.text }]}>
        {meta.label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Composable NestingPresetCard Component
// ---------------------------------------------------------------------------
export function NestingPresetCard({
  preset,
  isSelected,
  onSelect,
  disabled = false,
  width,
  style,
}: NestingPresetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback(
    (e: any) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar' || e.keyCode === 32 || e.keyCode === 13) {
        e.preventDefault?.();
        onSelect(preset);
      }
    },
    [disabled, onSelect, preset]
  );

  const accessibilityLabel = useMemo(
    () =>
      `${preset.name}, dimensions ${preset.sheetWidth} by ${preset.sheetHeight} millimeters, ${preset.defaultSpacing} mm spacing, ${preset.defaultMargin} mm margin, category ${preset.category}${
        isSelected ? ', selected' : ''
      }`,
    [preset, isSelected]
  );

  return (
    <Pressable
      role="radio"
      aria-checked={isSelected}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onSelect(preset)}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      // Support keyboard activation on Web
      // @ts-ignore
      onKeyDown={handleKeyDown}
      focusable={!disabled}
      tabIndex={disabled ? -1 : 0}
      style={({ pressed }) => [
        styles.card,
        width !== undefined && { width: width as any },
        isSelected && styles.cardSelected,
        isHovered && !isSelected && styles.cardHovered,
        isFocused && styles.cardFocused,
        pressed && !disabled && styles.cardPressed,
        disabled && styles.cardDisabled,
        style,
      ]}
    >
      {/* Top Header: Category & Radio / Check Indicator */}
      <View style={styles.cardHeader}>
        <CategoryPill category={preset.category} />
        <View
          style={[
            styles.checkIndicator,
            isSelected ? styles.checkIndicatorSelected : styles.checkIndicatorUnselected,
          ]}
          aria-hidden={true}
        >
          {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
        </View>
      </View>

      {/* Preset Title */}
      <Text
        style={[
          styles.presetName,
          isSelected && styles.presetNameSelected,
          disabled && styles.textDisabled,
        ]}
        numberOfLines={1}
      >
        {preset.name}
      </Text>

      {/* Dimensions Badge */}
      <View style={styles.dimensionsBadge}>
        <Maximize2 size={11} color={isSelected ? THEME.primary : THEME.textSecondary} strokeWidth={2} />
        <Text
          style={[
            styles.dimensionsBadgeText,
            isSelected && styles.dimensionsBadgeTextSelected,
          ]}
        >
          {preset.sheetWidth} × {preset.sheetHeight} mm
        </Text>
      </View>

      {/* Description */}
      <Text
        style={[styles.descriptionText, disabled && styles.textDisabled]}
        numberOfLines={2}
      >
        {preset.description}
      </Text>

      {/* Footer Metrics: Spacing & Margin */}
      <View style={styles.metricsContainer}>
        <SlidersHorizontal size={11} color={THEME.textMuted} strokeWidth={2} />
        <Text style={styles.metricsText}>
          {preset.defaultSpacing}mm spacing · {preset.defaultMargin}mm margin
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main NestingPresetSelector Component
// ---------------------------------------------------------------------------
export function NestingPresetSelector({
  selectedPresetId,
  onSelectPreset,
  className,
  presets = DEFAULT_NESTING_PRESETS,
  style,
  categoryFilter: controlledFilter,
  onCategoryFilterChange,
  showCategoryFilters = true,
  disabled = false,
}: NestingPresetSelectorProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [uncontrolledFilter, setUncontrolledFilter] = useState<'all' | NestingPreset['category']>('all');

  const activeFilter = controlledFilter ?? uncontrolledFilter;

  const handleFilterChange = useCallback(
    (newFilter: 'all' | NestingPreset['category']) => {
      if (onCategoryFilterChange) {
        onCategoryFilterChange(newFilter);
      } else {
        setUncontrolledFilter(newFilter);
      }
    },
    [onCategoryFilterChange]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  }, []);

  // Filtered preset list
  const filteredPresets = useMemo(() => {
    if (activeFilter === 'all') return presets;
    return presets.filter((p) => p.category === activeFilter);
  }, [presets, activeFilter]);

  // Responsive column breakdown:
  // Mobile (<640px): 1 column
  // Tablet (640-1024px): 2 columns
  // Desktop (>1024px): 4 columns
  const effectiveWidth = containerWidth > 0 ? containerWidth : windowWidth;
  const numColumns = useMemo(() => {
    if (effectiveWidth < 640) return 1;
    if (effectiveWidth <= 1024) return 2;
    return 4;
  }, [effectiveWidth]);

  // Responsive width calculation with 12px gap
  const cardWidth = useMemo(() => {
    if (Platform.OS === 'web') {
      if (numColumns === 1) return '100%';
      if (numColumns === 2) return 'calc(50% - 6px)';
      return 'calc(25% - 9px)';
    }

    if (containerWidth > 0) {
      const gap = 12;
      const totalGaps = (numColumns - 1) * gap;
      return (containerWidth - totalGaps) / numColumns;
    }

    return numColumns === 1 ? '100%' : numColumns === 2 ? '48%' : '23%';
  }, [numColumns, containerWidth]);

  // Category counts for filter tabs
  const categoryCounts = useMemo(() => {
    const counts = { all: presets.length, industrial: 0, desktop: 0, compact: 0 };
    presets.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [presets]);

  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, style]}
      // Pass optional className for Web/Tailwind integration
      // @ts-ignore
      className={className}
    >
      {/* Optional Category Filter Pills Header */}
      {showCategoryFilters && (
        <View
          style={styles.filterBar}
          role="tablist"
          aria-label="Preset categories filter"
        >
          {(['all', 'industrial', 'desktop', 'compact'] as const).map((cat) => {
            const isActive = activeFilter === cat;
            const count = categoryCounts[cat];
            const label = cat.charAt(0).toUpperCase() + cat.slice(1);

            return (
              <Pressable
                key={cat}
                role="tab"
                aria-selected={isActive}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                onPress={() => handleFilterChange(cat)}
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}
                >
                  {label}
                </Text>
                <View
                  style={[
                    styles.filterCountBadge,
                    isActive && styles.filterCountBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountBadgeText,
                      isActive && styles.filterCountBadgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Preset Cards Responsive Grid */}
      <View
        role="radiogroup"
        aria-label="Laser cutter sheet nesting presets"
        style={styles.grid}
      >
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <NestingPresetCard
              key={preset.id}
              preset={preset}
              isSelected={isSelected}
              onSelect={onSelectPreset}
              disabled={disabled}
              width={cardWidth}
            />
          );
        })}
      </View>
    </View>
  );
}

// Compound component attachment for flexible composition
NestingPresetSelector.Card = NestingPresetCard;

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: THEME.primaryMuted,
    borderColor: THEME.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  filterTabTextActive: {
    color: THEME.primary,
  },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(254, 119, 51, 0.20)',
  },
  filterCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  filterCountBadgeTextActive: {
    color: THEME.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    padding: 14,
    minHeight: 160,
    justifyContent: 'space-between',
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
          outline: 'none',
        } as any)
      : {}),
  },
  cardHovered: {
    borderColor: THEME.borderHover,
    backgroundColor: THEME.surfaceElevated,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        } as any)
      : {}),
  },
  cardSelected: {
    borderColor: THEME.borderSelected,
    backgroundColor: THEME.primaryMuted,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: `0 0 0 1px ${THEME.primary}, 0 4px 14px rgba(254, 119, 51, 0.15)`,
        } as any)
      : {}),
  },
  cardFocused: {
    ...(Platform.OS === 'web'
      ? ({
          outline: `2px solid ${THEME.focusRing}`,
          outlineOffset: '2px',
        } as any)
      : {}),
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },
  cardDisabled: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed' } as any) : {}),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  checkIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndicatorSelected: {
    backgroundColor: THEME.primary,
  },
  checkIndicatorUnselected: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'transparent',
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  presetNameSelected: {
    color: '#FFFFFF',
  },
  dimensionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: THEME.badgeBg,
    borderWidth: 1,
    borderColor: THEME.badgeBorder,
    marginBottom: 8,
  },
  dimensionsBadgeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : Platform.OS === 'android' ? 'monospace' : 'monospace',
    fontWeight: '600',
    color: THEME.textSecondary,
    letterSpacing: -0.2,
  },
  dimensionsBadgeTextSelected: {
    color: THEME.primary,
  },
  descriptionText: {
    fontSize: 12,
    lineHeight: 16,
    color: THEME.textSecondary,
    marginBottom: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricsText: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '500',
  },
  textDisabled: {
    color: THEME.textMuted,
  },
});

export default NestingPresetSelector;
