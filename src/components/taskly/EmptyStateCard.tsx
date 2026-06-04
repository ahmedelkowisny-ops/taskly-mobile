import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
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
  const iconBg = accent === 'pro' ? colors.proOrange50 : colors.tasklyBlue50;
  const iconColor = accent === 'pro' ? colors.proOrange600 : colors.tasklyBlue600;

  return (
    <AppCard backgroundColor={clean ? colors.white : iconBg}>
      <View style={styles.copy}>
        {icon ? (
          <View style={[styles.iconBox, { backgroundColor: colors.tasklyBlue50 }]}>
            <Ionicons color={iconColor} name={icon} size={22} />
          </View>
        ) : null}
        <AppText color={colors.navy900} variant="cardTitle">{title}</AppText>
        <AppText color={colors.slate500}>{body}</AppText>
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
  iconBox: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...designTokens.shadows.card,
  },
});
