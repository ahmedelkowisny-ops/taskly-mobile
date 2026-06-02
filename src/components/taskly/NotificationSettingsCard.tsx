import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Switch, View } from 'react-native';

import { AppButton, AppCard, AppText, StatusBadge } from '@/src/components/ui';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/src/lib/api/notifications';
import { NotificationPreferences } from '@/src/lib/api/domain';
import { useAuth } from '@/src/lib/auth/useAuth';
import {
  requestAndRegisterNotifications,
  unregisterStoredNotificationToken,
} from '@/src/lib/notifications/mobileNotifications';
import { isTaskerOnlyProvider } from '@/src/lib/auth/workspaceAccess';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const defaultPreferences: NotificationPreferences = {
  completionAlertsEnabled: true,
  coreAlertsEnabled: true,
  marketingAlertsEnabled: false,
  messageAlertsEnabled: true,
  paymentAlertsEnabled: true,
  proAlertsEnabled: true,
  pushEnabled: false,
  siteVisitAlertsEnabled: true,
  soundEnabled: true,
  supportAlertsEnabled: true,
  vibrationEnabled: true,
};

type NotificationSettingsCardProps = {
  workspace: 'customer' | 'provider';
};

type PreferenceKey = keyof NotificationPreferences;

const preferenceRows: { keyName: PreferenceKey; labelKey: Parameters<typeof t>[0] }[] = [
  { keyName: 'soundEnabled', labelKey: 'notificationSound' },
  { keyName: 'vibrationEnabled', labelKey: 'notificationVibration' },
  { keyName: 'coreAlertsEnabled', labelKey: 'coreTaskAlerts' },
  { keyName: 'proAlertsEnabled', labelKey: 'proRequestAlerts' },
  { keyName: 'messageAlertsEnabled', labelKey: 'messageAlerts' },
  { keyName: 'paymentAlertsEnabled', labelKey: 'paymentCompletionAlerts' },
  { keyName: 'supportAlertsEnabled', labelKey: 'supportAlerts' },
  { keyName: 'siteVisitAlertsEnabled', labelKey: 'siteVisitAlerts' },
];

