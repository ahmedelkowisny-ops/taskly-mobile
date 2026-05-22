import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
