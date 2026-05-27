import { StyleSheet, View } from 'react-native';

import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

import { AppButton, AppCard, AppText, StatusBadge } from '../ui';

type WorkspaceAccessCardProps = {
  accessState: 'available' | 'demo' | 'loginRequired' | 'unavailable';
  accent: 'customer' | 'core' | 'neutral' | 'pro' | 'provider';
  actionLabel: string;
  description: string;
  note?: string;
  onPress: () => void;
  onSecondaryPress?: () => void;
  secondaryLabel?: string;
  title: string;
};

const accentColors = {
  customer: colors.tasklyBlue600,
  core: colors.tasklyBlue600,
  neutral: colors.slate500,
  pro: colors.proOrange600,
  provider: colors.proAmber500,
} as const;

const badgeTone = {
  available: 'success',
  demo: 'warning',
  loginRequired: 'neutral',
  unavailable: 'warning',
} as const;

export function WorkspaceAccessCard({
  accessState,
  accent,
  actionLabel,
  description,
  note,
  onPress,
  onSecondaryPress,
  secondaryLabel,
  title,
}: WorkspaceAccessCardProps) {
  return (
    <AppCard
      accentColor={accentColors[accent]}
      backgroundColor={accent === 'pro' || accent === 'provider' ? colors.proOrange50 : colors.white}
      style={accessState === 'unavailable' ? styles.disabled : undefined}>
      <View style={styles.badges}>
        <StatusBadge label={getBadgeLabel(accessState)} tone={badgeTone[accessState]} />
        {accent === 'provider' ? <StatusBadge label="Taskly + Pro" tone="pro" /> : null}
      </View>

      <AppText variant="sectionTitle">{title}</AppText>
      <AppText color={colors.slate700}>{description}</AppText>

      {note ? (
        <AppText color={colors.slate500} variant="caption">
          {note}
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <AppButton onPress={onPress} tone={accent === 'provider' || accent === 'pro' ? 'pro' : 'core'}>
          {actionLabel}
        </AppButton>
        {secondaryLabel && onSecondaryPress ? (
          <AppButton onPress={onSecondaryPress} tone="neutral" variant="ghost">
            {secondaryLabel}
          </AppButton>
        ) : null}
      </View>
    </AppCard>
  );
}

function getBadgeLabel(accessState: WorkspaceAccessCardProps['accessState']) {
  if (accessState === 'available') return t('tasklyReady');
  if (accessState === 'demo') return t('demoPreview');
  if (accessState === 'loginRequired') return t('loginRequired');
  return t('notAvailable');
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.72,
  },
});
