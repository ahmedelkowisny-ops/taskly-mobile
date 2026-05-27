import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { LanguageToggle, TasklyLogoText } from '@/src/components/taskly';
import { AppText, Screen } from '@/src/components/ui';
import { canAccessCustomerWorkspace, canAccessProviderWorkspace } from '@/src/lib/auth/workspaceAccess';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

type EntryMode = 'login' | 'register';
type RoleId = 'customer' | 'tasker' | 'proTasker';
type CardTone = 'taskly' | 'pro';

type RoleOption = {
  accent: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: RoleId;
  title: string;
};

type ServiceChip = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

type PathCard = {
  body: string;
  chips: ServiceChip[];
  cta: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  title: string;
  tone: CardTone;
};

const CUSTOMER_HOME_ROUTE = '/customer/home' as Href;
const PROVIDER_DASHBOARD_ROUTE = '/provider/dashboard' as Href;
const PROVIDER_START_ROUTE = '/provider/start' as Href;

const toneStyles = {
  pro: {
    accent: colors.proAmber500,
    background: colors.proOrange50,
    border: '#F3D6AF',
    chipBorder: '#FCD9A8',
    chipIcon: '#B45309',
    cta: colors.proAmber500,
    muted: '#92400E',
  },
  taskly: {
    accent: colors.tasklyBlue600,
    background: '#F8FBFF',
    border: '#D7E7FF',
    chipBorder: '#BFDBFE',
    chipIcon: colors.tasklyBlue700,
    cta: colors.tasklyBlue600,
    muted: colors.tasklyBlue700,
  },
} as const;

export default function WelcomeScreen() {
  useI18n();
  const router = useRouter();
  const { session, status } = useAuth();
  const [mode, setMode] = useState<EntryMode>('login');
  const [menuOpen, setMenuOpen] = useState(false);
  const loginOptions = getLoginOptions();
  const registerOptions = getRegisterOptions();
  const options = mode === 'login' ? loginOptions : registerOptions;
  const pathCards = getPathCards({
    postProRequest: () => openRole('customer'),
    postTask: () => openRole('customer'),
  });

  function openRole(role: RoleId) {
    setMenuOpen(false);

    if (mode === 'register') {
      router.push(`/login?role=${role}&intent=register` as Href);
      return;
    }

    if (role === 'customer' && (status === 'demo' || canAccessCustomerWorkspace(session))) {
      router.push(CUSTOMER_HOME_ROUTE);
      return;
    }

    if ((role === 'tasker' || role === 'proTasker') && (status === 'demo' || canAccessProviderWorkspace(session))) {
      router.push(status === 'demo' || session?.nextAction.type === 'none' ? PROVIDER_DASHBOARD_ROUTE : PROVIDER_START_ROUTE);
      return;
    }

    router.push(`/login?role=${role}&intent=login` as Href);
  }

  function showRegisterChoices() {
    setMode('register');
    setMenuOpen(false);
  }

  return (
    <Screen contentStyle={styles.content} style={styles.screen}>
      <View style={styles.header}>
        <TasklyLogoText compact wordmarkOnly />
        <View style={styles.headerActions}>
          <LanguageToggle />
          <Pressable
            accessibilityLabel={menuOpen ? t('closeMenu') : t('menu')}
            accessibilityRole="button"
            onPress={() => setMenuOpen((value) => !value)}
            style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}>
            <Ionicons color={colors.navy900} name={menuOpen ? 'close' : 'menu'} size={21} />
          </Pressable>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.brandPills}>
          <View style={styles.brandPill}>
            <View style={[styles.brandDot, { backgroundColor: colors.tasklyBlue600 }]} />
            <AppText variant="small">Taskly</AppText>
          </View>
          <View style={[styles.brandPill, styles.proBrandPill]}>
            <View style={[styles.brandDot, { backgroundColor: colors.proAmber500 }]} />
            <AppText color="#92400E" variant="small">
              Taskly Pro
            </AppText>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <AppText style={styles.heroTitle} variant="title">
            {t('entryWebHeadline')}
          </AppText>
          <AppText color={colors.slate700} style={styles.heroSubtitle}>
            {t('entryWebSubtitle')}
          </AppText>
        </View>

        <View style={styles.pathCards}>
          {pathCards.map((card) => (
            <PathChoiceCard card={card} key={card.title} />
          ))}
        </View>

        <View style={styles.trustRow}>
          <TrustChip icon="shield-checkmark-outline" label={t('paymentProtectedChip')} tone="taskly" />
          <TrustChip icon="star-outline" label={t('approvedProsChip')} tone="pro" />
          <TrustChip icon="location-outline" label={t('localHelpChip')} tone="neutral" />
        </View>
      </View>

      <View style={styles.rolePanel}>
        <View style={styles.panelHeader}>
          <AppText style={styles.panelTitle} variant="screenTitle">
            {mode === 'login' ? t('entryPanelTitle') : t('registerPanelTitle')}
          </AppText>
          <AppText color={colors.slate700} style={styles.panelSubtitle}>
            {mode === 'login' ? t('entryPanelSubtitle') : t('registerPanelSubtitle')}
          </AppText>
        </View>

        <View style={styles.roleList}>
          {options.map((option) => (
            <RoleChoiceCard
              key={option.id}
              option={option}
              onPress={() => {
                openRole(option.id);
              }}
            />
          ))}
        </View>

        <View style={styles.switchLine}>
          <AppText color={colors.slate500} variant="caption">
            {mode === 'login' ? t('newToTaskly') : t('alreadyHaveAccount')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            style={({ pressed }) => [styles.linkButton, pressed ? styles.pressed : null]}>
            <AppText color={colors.tasklyBlue600} variant="bodyStrong">
              {mode === 'login' ? t('createAccount') : t('signIn')}
            </AppText>
          </Pressable>
        </View>
      </View>

      <EntryMenu
        loginOptions={loginOptions}
        onClose={() => setMenuOpen(false)}
        onRegisterPress={showRegisterChoices}
        onRolePress={openRole}
        visible={menuOpen}
      />
    </Screen>
  );
}

