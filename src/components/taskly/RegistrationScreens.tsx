import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen } from '@/src/components/ui';
import { RegisterRole } from '@/src/lib/api/types';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, TranslationKey, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

import { LanguageToggle } from './LanguageToggle';
import { TasklyLogoText } from './TasklyLogoText';

type RegisterOption = {
  body: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  title: TranslationKey;
  tone: RegisterRole;
};

type FieldErrors = Partial<Record<'confirmPassword' | 'email' | 'firstName' | 'lastName' | 'password' | 'phone', string>>;

const registerOptions: RegisterOption[] = [
  {
    body: 'registerCustomerHelper',
    icon: 'person-add-outline',
    route: '/register/customer',
    title: 'createCustomerAccount',
    tone: 'customer',
  },
  {
    body: 'registerTaskerHelper',
    icon: 'construct-outline',
    route: '/register/tasker',
    title: 'registerAsTasker',
    tone: 'tasker',
  },
  {
    body: 'registerProTaskerHelper',
    icon: 'medal-outline',
    route: '/register/pro',
    title: 'applyAsProTasker',
    tone: 'pro',
  },
];

const roleTitle: Record<RegisterRole, TranslationKey> = {
  customer: 'registrationCustomerTitle',
  pro: 'registrationProTitle',
  tasker: 'registrationTaskerTitle',
};

const roleBody: Record<RegisterRole, TranslationKey> = {
  customer: 'registrationCustomerBody',
  pro: 'registrationProBody',
  tasker: 'registrationTaskerBody',
};

const roleButton: Record<RegisterRole, TranslationKey> = {
  customer: 'registrationCustomerButton',
  pro: 'registrationProButton',
  tasker: 'registrationTaskerButton',
};

const roleIcon: Record<RegisterRole, keyof typeof Ionicons.glyphMap> = {
  customer: 'person-add-outline',
  pro: 'medal-outline',
  tasker: 'construct-outline',
};

export function RegisterChoiceScreen() {
  useI18n();
  const router = useRouter();

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <RegistrationTopBar />

      <View style={styles.header}>
        <AppText style={styles.title} variant="screenTitle">
          {t('registerPanelTitle')}
        </AppText>
        <AppText color={colors.slate700} style={styles.subtitle}>
          {t('registerPanelSubtitle')}
        </AppText>
      </View>

      <View style={styles.actionStack}>
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

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/login')}
        style={({ pressed }) => [styles.signInRow, pressed ? styles.pressedSoft : null]}>
        <AppText color={colors.slate500} style={styles.backText} variant="caption">
          {t('alreadyHaveAccount')}
        </AppText>
        <AppText color={colors.tasklyBlue600} style={styles.signInText} variant="caption">
          {t('signIn')}
        </AppText>
      </Pressable>
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const accent = getAccent(role);

  const passwordHelper = useMemo(() => t('registrationPasswordHelper'), []);

  function validate() {
    const errors: FieldErrors = {};
    if (!firstName.trim()) errors.firstName = t('requiredField');
    if (!lastName.trim()) errors.lastName = t('requiredField');
    if (!email.trim() || !email.includes('@')) errors.email = t('invalidEmail');
    if (!phone.trim()) errors.phone = t('requiredField');
    if (!password) errors.password = t('requiredField');
    if (password && password.length < 12) errors.password = t('registrationPasswordTooShort');
    if (password !== confirmPassword) errors.confirmPassword = t('passwordsDoNotMatch');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;

    setLoading(true);
    setError(null);

    const result = await register({
      confirmPassword,
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
      setError(getFriendlyRegistrationError(result.error.code));
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
      <RegistrationTopBar />

      <View style={styles.header}>
        <View style={[styles.formIcon, { backgroundColor: role === 'pro' ? colors.proOrange50 : colors.tasklyBlue50 }]}>
          <Ionicons color={accent} name={roleIcon[role]} size={24} />
        </View>
        <AppText style={styles.title} variant="screenTitle">
          {t(roleTitle[role])}
        </AppText>
        <AppText color={colors.slate700} style={styles.subtitle}>
          {t(roleBody[role])}
        </AppText>
      </View>

      <AppCard>
        <View style={styles.nameRow}>
          <FormField
            error={fieldErrors.firstName}
            label={t('firstNameLabel')}
            onChangeText={setFirstName}
            value={firstName}
          />
          <FormField
            error={fieldErrors.lastName}
            label={t('lastNameLabel')}
            onChangeText={setLastName}
            value={lastName}
          />
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
          inputMode="tel"
          keyboardType="phone-pad"
          label={t('phoneLabel')}
          onChangeText={setPhone}
          textContentType="telephoneNumber"
          value={phone}
        />

        <FormField
          autoComplete="new-password"
          error={fieldErrors.password}
          helper={passwordHelper}
          label={t('passwordLabel')}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />

        <FormField
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          label={t('confirmPasswordLabel')}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          value={confirmPassword}
        />

        <AppText color={colors.slate700} style={styles.note}>
          {role === 'customer' ? t('registrationCustomerNote') : role === 'tasker' ? t('registrationTaskerNote') : t('registrationProNote')}
        </AppText>

        {error ? (
          <AppText color={colors.danger600} variant="caption">
            {error}
          </AppText>
        ) : null}

        <AppButton
          loading={loading}
          onPress={() => {
            void onSubmit();
          }}
          tone={role === 'pro' ? 'pro' : 'core'}>
          {t(roleButton[role])}
        </AppButton>

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/register' as Href)}
          style={({ pressed }) => [styles.backLink, pressed ? styles.pressedSoft : null]}>
          <AppText color={colors.slate500} style={styles.backText} variant="caption">
            {t('backToRegisterOptions')}
          </AppText>
        </Pressable>
      </AppCard>
    </Screen>
  );
}

function RegistrationTopBar() {
  return (
    <View style={styles.topRow}>
      <View style={styles.brandMark}>
        <TasklyLogoText compact iconOnly />
      </View>
      <View style={styles.topActions}>
        <LanguageToggle />
      </View>
    </View>
  );
}

function RegisterOptionCard({ option, onPress }: { option: RegisterOption; onPress: () => void }) {
  const visual = getRegisterRoleVisual(option.tone);
  const foreground = option.tone === 'customer' ? colors.white : colors.slate700;
  const iconColor = option.tone === 'customer' ? colors.white : visual.accent;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        {
          backgroundColor: visual.background,
          borderColor: pressed ? visual.accent : visual.border,
        },
        pressed ? styles.pressed : null,
      ]}>
      <View style={[styles.optionIcon, { backgroundColor: visual.iconBackground, borderColor: visual.border }]}>
        <Ionicons color={iconColor} name={option.icon} size={19} />
      </View>
      <View style={styles.optionText}>
        <AppText color={visual.titleColor} style={styles.optionTitle}>
          {t(option.title)}
        </AppText>
        <AppText color={foreground} style={styles.optionBody}>
          {t(option.body)}
        </AppText>
      </View>
      <Ionicons color={iconColor} name="chevron-forward" size={18} />
    </Pressable>
  );
}

