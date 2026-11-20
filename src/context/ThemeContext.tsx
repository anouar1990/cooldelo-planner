import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  card: string;
  border: string;
  primary: string;           // Official Primary Orange (#FE7733)
  primaryGlow: string;
  primaryHover: string;      // Light variant (#FF925C)
  primaryDark: string;       // Dark variant (#E85F20)
  secondary: string;         // Official Secondary Neon Lime (#B1FA63)
  secondaryGlow: string;
  secondaryDark: string;     // High-contrast Lime (#8ED638)
  secondaryText: string;     // Text color for readability on Neon Lime (#0B0D13)
  neonLime: string;          // Direct alias for #B1FA63
  accentLime: string;        // Direct alias for #B1FA63
  text: string;
  sub: string;
  dim: string;
  isDark: boolean;
  // Semantic / Functional
  success: string;
  warning: string;
  error: string;
  info: string;
}

export const DARK_THEME: ThemeColors = {
  bg: '#111317',
  surface: '#1A1D21',
  surface2: '#23262C',
  surface3: '#2B2F37',
  card: '#1A1D21',
  border: 'rgba(255,255,255,0.08)',
  primary: '#FE7733',
  primaryGlow: 'rgba(254,119,51,0.15)',
  primaryHover: '#FF925C',
  primaryDark: '#E85F20',
  secondary: '#B1FA63',
  secondaryGlow: 'rgba(177,250,99,0.20)',
  secondaryDark: '#8ED638',
  secondaryText: '#0B0D13',
  neonLime: '#B1FA63',
  accentLime: '#B1FA63',
  text: '#FFFFFF',
  sub: '#8B95A8',
  dim: '#4B5568',
  isDark: true,
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const LIGHT_THEME: ThemeColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  surface3: '#E2E8F0',
  card: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#FE7733',
  primaryGlow: 'rgba(254,119,51,0.12)',
  primaryHover: '#FF925C',
  primaryDark: '#E85F20',
  secondary: '#72BF1C',
  secondaryGlow: 'rgba(114,191,28,0.18)',
  secondaryDark: '#5E9F17',
  secondaryText: '#FFFFFF',
  neonLime: '#72BF1C',
  accentLime: '#72BF1C',
  text: '#0F172A',
  sub: '#64748B',
  dim: '#94A3B8',
  isDark: false,
  success: '#10B981',
  warning: '#D97706',
  error: '#EF4444',
  info: '#2563EB',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: DARK_THEME,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<ThemeMode>('dark');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.removeItem('0machine_theme');
    }
  }, []);

  const setTheme = (_mode: ThemeMode) => {};
  const toggleTheme = () => {};

  const colors = DARK_THEME;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
