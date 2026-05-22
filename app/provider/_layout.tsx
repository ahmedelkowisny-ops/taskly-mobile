import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors } from '@/src/theme/colors';

export default function ProviderLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.proOrange600,
        tabBarInactiveTintColor: colors.slate500,
        tabBarLabelStyle: { fontSize: 10 },
      }}>
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
          title: 'Core',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="briefcase-outline" size={size} />,
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
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
