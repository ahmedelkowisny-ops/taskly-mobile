import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CustomerDrawer } from '@/src/components/taskly/CustomerDrawer';
import { CustomerTopBar, FormField } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import type { CustomerSupportIssueType } from '@/src/lib/api/domain';
import { submitCustomerSupportRequest } from '@/src/lib/api/customer';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type SupportForm = {
  details: string;
  issueType: CustomerSupportIssueType;
  subject: string;
};

type SupportErrors = Partial<Record<keyof SupportForm | 'form', string>>;

const issueTypes: CustomerSupportIssueType[] = ['account', 'task', 'pro_access', 'payment', 'technical', 'other'];

const emptyForm: SupportForm = {
  details: '',
  issueType: 'account',
  subject: '',
};

export default function CustomerSupportScreen() {
  useI18n();
  const router = useRouter();
  const { getValidAccessToken, status } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<SupportForm>(emptyForm);
  const [errors, setErrors] = useState<SupportErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit() {
    const nextErrors = validateSupportForm(form);
    setErrors(nextErrors);
    setSuccessMessage(null);
    if (Object.keys(nextErrors).length) return;

    const authToken = await getValidAccessToken();
    if (!authToken || status !== 'authenticated') {
      setErrors({ form: t('pleaseLoginToContinue') });
      return;
    }

    setIsSubmitting(true);
    const result = await submitCustomerSupportRequest(
      {
        details: form.details.trim(),
        issueType: form.issueType,
        subject: form.subject.trim(),
      },
      authToken,
    );
    setIsSubmitting(false);

    if (!result.ok) {
      setErrors(getSupportErrors(result.error.details));
      return;
    }

    setForm(emptyForm);
    setErrors({});
    setSuccessMessage(result.data.message || t('supportRequestSubmitted'));
  }

  return (
    <Screen contentStyle={styles.content}>
      <CustomerTopBar onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.header}>
        <StatusBadge label={t('support')} tone="neutral" />
        <AppText variant="screenTitle">{t('contactSupport')}</AppText>
        <AppText color={colors.slate700}>{t('contactSupportIntro')}</AppText>
      </View>

      <AppCard>
        <AppText variant="cardTitle">{t('howCanWeHelp')}</AppText>
        <View style={styles.issueGrid}>
          {issueTypes.map((issueType) => (
            <IssueChip
              key={issueType}
              label={getIssueTypeLabel(issueType)}
              onPress={() => setForm((current) => ({ ...current, issueType }))}
              selected={form.issueType === issueType}
            />
          ))}
        </View>
        {errors.issueType ? <AppText color={colors.warning600} variant="small">{errors.issueType}</AppText> : null}
        <FormField
          errorText={errors.subject}
          label={t('supportSubject')}
          onChangeText={(value) => setForm((current) => ({ ...current, subject: value }))}
          value={form.subject}
        />
        <FormField
          errorText={errors.details}
          label={t('supportMessage')}
          multiline
          onChangeText={(value) => setForm((current) => ({ ...current, details: value }))}
          value={form.details}
        />
        {errors.form ? <InlineMessage message={errors.form} tone="error" /> : null}
        {successMessage ? (
          <InlineMessage message={successMessage} tone="success" />
        ) : null}
        <AppButton loading={isSubmitting} onPress={handleSubmit}>
          {isSubmitting ? t('submittingSupportRequest') : t('submitSupportRequest')}
        </AppButton>
        {successMessage ? (
          <AppButton onPress={() => router.push('/customer/messages?context=support' as Href)} tone="neutral" variant="outline">
            {t('openSupportMessages')}
          </AppButton>
        ) : null}
      </AppCard>

      <AppCard accentColor={colors.tasklyBlue600}>
        <AppText variant="cardTitle">{t('supportContextNoteTitle')}</AppText>
        <AppText color={colors.slate700}>{t('supportContextNoteBody')}</AppText>
      </AppCard>

      <CustomerDrawer onClose={() => setDrawerOpen(false)} visible={drawerOpen} />
    </Screen>
  );
}

function IssueChip({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.issueChip, selected ? styles.issueChipSelected : null, pressed ? styles.pressed : null]}>
      <Ionicons color={selected ? colors.tasklyBlue700 : colors.slate500} name="help-circle-outline" size={15} />
      <AppText color={selected ? colors.tasklyBlue700 : colors.slate700} variant="small">
        {label}
      </AppText>
    </Pressable>
  );
}

function InlineMessage({ message, tone }: { message: string; tone: 'error' | 'success' }) {
  return (
    <View style={[styles.inlineMessage, tone === 'success' ? styles.successMessage : styles.errorMessage]}>
      <AppText color={tone === 'success' ? colors.tasklyBlue700 : colors.warning600} variant="small">
        {message}
      </AppText>
    </View>
  );
}

function validateSupportForm(form: SupportForm): SupportErrors {
  const errors: SupportErrors = {};
  if (!form.subject.trim()) errors.subject = t('supportSubjectRequired');
  if (form.subject.trim().length > 160) errors.subject = t('supportSubjectTooLong');
  if (!form.details.trim()) errors.details = t('supportMessageRequired');
  if (form.details.trim().length > 4000) errors.details = t('supportMessageTooLong');
  return errors;
}

function getSupportErrors(details: unknown): SupportErrors {
  if (details && typeof details === 'object' && 'fieldErrors' in details) {
    const fieldErrors = (details as { fieldErrors?: Record<string, unknown> }).fieldErrors;
    if (fieldErrors) {
      return {
        details: fieldErrors.details ? t('supportMessageRequired') : undefined,
        issueType: fieldErrors.issueType ? t('supportIssueTypeInvalid') : undefined,
        subject: fieldErrors.subject ? t('supportSubjectRequired') : undefined,
      };
    }
  }
  return { form: t('couldNotRequestSupport') };
}

function getIssueTypeLabel(issueType: CustomerSupportIssueType) {
  switch (issueType) {
    case 'account':
      return t('supportIssueAccount');
    case 'task':
      return t('supportIssueTask');
    case 'pro_access':
      return t('supportIssueProAccess');
    case 'payment':
      return t('supportIssuePayment');
    case 'technical':
      return t('supportIssueTechnical');
    case 'other':
      return t('supportIssueOther');
    default:
      return t('supportIssueOther');
  }
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  errorMessage: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  header: {
    gap: spacing.sm,
  },
  inlineMessage: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  issueChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  issueChipSelected: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlue600,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.84,
  },
  successMessage: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
  },
});
