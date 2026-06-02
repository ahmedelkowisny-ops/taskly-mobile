import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar } from '@/src/components/taskly';
import { AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function CustomerProfileScreen() {
  useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { session: authSession, status } = useAuth();
  const session = authSession ?? getMockUserSession();
  const displayName = session.user.displayName;
  const email = session.user.email ?? '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'T';

  return (
    <Screen contentStyle={styles.content}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <AppText style={styles.title} variant="screenTitle">
          {t('profile')}
        </AppText>
        <AppText color={colors.slate700}>{t('customerProfileIntro')}</AppText>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <AppText color={colors.white} style={styles.avatarInitial}>
            {initial}
          </AppText>
        </View>
        <View style={styles.profileMeta}>
          <AppText variant="cardTitle">{displayName}</AppText>
          <AppText color={colors.slate500}>{email || t('emailNotAvailable')}</AppText>
          <View style={styles.badgeRow}>
            <StatusBadge label={status === 'demo' ? t('demoMode') : t('signedIn')} tone={status === 'demo' ? 'neutral' : 'core'} />
            <StatusBadge label={t('customer')} tone="core" />
          </View>
        </View>
      </View>

      <AppCard>
        <View style={styles.cardHeader}>
          <Ionicons color={colors.tasklyBlue600} name="person-circle-outline" size={22} />
          <AppText variant="cardTitle">{t('accountOverview')}</AppText>
        </View>
        <InfoRow label={t('accountName')} value={displayName} />
        <InfoRow label={t('accountEmail')} value={email || t('emailNotAvailable')} />
        <InfoRow label={t('accountRole')} value={t('customer')} />
        <InfoRow label={t('customerAccess')} value={session.workspaceAccess.customer ? t('available') : t('notAvailable')} />
      </AppCard>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.slate500} variant="small">
        {label}
      </AppText>
      <AppText style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  infoRow: {
    backgroundColor: colors.slate50,
    borderColor: '#E6EBF0',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E6EBF0',
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
});
