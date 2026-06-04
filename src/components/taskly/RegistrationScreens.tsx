import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, AppText, Screen } from '@/src/components/ui';
import { RegisterRole } from '@/src/lib/api/types';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, TranslationKey, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { PublicTopBar } from './PublicTopBar';

type IoniconName = keyof typeof Ionicons.glyphMap;
type FieldErrors = Partial<Record<'email' | 'firstName' | 'lastName' | 'password' | 'phone' | 'terms', string>>;

type RegisterOption = {
  body: TranslationKey;
  icon: IoniconName;
  route: Href;
  title: TranslationKey;
  tone: RegisterRole;
};

const registerOptions: RegisterOption[] = [
  {
    body: 'registerCustomerCardSubtitle',
    icon: 'home-outline',
    route: '/register/customer',
    title: 'registerCustomerCardTitle',
    tone: 'customer',
  },
  {
    body: 'registerTaskerCardSubtitle',
    icon: 'construct-outline',
    route: '/register/tasker',
    title: 'registerTaskerCardTitle',
    tone: 'tasker',
  },
  {
    body: 'registerProCardSubtitle',
    icon: 'ribbon-outline',
    route: '/register/pro',
    title: 'registerProCardTitle',
    tone: 'pro',
  },
];

const roleTitle: Record<RegisterRole, TranslationKey> = {
  customer: 'registrationCustomerHeroTitle',
  pro: 'registrationProHeroTitle',
  tasker: 'registrationTaskerHeroTitle',
};

const roleButton: Record<RegisterRole, TranslationKey> = {
  customer: 'createMyAccount',
  pro: 'applyForTasklyProArrow',
  tasker: 'createMyAccount',
};

