import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { WorkspaceGuard } from '@/src/components/taskly';
import { ProviderBottomNav } from '@/src/components/taskly/ProviderBottomNav';
import { ProviderBottomNavVisibilityProvider } from '@/src/components/taskly/ProviderBottomNavVisibility';
import { useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';

export default function ProviderLayout() {
  useI18n();

  return (
    <WorkspaceGuard workspace="provider">
      <ProviderBottomNavVisibilityProvider>
        <View style={styles.shell}>
          <View style={styles.stack}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
          <ProviderBottomNav />
        </View>
      </ProviderBottomNavVisibilityProvider>
    </WorkspaceGuard>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.slate50,
    flex: 1,
  },
  stack: {
    flex: 1,
  },
});
