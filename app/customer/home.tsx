import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CustomerTopBar } from '@/src/components/taskly';
import { AppButton, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerHomeSummary, getCustomerProRequests, getCustomerTasks } from '@/src/lib/api/customer';
import type { CustomerHomeResponse, CustomerProRequestSummary, CustomerTasksResponse, CustomerTaskSummary, CustomerProRequestsResponse } from '@/src/lib/api/domain';
import { getMockCustomerHomeResponse, getMockCustomerProRequestsResponse, getMockCustomerTasksResponse, getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type HomeData = {
  home: CustomerHomeResponse;
  proRequests: CustomerProRequestsResponse;
  tasks: CustomerTasksResponse;
};

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function CustomerHomeScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, session: authSession, status, useDemoSession } = useAuth();
  const session = authSession ?? getMockUserSession();
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayName = data?.home.summary.displayName || session.user.displayName;
  const firstName = getFirstName(displayName);
  const greeting = useMemo(() => getTimeGreeting(), []);
  const activeTasks = (data?.tasks.tasks ?? []).filter((task) => !['COMPLETED', 'CANCELLED', 'CANCELLED_FREE', 'CANCELLED_LATE'].includes(task.status.toUpperCase()));
  const proRequests = data?.proRequests.proRequests ?? [];
  const proResponsesCount = data?.home.summary.proResponsesAvailableCount ?? proRequests.reduce((total, request) => total + request.responsesCount, 0);
  const visibleTasks = activeTasks.slice(0, 2);
  const visibleProRequests = proRequests.slice(0, 2);

  const loadHome = useCallback(async () => {
    setErrorMessage(null);
    setIsUnauthorized(false);

    if (status === 'demo') {
      setData({
        home: getMockCustomerHomeResponse(),
        proRequests: getMockCustomerProRequestsResponse(),
        tasks: getMockCustomerTasksResponse(),
      });
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setIsUnauthorized(status === 'unauthenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }

    const [homeResult, tasksResult, proResult] = await Promise.all([
      getCustomerHomeSummary(authToken),
      getCustomerTasks(authToken),
      getCustomerProRequests(authToken),
    ]);

    setIsLoading(false);

    if (homeResult.ok && tasksResult.ok && proResult.ok) {
      setData({
        home: homeResult.data,
        proRequests: proResult.data,
        tasks: tasksResult.data,
      });
      return;
    }

    const unauthorized =
      (!homeResult.ok && (homeResult.status === 401 || homeResult.status === 403)) ||
      (!tasksResult.ok && (tasksResult.status === 401 || tasksResult.status === 403)) ||
      (!proResult.ok && (proResult.status === 401 || proResult.status === 403));

    setData(null);
    setIsUnauthorized(unauthorized);
    setErrorMessage(unauthorized ? t('signInToLoadCustomerArea') : t('couldNotLoadCustomerArea'));
  }, [getValidAccessToken, status]);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [loadHome]),
  );

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <CustomerTopBar />

      <View style={styles.greeting}>
        <AppText color={colors.slate500} variant="small">
          {greeting}
        </AppText>
        <AppText variant="screenTitle">{t('customerHomeHello').replace('{{name}}', firstName)}</AppText>
      </View>

      <View style={styles.quickGrid}>
        <QuickActionCard
          icon="construct-outline"
          onPress={() => router.push('/customer/post-task' as Href)}
          subtitle={t('smallHomeTasks')}
          title={t('postTaskShort')}
          tone="core"
        />
        <QuickActionCard
          icon="ribbon-outline"
          onPress={() => router.push('/customer/post-pro-request' as Href)}
          subtitle={t('biggerProjects')}
          title={t('postProRequestShort')}
          tone="pro"
        />
      </View>
      <AppButton onPress={() => router.push('/map-test' as Href)} variant="outline">
        Map test
      </AppButton>

      {isLoading ? (
        <StateCard icon="timer-outline" title={t('loadingCustomerArea')} />
      ) : null}

      {errorMessage || isUnauthorized ? (
        <View style={styles.stateCard}>
          <StatusBadge label={isUnauthorized ? t('loginRequired') : t('backendUnavailable')} tone={isUnauthorized ? 'warning' : 'danger'} />
          <AppText variant="cardTitle">{isUnauthorized ? t('signInToViewCustomerActivity') : t('couldNotRefreshCustomerActivity')}</AppText>
          <AppText color={colors.slate500}>{errorMessage || t('retryOrContinueDemoBackendUnavailable')}</AppText>
          <View style={styles.buttonStack}>
            <AppButton onPress={loadHome} style={styles.secondaryButton} variant="outline">
              {t('retry')}
            </AppButton>
            <AppButton onPress={useDemoSession} style={styles.secondaryButton} tone="neutral" variant="outline">
              {t('continueDemoMode')}
            </AppButton>
          </View>
        </View>
      ) : null}

      {data ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard label={t('inProgress')} onPress={() => router.push('/customer/tasks' as Href)} value={activeTasks.length} />
            <StatCard
              label={proResponsesCount > 0 ? t('unlockNow') : t('noResponsesYet')}
              onPress={() => router.push('/customer/pro-requests' as Href)}
              pro
              value={proResponsesCount}
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              linkColor={colors.tasklyBlue600}
              onPress={() => router.push('/customer/tasks' as Href)}
              title={t('activeTasksTitle')}
            />
            {visibleTasks.length ? (
              <View style={styles.cardStack}>
                {visibleTasks.map((task) => (
                  <TaskPreviewCard key={task.id} onPress={() => router.push(`/customer/tasks/${task.id}` as Href)} task={task} />
                ))}
              </View>
            ) : (
              <MiniEmptyState icon="checkmark-circle-outline" title={t('noActiveTasksRightNow')} />
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              linkColor={colors.proOrange600}
              onPress={() => router.push('/customer/pro-requests' as Href)}
              title={t('proRequestsTitle')}
              titleColor={colors.proOrangeTextDark}
            />
            {visibleProRequests.length ? (
              <View style={styles.cardStack}>
                {visibleProRequests.map((request) => (
                  <ProRequestPreviewCard key={request.id} onPress={() => router.push(`/customer/pro-requests/${request.id}` as Href)} request={request} />
                ))}
              </View>
            ) : (
              <MiniEmptyState icon="ribbon-outline" title={t('noProRequestsYetShort')} pro />
            )}
          </View>

          <View style={styles.trustCard}>
            <View style={styles.trustIconBox}>
              <Ionicons color={colors.tasklyBlue600} name="shield-checkmark-outline" size={22} />
            </View>
            <View style={styles.trustCopy}>
              <AppText variant="cardTitle">{t('paymentProtected')}</AppText>
              <AppText color={colors.slate500}>{t('customerHomeTrustBody')}</AppText>
            </View>
          </View>
        </>
      ) : !isLoading && !errorMessage && !isUnauthorized ? (
        <MiniEmptyState icon="home-outline" title={t('customerHomeEmpty')} />
      ) : null}

    </Screen>
  );
}