function getLoginOptions(): RoleOption[] {
  return [
    {
      accent: colors.tasklyBlue600,
      body: t('loginCustomerHelper'),
      icon: 'home-outline',
      id: 'customer',
      title: t('continueAsCustomerLogin'),
    },
    {
      accent: colors.tasklyBlue600,
      body: t('loginTaskerHelper'),
      icon: 'hammer-outline',
      id: 'tasker',
      title: t('continueAsTasker'),
    },
    {
      accent: colors.proOrange600,
      body: t('loginProTaskerHelper'),
      icon: 'ribbon-outline',
      id: 'proTasker',
      title: t('continueAsProTasker'),
    },
  ];
}

function getRegisterOptions(): RoleOption[] {
  return [
    {
      accent: colors.tasklyBlue600,
      body: t('registerCustomerHelper'),
      icon: 'person-add-outline',
      id: 'customer',
      title: t('createCustomerAccount'),
    },
    {
      accent: colors.tasklyBlue600,
      body: t('registerTaskerHelper'),
      icon: 'construct-outline',
      id: 'tasker',
      title: t('registerAsTasker'),
    },
    {
      accent: colors.proOrange600,
      body: t('registerProTaskerHelper'),
      icon: 'medal-outline',
      id: 'proTasker',
      title: t('applyAsProTasker'),
    },
  ];
}

function getPathCards(actions: { postProRequest: () => void; postTask: () => void }): PathCard[] {
  return [
    {
      body: t('tasklyCardHelper'),
      chips: [
        { icon: 'tv-outline', label: t('mountTv') },
        { icon: 'cube-outline', label: t('furniture') },
        { icon: 'water-outline', label: t('fixSink') },
        { icon: 'hammer-outline', label: t('smallRepairs') },
      ],
      cta: t('postTaskShort'),
      icon: 'clipboard-outline',
      onPress: actions.postTask,
      title: 'Taskly',
      tone: 'taskly',
    },
    {
      body: t('tasklyProCardHelper'),
      chips: [
        { icon: 'water-outline', label: t('bathroom') },
        { icon: 'flash-outline', label: t('electrical') },
        { icon: 'restaurant-outline', label: t('kitchen') },
        { icon: 'ribbon-outline', label: t('renovation') },
      ],
      cta: t('postProRequestShort'),
      icon: 'ribbon-outline',
      onPress: actions.postProRequest,
      title: 'Taskly Pro',
      tone: 'pro',
    },
  ];
}