export function RegisterChoiceScreen() {
  useI18n();
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <PublicTopBar />

      <View style={styles.hero}>
        <AppText variant="screenTitle">{t('registerHeroTitle')}</AppText>
        <AppText color={colors.slate500}>{t('registerHeroSubtitle')}</AppText>
      </View>

      <View style={styles.optionStack}>
        {registerOptions.map((option) => (
          <RegisterOptionCard
            key={option.tone}
            option={option}
            onPress={() => {
              router.push(option.route);
            }}
          />
        ))}
      </View>

      <View style={styles.inlineLinkRow}>
        <AppText color={colors.slate500} style={styles.inlineText}>
          {t('alreadyHaveAccount')}
        </AppText>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/login' as Href)}
          style={({ pressed }) => [pressed ? styles.pressedSoft : null]}>
          <AppText color={colors.tasklyBlue600} style={styles.inlineLink}>
            {t('signIn')}
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

export function RegistrationFormScreen({ role }: { role: RegisterRole }) {
  const { locale } = useI18n();
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExistingProLoginPrompt, setShowExistingProLoginPrompt] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const isPro = role === 'pro';
  const accent = isPro ? colors.proAmber500 : colors.tasklyBlue600;

  const passwordHelper = useMemo(() => t('registrationPasswordHelper'), []);

  function validate() {
    const errors: FieldErrors = {};
    if (!firstName.trim()) errors.firstName = t('requiredField');
    if (!lastName.trim()) errors.lastName = t('requiredField');
    if (!email.trim() || !email.includes('@')) errors.email = t('invalidEmail');
    if (!phone.trim()) errors.phone = t('requiredField');
    if (!password) errors.password = t('requiredField');
    if (password && password.length < 12) errors.password = t('registrationPasswordTooShort');
    if (!termsAccepted) errors.terms = t('termsRequired');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setShowExistingProLoginPrompt(false);

    const result = await register({
      confirmPassword: password,
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password,
      phone: phone.trim(),
      preferredLocale: locale,
      role,
    });

    setLoading(false);

    if (!result.ok) {
      setShowExistingProLoginPrompt(role === 'pro' && result.error.code === 'EMAIL_ALREADY_EXISTS');
      setError(getFriendlyRegistrationError(result.error.code, role));
      return;
    }

    if (role === 'customer') {
      router.replace('/customer/home');
      return;
    }

    const nextHref = result.data.nextAction.href;
    router.replace((nextHref || '/provider/start') as Href);
  }

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <PublicTopBar />
      <ProgressDots activeColor={accent} />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/register' as Href)}
        style={({ pressed }) => [styles.backButton, pressed ? styles.pressedSoft : null]}>
        <Ionicons color={colors.slate500} name="arrow-back" size={18} />
        <AppText color={colors.slate500} variant="small">
          {t('back')}
        </AppText>
      </Pressable>

      <View style={styles.hero}>
        <AppText variant="screenTitle">{t(roleTitle[role])}</AppText>
        <AppText color={colors.slate500}>{t('registrationSharedSubtitle')}</AppText>
      </View>

      <View style={styles.formCard}>
        <View style={styles.nameRow}>
          <FormField error={fieldErrors.firstName} label={t('firstNameLabel')} onChangeText={setFirstName} value={firstName} />
          <FormField error={fieldErrors.lastName} label={t('lastNameLabel')} onChangeText={setLastName} value={lastName} />
        </View>

        <FormField
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email}
          inputMode="email"
          keyboardType="email-address"
          label={t('emailLabel')}
          onChangeText={setEmail}
          placeholder="you@example.com"
          textContentType="emailAddress"
          value={email}
        />

        <FormField
          autoComplete="tel"
          error={fieldErrors.phone}
          helper={t('phonePrefixHint')}
          inputMode="tel"
          keyboardType="phone-pad"
          label={t('phoneLabel')}
          onChangeText={setPhone}
          placeholder="+359"
          textContentType="telephoneNumber"
          value={phone}
        />

        <View style={styles.field}>
          <AppText color={colors.slate500} style={styles.fieldLabel}>
            {t('passwordLabelUpper')}
          </AppText>
          <View style={[styles.passwordWrap, fieldErrors.password ? styles.inputError : null]}>
            <TextInput
              autoCapitalize="none"
              autoComplete="new-password"
              onChangeText={setPassword}
              placeholder={t('passwordLabel')}
              placeholderTextColor={colors.slate500}
              secureTextEntry={!passwordVisible}
              style={styles.passwordInput}
              textContentType="newPassword"
              value={password}
            />
            <Pressable
              accessibilityLabel={passwordVisible ? t('hidePassword') : t('showPassword')}
              accessibilityRole="button"
              onPress={() => setPasswordVisible((current) => !current)}
              style={({ pressed }) => [styles.eyeButton, pressed ? styles.pressedSoft : null]}>
              <Ionicons color={colors.slate500} name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={19} />
            </Pressable>
          </View>
          <AppText color={fieldErrors.password ? colors.danger600 : colors.slate500} variant="small">
            {fieldErrors.password ?? passwordHelper}
          </AppText>
        </View>

        <View style={styles.termsBlock}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
            onPress={() => setTermsAccepted((current) => !current)}
            style={({ pressed }) => [styles.checkbox, termsAccepted ? styles.checkboxChecked : null, pressed ? styles.pressedSoft : null]}>
            {termsAccepted ? <Ionicons color={colors.white} name="checkmark" size={14} /> : null}
          </Pressable>
          <View style={styles.termsTextWrap}>
            <AppText color={colors.slate500} variant="small">
              {t('termsAgreementPrefix')}
              <AppText color={colors.tasklyBlue600} variant="small">{t('termsOfService')}</AppText>
              {t('termsAgreementMiddle')}
              <AppText color={colors.tasklyBlue600} variant="small">{t('privacyPolicy')}</AppText>
            </AppText>
            {fieldErrors.terms ? (
              <AppText color={colors.danger600} variant="small">
                {fieldErrors.terms}
              </AppText>
            ) : null}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <AppText color={colors.danger600} variant="small">
              {error}
            </AppText>
            {showExistingProLoginPrompt ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/login?intent=pro' as Href)}
                style={({ pressed }) => [styles.errorAction, pressed ? styles.pressedSoft : null]}>
                <AppText color={colors.tasklyBlue600} variant="small">{t('signInToAddTasklyPro')}</AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <AppButton
          loading={loading}
          onPress={() => {
            void onSubmit();
          }}
          style={[styles.primaryButton, isPro ? styles.proPrimaryButton : null]}
          tone={isPro ? 'pro' : 'core'}>
          {t(roleButton[role])}
        </AppButton>
      </View>
    </Screen>
  );
}

function RegisterOptionCard({ option, onPress }: { option: RegisterOption; onPress: () => void }) {
  const visual = getRegisterRoleVisual(option.tone);
  const isCustomer = option.tone === 'customer';
  const isPro = option.tone === 'pro';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        {
          backgroundColor: visual.background,
          borderColor: visual.border,
        },
        pressed ? styles.pressedScale : null,
      ]}>
      <View style={[styles.optionIcon, { backgroundColor: visual.iconBackground }]}>
        <Ionicons color={visual.iconColor} name={option.icon} size={22} />
      </View>
      <View style={styles.optionText}>
        <AppText color={visual.titleColor} variant="cardTitle">
          {t(option.title)}
        </AppText>
        <AppText color={visual.bodyColor} variant="small">
          {t(option.body)}
        </AppText>
      </View>
      <View style={[styles.optionArrow, isCustomer ? styles.optionArrowFilled : isPro ? styles.optionArrowPro : styles.optionArrowCore]}>
        <Ionicons color={visual.arrowColor} name="arrow-forward" size={18} />
      </View>
    </Pressable>
  );
}

