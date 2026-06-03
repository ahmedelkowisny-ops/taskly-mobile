import { Stack } from 'expo-router';

import { WorkspaceGuard } from '@/src/components/taskly';
import { useI18n } from '@/src/lib/i18n';

export default function CustomerLayout() {
  useI18n();

  return (
    <WorkspaceGuard workspace="customer">
      <Stack screenOptions={{ headerShown: false }} />
    </WorkspaceGuard>
  );
}
