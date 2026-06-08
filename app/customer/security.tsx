import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerTopBar, FormField, KeyboardAwareFormScreen } from '@/src/components/taskly';
import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { AppButton, AppCard, AppText, StatusBadge } from '@/src/components/ui';
import { changePassword } from '@/src/lib/api/account';
import { useAuth } from '@/src/lib/auth/useAuth';
import { saveAuthTokens } from '@/src/lib/auth/tokenStorage';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type PasswordDraft = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

type PasswordErrors = Partial<Record<keyof PasswordDraft | 'form', string>>;

const emptyDraft: PasswordDraft = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
};

export default function CustomerSecurityScreen() {
  useI18n();
  const router = useRouter();
  const { applySession, getValidAccessToken, isDemoMode, session, status } = useAuth();
  const [draft, setDraft] = useState<PasswordDraft>(emptyDraft);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSavePassword() {
    const nextErrors = validatePassword(draft);
    setErrors(nextErrors);
    setSuccessMessage(null);
    if (Object.keys(nextErrors).length) return;

    if (isDemoMode) {
      setDraft(emptyDraft);
      setSuccessMessage(t('passwordUpdated'));
      return;
    }

    if (status !== 'authenticated') {
      setErrors({ form: t('loginRequired') });
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setErrors({ form: t('loginRequired') });
      return;
    }

    setIsSaving(true);
    const result = await changePassword(draft, authToken);
    setIsSaving(false);

    if (!result.ok) {
      setErrors(getPasswordErrors(result.error.code));
      return;
    }

    await saveAuthTokens(result.data.tokens);
    applySession(result.data.session);
    setDraft(emptyDraft);
    setErrors({});
    setSuccessMessage(t('passwordUpdated'));
  }

  return (
    <KeyboardAwareFormScreen contentStyle={styles.content}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <StatusBadge label={t('accountSecurityTitle')} tone="core" />
        <AppText variant="screenTitle">{t('accountSecurityTitle')}</AppText>
        <AppText color={colors.slate700}>{t('accountSecuritySubtitle')}</AppText>
      </View>

      <AppCard accentColor={colors.tasklyBlue600} style={styles.card}>
        <AppText variant="cardTitle">{t('loginEmail')}</AppText>
        <AppText color={colors.navy900} variant="bodyStrong">
          {session?.user.email || t('emailNotAvailable')}
        </AppText>
        <AppText color={colors.slate700}>{t('contactSupportEmailChange')}</AppText>
        <AppButton onPress={() => router.push('/customer/support' as Href)} tone="neutral" variant="outline">
          {t('contactSupport')}
        </AppButton>
      </AppCard>

      <AppCard accentColor={colors.tasklyBlue600} style={styles.card}>
        <AppText variant="cardTitle">{t('changePassword')}</AppText>
        <AppText color={colors.slate700}>{t('registrationPasswordHelper')}</AppText>
        <FormField
          autoCapitalize="none"
          errorText={errors.currentPassword}
          label={t('currentPassword')}
          onChangeText={(value) => updateField('currentPassword', value)}
          secureTextEntry
          textContentType="password"
          value={draft.currentPassword}
        />
        <FormField
          autoCapitalize="none"
          errorText={errors.newPassword}
          label={t('newPassword')}
          onChangeText={(value) => updateField('newPassword', value)}
          secureTextEntry
          textContentType="newPassword"
          value={draft.newPassword}
        />
        <FormField
          autoCapitalize="none"
          errorText={errors.confirmPassword}
          label={t('confirmNewPassword')}
          onChangeText={(value) => updateField('confirmPassword', value)}
          secureTextEntry
          textContentType="newPassword"
          value={draft.confirmPassword}
        />
        {errors.form ? <AppText color={colors.danger600}>{errors.form}</AppText> : null}
        {successMessage ? <AppText color={colors.success600}>{successMessage}</AppText> : null}
        <AppButton disabled={isSaving} loading={isSaving} onPress={handleSavePassword}>
          {isSaving ? t('savingChanges') : t('changePassword')}
        </AppButton>
      </AppCard>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </KeyboardAwareFormScreen>
  );

  function updateField(field: keyof PasswordDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field] || errors.form) {
      setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    }
  }
}

function validatePassword(draft: PasswordDraft): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!draft.currentPassword) errors.currentPassword = t('currentPasswordRequired');
  if (!draft.newPassword) errors.newPassword = t('newPasswordRequired');
  if (draft.newPassword && !draft.confirmPassword) errors.confirmPassword = t('confirmPasswordRequired');
  if (draft.newPassword && draft.confirmPassword && draft.newPassword !== draft.confirmPassword) {
    errors.confirmPassword = t('passwordsDoNotMatch');
  }
  return errors;
}

function getPasswordErrors(code: string): PasswordErrors {
  if (code === 'INVALID_CURRENT_PASSWORD') return { currentPassword: t('passwordInvalid') };
  if (code === 'CURRENT_PASSWORD_REQUIRED') return { currentPassword: t('currentPasswordRequired') };
  if (code === 'NEW_PASSWORD_REQUIRED') return { newPassword: t('newPasswordRequired') };
  if (code === 'PASSWORDS_MISMATCH') return { confirmPassword: t('passwordsDoNotMatch') };
  if (code === 'PASSWORD_UNCHANGED') return { newPassword: t('passwordUnchanged') };
  if (code === 'PASSWORD_TOO_SHORT') return { newPassword: t('registrationPasswordTooShort') };
  if (code === 'PASSWORD_TOO_LONG') return { newPassword: t('registrationPasswordTooLong') };
  if (code === 'PASSWORD_PWNED') return { newPassword: t('registrationPasswordUnsafe') };
  if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') return { form: t('loginRequired') };
  return { form: t('couldNotUpdatePassword') };
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.slate50,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl + 96,
    paddingTop: spacing.lg,
  },
  header: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
