import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type TasklyLogoTextProps = {
  style?: StyleProp<ViewStyle>;
};

export function TasklyLogoText({ style }: TasklyLogoTextProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.mark}>
        <AppText color={colors.white} variant="bodyStrong">
          T
        </AppText>
      </View>
      <AppText variant="title">Taskly</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
