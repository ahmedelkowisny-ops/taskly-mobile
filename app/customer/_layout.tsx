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
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarStyle: {
            borderTopColor: colors.slate100,
          },
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: t('tabHome'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: t('tabTasks'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="list-outline" size={size} />,
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
            title: t('tabPost'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="add-circle-outline" size={size} />,
            tabBarStyle: {
              display: 'none',
            },
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
          name="onboarding"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="post-pro-request"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: t('tabAccount'),
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />,
          }}
        />
      </Tabs>
    </WorkspaceGuard>
  );
}
