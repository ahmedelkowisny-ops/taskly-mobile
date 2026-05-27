import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
        <View style={styles.topBar}>
          <TasklyLogoText compact wordmarkOnly />
          <LanguageToggle />
        </View>

        <View style={styles.hero}>
          <StatusBadge label={t('tasklyAccount')} tone="neutral" />
          <AppText style={styles.title} variant="screenTitle">
            {t('loginTitle')}
          </AppText>
          <AppText color={colors.slate700}>{t('loginIntro')}</AppText>
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
    gap: spacing.lg,
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
  title: {
    fontSize: 24,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
