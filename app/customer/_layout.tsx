import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';

import { CustomerCreateBarVisibilityProvider, useCustomerCreateBarVisibility, WorkspaceGuard } from '@/src/components/taskly';
import { AppText } from '@/src/components/ui';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

type CustomerTabBarProps = {
  descriptors: Record<string, { options?: { title?: string } }>;
  navigation: {
    navigate: (routeName: string) => void;
  };
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
};

const createRoutes = ['post-task', 'post-pro-request'] as const;

export default function CustomerLayout() {
  useI18n();

  return (
    <WorkspaceGuard workspace="customer">
      <CustomerCreateBarVisibilityProvider>
        <Tabs
          tabBar={(props) => <CustomerCreateBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              borderTopWidth: 0,
              elevation: 0,
              position: 'absolute',
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
      </CustomerCreateBarVisibilityProvider>
    </WorkspaceGuard>
  );
}

function CustomerCreateBar({ navigation, state }: CustomerTabBarProps) {
  const insets = useSafeAreaInsets();
  const controls = useCustomerCreateBarVisibility();
  const showCreateBar = controls?.showCreateBar;
  const visibility = useRef(new Animated.Value(1)).current;
  const bottomOffset = Math.max(insets.bottom + spacing.lg, spacing.xxl);
  const visibleRoutes = state.routes.filter((route) => createRoutes.includes(route.name as (typeof createRoutes)[number]));
  const activeRouteName = state.routes[state.index]?.name;
  const isCreateRouteActive = createRoutes.includes(activeRouteName as (typeof createRoutes)[number]);
  const isCreateBarHidden = isCreateRouteActive || Boolean(controls?.hidden);

  useEffect(() => {
    if (!isCreateRouteActive) {
      showCreateBar?.();
    }
  }, [isCreateRouteActive, showCreateBar, state.index]);

  useEffect(() => {
    Animated.timing(visibility, {
      duration: 180,
      toValue: isCreateBarHidden ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [isCreateBarHidden, visibility]);

  const translateY = visibility.interpolate({
    inputRange: [0, 1],
    outputRange: [86, 0],
  });

  return (
    <Animated.View
      pointerEvents={isCreateBarHidden ? 'none' : 'box-none'}
      style={[
        styles.tabBarWrap,
        {
          bottom: bottomOffset,
          opacity: visibility,
          transform: [{ translateY }],
        },
      ]}>
      <View style={styles.createBar}>
        {visibleRoutes.map((route) => {
          const isActive = state.routes[state.index]?.key === route.key;
          const isPro = route.name === 'post-pro-request';
          const label = isPro ? t('tabProShort') : t('tabTaskShort');

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={({ pressed }) => [
                styles.createAction,
                isPro ? styles.proAction : styles.taskAction,
                isActive ? (isPro ? styles.proActionActive : styles.taskActionActive) : null,
                { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}>
              <View style={[styles.iconBubble, isPro ? styles.proIconBubble : styles.taskIconBubble]}>
                <Ionicons color={isPro ? colors.proOrangeText : colors.tasklyBlue700} name="add" size={19} />
              </View>
              <AppText color={isPro ? colors.proOrangeText : colors.tasklyBlue700} style={styles.createLabel}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  createAction: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  createBar: {
    ...designTokens.shadows.surface,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
  },
  createLabel: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  proAction: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  proActionActive: {
    borderColor: colors.proOrange500,
  },
  proIconBubble: {
    backgroundColor: '#FDE8C7',
  },
  tabBarWrap: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: 0,
  },
  taskAction: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: '#CFE0F1',
  },
  taskActionActive: {
    borderColor: colors.tasklyBlue600,
  },
  taskIconBubble: {
    backgroundColor: '#DCEAF7',
  },
});
