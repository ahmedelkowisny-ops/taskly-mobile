import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { KeyboardAwareFormScreen, PublicTopBar } from '@/src/components/taskly';
import { AppButton, AppText } from '@/src/components/ui';
import { useAuth } from '@/src/lib/auth/useAuth';
import { canAccessProviderWorkspace, getDefaultAuthenticatedRoute } from '@/src/lib/auth/workspaceAccess';
import { t, useI18n } from '@/src/lib/i18n';
import {
  canOpenDeepLinkTarget,
  consumePendingDeepLinkTarget,
  getDeepLinkFallbackRoute,
} from '@/src/lib/navigation/deepLinks';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

export default function LoginScreen() {
  useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ intent?: string }>();
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      if (params.intent === 'pro' && canAccessProviderWorkspace(result.data)) {
        router.replace('/provider/profile?mode=pro&openApplication=1' as Href);
        return;
      }

      const pendingTarget = consumePendingDeepLinkTarget();
      if (pendingTarget && canOpenDeepLinkTarget({ session: result.data, status: 'authenticated', target: pendingTarget })) {
        router.replace(pendingTarget.href);
      } else {
        router.replace(
          pendingTarget
            ? getDeepLinkFallbackRoute(pendingTarget.workspace)
            : ((getDefaultAuthenticatedRoute(result.data) ?? '/') as Href),
        );
      }
      return;
    }

    setError(t('invalidLogin'));
  }

  return (
    <KeyboardAwareFormScreen contentStyle={styles.content} style={styles.screen}>
        <PublicTopBar />

        <View style={styles.hero}>
          <AppText variant="screenTitle">{t('loginHeroTitle')}</AppText>
          <AppText color={colors.slate500}>{t('loginHeroSubtitle')}</AppText>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <AppText color={colors.slate500} style={styles.fieldLabel}>
              {t('emailLabelUpper')}
            </AppText>
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
            <AppText color={colors.slate500} style={styles.fieldLabel}>
              {t('passwordLabelUpper')}
            </AppText>
            <View style={styles.passwordWrap}>
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
                secureTextEntry={!passwordVisible}
                style={styles.passwordInput}
                textContentType="password"
                value={password}
              />
              <Pressable
                accessibilityLabel={passwordVisible ? t('hidePassword') : t('showPassword')}
                accessibilityRole="button"
                onPress={() => setPasswordVisible((current) => !current)}
                style={({ pressed }) => [styles.eyeButton, pressed ? styles.pressed : null]}>
                <Ionicons color={colors.slate500} name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={19} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/forgot-password' as Href)}
              style={({ pressed }) => [styles.forgotRow, pressed ? styles.pressed : null]}>
              <AppText color={colors.slate500} style={styles.forgotText}>
                {t('forgotPassword')}
              </AppText>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AppText color={colors.danger600} variant="small">
                {error}
              </AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => {
              void onSubmit();
            }}
            style={({ pressed }) => [styles.primaryButton, loading ? styles.disabled : pressed ? styles.pressedButton : null]}>
            <Ionicons color={colors.white} name="log-in-outline" size={18} />
            <AppText color={colors.white} variant="button">
              {loading ? t('loading') : t('loginTitle')}
            </AppText>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <AppText color={colors.slate500} style={styles.dividerText}>
              {t('or')}
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          <AppButton
            labelColor={colors.slate500}
            onPress={() => router.push('/' as Href)}
            style={styles.secondaryButton}
            tone="neutral"
            variant="outline">
            {t('backToTaskly')}
          </AppButton>
        </View>

        <View style={styles.bottomPrompt}>
          <AppText color={colors.slate500} style={styles.promptText}>
            {t('newToTasklyQuestion')}
          </AppText>
          <Pressable onPress={() => router.push('/register' as Href)} style={({ pressed }) => [pressed ? styles.pressed : null]}>
            <AppText color={colors.tasklyBlue600} style={styles.promptLink}>
              {t('createFreeAccount')}
            </AppText>
          </Pressable>
        </View>
    </KeyboardAwareFormScreen>
  );
}

const styles = StyleSheet.create({
  bottomPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  content: {
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.55,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  eyeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 15,
  },
  forgotRow: {
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'right',
  },
  formCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    ...designTokens.shadows.surface,
  },
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.navy900,
    elevation: 0,
    fontSize: 14,
    height: 48,
    paddingHorizontal: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  passwordInput: {
    color: colors.navy900,
    flex: 1,
    fontSize: 14,
    height: 48,
    paddingLeft: spacing.md,
  },
  passwordWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.74,
  },
  pressedButton: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...designTokens.shadows.buttonBlue,
  },
  promptLink: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  secondaryButton: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 52,
  },
});
