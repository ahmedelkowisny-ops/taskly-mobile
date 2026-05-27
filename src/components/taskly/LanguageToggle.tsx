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
      {localeOptions.map((option, index) => {
        const active = option.value === locale;

        return (
          <View key={option.value} style={styles.optionWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void setLocale(option.value);
              }}
              style={({ pressed }) => [
                styles.option,
                active ? styles.activeOption : null,
                pressed ? styles.pressedOption : null,
              ]}>
              <AppText color={active ? '#374151' : colors.slate500} variant="small">
                {option.label}
              </AppText>
            </Pressable>
            {index < localeOptions.length - 1 ? (
              <AppText color="#D1D5DB" style={styles.separator} variant="small">
                /
              </AppText>
            ) : null}
          </View>
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
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  option: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 36,
    paddingHorizontal: spacing.xs,
  },
  optionWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  pressedOption: {
    opacity: 0.82,
  },
  separator: {
    paddingHorizontal: 2,
  },
});