function PathChoiceCard({ card }: { card: PathCard }) {
  const tone = toneStyles[card.tone];

  return (
    <View style={[styles.pathCard, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <Pressable
        accessibilityRole="button"
        onPress={card.onPress}
        style={({ pressed }) => [
          styles.pathCta,
          { backgroundColor: tone.cta },
          pressed ? styles.pressed : null,
        ]}>
        <Ionicons color={colors.white} name={card.icon} size={17} />
        <AppText color={colors.white} style={styles.pathCtaText} variant="bodyStrong">
          {card.cta}
        </AppText>
      </Pressable>
      <AppText color={tone.muted} style={styles.pathHelper} variant="caption">
        {card.body}
      </AppText>
      <AppText color={tone.muted} style={styles.pathLabel} variant="small">
        {card.title}
      </AppText>
      <View style={styles.serviceChips}>
        {card.chips.map((chip) => (
          <View key={chip.label} style={[styles.serviceChip, { borderColor: tone.chipBorder }]}>
            <Ionicons color={tone.chipIcon} name={chip.icon} size={13} />
            <AppText style={styles.serviceChipText} variant="small">
              {chip.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function TrustChip({
  icon,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: CardTone | 'neutral';
}) {
  const color = tone === 'pro' ? '#B45309' : tone === 'taskly' ? colors.tasklyBlue700 : colors.slate700;
  const border = tone === 'pro' ? '#FDE6BF' : tone === 'taskly' ? '#DBEAFE' : colors.slate100;
  const background = tone === 'pro' ? colors.proOrange50 : tone === 'taskly' ? colors.tasklyBlue50 : colors.white;

  return (
    <View style={[styles.trustChip, { backgroundColor: background, borderColor: border }]}>
      <Ionicons color={color} name={icon} size={13} />
      <AppText color={colors.slate700} style={styles.trustChipText} variant="small">
        {label}
      </AppText>
    </View>
  );
}

function RoleChoiceCard({ option, onPress }: { option: RoleOption; onPress: () => void }) {
  const isPro = option.id === 'proTasker';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleCard,
        {
          backgroundColor: isPro ? colors.proOrange50 : colors.white,
          borderColor: pressed ? option.accent : isPro ? '#F3D6AF' : colors.slate100,
        },
        pressed ? styles.pressed : null,
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: isPro ? colors.white : colors.tasklyBlue50 }]}>
        <Ionicons color={option.accent} name={option.icon} size={19} />
      </View>
      <View style={styles.roleCopy}>
        <AppText style={styles.roleTitle} variant="bodyStrong">
          {option.title}
        </AppText>
        <AppText color={colors.slate700} style={styles.roleBody} variant="caption">
          {option.body}
        </AppText>
      </View>
      <Ionicons color={colors.slate500} name="chevron-forward" size={17} />
    </Pressable>
  );
}

function EntryMenu({
  loginOptions,
  onClose,
  onRegisterPress,
  onRolePress,
  visible,
}: {
  loginOptions: RoleOption[];
  onClose: () => void;
  onRegisterPress: () => void;
  onRolePress: (role: RoleId) => void;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.menuLayer}>
        <Pressable accessibilityLabel={t('closeMenu')} onPress={onClose} style={styles.menuOverlay} />
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <TasklyLogoText compact wordmarkOnly />
            <Pressable accessibilityLabel={t('closeMenu')} accessibilityRole="button" onPress={onClose} style={styles.drawerClose}>
              <Ionicons color={colors.navy900} name="close" size={20} />
            </Pressable>
          </View>
          <View style={styles.drawerList}>
            {loginOptions.map((option) => (
              <Pressable
                accessibilityRole="button"
                key={option.id}
                onPress={() => onRolePress(option.id)}
                style={({ pressed }) => [styles.drawerItem, pressed ? styles.pressed : null]}>
                <View style={styles.drawerIcon}>
                  <Ionicons color={option.accent} name={option.icon} size={16} />
                </View>
                <AppText style={styles.drawerLabel} variant="bodyStrong">
                  {option.title}
                </AppText>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={onRegisterPress}
              style={({ pressed }) => [styles.drawerItem, styles.drawerRegister, pressed ? styles.pressed : null]}>
              <View style={styles.drawerIcon}>
                <Ionicons color={colors.tasklyBlue600} name="person-add-outline" size={16} />
              </View>
              <AppText color={colors.tasklyBlue600} style={styles.drawerLabel} variant="bodyStrong">
                {t('createAccount')}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  brandDot: {
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  brandPill: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  brandPills: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  drawer: {
    backgroundColor: '#FFFCF8',
    borderBottomRightRadius: 24,
    borderColor: '#E8DDD0',
    borderRightWidth: 1,
    borderTopRightRadius: 24,
    bottom: 0,
    left: 0,
    padding: spacing.lg,
    position: 'absolute',
    top: 0,
    width: '84%',
    maxWidth: 340,
    shadowColor: colors.navy900,
    shadowOffset: { height: 0, width: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  drawerClose: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E8DDD0',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  drawerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  drawerIcon: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E8DDD0',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  drawerItem: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  drawerLabel: {
    flex: 1,
    fontSize: 14,
  },
  drawerList: {
    gap: spacing.sm,
  },
  drawerRegister: {
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E5E7EB',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing.md,
    shadowColor: colors.navy900,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderColor: '#E5E7EB',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  heroTitle: {
    color: colors.navy900,
    fontSize: 30,
    lineHeight: 36,
  },
  iconCircle: {
    alignItems: 'center',
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  linkButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#E5E7EB',
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  menuLayer: {
    flex: 1,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 20, 0.22)',
  },
  panelHeader: {
    gap: spacing.xs,
  },
  panelSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  panelTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  pathCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  pathCards: {
    gap: spacing.md,
  },
  pathCta: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  pathCtaText: {
    flexShrink: 1,
    textAlign: 'center',
  },
  pathHelper: {
    textAlign: 'center',
  },
  pathLabel: {
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  proBrandPill: {
    backgroundColor: colors.proOrange50,
    borderColor: '#F3D6AF',
  },
  roleBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  roleCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 66,
    padding: spacing.sm,
    paddingRight: spacing.md,
  },
  roleCopy: {
    flex: 1,
    gap: 2,
  },
  roleList: {
    gap: spacing.sm,
  },
  rolePanel: {
    backgroundColor: colors.white,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  roleTitle: {
    fontSize: 16,
    lineHeight: 21,
  },
  screen: {
    backgroundColor: '#FCFDFF',
  },
  serviceChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  serviceChipText: {
    color: '#1F2A33',
    fontSize: 11,
  },
  serviceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  switchLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  trustChip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  trustChipText: {
    fontSize: 11,
    lineHeight: 15,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
