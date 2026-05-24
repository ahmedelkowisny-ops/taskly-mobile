import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppText } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type FormSectionProps = PropsWithChildren<{
  accent?: 'core' | 'neutral' | 'pro';
  description?: string;
  title: string;
}>;

export function FormSection({ accent = 'core', children, description, title }: FormSectionProps) {
  const accentColor =
    accent === 'pro' ? colors.proOrange600 : accent === 'neutral' ? colors.slate500 : colors.tasklyBlue600;

  return (
    <AppCard accentColor={accentColor}>
      <View style={styles.copy}>
        <AppText variant="sectionTitle">{title}</AppText>
        {description ? <AppText color={colors.slate700}>{description}</AppText> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  copy: {
    gap: spacing.xs,
  },
});
