import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

import { AppText } from '../ui';
import { LanguageToggle } from './LanguageToggle';
import { TasklyLogoText } from './TasklyLogoText';

type CustomerDrawerProps = {
  onClose: () => void;
  visible: boolean;
};

type DrawerItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: Href;
};

export function CustomerDrawer({ onClose, visible }: CustomerDrawerProps) {
  useI18n();
  const router = useRouter();
  const { logout } = useAuth();
  const drawerItems: DrawerItem[] = [
    { icon: 'home-outline', label: t('drawerHome'), route: '/customer/home' as Href },
    { icon: 'list-outline', label: t('drawerMyTasklyTasks'), route: '/customer/tasks' as Href },
    { icon: 'sparkles-outline', label: t('drawerMyTasklyProProjects'), route: '/customer/pro-requests' as Href },
    { icon: 'add-circle-outline', label: t('drawerPostTasklyTask'), route: '/customer/post-task' as Href },
    { icon: 'color-wand-outline', label: t('drawerStartTasklyProProject'), route: '/customer/post-pro-request' as Href },
    { icon: 'chatbubbles-outline', label: t('drawerChat'), route: '/customer/messages' as Href },
    { icon: 'mail-outline', label: t('drawerSupportMessages'), route: '/customer/messages' as Href },
    { icon: 'person-outline', label: t('drawerProfile'), route: '/customer/account' as Href },
    { icon: 'settings-outline', label: t('drawerSettings'), route: '/customer/account' as Href },
  ];

  const handleNavigate = (route: Href) => {
    onClose();
    router.push(route);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login' as Href);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.scrim} />
        <View style={styles.drawer}>
          <View style={styles.header}>
            <TasklyLogoText compact wordmarkOnly />
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons color={colors.slate700} name="close" size={20} />
            </Pressable>
          </View>

          <View style={styles.items}>
            {drawerItems.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={`${item.label}-${item.icon}`}
                onPress={() => item.route && handleNavigate(item.route)}
                style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}>
                <Ionicons color={colors.tasklyBlue600} name={item.icon} size={18} />
                <AppText style={styles.itemText}>{item.label}</AppText>
              </Pressable>
            ))}
          </View>

          <View style={styles.languageRow}>
            <AppText color={colors.slate700} variant="small">
              {t('drawerLanguage')}
            </AppText>
            <LanguageToggle />
          </View>

          <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons color={colors.danger600} name="log-out-outline" size={18} />
            <AppText color={colors.danger600} variant="bodyStrong">
              {t('drawerLogout')}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  drawer: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: radius.lg,
    borderTopLeftRadius: radius.lg,
    elevation: 12,
    gap: spacing.lg,
    height: '100%',
    padding: spacing.lg,
    shadowColor: colors.navy900,
    shadowOffset: { height: 0, width: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    width: '84%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  itemText: {
    color: colors.navy900,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  items: {
    gap: spacing.xs,
  },
  languageRow: {
    alignItems: 'center',
    backgroundColor: colors.slate50,
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  logoutButton: {
    alignItems: 'center',
    borderColor: colors.slate100,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  overlay: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pressed: {
    backgroundColor: colors.tasklyBlue50,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
});
