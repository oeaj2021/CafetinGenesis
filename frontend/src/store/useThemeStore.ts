import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryText: string;
  primaryDark: string;
  badgeBg: string;
  badgeText: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'amber',
    name: 'Ámbar Café (Clásico)',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryLight: '#fef3c7',
    primaryText: '#78350f',
    primaryDark: '#b45309',
    badgeBg: 'bg-amber-500/20 border-amber-400/30',
    badgeText: 'text-amber-300'
  },
  {
    id: 'emerald',
    name: 'Esmeralda Menta',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#d1fae5',
    primaryText: '#065f46',
    primaryDark: '#047857',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/30',
    badgeText: 'text-emerald-300'
  },
  {
    id: 'blue',
    name: 'Zafiro Real',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    primaryText: '#1e40af',
    primaryDark: '#1e3a8a',
    badgeBg: 'bg-blue-500/20 border-blue-400/30',
    badgeText: 'text-blue-300'
  },
  {
    id: 'rose',
    name: 'Rubí Pasión',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryLight: '#ffe4e6',
    primaryText: '#9f1239',
    primaryDark: '#be123c',
    badgeBg: 'bg-rose-500/20 border-rose-400/30',
    badgeText: 'text-rose-300'
  },
  {
    id: 'purple',
    name: 'Violeta Gourmet',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: '#ede9fe',
    primaryText: '#5b21b6',
    primaryDark: '#6d28d9',
    badgeBg: 'bg-purple-500/20 border-purple-400/30',
    badgeText: 'text-purple-300'
  },
  {
    id: 'cyan',
    name: 'Cian Caribe',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    primaryLight: '#cffafe',
    primaryText: '#155e75',
    primaryDark: '#0e7490',
    badgeBg: 'bg-cyan-500/20 border-cyan-400/30',
    badgeText: 'text-cyan-300'
  },
  {
    id: 'orange',
    name: 'Naranja Sunset',
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryLight: '#ffedd5',
    primaryText: '#9a3412',
    primaryDark: '#c2410c',
    badgeBg: 'bg-orange-500/20 border-orange-400/30',
    badgeText: 'text-orange-300'
  },
  {
    id: 'dark',
    name: 'Obsidiana Noir',
    primary: '#475569',
    primaryHover: '#334155',
    primaryLight: '#f1f5f9',
    primaryText: '#0f172a',
    primaryDark: '#1e293b',
    badgeBg: 'bg-slate-500/20 border-slate-400/30',
    badgeText: 'text-slate-300'
  }
];

interface ThemeState {
  currentThemeId: string;
  theme: ThemePreset;
  setTheme: (themeId: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentThemeId: 'amber',
      theme: THEME_PRESETS[0],
      setTheme: (themeId: string) => {
        const found = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
        // Inyectar variables CSS globales
        document.documentElement.style.setProperty('--primary-brand', found.primary);
        document.documentElement.style.setProperty('--primary-brand-hover', found.primaryHover);
        document.documentElement.style.setProperty('--primary-brand-light', found.primaryLight);
        document.documentElement.style.setProperty('--primary-brand-text', found.primaryText);
        set({ currentThemeId: found.id, theme: found });
      }
    }),
    {
      name: 'cafetin_genesis_theme'
    }
  )
);
