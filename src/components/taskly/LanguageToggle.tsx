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
            <AppText color={active ? colors.navy900 : colors.slate500} variant="small">
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
    backgroundColor: colors.white,
    borderColor: colors.white,
    shadowColor: colors.navy900,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  container: {
    alignSelf: 'flex-start',
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    minWidth: 38,
    paddingHorizontal: spacing.xs,
  },
  pressedOption: {
    opacity: 0.82,
  },
});
