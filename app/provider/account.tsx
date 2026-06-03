import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FormField,
  NotificationSettingsCard,
  ProviderTopBar,
} from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
import { changePassword } from '@/src/lib/api/account';
import { useAuth } from '@/src/lib/auth/useAuth';
import { saveAuthTokens } from '@/src/lib/auth/tokenStorage';
import { t } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type PasswordDraft = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;

const emptyPasswordDraft: PasswordDraft = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
};

function AccountSecurityCard() {
  const { getValidAccessToken, isDemoMode, session, applySession } = useAuth();
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<PasswordDraft>(emptyPasswordDraft);
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const email = session?.user?.email ?? '';

  function openModal() {
    setDraft(emptyPasswordDraft);
    setFieldErrors({});
    setNotice(null);
    setErrorMessage(null);
    setShowModal(true);
  }

  function closeModal() {
    setDraft(emptyPasswordDraft);
    setFieldErrors({});
    setShowModal(false);
  }

  async function handleSave() {
    const errors: PasswordErrors = {};
    if (!draft.currentPassword) errors.currentPassword = t('currentPasswordRequired');
    if (!draft.newPassword) errors.newPassword = t('newPasswordRequired');
    if (draft.newPassword && !draft.confirmPassword) errors.confirmPassword = t('confirmPasswordRequired');
    if (draft.newPassword && draft.confirmPassword && draft.newPassword !== draft.confirmPassword) {
      errors.confirmPassword = t('passwordsDoNotMatch');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (isDemoMode) {
      setFieldErrors({});
      closeModal();
      setNotice(t('passwordUpdated'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setErrorMessage(t('loginRequired'));
      return;
    }

    setIsSaving(true);
    const result = await changePassword(
      {
        confirmPassword: draft.confirmPassword,
        currentPassword: draft.currentPassword,
        newPassword: draft.newPassword,
      },
      authToken,
    );
    setIsSaving(false);

    if (!result.ok) {
      const code = result.error?.code;
      if (code === 'INVALID_CURRENT_PASSWORD') {
        setFieldErrors({ currentPassword: t('passwordInvalid') });
      } else if (code === 'PASSWORDS_MISMATCH') {
        setFieldErrors({ confirmPassword: t('passwordsDoNotMatch') });
      } else if (code === 'CURRENT_PASSWORD_REQUIRED') {
        setFieldErrors({ currentPassword: t('currentPasswordRequired') });
      } else if (code === 'NEW_PASSWORD_REQUIRED') {
        setFieldErrors({ newPassword: t('newPasswordRequired') });
      } else {
        setErrorMessage(result.error?.message || t('couldNotUpdatePassword'));
      }
      return;
    }

    await saveAuthTokens(result.data.tokens);
    applySession(result.data.session);

    closeModal();
    setNotice(t('passwordUpdated'));
  }

  const footerPadding = Math.max(insets.bottom, spacing.md);

  return (
    <>
      <AppCard accentColor={colors.tasklyBlue600}>
        <View style={styles.cardHeader}>
          <AppText variant="cardTitle">{t('accountSecurityTitle')}</AppText>
          <AppText color={colors.slate700}>{t('accountSecuritySubtitle')}</AppText>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldRowContent}>
            <AppText color={colors.slate500} variant="small">{t('loginEmail')}</AppText>
            <AppText variant="bodyStrong">{email}</AppText>
          </View>
        </View>
        <AppText color={colors.slate500} variant="caption">{t('contactSupportEmailChange')}</AppText>

        <View style={styles.divider} />

        <View style={styles.passwordRow}>
          <View style={styles.fieldRowContent}>
            <AppText color={colors.slate500} variant="small">{t('changePassword')}</AppText>
            <AppText>{'••••••••'}</AppText>
          </View>
          <AppButton onPress={openModal} style={styles.changeButton} tone="core" variant="outline">
            {t('changePassword')}
          </AppButton>
        </View>

        {notice ? (
          <AppText color={colors.success600} variant="caption">{notice}</AppText>
        ) : null}
        {errorMessage ? (
          <AppText color={colors.danger600} variant="caption">{errorMessage}</AppText>
        ) : null}
      </AppCard>

      <Modal animationType="slide" onRequestClose={closeModal} transparent visible={showModal}>
        <KeyboardAvoidingView
          behavior={Platform.select({ android: 'height', ios: 'padding', default: undefined })}
          style={styles.modalRoot}>
          <Pressable
            accessibilityLabel={t('cancel')}
            accessibilityRole="button"
            onPress={closeModal}
            style={styles.modalScrim}
          />
          <View style={[styles.modalSheet, { paddingBottom: footerPadding }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <AppText variant="sectionTitle">{t('changePassword')}</AppText>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <FormField
                autoCapitalize="none"
                autoComplete="current-password"
                errorText={fieldErrors.currentPassword}
                label={t('currentPassword')}
                onChangeText={(v) => {
                  setDraft((prev) => ({ ...prev, currentPassword: v }));
                  if (fieldErrors.currentPassword) setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }}
                secureTextEntry
                textContentType="password"
                value={draft.currentPassword}
              />
              <FormField
                autoCapitalize="none"
                autoComplete="new-password"
                errorText={fieldErrors.newPassword}
                label={t('newPassword')}
                onChangeText={(v) => {
                  setDraft((prev) => ({ ...prev, newPassword: v }));
                  if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                secureTextEntry
                textContentType="newPassword"
                value={draft.newPassword}
              />
              <FormField
                autoCapitalize="none"
                autoComplete="new-password"
                errorText={fieldErrors.confirmPassword}
                label={t('confirmNewPassword')}
                onChangeText={(v) => {
                  setDraft((prev) => ({ ...prev, confirmPassword: v }));
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                secureTextEntry
                textContentType="newPassword"
                value={draft.confirmPassword}
              />
              {errorMessage ? (
                <AppText color={colors.danger600} variant="caption">{errorMessage}</AppText>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton disabled={isSaving} onPress={closeModal} tone="neutral" variant="outline">
                {t('cancel')}
              </AppButton>
              <AppButton loading={isSaving} onPress={handleSave} style={styles.saveButton} tone="core">
                {t('saveChanges')}
              </AppButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

export default function ProviderSettingsScreen() {
  return (
    <Screen>
      <ProviderTopBar />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="screenTitle">{t('drawerSettings')}</AppText>
        <AppText color={colors.slate700}>{t('providerSettingsSubtitle')}</AppText>
      </View>

      <AccountSecurityCard />
      <NotificationSettingsCard workspace="provider" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    gap: spacing.xs,
  },
  changeButton: {
    alignSelf: 'flex-start',
  },
  divider: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldRowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  modalBody: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.xs,
    width: 48,
  },
  modalHeader: {
    paddingBottom: spacing.xs,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    gap: spacing.md,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    shadowColor: colors.navy900,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 18,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
  },
});
