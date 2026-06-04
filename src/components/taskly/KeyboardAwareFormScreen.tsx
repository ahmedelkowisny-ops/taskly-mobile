import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

import { useCustomerCreateBarScrollHandler } from './CustomerCreateBarVisibility';
import { useProviderBottomNavScrollHandler } from './ProviderBottomNavVisibility';

type KeyboardAwareFormScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  scrollViewStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}>;

export function KeyboardAwareFormScreen({
  children,
  contentStyle,
  keyboardVerticalOffset = 0,
  scrollViewStyle,
  style,
}: KeyboardAwareFormScreenProps) {
  const insets = useSafeAreaInsets();
  const handleCustomerScroll = useCustomerCreateBarScrollHandler();
  const handleProviderScroll = useProviderBottomNavScrollHandler();
  const bottomPadding = spacing.xxxl + 64 + Math.max(insets.bottom + spacing.lg, Platform.OS === 'android' ? 48 : spacing.lg);

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height', default: undefined })}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.keyboardAvoider}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }, contentStyle]}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            handleCustomerScroll(event);
            handleProviderScroll(event);
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={scrollViewStyle}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  keyboardAvoider: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: colors.slate50,
    flex: 1,
  },
});
