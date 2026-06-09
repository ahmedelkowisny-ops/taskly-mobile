import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { CustomerTopBar } from '@/src/components/taskly';
import { AppButton, AppCard, AppText, Screen, StatusBadge } from '@/src/components/ui';
import { t, useI18n } from '@/src/lib/i18n';
import { colors } from '@/src/theme/colors';
import { designTokens } from '@/src/theme/designTokens';
import { radius, spacing } from '@/src/theme/spacing';

const LEGAL_LINKS = {
  legal: 'https://tasklyco.com/legal',
  privacy: 'https://tasklyco.com/privacy',
  terms: 'https://tasklyco.com/terms',
} as const;

type LegalLinkKey = keyof typeof LEGAL_LINKS;

export default function CustomerHelpScreen() {
  useI18n();
  const router = useRouter();
  const [linkError, setLinkError] = useState<string | null>(null);

  const openLegalLink = async (key: LegalLinkKey) => {
    const url = LEGAL_LINKS[key];
    setLinkError(null);

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        setLinkError(t('couldNotOpenLink'));
        return;
      }

      await Linking.openURL(url);
    } catch {
      setLinkError(t('couldNotOpenLink'));
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <CustomerTopBar />

      <AppCard accentColor={colors.tasklyBlue600} style={styles.heroCard}>
        <StatusBadge label="Taskly" tone="core" />
        <AppText style={styles.title} variant="screenTitle">
          {t('helpLegalTitle')}
        </AppText>
        <AppText color={colors.slate700}>{t('helpLegalIntro')}</AppText>
      </AppCard>

      {linkError ? (
        <AppCard accentColor={colors.warning600} style={styles.errorCard}>
          <AppText color={colors.warning600} variant="bodyStrong">
            {linkError}
          </AppText>
        </AppCard>
      ) : null}

      <HelpSection
        accentColor={colors.tasklyBlue600}
        body={t('helpSupportBody')}
        icon="help-circle-outline"
        title={t('getHelpWithTaskly')}>
        <View style={styles.actionRow}>
          <AppButton onPress={() => router.push('/customer/support' as Href)} style={styles.actionButton}>
            {t('openSupport')}
          </AppButton>
          <AppButton
            onPress={() => router.push('/customer/messages?context=support' as Href)}
            style={styles.actionButton}
            tone="neutral"
            variant="outline">
            {t('viewSupportConversations')}
          </AppButton>
        </View>
      </HelpSection>

      <HelpSection
        accentColor={colors.tasklyBlue600}
        body={t('paymentCancellationHelpHubBody')}
        icon="card-outline"
        title={t('paymentsAndCancellations')}>
        <InfoList
          items={[
            t('paymentProtectedHelpBody'),
            t('cancellationHelpBody'),
            t('refundHelpPathBody'),
          ]}
        />
      </HelpSection>

      <HelpSection
        accentColor={colors.proOrange600}
        body={t('tasklyProHelpBody')}
        icon="sparkles-outline"
        title={t('tasklyProHelp')}
        tone="pro">
        <InfoList
          items={[
            t('proAccessHelpBody'),
            t('approvedProsCompareHelpBody'),
            t('proAgreementOutsideTasklyHelpBody'),
          ]}
        />
      </HelpSection>

      <HelpSection
        accentColor={colors.tasklyBlue600}
        body={t('rewardsHelpBody')}
        icon="gift-outline"
        title={t('rewardsAndReferrals')}>
        <AppButton onPress={() => router.push('/customer/rewards' as Href)} variant="outline">
          {t('openRewards')}
        </AppButton>
      </HelpSection>

      <HelpSection
        accentColor={colors.navy900}
        body={t('legalInformationBody')}
        icon="document-text-outline"
        title={t('legalInformation')}>
        <View style={styles.legalLinks}>
          <LegalLink label={t('termsOfService')} onPress={() => void openLegalLink('terms')} url={LEGAL_LINKS.terms} />
          <LegalLink label={t('privacyPolicy')} onPress={() => void openLegalLink('privacy')} url={LEGAL_LINKS.privacy} />
          <LegalLink label={t('legalInformation')} onPress={() => void openLegalLink('legal')} url={LEGAL_LINKS.legal} />
        </View>
      </HelpSection>
    </Screen>
  );
}

function HelpSection({
  accentColor,
  body,
  children,
  icon,
  title,
  tone = 'core',
}: {
  accentColor: string;
  body: string;
  children?: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone?: 'core' | 'pro' | 'neutral';
}) {
  const iconColor = tone === 'pro' ? colors.proOrange600 : tone === 'neutral' ? colors.navy900 : colors.tasklyBlue600;

  return (
    <AppCard accentColor={accentColor} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconBox, tone === 'pro' ? styles.proIconBox : null]}>
          <Ionicons color={iconColor} name={icon} size={20} />
        </View>
        <View style={styles.sectionTitleWrap}>
          <AppText variant="cardTitle">{title}</AppText>
          <AppText color={colors.slate700}>{body}</AppText>
        </View>
      </View>
      {children}
    </AppCard>
  );
}

function InfoList({ items }: { items: string[] }) {
  return (
    <View style={styles.infoList}>
      {items.map((item) => (
        <View key={item} style={styles.infoRow}>
          <View style={styles.bullet} />
          <AppText color={colors.slate700} style={styles.infoText}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function LegalLink({ label, onPress, url }: { label: string; onPress: () => void; url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.legalLink, pressed ? styles.pressed : null]}>
      <View style={styles.legalText}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText color={colors.slate500} variant="small">
          {url.replace('https://', '')}
        </AppText>
      </View>
      <Ionicons color={colors.slate500} name="open-outline" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    minWidth: 150,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bullet: {
    backgroundColor: colors.tasklyBlue600,
    borderRadius: radius.pill,
    height: 7,
    marginTop: 7,
    width: 7,
  },
  content: {
    backgroundColor: colors.slate50,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl + 96,
    paddingTop: spacing.lg,
  },
  errorCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  heroCard: {
    backgroundColor: colors.white,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#1877F2',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.tasklyBlue50,
    borderColor: colors.tasklyBlueBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoRow: {
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  legalLink: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 64,
    padding: spacing.md,
  },
  legalLinks: {
    gap: spacing.sm,
  },
  legalText: {
    flex: 1,
    gap: 3,
  },
  pressed: {
    opacity: 0.86,
  },
  proIconBox: {
    backgroundColor: colors.proOrange50,
    borderColor: colors.proOrangeBorder,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...designTokens.shadows.card,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.navy900,
    fontSize: 28,
    lineHeight: 34,
  },
});
