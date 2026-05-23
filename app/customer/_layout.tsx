import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors } from '@/src/theme/colors';

export default function CustomerLayout() {
  return (
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
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="list-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="pro-requests"
        options={{
          title: 'Pro',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="ribbon-outline" size={size} />,
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
        name="onboarding"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
