import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { TasklyLogoText } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { useAuth } from '@/src/lib/auth/useAuth';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

const FRIENDLY_LOGIN_ERROR = 'Invalid email or password, or the server could not be reached.';

export default function LoginScreen() {
  const router = useRouter();
  const { login, status, useDemoSession: activateDemoSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loading = status === 'loading';

  async function onSubmit() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setError(null);
    const result = await login(trimmedEmail, password);

    if (result.ok) {
      setPassword('');
      router.replace('/');
      return;
    }

    setError(FRIENDLY_LOGIN_ERROR);
  }

  function continueDemo() {
    activateDemoSession();
    router.replace('/');
  }

  return (
    <Screen contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.keyboard}>
        <View style={styles.hero}>
          <TasklyLogoText />
          <StatusBadge label="Taskly account" tone="neutral" />
          <AppText variant="screenTitle">Login</AppText>
          <AppText color={colors.slate700}>
            Use your Taskly account. Registration will be connected later.
          </AppText>
        </View>

        <AppCard>
          <View style={styles.field}>
            <AppText variant="bodyStrong">Email</AppText>
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
            <AppText variant="bodyStrong">Password</AppText>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
              onChangeText={setPassword}
              onSubmitEditing={() => {
                void onSubmit();
              }}
              placeholder="Password"
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
            Login
          </AppButton>

          <AppButton onPress={continueDemo} tone="pro" variant="outline">
            Continue in demo mode
          </AppButton>

          <AppButton onPress={() => router.push('/')} tone="neutral" variant="ghost">
            Back to Taskly
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
});
