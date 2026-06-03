import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CustomerCreateBarVisibilityProvider, WorkspaceGuard } from '@/src/components/taskly';
import { CustomerBottomNav } from '@/src/components/taskly/CustomerBottomNav';
import { useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';

export default function CustomerLayout() {
  useI18n();

  return (
    <WorkspaceGuard workspace="customer">
      <CustomerCreateBarVisibilityProvider>
        <View style={styles.shell}>
          <View style={styles.stack}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
          <CustomerBottomNav />
        </View>
      </CustomerCreateBarVisibilityProvider>
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
