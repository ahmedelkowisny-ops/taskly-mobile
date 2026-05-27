import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { WorkspaceGuard } from '@/src/components/taskly';
import { colors } from '@/src/theme/colors';

export default function ProviderLayout() {
  return (
    <WorkspaceGuard workspace="provider">
      <Tabs
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
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="core-tasks"
          options={{
            title: 'Taskly',
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
          name="pro-requests"
          options={{
            title: 'Pro',
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
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => <Ionicons color={color} name="chatbubbles-outline" size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
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
