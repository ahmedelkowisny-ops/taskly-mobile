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
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from './AppText';

type ButtonTone = 'core' | 'pro' | 'neutral';
type ButtonVariant = 'filled' | 'outline' | 'ghost';

type AppButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  labelColor?: string;
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

const toneBorderColor: Record<ButtonTone, string> = {
  core: colors.tasklyBlueBorder,
  pro: colors.proOrange500,
  neutral: colors.navy900,
};

export function AppButton({
  children,
  disabled = false,
  labelColor,
  loading = false,
  onPress,
  style,
  tone = 'core',
  variant = 'filled',
}: AppButtonProps) {
  const accent = toneColor[tone];
  const borderAccent = toneBorderColor[tone];
  const isDisabled = disabled || loading;
  const filled = variant === 'filled';
  const disabledFilledColor = tone === 'pro' ? '#F6C56D' : colors.tasklyBlueDisabled;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: filled ? (isDisabled ? disabledFilledColor : accent) : colors.white,
          borderColor: variant === 'ghost' ? 'transparent' : borderAccent,
          opacity: isDisabled ? 0.55 : pressed ? 0.86 : 1,
          transform: [{ scale: isDisabled ? 1 : pressed ? 0.985 : 1 }],
        },
        filled && !isDisabled ? (tone === 'pro' ? designTokens.shadows.buttonPro : designTokens.shadows.buttonBlue) : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={filled ? colors.white : accent} />
      ) : (
        <AppText color={labelColor ?? (filled ? colors.white : accent)} style={styles.label} variant="button">
          {children}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: designTokens.size.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
