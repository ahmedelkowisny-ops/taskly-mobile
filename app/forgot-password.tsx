import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { KeyboardAwareFormScreen, LanguageToggle, TasklyLogoText } from '@/src/components/taskly';
import { AppButton, AppCard, AppText } from '@/src/components/ui';
import { requestMobilePasswordReset } from '@/src/lib/api/auth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function ForgotPasswordScreen() {
  const { locale } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(t('forgotPasswordEmailRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    const result = await requestMobilePasswordReset({
      email: trimmedEmail,
      preferredLocale: locale,
    });

    setLoading(false);

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setError(t('forgotPasswordSubmitError'));
  }

  return (
    <KeyboardAwareFormScreen contentStyle={styles.content} style={styles.screen}>
      <View style={styles.topRow}>
        <TasklyLogoText compact wordmarkOnly />
        <View style={styles.topActions}>
          <LanguageToggle />
        </View>
      </View>

      <View style={styles.header}>
        <AppText style={styles.title} variant="screenTitle">
          {t('forgotPasswordTitle')}
        </AppText>
        <AppText color={colors.slate700} style={styles.subtitle}>
          {t('forgotPasswordIntro')}
        </AppText>
      </View>

      <AppCard>
        {submitted ? (
          <View style={styles.successBox}>
            <AppText style={styles.successTitle} variant="bodyStrong">
              {t('forgotPasswordSentTitle')}
            </AppText>
            <AppText color={colors.slate700} style={styles.successBody}>
              {t('forgotPasswordSentBody')}
            </AppText>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <AppText variant="bodyStrong">{t('emailLabel')}</AppText>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                inputMode="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.slate500}
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            {error ? (
              <AppText color={colors.danger600} variant="caption">
                {error}
              </AppText>
            ) : null}

            <AppButton
              loading={loading}
              onPress={() => {
                void onSubmit();
              }}>
              {t('forgotPasswordSubmit')}
            </AppButton>
          </>
        )}

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/login')}
          style={({ pressed }) => [styles.backLink, pressed ? styles.pressed : null]}>
          <AppText color={colors.slate500} style={styles.backText} variant="caption">
            {t('backToLogin')}
          </AppText>
        </Pressable>
      </AppCard>
    </KeyboardAwareFormScreen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  backText: {
    textAlign: 'center',
  },
  content: {
    gap: spacing.lg,
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.navy900,
    fontSize: 15,
    height: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  successBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  successTitle: {
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
