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
  shades: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'amber',
    name: 'Ámbar Café (Cálido)',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryLight: '#fef3c7',
    primaryText: '#78350f',
    primaryDark: '#b45309',
    shades: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    }
  },
  {
    id: 'emerald',
    name: 'Esmeralda & Farmacia (Verde)',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#d1fae5',
    primaryText: '#065f46',
    primaryDark: '#047857',
    shades: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22'
    }
  },
  {
    id: 'blue',
    name: 'Zafiro Comercial (Azul)',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    primaryText: '#1e40af',
    primaryDark: '#1e3a8a',
    shades: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    }
  },
  {
    id: 'rose',
    name: 'Rubí & Variedades (Rojo/Rosa)',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryLight: '#ffe4e6',
    primaryText: '#9f1239',
    primaryDark: '#be123c',
    shades: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
      950: '#4c0519'
    }
  },
  {
    id: 'purple',
    name: 'Violeta & Boutique (Púrpura)',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: '#ede9fe',
    primaryText: '#5b21b6',
    primaryDark: '#6d28d9',
    shades: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764'
    }
  },
  {
    id: 'cyan',
    name: 'Cian Fresco (Turquesa)',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    primaryLight: '#cffafe',
    primaryText: '#155e75',
    primaryDark: '#0e7490',
    shades: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344'
    }
  },
  {
    id: 'orange',
    name: 'Naranja Market (Vibrante)',
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryLight: '#ffedd5',
    primaryText: '#9a3412',
    primaryDark: '#c2410c',
    shades: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407'
    }
  },
  {
    id: 'indigo',
    name: 'Índigo Corporativo (Moderno)',
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    primaryLight: '#e0e7ff',
    primaryText: '#3730a3',
    primaryDark: '#4338ca',
    shades: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b'
    }
  },
  {
    id: 'dark',
    name: 'Obsidiana & Grafito (Minimal)',
    primary: '#475569',
    primaryHover: '#334155',
    primaryLight: '#f1f5f9',
    primaryText: '#0f172a',
    primaryDark: '#1e293b',
    shades: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    }
  }
];

export const applyThemeToDocument = (preset: ThemePreset) => {
  const root = document.documentElement;
  root.setAttribute('data-theme', preset.id);

  // Set individual palette shades
  Object.entries(preset.shades).forEach(([shade, color]) => {
    root.style.setProperty(`--primary-${shade}`, color);
    root.style.setProperty(`--genesis-${shade}`, color);
  });

  root.style.setProperty('--primary-brand', preset.primary);
  root.style.setProperty('--primary-brand-hover', preset.primaryHover);
  root.style.setProperty('--primary-brand-light', preset.primaryLight);
  root.style.setProperty('--primary-brand-text', preset.primaryText);
  root.style.setProperty('--primary-brand-dark', preset.primaryDark);
};

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
        applyThemeToDocument(found);
        set({ currentThemeId: found.id, theme: found });
      }
    }),
    {
      name: 'cafetin_genesis_theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const found = THEME_PRESETS.find((t) => t.id === state.currentThemeId) || THEME_PRESETS[0];
          applyThemeToDocument(found);
        }
      }
    }
  )
);
