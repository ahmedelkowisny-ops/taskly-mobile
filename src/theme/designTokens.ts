import type { ViewStyle } from 'react-native';

export const designTokens = {
  colors: {
    background: '#F7F9FB',
    foreground: '#1F2A33',
    foregroundHover: '#273641',
    mutedText: '#6B7280',
    card: '#FFFFFF',
    border: '#E6EBF0',
    hoverBackground: '#F1F5F9',
    softBlueTint: '#EAF2FB',

    tasklyBlue: '#5A8EC7',
    tasklyBluePressed: '#4F80B5',
    tasklyBlueBorder: '#4F80B5',
    tasklyBlueFocus: 'rgba(90, 142, 199, 0.22)',
    tasklyBlueShadow: 'rgba(90, 142, 199, 0.25)',
    tasklyBlueDisabled: '#9EB8D3',
    tasklyBlueSurface: '#EAF2FB',

    landingBlue: '#2C6BED',
    landingBluePressed: '#1F5DE0',

    proGold: '#F59E0B',
    proGoldPressed: '#D97706',
    proText: '#B45309',
    proTextDark: '#92400E',
    proSurface: '#FFF7ED',
    proBorder: '#F3D6AF',
    proChipBorder: '#FCD9A8',

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
    sectionTitle: { fontSize: 19, lineHeight: 25, fontWeight: '800' },
    cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800' },
    body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
    bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    small: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
    button: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  },
  shadows: {
    surface: {
      shadowColor: '#1F2A33',
      shadowOffset: { height: 8, width: 0 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 3,
    } satisfies ViewStyle,
    card: {
      shadowColor: '#1F2A33',
      shadowOffset: { height: 6, width: 0 },
      shadowOpacity: 0.05,
      shadowRadius: 18,
      elevation: 2,
    } satisfies ViewStyle,
    buttonBlue: {
      shadowColor: '#5A8EC7',
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 2,
    } satisfies ViewStyle,
    buttonPro: {
      shadowColor: '#D97706',
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.24,
      shadowRadius: 12,
      elevation: 2,
    } satisfies ViewStyle,
  },
} as const;

export type DesignTokens = typeof designTokens;
