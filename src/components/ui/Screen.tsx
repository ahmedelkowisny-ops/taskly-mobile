import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type ScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, contentStyle, scroll = true, style }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