function FormField({
  error,
  helper,
  label,
  ...inputProps
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'new-password' | 'tel';
  error?: string;
  helper?: string;
  inputMode?: 'email' | 'tel' | 'text';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  label: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  textContentType?: 'emailAddress' | 'newPassword' | 'telephoneNumber';
  value: string;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="bodyStrong">{label}</AppText>
      <TextInput
        placeholderTextColor={colors.slate500}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {helper && !error ? (
        <AppText color={colors.slate500} variant="caption">
          {helper}
        </AppText>
      ) : null}
      {error ? (
        <AppText color={colors.danger600} variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function getAccent(role: RegisterRole) {
  if (role === 'pro') return colors.proOrange600;
  if (role === 'tasker') return colors.tasklyBlue700;
  return colors.tasklyBlue600;
}

function getRegisterRoleVisual(role: RegisterRole) {
  if (role === 'pro') {
    return {
      accent: colors.proOrange600,
      background: colors.proOrange50,
      border: colors.proOrangeBorder,
      iconBackground: colors.white,
      titleColor: colors.proOrangeTextDark,
    };
  }

  if (role === 'tasker') {
    return {
      accent: colors.tasklyBlue700,
      background: colors.white,
      border: colors.slate100,
      iconBackground: colors.tasklyBlue50,
      titleColor: colors.navy900,
    };
  }

  return {
    accent: colors.tasklyBlue600,
    background: colors.tasklyBlue600,
    border: colors.tasklyBlue600,
    iconBackground: 'rgba(255,255,255,0.16)',
    titleColor: colors.white,
  };
}

function getFriendlyRegistrationError(code: string) {
  if (code === 'EMAIL_ALREADY_EXISTS') return t('emailAlreadyExists');
  if (code === 'PASSWORD_TOO_SHORT') return t('registrationPasswordTooShort');
  if (code === 'PASSWORD_TOO_LONG') return t('registrationPasswordTooLong');
  if (code === 'PASSWORD_PWNED') return t('registrationPasswordUnsafe');
  if (code === 'RATE_LIMITED') return t('registrationRateLimited');
  return t('registrationSubmitError');
}

const styles = StyleSheet.create({
  actionStack: {
    gap: spacing.sm,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  backText: {
    textAlign: 'center',
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DCEBFA',
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 1,
    height: 46,
    justifyContent: 'center',
    shadowColor: colors.navy900,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    width: 46,
  },
  content: {
    gap: spacing.lg,
    justifyContent: 'flex-start',
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  field: {
    flex: 1,
    gap: spacing.sm,
  },
  formIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.navy900,
    fontSize: 16,
    height: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: colors.danger600,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  optionBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  optionCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.navy900,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  optionIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  pressedSoft: {
    opacity: 0.72,
  },
  screen: {
    backgroundColor: '#F6F9FD',
  },
  signInRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  signInText: {
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
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
