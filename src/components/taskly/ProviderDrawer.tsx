import Ionicons from '@expo/vector-icons/Ionicons';
import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  hasApprovedProMode,
  hasCoreTaskerMode,
} from '@/src/lib/auth/workspaceAccess';
import { changePassword } from '@/src/lib/api/account';
import { useAuth } from '@/src/lib/auth/useAuth';
import { saveAuthTokens } from '@/src/lib/auth/tokenStorage';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

import { AppButton, AppText } from '../ui';
import { FormField } from './FormField';
import { TasklyLogoText } from './TasklyLogoText';

type ProviderDrawerProps = {
  onClose: () => void;
  visible: boolean;
};

type DrawerItem = {
  action?: () => void;
  highlight?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  isActive: (pathname: string) => boolean;
  keepOpenOnAction?: boolean;
  label: string;
  route?: Href;
  tone?: 'taskly' | 'pro';
};

type DrawerGroup = {
  items: DrawerItem[];
  label: string;
};

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

export function ProviderDrawer({ onClose, visible }: ProviderDrawerProps) {
  useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { applySession, getValidAccessToken, isDemoMode, logout, session, status } = useAuth();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(width * 0.74, 286);
  const panelTopInset = Math.max(insets.top + spacing.md, spacing.xl);
  const panelBottomInset = Math.max(insets.bottom + spacing.lg, spacing.xxl);
  const drawerBottomPadding = spacing.lg;
  const proConfirmBottomPadding = Math.max(insets.bottom + 24, Platform.OS === 'android' ? 88 : 24);
  const proConfirmMaxHeight = Math.round(height * 0.85);
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const showCoreTasker = status === 'demo' || hasCoreTaskerMode(session);
  const showApprovedPro = status === 'demo' || hasApprovedProMode(session);
  const showProUpsell = showCoreTasker && !showApprovedPro;
  const isProOnly = showApprovedPro && !showCoreTasker;
  const [securityExpanded, setSecurityExpanded] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProApplyConfirm, setShowProApplyConfirm] = useState(false);
  const [isOpeningProRegister, setIsOpeningProRegister] = useState(false);
  const [draft, setDraft] = useState<PasswordDraft>(emptyPasswordDraft);
  const [fieldErrors, setFieldErrors] = useState<PasswordErrors>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      translateX.setValue(-drawerWidth);
      return;
    }

    translateX.setValue(-drawerWidth);
    Animated.timing(translateX, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [drawerWidth, translateX, visible]);

  function openPasswordModal() {
    setDraft(emptyPasswordDraft);
    setFieldErrors({});
    setSecurityNotice(null);
    setSecurityError(null);
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    setDraft(emptyPasswordDraft);
    setFieldErrors({});
    setShowPasswordModal(false);
  }

  function closeProApplyConfirm() {
    if (isOpeningProRegister) return;
    setShowProApplyConfirm(false);
  }

  async function handleContinueProApplication() {
    setIsOpeningProRegister(true);

    try {
      await logout();
    } finally {
      setShowProApplyConfirm(false);
      onClose();
      router.replace('/register/pro' as Href);
      setIsOpeningProRegister(false);
    }
  }

  async function handleSavePassword() {
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
      closePasswordModal();
      setSecurityNotice(t('passwordUpdated'));
      return;
    }

    const authToken = await getValidAccessToken();
    if (!authToken) {
      setSecurityError(t('loginRequired'));
      return;
    }

    setIsSavingPassword(true);
    const result = await changePassword(
      {
        confirmPassword: draft.confirmPassword,
        currentPassword: draft.currentPassword,
        newPassword: draft.newPassword,
      },
      authToken,
    );
    setIsSavingPassword(false);

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
        setSecurityError(result.error?.message || t('couldNotUpdatePassword'));
      }
      return;
    }

    await saveAuthTokens(result.data.tokens);
    applySession(result.data.session);

    closePasswordModal();
    setSecurityNotice(t('passwordUpdated'));
  }

  const drawerGroups: DrawerGroup[] = [
    ...(showCoreTasker
      ? [
          {
            label: t('drawerGroupMyWork'),
            items: [
              {
                icon: 'hand-right-outline' as keyof typeof Ionicons.glyphMap,
                isActive: (current: string) => current === '/provider/interests',
                label: t('drawerInterestsSent'),
                route: '/provider/interests' as Href,
              },
              {
                icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
                isActive: (current: string) => current === '/provider/task-history',
                label: t('drawerTaskHistory'),
                route: '/provider/task-history' as Href,
              },
              {
                icon: 'wallet-outline' as keyof typeof Ionicons.glyphMap,
                isActive: (current: string) => current === '/provider/payouts',
                label: t('drawerPayouts'),
                route: '/provider/payouts' as Href,
              },
            ],
          },
        ]
      : []),
    ...(showApprovedPro || showProUpsell
      ? [
          {
            label: t('drawerGroupTasklyPro'),
            items: [
              ...(showApprovedPro
                ? [
                    {
                      icon: 'ribbon-outline' as keyof typeof Ionicons.glyphMap,
                      isActive: (current: string) => current.startsWith('/provider/pro-requests'),
                      label: t('drawerTasklyProRequests'),
                      route: '/provider/pro-requests' as Href,
                      tone: 'pro' as const,
                    },
                  ]
                : [
                    {
                      icon: 'ribbon-outline' as keyof typeof Ionicons.glyphMap,
                      highlight: true,
                      isActive: () => false,
                      keepOpenOnAction: true,
                      label: t('applyForTasklyPro'),
                      action: () => setShowProApplyConfirm(true),
                      tone: 'pro' as const,
                    },
                  ]),
            ],
          },
        ]
      : []),
    {
      label: t('drawerGroupAccount'),
      items: [
        {
          icon: 'gift-outline',
          isActive: (current) => current === '/provider/rewards',
          label: t('rewards'),
          route: '/provider/rewards' as Href,
        },
        {
          icon: 'notifications-outline',
          isActive: (current) => current === '/provider/account',
          label: t('notifications'),
          route: '/provider/account' as Href,
        },
        {
          icon: 'lock-closed-outline',
          iconColor: colors.navy900,
          isActive: () => securityExpanded,
          keepOpenOnAction: true,
          label: t('accountSecurityTitle'),
          action: () => setSecurityExpanded((current) => !current),
        },
      ],
    },
  ];

  const handleNavigate = (item: DrawerItem) => {
    if (item.action) {
      if (!item.keepOpenOnAction) {
        onClose();
      }
      item.action();
    } else if (item.route) {
      onClose();
      router.push(item.route);
    }
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login' as Href);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={onClose} style={styles.scrim} />
        <Animated.View
          style={[
            styles.animatedDrawer,
            {
              bottom: panelBottomInset,
              top: panelTopInset,
              transform: [{ translateX }],
              width: drawerWidth,
            },
          ]}>
          <SafeAreaView style={[styles.drawer, { paddingBottom: drawerBottomPadding }]}>
            <View style={styles.header}>
              <View style={styles.headerIdentity}>
                <TasklyLogoText compact wordmarkOnly />
                <AppText color={colors.slate500} style={styles.areaLabel} variant="small">
                  {isProOnly ? t('drawerProArea') : t('drawerTaskerArea')}
                </AppText>
              </View>
              <Pressable accessibilityLabel={t('close')} accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                <Ionicons color={colors.navy900} name="close" size={20} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false} style={styles.navScroll}>
              {drawerGroups.map((group) => (
                <View key={group.label} style={styles.group}>
                  <AppText color={colors.slate500} style={styles.groupLabel} variant="small">
                    {group.label}
                  </AppText>
                  <View style={styles.groupItems}>
                    {group.items.map((item) => (
                      <View key={`${group.label}-${item.label}`}>
                        <DrawerNavItem
                          active={item.isActive(pathname)}
                          highlight={item.highlight}
                          icon={item.icon}
                          iconColor={item.iconColor}
                          label={item.label}
                          onPress={() => handleNavigate(item)}
                          tone={item.tone}
                        />
                        {item.label === t('accountSecurityTitle') && securityExpanded ? (
                          <AccountSecurityDrawerPanel
                            email={session?.user?.email ?? ''}
                            errorMessage={securityError}
                            notice={securityNotice}
                            onChangePassword={openPasswordModal}
                          />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable accessibilityRole="button" onPress={handleLogout} style={({ pressed }) => [styles.logoutButton, pressed ? styles.pressed : null]}>
                <View style={styles.logoutIcon}>
                  <Ionicons color={colors.slate500} name="log-out-outline" size={18} />
                </View>
                <AppText color={colors.slate500} style={styles.logoutLabel} variant="bodyStrong">
                  {t('drawerLogout')}
                </AppText>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
      <Modal animationType="slide" onRequestClose={closePasswordModal} transparent visible={showPasswordModal}>
        <KeyboardAvoidingView
          behavior={Platform.select({ android: 'height', ios: 'padding', default: undefined })}
          style={styles.modalRoot}>
          <Pressable
            accessibilityLabel={t('cancel')}
            accessibilityRole="button"
            onPress={closePasswordModal}
            style={styles.modalScrim}
          />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.modalHandle} />
            <AppText variant="sectionTitle">{t('changePassword')}</AppText>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <FormField
                autoCapitalize="none"
                autoComplete="current-password"
                errorText={fieldErrors.currentPassword}
                label={t('currentPassword')}
                onChangeText={(value) => {
                  setDraft((prev) => ({ ...prev, currentPassword: value }));
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
                onChangeText={(value) => {
                  setDraft((prev) => ({ ...prev, newPassword: value }));
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
                onChangeText={(value) => {
                  setDraft((prev) => ({ ...prev, confirmPassword: value }));
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                secureTextEntry
                textContentType="newPassword"
                value={draft.confirmPassword}
              />
              {securityError ? (
                <AppText color={colors.danger600} variant="caption">{securityError}</AppText>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton disabled={isSavingPassword} onPress={closePasswordModal} tone="neutral" variant="outline">
                {t('cancel')}
              </AppButton>
              <AppButton loading={isSavingPassword} onPress={handleSavePassword} style={styles.saveButton} tone="core">
                {t('saveChanges')}
              </AppButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType="slide"
        onRequestClose={closeProApplyConfirm}
        statusBarTranslucent
        transparent
        visible={showProApplyConfirm}>
        <View style={styles.proConfirmRoot}>
          <Pressable
            accessibilityLabel={t('cancel')}
            accessibilityRole="button"
            onPress={closeProApplyConfirm}
            style={styles.modalScrim}
          />
          <View style={styles.proConfirmSafeArea}>
            <View style={[styles.modalSheet, styles.proConfirmSheet, { maxHeight: proConfirmMaxHeight, paddingBottom: proConfirmBottomPadding }]}>
              <ScrollView
                bounces={false}
                contentContainerStyle={styles.proConfirmScrollContent}
                showsVerticalScrollIndicator={false}
                style={styles.proConfirmScroll}>
                <View style={styles.modalHandle} />
                <View style={styles.proConfirmIcon}>
                  <Ionicons color="#EA580C" name="ribbon-outline" size={24} />
                </View>
                <View style={styles.proConfirmCopy}>
                  <AppText color={colors.navy900} variant="sectionTitle">{t('applyForTasklyProConfirmTitle')}</AppText>
                  <AppText color={colors.slate700} style={styles.proConfirmBody}>{t('applyForTasklyProConfirmBody')}</AppText>
                </View>
              </ScrollView>
              <View style={styles.proConfirmActions}>
                <AppButton loading={isOpeningProRegister} onPress={handleContinueProApplication} tone="pro">
                  {t('continueAction')}
                </AppButton>
                <AppButton disabled={isOpeningProRegister} onPress={closeProApplyConfirm} tone="neutral" variant="outline">
                  {t('cancel')}
                </AppButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function AccountSecurityDrawerPanel({
  email,
  errorMessage,
  notice,
  onChangePassword,
}: {
  email: string;
  errorMessage: string | null;
  notice: string | null;
  onChangePassword: () => void;
}) {
  return (
    <View style={styles.securityPanel}>
      <View style={styles.securityField}>
        <AppText color={colors.slate500} variant="small">{t('loginEmail')}</AppText>
        <AppText color={colors.navy900} numberOfLines={1} style={styles.securityEmail} variant="bodyStrong">
          {email}
        </AppText>
      </View>
      <AppText color={colors.slate500} variant="caption">{t('contactSupportEmailChange')}</AppText>
      <AppButton onPress={onChangePassword} style={styles.securityButton} tone="core" variant="outline">
        {t('changePassword')}
      </AppButton>
      {notice ? <AppText color={colors.success600} variant="caption">{notice}</AppText> : null}
      {errorMessage ? <AppText color={colors.danger600} variant="caption">{errorMessage}</AppText> : null}
    </View>
  );
}

function DrawerNavItem({
  active,
  highlight = false,
  icon,
  iconColor: fixedIconColor,
  label,
  onPress,
  tone = 'taskly',
}: {
  active: boolean;
  highlight?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  onPress: () => void;
  tone?: 'taskly' | 'pro';
}) {
  const isPro = tone === 'pro';
  const accent = isPro ? colors.proOrange500 : colors.tasklyBlue600;
  const iconColor = fixedIconColor ?? (highlight ? '#EA580C' : active ? (isPro ? colors.proOrangeText : colors.tasklyBlue700) : colors.slate500);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        highlight ? styles.itemProHighlight : null,
        active ? (isPro ? styles.itemActivePro : styles.itemActiveTaskly) : null,
        pressed && !active ? styles.itemPressed : null,
      ]}>
      {active ? <View style={[styles.activeBar, { backgroundColor: accent }]} /> : null}
      <View style={[styles.itemIcon, highlight ? styles.itemIconProHighlight : isPro ? styles.itemIconAccent : active ? styles.itemIconActiveTaskly : null]}>
        <Ionicons color={iconColor} name={icon} size={18} />
      </View>
      <AppText color={highlight ? '#EA580C' : active ? colors.navy900 : colors.slate500} style={styles.itemText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeBar: {
    borderBottomRightRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    bottom: 8,
    left: 0,
    position: 'absolute',
    top: 8,
    width: 4,
  },
  animatedDrawer: {
    borderBottomRightRadius: 28,
    borderTopRightRadius: 28,
    elevation: 12,
    left: 0,
    position: 'absolute',
    shadowColor: colors.navy900,
    shadowOffset: { height: 0, width: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    zIndex: 1,
  },
  areaLabel: {
    letterSpacing: 0,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  drawer: {
    backgroundColor: colors.white,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderColor: colors.border,
    borderRightWidth: 1,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    flex: 1,
    gap: spacing.sm,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    paddingTop: spacing.sm,
  },
  group: {
    gap: spacing.xs,
  },
  groupItems: {
    gap: spacing.sm,
  },
  groupLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
    lineHeight: 14,
    paddingHorizontal: spacing.sm,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  headerIdentity: {
    gap: spacing.xs,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    position: 'relative',
  },
  itemActivePro: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderWidth: 1,
    ...designTokens.shadows.card,
  },
  itemActiveTaskly: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderWidth: 1,
    ...designTokens.shadows.card,
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: designTokens.size.drawerIcon,
    justifyContent: 'center',
    width: designTokens.size.drawerIcon,
  },
  itemIconAccent: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  itemIconActiveTaskly: {
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
  },
  itemIconProHighlight: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  itemPressed: {
    backgroundColor: colors.tasklyBlue50,
    transform: [{ scale: 0.985 }],
  },
  itemProHighlight: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderWidth: 1,
    ...designTokens.shadows.card,
  },
  itemText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  logoutIcon: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: designTokens.size.drawerIcon,
    justifyContent: 'center',
    width: designTokens.size.drawerIcon,
  },
  logoutLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
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
    elevation: 18,
    gap: spacing.md,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    shadowColor: colors.navy900,
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  proConfirmActions: {
    flexShrink: 0,
    gap: spacing.sm,
  },
  proConfirmBody: {
    lineHeight: 22,
  },
  proConfirmCopy: {
    gap: spacing.xs,
  },
  proConfirmIcon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  proConfirmRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  proConfirmScroll: {
    flexShrink: 1,
  },
  proConfirmScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  proConfirmSafeArea: {
    justifyContent: 'flex-end',
  },
  proConfirmSheet: {
    gap: spacing.md,
  },
  navContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  navScroll: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(8, 12, 20, 0.18)',
    flex: 1,
  },
  pressed: {
    opacity: 0.86,
  },
  saveButton: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  securityButton: {
    alignSelf: 'flex-start',
  },
  securityEmail: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  securityField: {
    gap: 2,
  },
  securityPanel: {
    backgroundColor: colors.slate50,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
});
