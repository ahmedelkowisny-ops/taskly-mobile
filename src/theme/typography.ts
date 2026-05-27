import { TextStyle } from 'react-native';

import { designTokens } from './designTokens';

export const typography = {
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  screenTitle: {
    ...designTokens.typography.screenTitle,
  },
  sectionTitle: {
    ...designTokens.typography.sectionTitle,
  },
  cardTitle: {
    ...designTokens.typography.cardTitle,
  },
  body: {
    ...designTokens.typography.body,
  },
  bodyStrong: {
    ...designTokens.typography.bodyStrong,
  },
  caption: {
    ...designTokens.typography.caption,
  },
  small: {
    ...designTokens.typography.small,
  },
  button: {
    ...designTokens.typography.button,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
