import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VideoThumbnail } from '@/components/ui/VideoThumbnail';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useBibleschoolSimpleMode } from '@/contexts/BibleschoolSimpleModeContext';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { routes } from '@/constants/routes';
import { useVimeoThumbnail } from '@/hooks/useVimeoThumbnail';
import { TouchableOpacity } from 'react-native';

function IntroRowThumbnail({ introductionVimeoId }: { introductionVimeoId: string }) {
  const { data: vimeoThumbnail, isLoading } = useVimeoThumbnail(introductionVimeoId);
  return (
    <VideoThumbnail
      thumbnailUrl={vimeoThumbnail ?? undefined}
      isLoading={isLoading}
    />
  );
}

interface IntroVideoRowProps {
  introductionVimeoId: string;
  showWatchedCheck?: boolean;
  introWatched?: boolean;
}

export function IntroVideoRow({
  introductionVimeoId,
  showWatchedCheck,
  introWatched,
}: IntroVideoRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enabled: simpleMode } = useBibleschoolSimpleMode();

  return (
    <TouchableOpacity
      onPress={() => {
        bzzt();
        router.push(routes.bibleschoolIntro());
      }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('overview.introVideoTitle')}
      className="cursor-pointer"
    >
      <Box
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: theme.cardBg,
          borderWidth: 1,
          borderColor: theme.cardBorder,
        }}
      >
        <Box
          className={`flex-row items-center pr-4 ${simpleMode ? 'py-4 min-h-24' : 'py-3'}`}
        >
          <Box className="pl-3 mr-4">
            <IntroRowThumbnail introductionVimeoId={introductionVimeoId} />
          </Box>
          <Box className="flex-1 justify-center min-w-0">
            <Text
              className={simpleMode ? 'text-xl font-semibold' : 'text-base font-medium'}
              style={{ color: theme.textPrimary }}
              numberOfLines={2}
            >
              {t('overview.introVideoTitle')}
            </Text>
            <Text
              className={simpleMode ? 'text-base font-medium mt-1' : 'text-xs font-medium mt-0.5'}
              style={{ color: theme.textSecondary }}
            >
              {t('overview.introVideoSubtitle')}
            </Text>
          </Box>
          {showWatchedCheck && introWatched ? (
            <Ionicons name="checkmark-circle" size={22} color={theme.quizCorrect} />
          ) : null}
          <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
        </Box>
      </Box>
    </TouchableOpacity>
  );
}

const __expoRouterPrivateRoute_IntroVideoRow = () => null;

export default __expoRouterPrivateRoute_IntroVideoRow;
