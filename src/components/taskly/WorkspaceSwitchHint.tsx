import { AppCard, AppText, StatusBadge } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';

type WorkspaceSwitchHintProps = {
  compact?: boolean;
};

export function WorkspaceSwitchHint({ compact = false }: WorkspaceSwitchHintProps) {
  return (
    <AppCard accentColor={colors.proAmber500} backgroundColor={colors.slate50}>
      <StatusBadge label={t('switchWorkspace')} tone="neutral" />
      <AppText variant={compact ? 'bodyStrong' : 'sectionTitle'}>{t('oneTasklyApp')}</AppText>
      <AppText color={colors.slate700}>
        Customer and Provider areas stay separate for clarity. Access depends on account permissions.
        {compact ? '' : ` ${t('adminWebOnly')}.`}
      </AppText>
    </AppCard>
  );
}
