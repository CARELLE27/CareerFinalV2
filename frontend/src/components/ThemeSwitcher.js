import React, { useState } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      {/* Bouton principal */}
      <button
        onClick={() => setOpen(!open)}
        title="Changer le thème"
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '5px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-sub)',
          fontSize: '0.82rem',
          fontWeight: 700,
          fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}
      >
        🎨 {THEMES[theme]?.name}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay pour fermer */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          />
          <div style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '8px',
            zIndex: 999,
            minWidth: '180px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 8px', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Choisir un thème
            </p>
            {Object.values(THEMES).map(t => (
              <button
                key={t.key}
                onClick={() => { setTheme(t.key); setOpen(false); }}
                style={{
                  background: theme === t.key ? 'var(--purple)' : 'transparent',
                  border: theme === t.key ? '1px solid var(--purple)' : '1px solid transparent',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: theme === t.key ? 'white' : 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: theme === t.key ? 700 : 400,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {t.name}
                {theme === t.key && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
