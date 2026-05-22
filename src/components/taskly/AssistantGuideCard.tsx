import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, StatusBadge } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type AssistantGuideCardProps = {
  body: string;
  title: string;
  tone?: 'core' | 'pro';
};

export function AssistantGuideCard({ body, title, tone = 'core' }: AssistantGuideCardProps) {
  const accentColor = tone === 'pro' ? colors.proAmber500 : colors.tasklyBlue600;
  const backgroundColor = tone === 'pro' ? colors.proOrange50 : colors.tasklyBlue50;

  return (
    <AppCard accentColor={accentColor} backgroundColor={backgroundColor} style={styles.card}>
      <View style={styles.header}>
        <StatusBadge label="Taskly Assistant" tone={tone} />
      </View>
      <View style={styles.copy}>
        <AppText variant="sectionTitle">{title}</AppText>
        <AppText color={colors.slate700}>{body}</AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.white,
  },
  copy: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'flex-start',
  },
});
