import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type EmptyStateCardProps = {
  actionLabel?: string;
  accent?: 'core' | 'pro';
  body: string;
  clean?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
  title: string;
};

export function EmptyStateCard({
  actionLabel,
  accent = 'core',
  body,
  clean = false,
  icon,
  onActionPress,
  title,
}: EmptyStateCardProps) {
  const accentColor = accent === 'pro' ? colors.proOrange600 : colors.tasklyBlue600;
  const backgroundColor = accent === 'pro' ? colors.proOrange50 : colors.tasklyBlue50;
  const iconColor = accent === 'pro' ? colors.proOrange600 : colors.tasklyBlue600;

  return (
    <AppCard accentColor={clean ? undefined : accentColor} backgroundColor={clean ? colors.white : backgroundColor}>
      <View style={styles.copy}>
        {icon ? (
          <View style={styles.iconWrap}>
            <Ionicons color={iconColor} name={icon} size={22} />
          </View>
        ) : null}
        <AppText variant="sectionTitle">{title}</AppText>
        <AppText color={colors.slate700}>{body}</AppText>
      </View>
      {actionLabel ? (
        <AppButton onPress={onActionPress} tone={accent === 'pro' ? 'pro' : 'core'} variant="outline">
          {actionLabel}
        </AppButton>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});
