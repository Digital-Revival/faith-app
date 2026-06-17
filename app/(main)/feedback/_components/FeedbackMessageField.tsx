import { Box } from '@/components/ui/box';
import { FormControl } from '@/components/ui/form-control';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons as Ion } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface FeedbackMessageFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  editable?: boolean;
}

export function FeedbackMessageField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  focused,
  onFocus,
  onBlur,
  editable = true,
}: FeedbackMessageFieldProps) {
  const theme = useTheme();
  const hasError = !!error;

  const boxStyle = {
    backgroundColor: theme.inputBg,
    borderWidth: hasError ? 1.5 : 1,
    borderColor: hasError
      ? theme.buttonDecline
      : focused
        ? theme.buttonPrimary
        : theme.cardBorder,
  };

  return (
    <FormControl isInvalid={hasError}>
      <VStack className="gap-2">
        <Text
          accessible={false}
          importantForAccessibility="no"
          className="text-sm font-medium"
          style={{ color: theme.textSecondary }}
        >
          {label}
        </Text>
        <Box className="overflow-hidden rounded-2xl px-4 py-3" style={boxStyle}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor={theme.textTertiary}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            editable={editable}
            multiline
            textAlignVertical="top"
            className="text-base"
            style={{
              color: theme.textPrimary,
              minHeight: 120,
            }}
            accessibilityLabel={error ? `${label}. ${error}` : label}
          />
        </Box>
        {error && (
          <Animated.View entering={FadeIn} accessibilityLiveRegion="polite">
            <HStack
              className="mt-1 items-center gap-1.5"
              accessible
              accessibilityRole="text"
            >
              <View accessible={false} importantForAccessibility="no">
                <Ion name="close-circle" size={14} color={theme.buttonDecline} />
              </View>
              <Text className="text-xs" style={{ color: theme.buttonDecline }}>
                {error}
              </Text>
            </HStack>
          </Animated.View>
        )}
      </VStack>
    </FormControl>
  );
}

const __expoRouterPrivateRoute_FeedbackMessageField = () => null;

export default __expoRouterPrivateRoute_FeedbackMessageField;
