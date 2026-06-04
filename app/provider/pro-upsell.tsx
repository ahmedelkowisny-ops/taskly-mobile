import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { useAuth } from '@/src/lib/auth/useAuth';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { radius, spacing } from '@/src/theme/spacing';

const PRO_CATEGORIES = [
  'proCategoryBathroomRenovation',
  'proCategoryKitchenProjects',
  'proCategoryElectrical',
  'proCategoryPainting',
  'proCategoryTiling',
  'proCategoryRoofing',
  'proCategoryHVAC',
  'proCategoryWindowsDoors',
  'proCategoryFullRenovation',
] as const;

export default function ProUpsellScreen() {
  useI18n();
  const router = useRouter();
  const { logout, status } = useAuth();

  async function handleApplyPress() {
    try {
      if (status === 'authenticated' || status === 'demo') {
        await logout();
      }
    } finally {
      router.replace('/register/pro' as Href);
    }
  }

  return (
    <Screen>
      <ProviderTopBar />

      <View style={styles.iconContainer}>
        <View style={styles.iconBox}>
          <Ionicons color={colors.proOrange600} name="ribbon-outline" size={48} />
        </View>
      </View>

      <View style={styles.headingBlock}>
        <AppText style={styles.title} variant="screenTitle">
          {t('proUpsellTitle')}
        </AppText>
        <AppText color={colors.slate700} style={styles.subtitle}>
          {t('proUpsellSubtitle')}
        </AppText>
      </View>

      <View style={styles.categoriesBlock}>
        <AppText color={colors.slate700} variant="sectionTitle">
          {t('proUpsellProjectsLabel')}
        </AppText>
        <View style={styles.chipsRow}>
          {PRO_CATEGORIES.map((key) => (
            <View key={key} style={styles.chip}>
              <AppText style={styles.chipText}>{t(key)}</AppText>
            </View>
          ))}
        </View>
      </View>

      <AppText color={colors.slate700} style={styles.trustLine}>
        {t('proUpsellTrustLine')}
      </AppText>

      <View style={styles.ctaBlock}>
        <AppButton onPress={handleApplyPress} tone="pro">
          {t('applyForTasklyPro')}
        </AppButton>
        <Pressable
          accessibilityRole="button"
          onPress={() => WebBrowser.openBrowserAsync('https://tasklyco.com')}
          style={styles.learnMoreLink}>
          <AppText color={colors.slate500} variant="small">{t('proUpsellLearnMore')}</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  categoriesBlock: {
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.proOrangeTextDark,
    fontSize: 13,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  learnMoreLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  ctaBlock: {
    gap: spacing.sm,
  },
  headingBlock: {
    gap: spacing.xs,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.proOrange50,
    borderRadius: radius.lg,
    justifyContent: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
  },
  subtitle: {
    lineHeight: 22,
  },
  title: {
    textAlign: 'center',
  },
  trustLine: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
