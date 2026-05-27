import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { LanguageToggle, TasklyLogoText } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import {
  canOpenDeepLinkTarget,
  consumePendingDeepLinkTarget,
  getDeepLinkFallbackRoute,
} from '@/src/lib/navigation/deepLinks';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

export default function LoginScreen() {
  useI18n();
  const router = useRouter();
  const { login, status, useDemoSession: activateDemoSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loading = status === 'loading';

  async function onSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError(t('enterEmailPassword'));
      return;
    }

    setError(null);
    const result = await login(trimmedEmail, password);

    if (result.ok) {
      setPassword('');
      const pendingTarget = consumePendingDeepLinkTarget();
      if (pendingTarget && canOpenDeepLinkTarget({ session: result.data, status: 'authenticated', target: pendingTarget })) {
        router.replace(pendingTarget.href);
      } else {
        router.replace(pendingTarget ? getDeepLinkFallbackRoute(pendingTarget.workspace) : '/');
      }
      return;
    }

    setError(t('invalidLogin'));
  }

  function continueDemo() {
    activateDemoSession();
    router.replace('/');
  }

  return (
    <Screen contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.keyboard}>
        <View style={styles.topBar}>
          <LanguageToggle />
        </View>

        <View style={styles.hero}>
          <TasklyLogoText />
          <StatusBadge label={t('tasklyAccount')} tone="neutral" />
          <AppText variant="screenTitle">{t('loginTitle')}</AppText>
          <AppText color={colors.slate700}>{t('loginIntro')}</AppText>
        </View>

        <AppCard>
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

          <View style={styles.field}>
            <AppText variant="bodyStrong">{t('passwordLabel')}</AppText>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
              onChangeText={setPassword}
              onSubmitEditing={() => {
                void onSubmit();
              }}
            placeholder={t('passwordLabel')}
              placeholderTextColor={colors.slate500}
              secureTextEntry
              style={styles.input}
              textContentType="password"
              value={password}
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
            {t('loginTitle')}
          </AppButton>

          <AppButton onPress={continueDemo} tone="pro" variant="outline">
            {t('continueDemoMode')}
          </AppButton>

          <AppButton onPress={() => router.push('/')} tone="neutral" variant="ghost">
            {t('backToTaskly')}
          </AppButton>
        </AppCard>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  field: {
    gap: spacing.sm,
  },
  hero: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.navy900,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  keyboard: {
    gap: spacing.lg,
  },
  topBar: {
    alignItems: 'flex-end',
  },
});
