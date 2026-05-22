import { StatusBadge } from '@/src/components/ui/StatusBadge';

type ModeBadgeProps = {
  mode: 'customer' | 'providerCore' | 'providerPro';
};

const modeCopy: Record<ModeBadgeProps['mode'], { label: string; tone: 'core' | 'pro' }> = {
  customer: { label: 'Customer Workspace', tone: 'core' },
  providerCore: { label: 'Core Tasks', tone: 'core' },
  providerPro: { label: 'Pro Requests', tone: 'pro' },
};

export function ModeBadge({ mode }: ModeBadgeProps) {
  const copy = modeCopy[mode];

  return <StatusBadge label={copy.label} tone={copy.tone} />;
}
