import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors } from '@/src/theme/colors';
import { typography, TypographyVariant } from '@/src/theme/typography';

type AppTextProps = PropsWithChildren<{
  color?: string;
  style?: StyleProp<TextStyle>;
  variant?: TypographyVariant;
}>;

export function AppText({ children, color = colors.navy900, style, variant = 'body' }: AppTextProps) {
  return <Text style={[styles.base, typography[variant], { color }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
});
