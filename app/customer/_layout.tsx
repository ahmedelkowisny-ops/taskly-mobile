import { Tabs } from 'expo-router';

import { WorkspaceGuard } from '@/src/components/taskly';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';

export default function CustomerLayout() {
  useI18n();

  return (
    <WorkspaceGuard workspace="customer">
      <Tabs
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen name="home" options={{ href: null }} />
        <Tabs.Screen name="tasks" options={{ href: null }} />
        <Tabs.Screen name="dashboard" options={{ href: null }} />
        <Tabs.Screen name="tasks/[taskId]" options={{ href: null }} />
        <Tabs.Screen
          name="post-task"
          options={{
            title: t('tabTaskShort'),
            tabBarActiveTintColor: colors.tasklyBlue700,
            tabBarInactiveTintColor: colors.tasklyBlue600,
          }}
        />
        <Tabs.Screen name="pro-requests" options={{ href: null }} />
        <Tabs.Screen name="pro-requests/[proRequestId]" options={{ href: null }} />
        <Tabs.Screen name="messages" options={{ href: null }} />
        <Tabs.Screen name="messages/[threadId]" options={{ href: null }} />
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen
          name="post-pro-request"
          options={{
            title: t('tabProShort'),
            tabBarActiveTintColor: colors.proOrangeText,
            tabBarInactiveTintColor: colors.proOrange600,
          }}
        />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="account" options={{ href: null }} />
      </Tabs>
    </WorkspaceGuard>
  );
}
