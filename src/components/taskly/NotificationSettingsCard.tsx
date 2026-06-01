import { useCallback, useEffect, useState } from 'react';
import { Linking, Switch, View } from 'react-native';

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
  const { getValidAccessToken, isDemoMode, status } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const result = await updateNotificationPreferences(patch, authToken);
      setIsSaving(false);

      if (!result.ok) {
        setError(t('couldNotSaveNotificationSettings'));
        return false;
      }

      setPreferences(result.data.preferences);
      setNotice(t('alertsSaved'));
      return true;
    },
    [getValidAccessToken, isDemoMode],
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
      preferences: { ...preferences, pushEnabled: true },
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

      setError(t('couldNotSaveNotificationSettings'));
      return;
    }

    await savePreferences({ pushEnabled: true });
    setIsSaving(false);
    setNotice(t('alertsSaved'));
  }, [getValidAccessToken, isDemoMode, preferences, savePreferences, workspace]);

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
    <AppCard accentColor={colors.tasklyBlue600}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
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
      {error ? <AppText color={colors.danger600}>{error}</AppText> : null}

      {!preferences.pushEnabled ? (
        <View style={{ gap: spacing.sm }}>
          <AppButton loading={isSaving} onPress={enableNotifications}>
            {t('enableAlerts')}
          </AppButton>
          <AppButton disabled={isSaving} onPress={() => setNotice(t('notificationsDisabled'))} variant="ghost">
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

      <View style={{ gap: spacing.sm }}>
        {preferenceRows.map((row) => (
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
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }}>
      <AppText color={colors.slate700} style={{ flex: 1 }}>
        {label}
      </AppText>
      <Switch disabled={disabled} onValueChange={onValueChange} value={value} />
    </View>
  );
}
