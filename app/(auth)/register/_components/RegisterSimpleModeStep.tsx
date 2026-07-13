import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuthCardShadow } from '@/hooks/useShadows';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface RegisterSimpleModeStepProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

interface SimpleModeChoiceProps {
  selected: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress: () => void;
}

export function RegisterSimpleModeStep({
  value,
  onChange,
}: RegisterSimpleModeStepProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardShadow = useAuthCardShadow();

  return (
    <Box
      className="rounded-3xl p-6"
      style={{
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        ...cardShadow,
      }}
    >
      <VStack className="gap-5">
        <View style={styles.header}>
          <View
            style={[
              styles.headerIcon,
              { backgroundColor: theme.avatarPrimary },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={26}
              color={theme.textPrimary}
            />
          </View>
          <Text
            className="text-xl font-bold text-center"
            style={{ color: theme.textPrimary, lineHeight: 28 }}
          >
            {t('auth.simpleModeTitle')}
          </Text>
          <Text
            className="text-sm text-center"
            style={{ color: theme.textSecondary, lineHeight: 21 }}
          >
            {t('auth.simpleModeSubtitle')}
          </Text>
        </View>

        <VStack className="gap-3">
          <SimpleModeChoice
            selected={value === true}
            icon="play-circle-outline"
            title={t('auth.simpleModeYesTitle')}
            body={t('auth.simpleModeYesBody')}
            onPress={() => onChange(true)}
          />
          <SimpleModeChoice
            selected={value === false}
            icon="list-outline"
            title={t('auth.simpleModeNoTitle')}
            body={t('auth.simpleModeNoBody')}
            onPress={() => onChange(false)}
          />
        </VStack>
      </VStack>
    </Box>
  );
}

function SimpleModeChoice({
  selected,
  icon,
  title,
  body,
  onPress,
}: SimpleModeChoiceProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={body}
      accessibilityState={{ selected }}
      style={[
        styles.choice,
        {
          backgroundColor: selected ? theme.avatarPrimary : theme.emptyBg,
          borderColor: selected ? theme.buttonPrimary : theme.cardBorder,
        },
      ]}
    >
      <View
        style={[
          styles.choiceIcon,
          {
            backgroundColor: selected ? theme.buttonPrimary : theme.cardBg,
            borderColor: selected ? theme.buttonPrimary : theme.cardBorder,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={selected ? theme.buttonPrimaryContrast : theme.buttonPrimary}
        />
      </View>

      <View style={styles.choiceText}>
        <Text
          className="text-base font-semibold"
          style={{ color: theme.textPrimary, lineHeight: 22 }}
        >
          {title}
        </Text>
        <Text
          className="text-sm"
          style={{ color: theme.textSecondary, lineHeight: 20 }}
        >
          {body}
        </Text>
      </View>

      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={selected ? theme.buttonPrimary : theme.textTertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choice: {
    minHeight: 92,
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: {
    flex: 1,
    gap: 3,
  },
});

const __expoRouterPrivateRoute_RegisterSimpleModeStep = () => null;

export default __expoRouterPrivateRoute_RegisterSimpleModeStep;
