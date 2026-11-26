import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';

interface SidebarContextType {
  isCollapsed: boolean;
  isHovered: boolean;
  isOpen: boolean;
  setHovered: (hovered: boolean) => void;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
}

const STORAGE_KEY = '0machine_sidebar_collapsed';

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: true,
  isHovered: false,
  isOpen: false,
  setHovered: () => {},
  toggleSidebar: () => {},
  collapseSidebar: () => {},
  expandSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to true (compact icon rail) for maximum workspace space
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) return saved === 'true';
        return true;
      } catch {
        return true;
      }
    }
    return true;
  });

  const [isHovered, setHovered] = useState<boolean>(false);

  // Expanded visually if user pinned it open OR is hovering over the rail
  const isOpen = !isCollapsed || isHovered;

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, String(next));
        } catch {}
      }
      return next;
    });
  };

  const collapseSidebar = () => {
    setIsCollapsed(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}
    }
  };

  const expandSidebar = () => {
    setIsCollapsed(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, 'false');
      } catch {}
    }
  };

  // Keyboard shortcut on Web: Cmd+B or Ctrl+B to toggle pin state
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isHovered,
        isOpen,
        setHovered,
        toggleSidebar,
        collapseSidebar,
        expandSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