export function NotificationSettingsCard({ workspace }: NotificationSettingsCardProps) {
  const { getValidAccessToken, isDemoMode, session, status } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hideProPreferences = workspace === 'provider' && status !== 'demo' && isTaskerOnlyProvider(session);
  const visiblePreferenceRows = preferenceRows.filter((row) => {
    if (!hideProPreferences) return true;
    return row.keyName !== 'proAlertsEnabled' && row.keyName !== 'siteVisitAlertsEnabled';
  });

  const loadPreferences = useCallback(async () => {
    if (status === 'demo') {
      setPreferences(defaultPreferences);
      return;
    }

    if (status !== 'authenticated') return;

    setIsLoading(true);
    setError(null);
    const authToken = await getValidAccessToken();
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    const result = await getNotificationPreferences(authToken);
    if (result.ok) {
      setPreferences(result.data.preferences);
    }
    // Silently fall back to defaults when preferences fail to load —
    // the card still renders usably and the user can interact with toggles.
    setIsLoading(false);
  }, [getValidAccessToken, status]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const savePreferences = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      setError(null);
      setNotice(null);

      if (isDemoMode) {
        setPreferences((current) => ({ ...current, ...patch }));
        setNotice(t('demoNotificationsNotRegistered'));
        return true;
      }

      const authToken = await getValidAccessToken();
      if (!authToken) {
        setError(t('loginRequired'));
        return false;
      }

      setIsSaving(true);
      const safePatch = hideProPreferences
        ? Object.fromEntries(
            Object.entries(patch).filter(([key]) => key !== 'proAlertsEnabled' && key !== 'siteVisitAlertsEnabled'),
          )
        : patch;
      const result = await updateNotificationPreferences(safePatch, authToken);
      setIsSaving(false);

      if (!result.ok) {
        setError(result.error.message || t('couldNotSaveNotificationSettings'));
        return false;
      }

      setPreferences(result.data.preferences);
      setNotice(t('alertsSaved'));
      return true;
    },
    [getValidAccessToken, hideProPreferences, isDemoMode],
  );

  const enableNotifications = useCallback(async () => {
    setError(null);
    setNotice(null);

    if (isDemoMode) {
      setPreferences((current) => ({ ...current, pushEnabled: true }));
      setNotice(t('demoNotificationsNotRegistered'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setError(t('loginRequired'));
      return;
    }

    setIsSaving(true);
    const result = await requestAndRegisterNotifications({
      authToken,
      isDemoMode,
        preferences: {
          ...preferences,
          ...(hideProPreferences ? { proAlertsEnabled: false, siteVisitAlertsEnabled: false } : null),
          pushEnabled: true,
        },
      workspace,
    });

    if (!result.ok) {
      setIsSaving(false);
      if (result.code === 'PERMISSION_DENIED') {
        const preferenceResult = await updateNotificationPreferences({ pushEnabled: false }, authToken);
        if (preferenceResult.ok) {
          setPreferences(preferenceResult.data.preferences);
        } else {
          setPreferences((current) => ({ ...current, pushEnabled: false }));
        }
        setError(t('notificationPermissionDenied'));
        return;
      }

      if (result.code === 'PROJECT_ID_MISSING' || result.code === 'REGISTRATION_FAILED' || result.code === 'UNSUPPORTED_PLATFORM') {
        setError(t('pushNotificationsUnavailable'));
        return;
      }

      setError(result.message || t('couldNotSaveNotificationSettings'));
      return;
    }

    await savePreferences({ pushEnabled: true });
    setIsSaving(false);
    setNotice(t('alertsSaved'));
  }, [getValidAccessToken, hideProPreferences, isDemoMode, preferences, savePreferences, workspace]);

  const disableNotifications = useCallback(async () => {
    if (isDemoMode) {
      setPreferences((current) => ({ ...current, pushEnabled: false }));
      setNotice(t('demoNotificationsNotRegistered'));
      return;
    }

    const authToken = await getValidAccessToken();
    await unregisterStoredNotificationToken(authToken);
    await savePreferences({ pushEnabled: false });
  }, [getValidAccessToken, isDemoMode, savePreferences]);

  const togglePreference = useCallback(
    async (key: PreferenceKey, value: boolean) => {
      if (key === 'pushEnabled' && !value) {
        await disableNotifications();
        return;
      }

      await savePreferences({ [key]: value });
    },
    [disableNotifications, savePreferences],
  );

  return (
    <AppCard style={styles.card}>
      <View style={styles.badgeRow}>
        <StatusBadge label={t('notifications')} tone="neutral" />
        <StatusBadge
          label={preferences.pushEnabled ? t('pushNotifications') : t('notificationsDisabled')}
          tone={preferences.pushEnabled ? 'success' : 'warning'}
        />
      </View>
      <AppText variant="sectionTitle">{t('enableNotifications')}</AppText>
      <AppText color={colors.slate700}>
        {t('notificationSettingsIntro')}
      </AppText>
      <AppText color={colors.slate500} variant="caption">
        {t('changeNotificationsLater')}
      </AppText>

      {isLoading ? <AppText color={colors.slate700}>{t('loading')}</AppText> : null}
      {notice ? <AppText color={colors.success600}>{notice}</AppText> : null}
      {error ? (
        <View style={styles.errorChip}>
          <AppText color={colors.white} style={styles.errorChipText} variant="caption">
            {error}
          </AppText>
        </View>
      ) : null}

      {!preferences.pushEnabled ? (
        <View style={styles.actionStack}>
          <AppButton loading={isSaving} onPress={enableNotifications}>
            {t('enableAlerts')}
          </AppButton>
          <AppButton
            disabled={isSaving}
            labelColor={colors.slate500}
            onPress={() => setNotice(t('notificationsDisabled'))}
            variant="ghost">
            {t('notNow')}
          </AppButton>
        </View>
      ) : (
        <PreferenceRow
          disabled={isSaving}
          label={t('pushNotifications')}
          onValueChange={(value) => togglePreference('pushEnabled', value)}
          value={preferences.pushEnabled}
        />
      )}

      <View style={styles.preferenceStack}>
        {visiblePreferenceRows.map((row) => (
          <PreferenceRow
            disabled={isSaving}
            key={row.keyName}
            label={t(row.labelKey)}
            onValueChange={(value) => togglePreference(row.keyName, value)}
            value={preferences[row.keyName]}
          />
        ))}
      </View>

      {error === t('notificationPermissionDenied') ? (
        <AppButton onPress={() => Linking.openSettings()} variant="outline">
          {t('openSystemSettings')}
        </AppButton>
      ) : null}
    </AppCard>
  );
}

function PreferenceRow({
  disabled,
  label,
  onValueChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.preferenceRow}>
      <AppText color={colors.slate700} style={styles.preferenceLabel}>
        {label}
      </AppText>
      <Switch
        disabled={disabled}
        ios_backgroundColor={colors.slate100}
        onValueChange={onValueChange}
        thumbColor={value ? colors.white : colors.white}
        trackColor={{ false: colors.slate100, true: colors.tasklyBlue600 }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    borderColor: colors.border,
  },
  errorChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning600,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  errorChipText: {
    fontWeight: '700',
  },
  preferenceLabel: {
    flex: 1,
  },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  preferenceStack: {
    gap: spacing.sm,
  },
});
