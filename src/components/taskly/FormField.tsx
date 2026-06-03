import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { AppText } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type FormFieldProps = TextInputProps & {
  errorText?: string;
  helperText?: string;
  label: string;
};

export function FormField({ errorText, helperText, label, multiline, style, ...inputProps }: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  function handleBlur(event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) {
    setFocused(false);
    inputProps.onBlur?.(event);
  }

  function handleFocus(event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
    setFocused(true);
    inputProps.onFocus?.(event);
  }

  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label} variant="bodyStrong">{label}</AppText>
      <TextInput
        {...inputProps}
        multiline={multiline}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholderTextColor={colors.slate500}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          errorText ? styles.inputError : null,
          multiline ? styles.multiline : null,
          style,
        ]}
      />
      {errorText ? (
        <AppText color={colors.danger600} variant="small">
          {errorText}
        </AppText>
      ) : null}
      {helperText ? (
        <AppText color={colors.slate500} variant="small">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.navy900,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  inputFocused: {
    borderColor: colors.tasklyBlueBorder,
    borderWidth: 1,
  },
  inputError: {
    borderColor: colors.danger600,
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
  },
  multiline: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  wrapper: {
    gap: spacing.xs,
  },
});
