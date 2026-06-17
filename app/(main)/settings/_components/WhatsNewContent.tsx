import { useState } from 'react';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/Card';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { APP_VERSION } from '@/constants/version';
import type {
  WhatsNewCategory,
  WhatsNewItem,
  WhatsNewRelease,
} from '@/constants/whatsNew';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

interface WhatsNewContentProps {
  variant: 'full' | 'modal';
  releases: WhatsNewRelease[];
}

function getCategoryColors(
  category: WhatsNewCategory,
  theme: ReturnType<typeof useTheme>,
): { backgroundColor: string } {
  switch (category) {
    case 'added':
      return { backgroundColor: theme.badgeSuccess };
    case 'improved':
      return { backgroundColor: theme.badgeInfo };
    case 'fixed':
      return { backgroundColor: theme.badgeWarning };
  }
}

function formatReleaseDate(
  date: string,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  return t('whatsNew.dateFormat', { date });
}

function WhatsNewItemRow({
  item,
  compact,
}: {
  item: WhatsNewItem;
  compact: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const categoryColors = getCategoryColors(item.category, theme);
  const iconSize = compact ? 18 : 20;
  const iconContainerSize = compact ? 36 : 40;

  return (
    <HStack className="gap-3 items-start">
      <View
        className="rounded-full items-center justify-center"
        style={{
          width: iconContainerSize,
          height: iconContainerSize,
          backgroundColor: theme.avatarPrimary,
        }}
      >
        <Ionicons
          name={item.icon}
          size={iconSize}
          color={theme.textPrimary}
        />
      </View>
      <VStack className="flex-1 gap-1">
        <HStack className="items-center gap-2 flex-wrap">
          <View
            className="rounded-full px-2 py-0.5"
            style={categoryColors}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: theme.textPrimary }}
            >
              {t(`whatsNew.category.${item.category}`)}
            </Text>
          </View>
        </HStack>
        <Text
          className={compact ? 'text-sm font-semibold' : 'text-base font-semibold'}
          style={{ color: theme.textPrimary }}
        >
          {t(item.titleKey)}
        </Text>
        <Text
          className={compact ? 'text-xs leading-5' : 'text-sm leading-6'}
          style={{ color: theme.textSecondary }}
        >
          {t(item.descriptionKey)}
        </Text>
      </VStack>
    </HStack>
  );
}

function ReleaseItems({
  items,
  compact,
}: {
  items: WhatsNewItem[];
  compact: boolean;
}) {
  return (
    <VStack className={compact ? 'gap-4' : 'gap-5'}>
      {items.map((item) => (
        <WhatsNewItemRow key={item.id} item={item} compact={compact} />
      ))}
    </VStack>
  );
}

function ReleaseHeader({
  release,
  showVersionLabel,
}: {
  release: WhatsNewRelease;
  showVersionLabel?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <VStack className="gap-1">
      {showVersionLabel ? (
        <Text
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.textTertiary }}
        >
          {t('whatsNew.currentVersion')}
        </Text>
      ) : null}
      <Text
        className="text-lg font-bold"
        style={{ color: theme.textPrimary }}
      >
        v{release.version}
      </Text>
      <Text className="text-sm" style={{ color: theme.textSecondary }}>
        {formatReleaseDate(release.date, t)}
      </Text>
    </VStack>
  );
}

export function WhatsNewContent({ variant, releases }: WhatsNewContentProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const compact = variant === 'modal';
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>(
    {},
  );

  if (releases.length === 0) {
    return (
      <Box className="py-8 items-center">
        <Text className="text-sm text-center" style={{ color: theme.textSecondary }}>
          {t('whatsNew.empty')}
        </Text>
      </Box>
    );
  }

  if (variant === 'modal') {
    return (
      <VStack className="gap-5">
        {releases.map((release) => (
          <VStack key={release.version} className="gap-3">
            <ReleaseHeader release={release} />
            <ReleaseItems items={release.items} compact={compact} />
          </VStack>
        ))}
      </VStack>
    );
  }

  const currentRelease = releases.find((release) => release.version === APP_VERSION);
  const olderReleases = releases.filter(
    (release) => release.version !== APP_VERSION,
  );

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  return (
    <VStack className="gap-6">
      {currentRelease ? (
        <VStack className="gap-3">
          <Card padding="lg">
            <VStack className="gap-5">
              <ReleaseHeader release={currentRelease} showVersionLabel />
              <ReleaseItems items={currentRelease.items} compact={compact} />
            </VStack>
          </Card>
        </VStack>
      ) : null}

      {olderReleases.length > 0 ? (
        <VStack className="gap-3">
          <Text
            className="text-sm font-medium uppercase tracking-wider px-1"
            style={{ color: theme.textTertiary }}
          >
            {t('whatsNew.olderVersions')}
          </Text>
          <VStack className="gap-2">
            {olderReleases.map((release) => {
              const collapsed = !expandedVersions[release.version];
              const sectionTitle = `v${release.version} · ${formatReleaseDate(release.date, t)}`;

              return (
                <CollapsibleSection
                  key={release.version}
                  title={sectionTitle}
                  collapsed={collapsed}
                  onToggle={() => toggleVersion(release.version)}
                >
                  <ReleaseItems items={release.items} compact={compact} />
                </CollapsibleSection>
              );
            })}
          </VStack>
        </VStack>
      ) : null}
    </VStack>
  );
}

const __expoRouterPrivateRoute_WhatsNewContent = () => null;

export default __expoRouterPrivateRoute_WhatsNewContent;
