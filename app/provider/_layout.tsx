import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { WorkspaceGuard } from '@/src/components/taskly';
import { hasApprovedProMode, hasCoreTaskerMode } from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';

export default function ProviderLayout() {
  useI18n();
  const { session, status } = useAuth();
  const showCoreTasker = status === 'demo' || hasCoreTaskerMode(session);
  const showPro = status === 'demo' || hasApprovedProMode(session);
  const showProUpsell = showCoreTasker && !showPro;

  return (
    <WorkspaceGuard workspace="provider">
      <Tabs
        tabBar={() => null}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor:
            route.name === 'pro-requests' ? colors.proOrange600 : colors.tasklyBlue600,
          tabBarInactiveTintColor: colors.slate500,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarStyle: {
            borderTopColor: colors.slate100,
          },
        })}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t('tabHome'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="active-tasks"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="core-tasks"
          options={{
            href: showCoreTasker ? undefined : null,
            title: t('tabTasks'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="briefcase-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="core-tasks/[taskId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="interests"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="task-history"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="payouts"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="pro-requests"
          options={{
            href: showPro ? undefined : null,
            title: t('tabPro'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="star-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="pro-requests/[proRequestId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="pro-upsell"
          options={{
            href: showProUpsell ? undefined : null,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('tabMessages'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="chatbubbles-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="messages/[threadId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabAccount'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="id-card-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="start"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </WorkspaceGuard>
  );
}
