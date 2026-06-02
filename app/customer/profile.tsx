import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, FormField } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { getCustomerProfile, updateCustomerProfile } from '@/src/lib/api/customer';
import type { CustomerProfile } from '@/src/lib/api/domain';
import type { ApiError } from '@/src/lib/api/types';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type ProfileDraft = {
  firstName: string;
  lastName: string;
  phone: string;
};

type ProfileFieldErrors = Partial<Record<keyof ProfileDraft, string>>;

const emptyDraft: ProfileDraft = {
  firstName: '',
  lastName: '',
  phone: '',
};

export default function CustomerProfileScreen() {
  useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { getValidAccessToken, refreshSession, session: authSession, status } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const session = authSession ?? getMockUserSession();
  const displayName = profile?.displayName ?? session.user.displayName;
  const email = profile?.email ?? session.user.email ?? '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'T';
  const isAuthenticated = status === 'authenticated';
  const canEditProfile = isAuthenticated && Boolean(profile);
  const hasChanges = useMemo(() => {
    if (!profile) return false;

    return (
      draft.firstName.trim() !== profile.firstName ||
      draft.lastName.trim() !== profile.lastName ||
      draft.phone.trim() !== profile.phone
    );
  }, [draft, profile]);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setDraft(emptyDraft);
      setIsEditing(false);
      setErrorMessage(null);
      return;
    }

    setIsLoadingProfile(true);
    setErrorMessage(null);

    const token = await getValidAccessToken();
    if (!token) {
      setErrorMessage(t('pleaseLoginToContinue'));
      setIsLoadingProfile(false);
      return;
    }

    const result = await getCustomerProfile(token);

    if (!result.ok) {
      setErrorMessage(t('couldNotLoadProfile'));
      setIsLoadingProfile(false);
      return;
    }

    setProfile(result.data.profile);
    setDraft(toDraft(result.data.profile));
    setFieldErrors({});
    setIsLoadingProfile(false);
  }, [getValidAccessToken, isAuthenticated]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function beginEditing() {
    if (!profile) return;
    setDraft(toDraft(profile));
    setFieldErrors({});
    setNotice(null);
    setErrorMessage(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (profile) {
      setDraft(toDraft(profile));
    }
    setFieldErrors({});
    setNotice(null);
    setErrorMessage(null);
    setIsEditing(false);
  }

  async function handleSave() {
    const validation = validateDraft(draft);
    setFieldErrors(validation);
    setNotice(null);
    setErrorMessage(null);

    if (Object.keys(validation).length > 0 || !hasChanges) {
      return;
    }

    const token = await getValidAccessToken();
    if (!token) {
      setErrorMessage(t('pleaseLoginToContinue'));
      return;
    }

    setIsSaving(true);
    const result = await updateCustomerProfile(
      {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        phone: draft.phone.trim(),
      },
      token,
    );
    setIsSaving(false);

    if (!result.ok) {
      const backendFieldErrors = getFieldErrorsFromApiError(result.error);
      setFieldErrors(backendFieldErrors);
      setErrorMessage(t('couldNotSaveProfile'));
      return;
    }

    setProfile(result.data.profile);
    setDraft(toDraft(result.data.profile));
    setFieldErrors({});
    setIsEditing(false);
    setNotice(t('profileSaved'));
    await refreshSession();
  }

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

      <AppCard>
        <View style={styles.editHeader}>
          <View style={styles.cardHeader}>
            <Ionicons color={colors.tasklyBlue600} name="create-outline" size={22} />
            <AppText variant="cardTitle">{t('editProfile')}</AppText>
          </View>
          {!isEditing && canEditProfile ? (
            <AppButton onPress={beginEditing} style={styles.headerButton} variant="outline">
              {t('edit')}
            </AppButton>
          ) : null}
        </View>

        {isLoadingProfile ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.tasklyBlue600} />
            <AppText color={colors.slate500}>{t('loading')}</AppText>
          </View>
        ) : null}

        {errorMessage ? <InlineMessage tone="error" message={errorMessage} /> : null}
        {notice ? <InlineMessage tone="success" message={notice} /> : null}

        {!isAuthenticated ? (
          <InlineMessage tone="neutral" message={status === 'demo' ? t('profileEditUnavailableDemo') : t('pleaseLoginToContinue')} />
        ) : null}

        {canEditProfile ? (
          <View style={styles.form}>
            <FormField
              autoCapitalize="words"
              editable={isEditing && !isSaving}
              errorText={fieldErrors.firstName}
              label={t('firstNameLabel')}
              onChangeText={(value) => setDraft((current) => ({ ...current, firstName: value }))}
              value={draft.firstName}
            />
            <FormField
              autoCapitalize="words"
              editable={isEditing && !isSaving}
              errorText={fieldErrors.lastName}
              label={t('lastNameLabel')}
              onChangeText={(value) => setDraft((current) => ({ ...current, lastName: value }))}
              value={draft.lastName}
            />
            <FormField
              autoComplete="tel"
              editable={isEditing && !isSaving}
              errorText={fieldErrors.phone}
              helperText={t('phoneOptional')}
              keyboardType="phone-pad"
              label={t('phoneLabel')}
              onChangeText={(value) => setDraft((current) => ({ ...current, phone: value }))}
              value={draft.phone}
            />
            <InfoRow label={t('accountEmail')} value={email || t('emailNotAvailable')} />
            <AppText color={colors.slate500} variant="small">
              {t('emailReadOnly')}
            </AppText>
            {isEditing ? (
              <View style={styles.actionRow}>
                <AppButton disabled={isSaving} onPress={cancelEditing} style={styles.actionButton} tone="neutral" variant="outline">
                  {t('cancel')}
                </AppButton>
                {hasChanges ? (
                  <AppButton disabled={isSaving} loading={isSaving} onPress={handleSave} style={styles.actionButton}>
                    {isSaving ? t('savingChanges') : t('saveChanges')}
                  </AppButton>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </AppCard>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function toDraft(profile: CustomerProfile): ProfileDraft {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
  };
}

function validateDraft(draft: ProfileDraft): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const phone = draft.phone.trim();

  if (!firstName) errors.firstName = t('profileFirstNameRequired');
  if (!lastName) errors.lastName = t('profileLastNameRequired');
  if (firstName.length > 100) errors.firstName = t('profileNameTooLong');
  if (lastName.length > 100) errors.lastName = t('profileNameTooLong');
  if (phone.length > 20) errors.phone = t('profilePhoneTooLong');

  return errors;
}

function getFieldErrorsFromApiError(error: ApiError): ProfileFieldErrors {
  const details = error.details;
  if (!details || typeof details !== 'object' || !('fields' in details)) {
    return {};
  }

  const fields = (details as { fields?: unknown }).fields;
  if (!fields || typeof fields !== 'object') {
    return {};
  }

  const fieldErrors: ProfileFieldErrors = {};
  const firstName = (fields as Record<string, unknown>).firstName;
  const lastName = (fields as Record<string, unknown>).lastName;
  const phone = (fields as Record<string, unknown>).phone;

  if (firstName) fieldErrors.firstName = mapBackendFieldError(String(firstName), 'firstName');
  if (lastName) fieldErrors.lastName = mapBackendFieldError(String(lastName), 'lastName');
  if (phone) fieldErrors.phone = mapBackendFieldError(String(phone), 'phone');

  return fieldErrors;
}

function mapBackendFieldError(message: string, field: keyof ProfileDraft) {
  const lower = message.toLowerCase();

  if (lower.includes('required')) {
    return field === 'lastName' ? t('profileLastNameRequired') : t('profileFirstNameRequired');
  }

  if (field === 'phone') {
    return t('profilePhoneTooLong');
  }

  return t('profileNameTooLong');
}

function InlineMessage({ message, tone }: { message: string; tone: 'error' | 'neutral' | 'success' }) {
  return (
    <View style={[styles.inlineMessage, styles[`${tone}Message`]]}>
      <AppText
        color={tone === 'error' ? colors.warning600 : tone === 'success' ? colors.tasklyBlue700 : colors.slate500}
        variant="small">
        {message}
      </AppText>
    </View>
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
  actionButton: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  editHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  errorMessage: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  form: {
    gap: spacing.md,
  },
  headerButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
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
  inlineMessage: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  neutralMessage: {
    backgroundColor: colors.slate50,
    borderColor: '#E6EBF0',
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
  successMessage: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
});
