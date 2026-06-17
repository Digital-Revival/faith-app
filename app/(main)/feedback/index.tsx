import { useState } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSubmitButton } from '@/app/(auth)/_components/AuthSubmitButton';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { Box } from '@/components/ui/box';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { APP_VERSION } from '@/constants/version';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types/user';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { FeedbackCategory } from '@/types/feedback';
import { bzzt } from '@/utils/haptics';

import { FeedbackMessageField } from './_components/FeedbackMessageField';
import { useSendFeedback } from './_hooks/useSendFeedback';

const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

const CATEGORIES: FeedbackCategory[] = ['bug', 'idea', 'other'];

function getFeedbackPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function resolveFeedbackDisplayName(
  profile: User | undefined,
  userMetadataFullName: string | undefined,
): string | undefined {
  const profileName = profile?.full_name?.trim();
  if (profileName) return profileName;

  const metadataName = userMetadataFullName?.trim();
  if (metadataName) return metadataName;

  return undefined;
}

function getCategoryLabel(category: FeedbackCategory, t: (key: string) => string): string {
  switch (category) {
    case 'bug':
      return t('feedback.categoryBug');
    case 'idea':
      return t('feedback.categoryIdea');
    case 'other':
      return t('feedback.categoryOther');
  }
}

export default function FeedbackScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: profile } = useUserProfile(user?.id);

  const { sendFeedback, isLoading, reset } = useSendFeedback();

  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('other');
  const [messageError, setMessageError] = useState('');
  const [messageFocused, setMessageFocused] = useState(false);

  const clearForm = () => {
    setMessage('');
    setCategory('other');
    setMessageError('');
    reset();
  };

  const validateMessage = (value: string): string => {
    const trimmed = value.trim();
    if (trimmed.length < MIN_MESSAGE_LENGTH) {
      return t('feedback.messageTooShort');
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return t('feedback.messageTooLong');
    }
    return '';
  };

  const handleSubmit = async () => {
    bzzt();
    const err = validateMessage(message);
    setMessageError(err);
    if (err) return;

    try {
      await sendFeedback({
        message: message.trim(),
        category,
        displayName: resolveFeedbackDisplayName(
          profile,
          typeof user?.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : undefined,
        ),
        appVersion: APP_VERSION,
        platform: getFeedbackPlatform(),
        locale,
      });
      clearForm();
    } catch {
      // Errors handled in hook via toast
    }
  };

  return (
    <Box
      className="flex-1 px-6"
      style={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        backgroundColor: theme.pageBg,
      }}
    >
      <MainTopBar
        title={t('feedback.title')}
        currentSection="feedback"
        showBackButton
        onBack={() => navigation.goBack()}
      />
      <FormScrollView
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Box
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: theme.cardBg,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          }}
        >
          <Box className="px-5 pt-4 pb-4">
            <VStack className="gap-4">
              <Text className="text-sm" style={{ color: theme.textSecondary }}>
                {t('feedback.subtitle')}
              </Text>

              <HStack className="flex-wrap gap-2">
                  {CATEGORIES.map((item) => {
                    const selected = category === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => {
                          bzzt();
                          setCategory(item);
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className="rounded-full px-4 py-2"
                        style={{
                          backgroundColor: selected
                            ? theme.buttonPrimary
                            : theme.inputBg,
                          borderWidth: 1,
                          borderColor: selected
                            ? theme.buttonPrimary
                            : theme.cardBorder,
                        }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: selected
                              ? theme.buttonPrimaryContrast
                              : theme.textSecondary,
                          }}
                        >
                          {getCategoryLabel(item, t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </HStack>

              <FeedbackMessageField
                label={t('feedback.message')}
                placeholder={t('feedback.messagePlaceholder')}
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  if (messageError) setMessageError('');
                }}
                error={messageError}
                focused={messageFocused}
                onFocus={() => setMessageFocused(true)}
                onBlur={() => setMessageFocused(false)}
                editable={!isLoading}
              />

              <AuthSubmitButton
                label={t('feedback.submit')}
                loadingLabel={t('feedback.submitting')}
                isLoading={isLoading}
                onPress={handleSubmit}
              />
            </VStack>
          </Box>
        </Box>
      </FormScrollView>
    </Box>
  );
}
