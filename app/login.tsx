import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PublicTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import {
  canOpenDeepLinkTarget,
  consumePendingDeepLinkTarget,
  getDeepLinkFallbackRoute,
} from '@/src/lib/navigation/deepLinks';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type LoginRole = 'customer' | 'tasker' | 'proTasker';

const roleIcons: Record<LoginRole, keyof typeof Ionicons.glyphMap> = {
  customer: 'home-outline',
  proTasker: 'ribbon-outline',
  tasker: 'hammer-outline',
};

export default function LoginScreen() {
  useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loading = status === 'loading';
  const selectedRole = getLoginRole(params.role);
  const roleCopy = selectedRole ? getRoleCopy(selectedRole) : null;

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

  return (
    <Screen contentStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.keyboard}>
        <PublicTopBar />

        <View style={styles.mainContent}>
          <View style={styles.hero}>
            <AppText style={styles.title} variant="screenTitle">
              {t('loginTitle')}
            </AppText>
            <AppText color={colors.slate700} style={styles.subtitle}>
              {t('loginIntro')}
            </AppText>
          </View>

          <AppCard>
            {roleCopy ? (
              <View style={styles.roleContext}>
                <View style={[styles.iconCircle, { backgroundColor: roleCopy.accent === colors.proOrange600 ? colors.proOrange50 : colors.tasklyBlue50 }]}>
                  <Ionicons color={roleCopy.accent} name={roleIcons[selectedRole ?? 'customer']} size={20} />
                </View>
                <View style={styles.roleCopy}>
                  <AppText color={colors.slate500} variant="small">
                    {t('selectedRole')}
                  </AppText>
                  <AppText variant="bodyStrong">{roleCopy.title}</AppText>
                  <AppText color={colors.slate700} variant="caption">
                    {roleCopy.body}
                  </AppText>
                </View>
              </View>
            ) : null}

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

            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/forgot-password' as Href)}
              style={({ pressed }) => [styles.forgotRow, pressed ? styles.pressed : null]}>
              <AppText color={colors.slate500} style={styles.forgotText} variant="caption">
                {t('forgotPassword')}
              </AppText>
            </Pressable>

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

            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/')}
              style={({ pressed }) => [styles.backLink, pressed ? styles.pressed : null]}>
              <AppText color={colors.slate500} style={styles.backLinkText} variant="caption">
                {t('backToTaskly')}
              </AppText>
            </Pressable>
          </AppCard>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  backLinkText: {
    textAlign: 'center',
  },
  content: {
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotText: {
    textAlign: 'right',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
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
    flex: 1,
    gap: spacing.xl,
  },
  mainContent: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
  },
  roleContext: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  roleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
});

function getLoginRole(role: string | undefined): LoginRole | null {
  if (role === 'customer' || role === 'tasker' || role === 'proTasker') return role;
  return null;
}

function getRoleCopy(role: LoginRole) {
  if (role === 'customer') {
    return {
      accent: colors.tasklyBlue600,
      body: t('loginCustomerHelper'),
      title: t('continueAsCustomerLogin'),
    };
  }

  if (role === 'tasker') {
    return {
      accent: colors.tasklyBlue600,
      body: t('loginTaskerHelper'),
      title: t('continueAsTasker'),
    };
  }

  return {
    accent: colors.proOrange600,
    body: t('loginProTaskerHelper'),
    title: t('continueAsProTasker'),
  };
}
