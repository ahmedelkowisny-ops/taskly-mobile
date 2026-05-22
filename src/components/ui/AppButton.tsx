import { ReactNode } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from './AppText';

type ButtonTone = 'core' | 'pro' | 'neutral';
type ButtonVariant = 'filled' | 'outline' | 'ghost';

type AppButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  tone?: ButtonTone;
  variant?: ButtonVariant;
};

const toneColor: Record<ButtonTone, string> = {
  core: colors.tasklyBlue600,
  pro: colors.proOrange600,
  neutral: colors.navy900,
};

export function AppButton({
  children,
  disabled = false,
  loading = false,
  onPress,
  style,
  tone = 'core',
  variant = 'filled',
}: AppButtonProps) {
  const accent = toneColor[tone];
  const isDisabled = disabled || loading;
  const filled = variant === 'filled';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: filled ? accent : 'transparent',
          borderColor: variant === 'ghost' ? 'transparent' : accent,
          opacity: isDisabled ? 0.55 : pressed ? 0.86 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={filled ? colors.white : accent} />
      ) : (
        <AppText color={filled ? colors.white : accent} style={styles.label} variant="bodyStrong">
          {children}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    textAlign: 'center',
  },
});
