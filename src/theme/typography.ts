import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
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
