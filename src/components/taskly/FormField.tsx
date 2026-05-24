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
  return (
    <View style={styles.wrapper}>
      <AppText variant="bodyStrong">{label}</AppText>
      <TextInput
        multiline={multiline}
        placeholderTextColor={colors.slate500}
        style={[styles.input, errorText ? styles.inputError : null, multiline ? styles.multiline : null, style]}
        {...inputProps}
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
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.navy900,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: colors.danger600,
  },
  multiline: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  wrapper: {
    gap: spacing.xs,
  },
});
