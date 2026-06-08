import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCustomerCreateBarScrollHandler, useCustomerCreateBarVisibility } from '@/src/components/taskly/CustomerCreateBarVisibility';
import { useProviderBottomNavScrollHandler } from '@/src/components/taskly/ProviderBottomNavVisibility';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type ScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  stickyHeaderIndices?: number[];
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, contentStyle, scroll = true, stickyHeaderIndices, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const customerVisibility = useCustomerCreateBarVisibility();
  const handleCustomerScroll = useCustomerCreateBarScrollHandler();
  const handleProviderScroll = useProviderBottomNavScrollHandler();
  const customerBottomClearance = 58 + Math.max(insets.bottom, spacing.md) + spacing.xxl;

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            contentStyle,
            customerVisibility ? { paddingBottom: customerBottomClearance } : null,
          ]}
          onScroll={(event) => {
            handleCustomerScroll(event);
            handleProviderScroll(event);
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={stickyHeaderIndices}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl + 64,
  },
});
