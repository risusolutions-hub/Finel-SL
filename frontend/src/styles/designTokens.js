/**
 * Enterprise Design System - Design Tokens
 * Professional, corporate, minimal business interface
 */

export const Colors = {
  // Neutral palette - clean and professional
  white: '#FFFFFF',
  neutral50: '#F9FAFB',    // Very light gray - backgrounds
  neutral100: '#F3F4F6',   // Light gray - alt backgrounds
  neutral200: '#E5E7EB',   // Light border, disabled
  neutral300: '#D1D5DB',   // Medium border
  neutral400: '#9CA3AF',   // Tertiary text
  neutral500: '#6B7280',   // Secondary text
  neutral600: '#4B5563',   // Primary text (dark)
  neutral700: '#374151',   // Darker text
  neutral800: '#1F2937',   // Very dark text
  neutral900: '#111827',   // Darkest - headers, bg

  // Primary - corporate navy/dark blue
  primary50: '#F0F4F8',
  primary100: '#D9E2EC',
  primary200: '#B3C5DB',
  primary300: '#8CA5C0',
  primary400: '#6B88AE',
  primary500: '#4A6FA5',   // Primary blue
  primary600: '#3D5A8C',
  primary700: '#304673',
  primary800: '#23325A',
  primary900: '#1B2541',

  // Secondary - professional gray-blue
  secondary50: '#F7F9FB',
  secondary100: '#EFF2F5',
  secondary200: '#D9E0E8',
  secondary300: '#C3CEDB',
  secondary400: '#9EAEC0',
  secondary500: '#7A8EA5',
  secondary600: '#5A738E',
  secondary700: '#455A77',
  secondary800: '#304160',
  secondary900: '#1E2B47',

  // Status colors - muted, professional
  success500: '#059669',  // Professional green
  warning500: '#D97706',  // Professional amber
  error500: '#DC2626',    // Professional red
  info500: '#0891B2',     // Professional cyan

  // Functional
  success50: '#F0FDF4',
  success100: '#DCFCE7',
  success200: '#BBF7D0',
  warning50: '#FFFBEB',
  warning100: '#FEF3C7',
  warning200: '#FDE68A',
  error50: '#FEF2F2',
  error100: '#FEE2E2',
  error200: '#FECACA',
  info50: '#F0F9FF',
  info100: '#E0F2FE',
  info200: '#BAE6FD',
};

export const Typography = {
  // Font family
  fontFamily: "'Inter', 'Roboto', 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMono: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",

  // Font sizes (px)
  xs: '12px',      // Captions, small labels
  sm: '13px',      // Small text, secondary labels
  base: '14px',    // Body text, default
  lg: '16px',      // Larger body, section headers
  xl: '18px',      // Page titles
  '2xl': '20px',   // Dashboard headers
  '3xl': '24px',   // Page headers
  '4xl': '28px',   // Main titles

  // Font weights
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,

  // Line heights
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,

  // Letter spacing
  tight: '-0.02em',
  normal: '0em',
  wide: '0.02em',
  wider: '0.05em',
  widest: '0.1em',
};

export const Spacing = {
  // Base 4px grid
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
};

export const BorderRadius = {
  none: '0px',
  sm: '3px',       // Minimal border radius
  md: '4px',       // Default
  lg: '6px',       // Larger elements
  xl: '8px',       // Cards, modals
  full: '9999px',  // Circles, pills
};

export const Shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

export const Borders = {
  width1: '1px',
  width2: '2px',
  style: 'solid',
  color: Colors.neutral200,
};

export const Transitions = {
  fast: '150ms ease-out',
  normal: '250ms ease-out',
  slow: '400ms ease-out',
};

// Component-specific tokens
export const Components = {
  Button: {
    heightSm: '32px',
    heightMd: '40px',
    heightLg: '44px',
    paddingX: '16px',
    fontWeight: Typography.medium,
    fontSize: Typography.sm,
    borderRadius: BorderRadius.md,
    transition: Transitions.normal,
  },

  Input: {
    height: '40px',
    paddingX: '12px',
    paddingY: '8px',
    fontSize: Typography.sm,
    borderRadius: BorderRadius.md,
    border: `${Borders.width1} ${Borders.style} ${Borders.color}`,
    transition: Transitions.normal,
  },

  Card: {
    borderRadius: BorderRadius.lg,
    border: `${Borders.width1} ${Borders.style} ${Borders.color}`,
    padding: Spacing[4],
    backgroundColor: Colors.white,
    shadow: Shadows.sm,
  },

  Table: {
    headerBackground: Colors.neutral50,
    headerBorder: `${Borders.width1} ${Borders.style} ${Borders.color}`,
    rowBorder: `${Borders.width1} ${Borders.style} rgba(0, 0, 0, 0.04)`,
    rowHoverBackground: Colors.neutral50,
    headerFontWeight: Typography.semibold,
    headerFontSize: Typography.xs,
    rowFontSize: Typography.sm,
  },

  Modal: {
    borderRadius: BorderRadius.xl,
    shadow: Shadows.lg,
    backgroundColor: Colors.white,
    overlayBackground: 'rgba(0, 0, 0, 0.5)',
  },

  Sidebar: {
    backgroundColor: Colors.neutral900,
    width: '256px',
    borderRight: `${Borders.width1} ${Borders.style} ${Colors.neutral800}`,
    textColor: Colors.neutral300,
  },

  Header: {
    backgroundColor: Colors.white,
    borderBottom: `${Borders.width1} ${Borders.style} ${Colors.neutral200}`,
    height: '64px',
  },
};