function QuickActionCard({ icon, onPress, subtitle, title, tone }: { icon: IoniconName; onPress: () => void; subtitle: string; title: string; tone: 'core' | 'pro' }) {
  const isPro = tone === 'pro';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickCard, isPro ? styles.quickCardPro : styles.quickCardCore, pressed ? styles.pressedScale : null]}>
      <View style={styles.quickIconBox}>
        <Ionicons color={colors.white} name={icon} size={22} />
      </View>
      <AppText color={colors.white} variant="cardTitle">{title}</AppText>
      <AppText color={colors.white} style={styles.mutedWhite} variant="small">{subtitle}</AppText>
    </Pressable>
  );
}

function StatCard({ label, onPress, pro = false, value }: { label: string; onPress: () => void; pro?: boolean; value: number }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.statCard, pressed ? styles.pressedScale : null]}>
      <AppText color={pro ? colors.proOrangeTextDark : colors.navy900} style={styles.statValue} variant="sectionTitle">
        {value}
      </AppText>
      <View style={[styles.statBadge, pro ? styles.statBadgePro : styles.statBadgeCore]}>
        <AppText color={pro ? colors.proOrangeText : colors.tasklyBlue600} variant="small">
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

function SectionHeader({ linkColor, onPress, title, titleColor = colors.slate500 }: { linkColor: string; onPress: () => void; title: string; titleColor?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText color={titleColor} style={styles.upperTitle}>
        {title}
      </AppText>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressedSoft : null]}>
        <AppText color={linkColor} style={styles.seeAllText}>
          {t('seeAll')}
        </AppText>
      </Pressable>
    </View>
  );
}

