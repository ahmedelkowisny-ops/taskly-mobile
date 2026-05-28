import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type SelectOptionCardProps = {
  description?: string | null;
  label: string;
  onPress: () => void;
  selected?: boolean;
  tone?: 'core' | 'pro';
};

export function SelectOptionCard({
  description,
  label,
  onPress,
  selected = false,
  tone = 'core',
}: SelectOptionCardProps) {
  const accentColor = tone === 'pro' ? colors.proOrange600 : colors.tasklyBlue600;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? accentColor : colors.slate100,
          backgroundColor: selected ? (tone === 'pro' ? colors.proOrange50 : colors.tasklyBlue50) : colors.white,
          opacity: pressed ? 0.86 : 1,
        },
      ]}>
      <View style={styles.header}>
        <AppText style={styles.label} variant="bodyStrong">
          {label}
        </AppText>
        {selected ? <StatusBadge label={t('selected')} tone={tone} /> : null}
      </View>
      {description ? (
        <AppText color={colors.slate700} variant="small">
          {description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
  },
});
