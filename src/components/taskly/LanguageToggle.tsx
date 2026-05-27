import { Pressable, StyleSheet, View } from 'react-native';

import { Locale, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from '../ui';

const localeOptions: { label: string; value: Locale }[] = [
  { label: 'BG', value: 'bg' },
  { label: 'EN', value: 'en' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <View accessibilityLabel="Language" style={styles.container}>
      {localeOptions.map((option) => {
        const active = option.value === locale;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => {
              void setLocale(option.value);
            }}
            style={({ pressed }) => [
              styles.option,
              active ? styles.activeOption : null,
              pressed ? styles.pressedOption : null,
            ]}>
            <AppText color={active ? colors.white : colors.slate700} variant="small">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeOption: {
    backgroundColor: colors.navy900,
    borderColor: colors.navy900,
  },
  container: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 40,
    paddingHorizontal: spacing.sm,
  },
  pressedOption: {
    opacity: 0.82,
  },
});
