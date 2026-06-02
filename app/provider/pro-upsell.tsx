import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { ProviderTopBar } from '@/src/components/taskly';
import { AppButton, AppText, Screen } from '@/src/components/ui';
import { t } from '@/src/lib/i18n';
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
  const router = useRouter();

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
        <AppButton onPress={() => router.push('/provider/start')} tone="pro">
          {t('applyForTasklyPro')}
        </AppButton>
        <AppButton
          labelColor={colors.slate500}
          onPress={() => WebBrowser.openBrowserAsync('https://tasklyco.com')}
          variant="ghost">
          {t('proUpsellLearnMore')}
        </AppButton>
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
    gap: spacing.xs,
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
