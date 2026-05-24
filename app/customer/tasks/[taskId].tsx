import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerTaskDetail } from '@/src/lib/api/customer';
import { CustomerTaskDetailResponse } from '@/src/lib/api/domain';
import { getMockCustomerTaskDetailResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerTaskDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const taskId = String(params.taskId || 'demo-task');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerTaskDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stateLabel, setStateLabel] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setMessage(null);
    setStateLabel(null);

    if (status === 'demo') {
      setData(getMockCustomerTaskDetailResponse(taskId));
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this Core task detail.');
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this Core task detail.');
      setIsLoading(false);
      return;
    }

    const result = await getCustomerTaskDetail(taskId, authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setStateLabel(result.status === 404 ? 'Not found' : result.status === 401 || result.status === 403 ? 'Login required' : 'Backend unavailable');
    setMessage(result.status === 404 ? 'This task was not found or is not available to this account.' : 'Could not load this task detail.');
  }, [getValidAccessToken, status, taskId]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const task = data?.task;

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppButton onPress={() => router.back()} variant="ghost">
          Back
        </AppButton>
      </View>

      {isLoading ? <StateCard label="Loading" message="Loading Core task detail." tone="core" /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || 'Notice'} tone="warning" />
          <AppText variant="sectionTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} variant="outline">Retry</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">Continue in demo mode</AppButton>
          </View>
        </AppCard>
      ) : null}

      {task ? (
        <>
          <AppCard accentColor={colors.tasklyBlue600}>
            <StatusBadge label={task.statusLabel} tone="core" />
            <AppText variant="screenTitle">{task.title}</AppText>
            <AppText color={colors.slate700}>{task.description}</AppText>
            <AppText color={colors.slate700}>{task.categoryLabel} - {task.cityLabel}</AppText>
          </AppCard>

          <AppCard>
            <StatusBadge label={task.paymentStatusLabel} tone={task.paymentStatusLabel === 'Payment protected' ? 'success' : 'neutral'} />
            <Info label="Price" value={task.priceLabel} />
            <Info label="Schedule" value={formatSchedule(task.scheduledStartAt, task.scheduledEndAt)} />
            <Info label="Address" value={task.addressPreviewLabel} />
            {task.taskerPreview ? <Info label="Tasker" value={`${task.taskerPreview.displayName} - ${task.taskerPreview.ratingLabel}`} /> : null}
          </AppCard>

          <Images images={task.images} />
          <Timeline items={task.timeline} accent="core" />
          <NextActions actions={task.nextActions} tone="core" />
        </>
      ) : null}
    </Screen>
  );
}

function StateCard({ label, message, tone }: { label: string; message: string; tone: 'core' | 'neutral' }) {
  return (
    <AppCard accentColor={tone === 'core' ? colors.tasklyBlue600 : colors.navy900}>
      <StatusBadge label={label} tone={tone} />
      <AppText color={colors.slate700}>{message}</AppText>
    </AppCard>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText color={colors.slate500} variant="small">{label}</AppText>
      <AppText color={colors.slate700}>{value}</AppText>
    </View>
  );
}

function Images({ images }: { images: { alt: string; id: string; url: string }[] }) {
  if (!images.length) return null;
  return (
    <AppCard>
      <AppText variant="sectionTitle">Images</AppText>
      <View style={styles.imageGrid}>
        {images.map((image) => <Image key={image.id} accessibilityLabel={image.alt} source={{ uri: image.url }} style={styles.image} />)}
      </View>
    </AppCard>
  );
}

function Timeline({ items, accent }: { accent: 'core'; items: { description: string; id: string; label: string; status: string }[] }) {
  return (
    <AppCard accentColor={colors.tasklyBlue600}>
      <AppText variant="sectionTitle">Timeline</AppText>
      {items.map((item) => (
        <View key={item.id} style={styles.timelineItem}>
          <StatusBadge label={item.status} tone={accent} />
          <AppText variant="bodyStrong">{item.label}</AppText>
          <AppText color={colors.slate700}>{item.description}</AppText>
        </View>
      ))}
    </AppCard>
  );
}

function NextActions({ actions, tone }: { actions: { label: string; type: string }[]; tone: 'core' }) {
  return (
    <AppCard>
      <AppText variant="sectionTitle">Next steps</AppText>
      {actions.map((action) => (
        <AppButton key={action.type} disabled tone={tone} variant="outline">{action.label}</AppButton>
      ))}
    </AppCard>
  );
}

function formatSchedule(start: string | null, end: string | null) {
  if (!start) return 'Schedule not set';
  const startLabel = new Date(start).toLocaleString();
  const endLabel = end ? new Date(end).toLocaleTimeString() : '';
  return endLabel ? `${startLabel} - ${endLabel}` : startLabel;
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  stack: { gap: spacing.sm },
  timelineItem: { gap: spacing.xs },
});