function ProgressDots({ activeColor }: { activeColor: string }) {
  return (
    <View style={styles.progressDots}>
      <View style={[styles.progressDotActive, { backgroundColor: activeColor }]} />
      <View style={styles.progressDot} />
      <View style={styles.progressDot} />
    </View>
  );
}

function FormField({
  error,
  helper,
  label,
  ...inputProps
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'tel';
  error?: string;
  helper?: string;
  inputMode?: 'email' | 'tel' | 'text';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  label: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  textContentType?: 'emailAddress' | 'telephoneNumber';
  value: string;
}) {
  return (
    <View style={styles.field}>
      <AppText color={colors.slate500} style={styles.fieldLabel}>
        {label.toLocaleUpperCase()}
      </AppText>
      <TextInput
        placeholderTextColor={colors.slate500}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {helper && !error ? (
        <AppText color={colors.slate500} variant="small">
          {helper}
        </AppText>
      ) : null}
      {error ? (
        <AppText color={colors.danger600} variant="small">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function getRegisterRoleVisual(role: RegisterRole) {
  if (role === 'pro') {
    return {
      arrowColor: colors.proOrange600,
      background: colors.proOrange50,
      bodyColor: colors.proOrangeText,
      border: colors.proOrangeBorder,
      iconBackground: colors.proOrange50,
      iconColor: colors.proOrange600,
      titleColor: colors.proOrangeTextDark,
    };
  }

  if (role === 'tasker') {
    return {
      arrowColor: colors.tasklyBlue600,
      background: colors.white,
      bodyColor: colors.slate500,
      border: colors.border,
      iconBackground: colors.tasklyBlue50,
      iconColor: colors.tasklyBlue600,
      titleColor: colors.navy900,
    };
  }

  return {
    arrowColor: colors.white,
    background: colors.tasklyBlue600,
    bodyColor: colors.white,
    border: colors.tasklyBlue600,
    iconBackground: 'rgba(255,255,255,0.2)',
    iconColor: colors.white,
    titleColor: colors.white,
  };
}

function getFriendlyRegistrationError(code: string, role: RegisterRole) {
  if (code === 'EMAIL_ALREADY_EXISTS') {
    return role === 'pro' ? t('emailAlreadyExistsProLogin') : t('emailAlreadyExists');
  }
  if (code === 'PASSWORD_TOO_SHORT') return t('registrationPasswordTooShort');
  if (code === 'PASSWORD_TOO_LONG') return t('registrationPasswordTooLong');
  if (code === 'PASSWORD_PWNED') return t('registrationPasswordUnsafe');
  if (code === 'RATE_LIMITED') return t('registrationRateLimited');
  return t('registrationSubmitError');
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: colors.tasklyBlue600,
    borderColor: colors.tasklyBlue600,
  },
  content: {
    gap: spacing.lg,
    justifyContent: 'flex-start',
    paddingBottom: spacing.xxxl,
  },
  errorBox: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorAction: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  eyeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  field: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  hero: {
    gap: spacing.sm,
  },
  inlineLink: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  inlineLinkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  inlineText: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.navy900,
    fontSize: 14,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.danger600,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionArrow: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  optionArrowCore: {
    backgroundColor: colors.tasklyBlue50,
  },
  optionArrowFilled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  optionArrowPro: {
    backgroundColor: colors.proOrange50,
  },
  optionCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.lg,
  },
  optionIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  optionStack: {
    gap: spacing.md,
  },
  optionText: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
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
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
  },
  pressedScale: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  pressedSoft: {
    opacity: 0.74,
  },
  primaryButton: {
    borderRadius: radius.pill,
    minHeight: 52,
  },
  proPrimaryButton: {
    backgroundColor: colors.proAmber500,
    borderColor: colors.proAmber500,
  },
  progressDot: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  progressDotActive: {
    borderRadius: radius.pill,
    height: 8,
    width: 28,
  },
  progressDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  screen: {
    backgroundColor: colors.slate50,
  },
  termsBlock: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  termsTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
});
