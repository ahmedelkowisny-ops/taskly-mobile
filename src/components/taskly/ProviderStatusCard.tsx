import { GestureResponderEvent } from 'react-native';
import { StyleSheet } from 'react-native';

import { AppButton, AppCard, AppText, StatusBadge } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

type ProviderStatusCardProps = {
  accent: 'core' | 'neutral' | 'pro';
  actionLabel?: string;
  description: string;
  onPress?: (event: GestureResponderEvent) => void;
  statusLabel: string;
  title: string;
};

const accentColors: Record<ProviderStatusCardProps['accent'], string> = {
  core: colors.tasklyBlue600,
  neutral: colors.slate700,
  pro: colors.proOrange600,
};

export function ProviderStatusCard({
  accent,
  actionLabel,
  description,
  onPress,
  statusLabel,
  title,
}: ProviderStatusCardProps) {
  const tone = accent === 'neutral' ? 'neutral' : accent;

  return (
    <AppCard
      accentColor={accentColors[accent]}
      backgroundColor={accent === 'pro' ? colors.proOrange50 : accent === 'core' ? colors.tasklyBlue50 : colors.white}
      style={[styles.card, accent === 'pro' ? styles.proCard : accent === 'core' ? styles.coreCard : null]}>
      <StatusBadge label={statusLabel} tone={tone} />
      <AppText variant="sectionTitle">{title}</AppText>
      <AppText color={colors.slate700}>{description}</AppText>
      {actionLabel ? (
        <AppButton onPress={onPress} tone={accent === 'pro' ? 'pro' : 'core'} variant="outline">
          {actionLabel}
        </AppButton>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    gap: spacing.md,
    ...designTokens.shadows.card,
  },
  coreCard: {
    borderColor: colors.tasklyBlueBorder,
  },
  proCard: {
    borderColor: colors.proOrangeBorder,
  },
});
