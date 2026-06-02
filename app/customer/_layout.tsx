import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { WorkspaceGuard } from '@/src/components/taskly';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';

export default function CustomerLayout() {
  useI18n();

  return (
    <WorkspaceGuard workspace="customer">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tasklyBlue600,
          tabBarInactiveTintColor: colors.slate500,
          tabBarItemStyle: {
            borderRadius: 18,
            marginHorizontal: 6,
            marginVertical: 7,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.slate100,
            height: 74,
            paddingBottom: 10,
            paddingHorizontal: 62,
            paddingTop: 8,
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="tasks/[taskId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="post-task"
          options={{
            title: t('tabTaskShort'),
            tabBarActiveBackgroundColor: colors.tasklyBlue50,
            tabBarActiveTintColor: colors.tasklyBlue700,
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="add-circle" size={size + 5} />,
            tabBarInactiveBackgroundColor: colors.tasklyBlue50,
            tabBarInactiveTintColor: colors.tasklyBlue600,
          }}
        />
        <Tabs.Screen
          name="pro-requests"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="pro-requests/[proRequestId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="messages/[threadId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="onboarding"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="post-pro-request"
          options={{
            title: t('tabProShort'),
            tabBarActiveBackgroundColor: colors.proOrange50,
            tabBarActiveTintColor: colors.proOrangeText,
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="add-circle" size={size + 5} />,
            tabBarInactiveBackgroundColor: colors.proOrange50,
            tabBarInactiveTintColor: colors.proOrange600,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="settings"
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
