import React, { createContext, useContext, useState, useEffect } from 'react';

// ── Définition des thèmes ─────────────────────────────────
export const THEMES = {
  dark: {
    name: '🌙 Sombre',
    key: 'dark',
    vars: {
      '--bg-main':       '#07071a',
      '--bg-card':       '#1a1a2e',
      '--bg-card2':      '#0d0d2b',
      '--bg-input':      '#07071a',
      '--border':        '#2a1a5e',
      '--border-light':  '#333',
      '--text-main':     '#e0e0f0',
      '--text-sub':      '#a78bfa',
      '--text-muted':    '#888',
      '--purple':        '#7c3aed',
      '--purple-light':  '#a78bfa',
      '--purple-dark':   '#5a32a3',
      '--accent':        '#fde047',
      '--green':         '#4ade80',
      '--red':           '#f87171',
      '--blue':          '#38bdf8',
      '--pink':          '#f472b6',
      '--hero-gradient': 'linear-gradient(135deg, #1a1a40, #2d1060)',
      '--navbar-bg':     '#0d0d2b',
      '--shadow':        '0 4px 20px rgba(0,0,0,0.4)',
    }
  },

  rose: {
    name: '🌸 Rose',
    key: 'rose',
    vars: {
      '--bg-main':       '#fff1f5',
      '--bg-card':       '#ffffff',
      '--bg-card2':      '#fce7f0',
      '--bg-input':      '#fff5f8',
      '--border':        '#fbcfe8',
      '--border-light':  '#f9a8d4',
      '--text-main':     '#1f0a14',
      '--text-sub':      '#9d174d',
      '--text-muted':    '#be185d',
      '--purple':        '#db2777',
      '--purple-light':  '#ec4899',
      '--purple-dark':   '#9d174d',
      '--accent':        '#f59e0b',
      '--green':         '#059669',
      '--red':           '#dc2626',
      '--blue':          '#2563eb',
      '--pink':          '#db2777',
      '--hero-gradient': 'linear-gradient(135deg, #fce7f0, #fdf2f8)',
      '--navbar-bg':     '#fdf2f8',
      '--shadow':        '0 4px 20px rgba(219,39,119,0.12)',
    }
  },

  white: {
    name: '☀️ Blanc',
    key: 'white',
    vars: {
      '--bg-main':       '#f8f7ff',
      '--bg-card':       '#ffffff',
      '--bg-card2':      '#f5f3ff',
      '--bg-input':      '#ffffff',
      '--border':        '#ddd6fe',
      '--border-light':  '#e9d5ff',
      '--text-main':     '#1f2937',
      '--text-sub':      '#5b21b6',
      '--text-muted':    '#6b7280',
      '--purple':        '#7c3aed',
      '--purple-light':  '#a78bfa',
      '--purple-dark':   '#5b21b6',
      '--accent':        '#f59e0b',
      '--green':         '#059669',
      '--red':           '#dc2626',
      '--blue':          '#2563eb',
      '--pink':          '#db2777',
      '--hero-gradient': 'linear-gradient(135deg, #ede9fe, #faf5ff)',
      '--navbar-bg':     '#ffffff',
      '--shadow':        '0 4px 20px rgba(124,58,237,0.1)',
    }
  },

  ocean: {
    name: '🌊 Océan',
    key: 'ocean',
    vars: {
      '--bg-main':       '#f0f9ff',
      '--bg-card':       '#ffffff',
      '--bg-card2':      '#e0f2fe',
      '--bg-input':      '#f0f9ff',
      '--border':        '#bae6fd',
      '--border-light':  '#7dd3fc',
      '--text-main':     '#0c1a2e',
      '--text-sub':      '#0369a1',
      '--text-muted':    '#0284c7',
      '--purple':        '#0284c7',
      '--purple-light':  '#38bdf8',
      '--purple-dark':   '#0369a1',
      '--accent':        '#f59e0b',
      '--green':         '#059669',
      '--red':           '#dc2626',
      '--blue':          '#0284c7',
      '--pink':          '#db2777',
      '--hero-gradient': 'linear-gradient(135deg, #e0f2fe, #f0f9ff)',
      '--navbar-bg':     '#ffffff',
      '--shadow':        '0 4px 20px rgba(2,132,199,0.12)',
    }
  },

  forest: {
    name: '🌿 Forêt',
    key: 'forest',
    vars: {
      '--bg-main':       '#f0fdf4',
      '--bg-card':       '#ffffff',
      '--bg-card2':      '#dcfce7',
      '--bg-input':      '#f0fdf4',
      '--border':        '#bbf7d0',
      '--border-light':  '#86efac',
      '--text-main':     '#052e16',
      '--text-sub':      '#166534',
      '--text-muted':    '#15803d',
      '--purple':        '#16a34a',
      '--purple-light':  '#4ade80',
      '--purple-dark':   '#166534',
      '--accent':        '#f59e0b',
      '--green':         '#16a34a',
      '--red':           '#dc2626',
      '--blue':          '#2563eb',
      '--pink':          '#db2777',
      '--hero-gradient': 'linear-gradient(135deg, #dcfce7, #f0fdf4)',
      '--navbar-bg':     '#ffffff',
      '--shadow':        '0 4px 20px rgba(22,163,74,0.12)',
    }
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cq_theme') || 'dark';
  });

  // Appliquer les variables CSS au :root
  useEffect(() => {
    const vars = THEMES[theme]?.vars || THEMES.dark.vars;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('cq_theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
