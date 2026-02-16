// theme.js - Palettes de couleurs cohérentes
// Utilisation : const colors = isDarkMode ? COLORS.dark : COLORS.light

export const COLORS = {
  light: {
    // Backgrounds
    bg: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      accent: '#f0f9ff'
    },
    
    // Textes
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      light: '#cbd5e1'
    },
    
    // Branding
    brand: {
      primary: '#2563eb',      // Bleu
      dark: '#1e40af',         // Bleu foncé
      light: '#dbeafe'         // Bleu clair
    },
    
    // States
    success: '#10b981',        // Vert
    warning: '#f59e0b',        // Amber
    danger: '#ef4444',         // Rouge
    info: '#0284c7',           // Cyan
    
    // Éléments UI
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowSmall: 'rgba(0, 0, 0, 0.05)'
  },

  dark: {
    // Backgrounds
    bg: {
      primary: '#0f172a',      // Slate 900
      secondary: '#1e293b',    // Slate 800
      tertiary: '#334155',     // Slate 700
      accent: '#1e3a8a'        // Blue 900
    },
    
    // Textes
    text: {
      primary: '#f1f5f9',      // Slate 100
      secondary: '#cbd5e1',    // Slate 300
      tertiary: '#94a3b8',     // Slate 400
      light: '#64748b'         // Slate 500
    },
    
    // Branding
    brand: {
      primary: '#3b82f6',      // Bleu plus clair
      dark: '#2563eb',         // Bleu normal
      light: '#1e40af'         // Bleu foncé
    },
    
    // States
    success: '#34d399',        // Vert plus clair
    warning: '#fbbf24',        // Amber plus clair
    danger: '#f87171',         // Rouge plus clair
    info: '#06b6d4',           // Cyan plus clair
    
    // Éléments UI
    border: '#475569',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowSmall: 'rgba(0, 0, 0, 0.2)'
  }
};

// Fonction helper pour utiliser les couleurs
export const getTheme = (isDarkMode) => COLORS[isDarkMode ? 'dark' : 'light'];

// Styles réutilisables
export const COMMON_STYLES = {
  button: (colors, isActive = false) => ({
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? colors.brand.primary : colors.bg.tertiary,
    color: isActive ? 'white' : colors.text.secondary,
    ':hover': {
      backgroundColor: isActive ? colors.brand.dark : colors.bg.accent
    }
  }),

  input: (colors) => ({
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: colors.brand.primary,
      boxShadow: `0 0 0 3px ${colors.brand.light}`
    }
  }),

  card: (colors) => ({
    backgroundColor: colors.bg.primary,
    borderRadius: '10px',
    padding: '15px',
    boxShadow: `0 2px 8px ${colors.shadow}`,
    transition: 'all 0.2s ease'
  }),

  header: (colors) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: colors.bg.secondary,
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: `0 2px 8px ${colors.shadowSmall}`
  })
};