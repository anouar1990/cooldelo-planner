import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  primary: string;
  primaryGlow: string;
  text: string;
  sub: string;
  dim: string;
  isDark: boolean;
}

export const DARK_THEME: ThemeColors = {
  bg: '#0F1117',
  surface: '#1C2030',
  surface2: '#242840',
  border: 'rgba(255,255,255,0.08)',
  primary: '#FF6B35',
  primaryGlow: 'rgba(255,107,53,0.15)',
  text: '#FFFFFF',
  sub: '#8B95A8',
  dim: '#4B5568',
  isDark: true,
};

export const LIGHT_THEME: ThemeColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  primary: '#FF6B35',
  primaryGlow: 'rgba(255,107,53,0.12)',
  text: '#0F172A',
  sub: '#64748B',
  dim: '#94A3B8',
  isDark: false,
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
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('0machine_theme') as ThemeMode;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      }
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('0machine_theme', mode);
    }
  };

  const toggleTheme = () => {
    const nextMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextMode);
  };

  const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
