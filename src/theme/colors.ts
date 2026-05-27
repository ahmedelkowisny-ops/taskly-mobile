import { designTokens } from './designTokens';

const tokenColors = designTokens.colors;

export const colors = {
  tasklyBlue600: tokenColors.tasklyBlue,
  tasklyBlue700: tokenColors.tasklyBluePressed,
  tasklyBlue50: tokenColors.tasklyBlueSurface,
  tasklyBlueBorder: tokenColors.tasklyBlueBorder,
  tasklyBlueDisabled: tokenColors.tasklyBlueDisabled,
  landingBlue600: tokenColors.landingBlue,
  landingBlue700: tokenColors.landingBluePressed,

  navy900: tokenColors.foreground,
  navy800: tokenColors.foregroundHover,
  slate700: '#4E5F71',
  slate500: tokenColors.mutedText,
  slate100: tokenColors.border,
  slate50: tokenColors.background,
  white: tokenColors.card,

  proOrange600: tokenColors.proGold,
  proOrange500: tokenColors.proGoldPressed,
  proAmber500: tokenColors.proGold,
  proOrange50: tokenColors.proSurface,
  proOrangeBorder: tokenColors.proBorder,
  proOrangeText: tokenColors.proText,
  proOrangeTextDark: tokenColors.proTextDark,

  success600: '#059669',
  success50: '#ECFDF5',
  warning600: '#D97706',
  danger600: '#DC2626',

  border: tokenColors.border,
  mutedText: tokenColors.mutedText,
  sidebarBackground: tokenColors.sidebarBackground,
  sidebarBorder: tokenColors.sidebarBorder,
  sidebarMuted: tokenColors.sidebarMuted,
} as const;

export type AppColor = keyof typeof colors;
