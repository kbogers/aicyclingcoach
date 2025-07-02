// Theme configuration with neutral colors (avoiding Strava colors)
export const theme = {
  colors: {
    // Primary colors
    primary: '#2563eb', // Blue
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    primaryDark: '#1e40af',
    
    // Neutral colors
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    
    // Status colors
    success: '#10b981',
    successLight: '#dcfce7',
    successDark: '#059669',
    warning: '#f59e0b',
    warningLight: '#fffbeb',
    warningDark: '#d97706',
    error: '#ef4444',
    errorLight: '#fef2f2',
    errorDark: '#dc2626',
    info: '#3b82f6',
    infoLight: '#dbeafe',
    infoDark: '#1e40af',
    
    // Background colors
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceHover: '#f1f5f9',
    surfaceActive: '#e2e8f0',
    
    // Text colors
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    textLight: '#d1d5db',
    
    // Border colors
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};

// Helper function for easier color usage (simplified)
export const getThemeColor = (colorKey: keyof typeof theme.colors) => {
  return theme.colors[colorKey];
};

// Common color combinations for consistency
export const colorSchemes = {
  primary: {
    bg: theme.colors.primary,
    text: '#ffffff',
    hover: theme.colors.primaryHover,
  },
  secondary: {
    bg: theme.colors.surface,
    text: theme.colors.textPrimary,
    hover: theme.colors.surfaceHover,
    border: theme.colors.border,
  },
  success: {
    bg: theme.colors.successLight,
    text: theme.colors.successDark,
    border: theme.colors.success,
  },
  warning: {
    bg: theme.colors.warningLight,
    text: theme.colors.warningDark,
    border: theme.colors.warning,
  },
  error: {
    bg: theme.colors.errorLight,
    text: theme.colors.errorDark,
    border: theme.colors.error,
  },
}; 