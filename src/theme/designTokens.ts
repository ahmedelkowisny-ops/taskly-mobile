import type { ViewStyle } from 'react-native';

export const designTokens = {
  colors: {
    // ── Base surfaces ──────────────────────────────────────────────
    background: '#F4F7FA',
    foreground: '#0F172A',
    foregroundHover: '#1E293B',
    mutedText: '#64748B',
    card: '#FFFFFF',
    border: '#E2E8F0',
    hoverBackground: '#F1F5F9',
    softBlueTint: '#EFF6FF',

    // ── Taskly Core Blue — #1877F2 (Facebook blue) ─────────────────
    tasklyBlue: '#1877F2',
    tasklyBluePressed: '#0e63d4',
    tasklyBlueBorder: '#BFDBFE',
    tasklyBlueFocus: 'rgba(24, 119, 242, 0.20)',
    tasklyBlueShadow: 'rgba(24, 119, 242, 0.30)',
    tasklyBlueDisabled: '#93C5FD',
    tasklyBlueSurface: '#EFF6FF',
    tasklyBlueSurface2: '#DBEAFE',

    // ── Landing blue (same as core at launch) ──────────────────────
    landingBlue: '#1877F2',
    landingBluePressed: '#0e63d4',

    // ── Taskly Pro Amber — #F59E0B ─────────────────────────────────
    proGold: '#F59E0B',
    proGoldPressed: '#D97706',
    proText: '#B45309',
    proTextDark: '#92400E',
    proSurface: '#FFF7ED',
    proSurface2: '#FEF3C7',
    proBorder: '#FDE68A',
    proChipBorder: '#FDE68A',

    // ── Sidebar ────────────────────────────────────────────────────
    sidebarBackground: '#FFFCF8',
    sidebarBorder: '#E8DDD0',
    sidebarMuted: '#6A6259',
  },

  radius: {
    control: 14,
    compactControl: 12,
    card: 20,
    modal: 18,
    sheet: 24,
    pill: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  size: {
    button: 48,
    buttonCompact: 44,
    input: 52,
    chip: 28,
    drawerIcon: 32,
  },

  typography: {
    screenTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
    sectionTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
    cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
    bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    small: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
    button: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  },

  shadows: {
    surface: {
      shadowColor: '#0F172A',
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: 0.10,
      shadowRadius: 32,
      elevation: 4,
    } satisfies ViewStyle,
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { height: 8, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 3,
    } satisfies ViewStyle,
    buttonBlue: {
      shadowColor: '#1877F2',
      shadowOffset: { height: 6, width: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 4,
    } satisfies ViewStyle,
    buttonPro: {
      shadowColor: '#F59E0B',
      shadowOffset: { height: 6, width: 0 },
      shadowOpacity: 0.32,
      shadowRadius: 16,
      elevation: 4,
    } satisfies ViewStyle,
  },
} as const;

export type DesignTokens = typeof designTokens;
