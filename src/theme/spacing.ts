import { designTokens } from './designTokens';

export const spacing = {
  ...designTokens.spacing,
} as const;

export const radius = {
  sm: 8,
  md: designTokens.radius.compactControl,
  lg: designTokens.radius.control,
  card: designTokens.radius.card,
  modal: designTokens.radius.modal,
  sheet: designTokens.radius.sheet,
  pill: designTokens.radius.pill,
} as const;
