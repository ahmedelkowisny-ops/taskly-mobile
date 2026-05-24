import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ModeBadge } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerProRequestDetail } from '@/src/lib/api/customer';
import { CustomerProRequestDetailResponse } from '@/src/lib/api/domain';
import { getMockCustomerProRequestDetailResponse } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function CustomerProRequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ proRequestId?: string }>();
  const proRequestId = String(params.proRequestId || 'demo-pro-request');
  const { getValidAccessToken, status, useDemoSession } = useAuth();
  const [data, setData] = useState<CustomerProRequestDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stateLabel, setStateLabel] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setMessage(null);
    setStateLabel(null);

    if (status === 'demo') {
      setData(getMockCustomerProRequestDetailResponse(proRequestId));
      return;
    }

    if (status !== 'authenticated') {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this Pro request detail.');
      return;
    }

    setIsLoading(true);
    const authToken = await getValidAccessToken();

    if (!authToken) {
      setData(null);
      setStateLabel('Login required');
      setMessage('Login is required to load this Pro request detail.');
      setIsLoading(false);
      return;
    }

    const result = await getCustomerProRequestDetail(proRequestId, authToken);
    setIsLoading(false);

    if (result.ok) {
      setData(result.data);
      return;
    }

    setData(null);
    setStateLabel(result.status === 404 ? 'Not found' : result.status === 401 || result.status === 403 ? 'Login required' : 'Backend unavailable');
    setMessage(result.status === 404 ? 'This Pro request was not found or is not available to this account.' : 'Could not load this Pro request detail.');
  }, [getValidAccessToken, proRequestId, status]);

  useFocusEffect(
    useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  const request = data?.proRequest;

  return (
    <Screen>
      <View style={styles.header}>
        <ModeBadge mode="customer" />
        <AppButton onPress={() => router.back()} variant="ghost">Back</AppButton>
      </View>

      {isLoading ? <StateCard label="Loading" message="Loading Pro request detail." /> : null}

      {message ? (
        <AppCard accentColor={colors.warning600}>
          <StatusBadge label={stateLabel || 'Notice'} tone="warning" />
          <AppText variant="sectionTitle">{message}</AppText>
          <View style={styles.stack}>
            <AppButton onPress={loadDetail} tone="pro" variant="outline">Retry</AppButton>
            <AppButton onPress={useDemoSession} tone="neutral" variant="outline">Continue in demo mode</AppButton>
          </View>
        </AppCard>
      ) : null}

      {request ? (
        <>
          <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
            <StatusBadge label={request.statusLabel} tone="pro" />
            <AppText variant="screenTitle">{request.title}</AppText>
            <AppText color={colors.slate700}>{request.description}</AppText>
            <AppText color={colors.slate700}>{request.categoryLabel} - {request.cityLabel}</AppText>
          </AppCard>

          <AppCard>
            <StatusBadge label={request.unlockStatusLabel} tone={request.isUnlocked ? 'success' : 'warning'} />
            <Info label="Budget" value={request.budgetLabel} />
            <Info label="Timeline" value={request.timelineLabel} />
            <Info label="Responses" value={String(request.responsesCount)} />
          </AppCard>

          <Images images={request.images} />

          <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
            <AppText variant="sectionTitle">Pro responses</AppText>
            {request.responsePreviews.length ? request.responsePreviews.map((response) => (
              <View key={response.id} style={styles.response}>
                <StatusBadge label={response.statusLabel} tone={response.isLocked ? 'warning' : 'success'} />
                <AppText variant="bodyStrong">{response.proDisplayName}</AppText>
                <AppText color={colors.slate700}>{response.headline}</AppText>
                <AppText color={colors.slate700}>{response.roughQuoteLabel}</AppText>
              </View>
            )) : <AppText color={colors.slate700}>No Pro responses yet.</AppText>}
          </AppCard>

          <NextActions actions={request.nextActions} />
        </>
      ) : null}
    </Screen>
  );
}

function StateCard({ label, message }: { label: string; message: string }) {
  return (
    <AppCard accentColor={colors.proOrange600} backgroundColor={colors.proOrange50}>
      <StatusBadge label={label} tone="pro" />
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

function NextActions({ actions }: { actions: { label: string; type: string }[] }) {
  return (
    <AppCard>
      <AppText variant="sectionTitle">Next steps</AppText>
      {actions.map((action) => (
        <AppButton key={action.type} disabled tone="pro" variant="outline">{action.label}</AppButton>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  image: { aspectRatio: 1, borderRadius: 8, width: '31%' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoRow: { gap: spacing.xs },
  response: { gap: spacing.xs },
  stack: { gap: spacing.sm },
});
