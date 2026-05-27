import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { t } from '@/src/lib/i18n';

type ModeBadgeProps = {
  mode: 'customer' | 'providerCore' | 'providerPro';
};

const modeTone: Record<ModeBadgeProps['mode'], 'core' | 'pro'> = {
  customer: 'core',
  providerCore: 'core',
  providerPro: 'pro',
};

export function ModeBadge({ mode }: ModeBadgeProps) {
  const label =
    mode === 'customer' ? t('customerArea') : mode === 'providerCore' ? t('tabTasks') : t('tasklyPro');

  return <StatusBadge label={label} tone={modeTone[mode]} />;
}