function TaskPreviewCard({ onPress, task }: { onPress: () => void; task: CustomerTaskSummary }) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.cardTitleRow}>
        <AppText style={styles.cardTitleText} variant="cardTitle">{task.title}</AppText>
        <StatusBadge label={task.statusLabel} tone="core" />
      </View>
      <View style={styles.metaRow}>
        <Ionicons color={colors.slate500} name="location-outline" size={15} />
        <AppText color={colors.slate500} style={styles.metaText}>
          {task.cityLabel} · {formatScheduleSummary(task.scheduledStartAt, task.scheduledEndAt)}
        </AppText>
      </View>
      <View style={styles.cardFooter}>
        <AppText variant="cardTitle">{task.priceLabel}</AppText>
        <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressedSoft : null]}>
          <AppText color={colors.tasklyBlue600} style={styles.detailsLink}>{t('viewDetailsArrow')}</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ProRequestPreviewCard({ onPress, request }: { onPress: () => void; request: CustomerProRequestSummary }) {
  const responseCount = request.meaningfulResponseCount ?? request.responsesCount;
  return (
    <View style={styles.proCard}>
      <View style={styles.cardTitleRow}>
        <View style={styles.proBadge}>
          <Ionicons color={colors.proOrange600} name="ribbon-outline" size={14} />
          <AppText color={colors.proOrangeTextDark} variant="small">{t('tasklyPro')}</AppText>
        </View>
        <View style={styles.responseChip}>
          <AppText color={colors.proOrangeTextDark} variant="small">
            {responseCount} {t('responsesReceived')}
          </AppText>
        </View>
      </View>
      <AppText color={colors.navy900} variant="cardTitle">{request.title}</AppText>
      <View style={styles.metaRow}>
        <Ionicons color={colors.proOrange600} name="location-outline" size={15} />
        <AppText color={colors.slate500} style={styles.metaText}>
          {request.cityLabel} · {request.timelineLabel}
        </AppText>
      </View>
      <View style={styles.cardFooter}>
        <AppText color={colors.proOrangeText} variant="small">
          {request.proAccessSummary || t('unlockForPrice')}
        </AppText>
        <AppButton onPress={onPress} style={styles.compareButton} tone="pro">
          {t('comparePros')}
        </AppButton>
      </View>
    </View>
  );
}

function StateCard({ icon, title }: { icon: IoniconName; title: string }) {
  return (
    <View style={styles.stateCard}>
      <Ionicons color={colors.tasklyBlue600} name={icon} size={22} />
      <AppText variant="cardTitle">{title}</AppText>
    </View>
  );
}

function MiniEmptyState({ icon, pro = false, title }: { icon: IoniconName; pro?: boolean; title: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons color={pro ? colors.proOrange600 : colors.tasklyBlue600} name={icon} size={26} />
      <AppText color={colors.slate500} style={styles.emptyText}>{title}</AppText>
    </View>
  );
}

function getFirstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || t('customer');
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t('goodMorning');
  if (hour < 18) return t('goodAfternoon');
  return t('goodEvening');
}

function formatScheduleSummary(start: string | null, end: string | null) {
  if (!start) return t('noScheduleSet');
  const startDate = new Date(start);
  const dateLabel = startDate.toLocaleDateString([], { day: '2-digit', month: 'short' });
  const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = end ? new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  return endTime ? `${dateLabel}, ${startTime}-${endTime}` : `${dateLabel}, ${startTime}`;
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: spacing.sm,
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  cardStack: {
    gap: spacing.md,
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardTitleText: {
    flex: 1,
  },
  compareButton: {
    borderRadius: radius.pill,
    elevation: 3,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  detailsLink: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderStyle: 'dashed',
    borderWidth: 1,
    elevation: 1,
    gap: spacing.sm,
    padding: spacing.xl,
    shadowColor: '#0F172A',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
  },
  greeting: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.xs,
    padding: spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  mutedWhite: {
    opacity: 0.84,
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  pressedSoft: {
    opacity: 0.74,
  },
  proBadge: {
    alignItems: 'center',
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  proCard: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 3,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  quickCard: {
    borderRadius: radius.card,
    flex: 1,
    gap: spacing.sm,
    minHeight: 132,
    minWidth: 142,
    padding: spacing.lg,
  },
  quickCardCore: {
    backgroundColor: colors.tasklyBlue600,
    elevation: 6,
    shadowColor: '#1877F2',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
  },
  quickCardPro: {
    backgroundColor: colors.proAmber500,
    elevation: 6,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickIconBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  responseChip: {
    backgroundColor: colors.white,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: '#F59E0B',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  secondaryButton: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 48,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  statBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statBadgeCore: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderWidth: 1,
  },
  statBadgePro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderWidth: 1,
  },
  statCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    gap: spacing.sm,
    minWidth: 142,
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stateCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  taskCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 3,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  trustCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  trustCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  trustIconBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 2,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#1877F2',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    width: 44,
  },
  upperTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
});
