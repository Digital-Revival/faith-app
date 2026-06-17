import { Box } from '@/components/ui/box';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { routes } from '@/constants/routes';
import { useAuthCardShadow } from '@/hooks/useShadows';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { validateEmail } from '@/utils/validators';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBackgroundDecor } from '../_components/AuthBackgroundDecor';
import { AuthHeader } from '../_components/AuthHeader';
import { AuthInputField } from '../_components/AuthInputField';
import { AuthSubmitButton } from '../_components/AuthSubmitButton';
import { AuthTopBar } from '../_components/AuthTopBar';
import { useForgotPassword } from './_hooks/useForgotPassword';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardShadow = useAuthCardShadow();
  const { requestReset, isLoading, isSuccess } = useForgotPassword();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const emailRef = useRef<TextInput>(null);

  const gradientColors = [
    theme.pageBg,
    theme.isDark ? theme.cardBg : theme.emptyBg,
  ] as [string, string];

  const handleSubmit = async () => {
    bzzt();
    const err = validateEmail(email, t);
    setEmailError(err);
    if (err) return;
    await requestReset(email);
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <AuthBackgroundDecor />
        <AuthTopBar />
        <FormScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Box className="flex-1 justify-center px-6 pt-4 pb-8">
            <Animated.View entering={FadeIn.duration(700)}>
              <AuthHeader
                showLogo
                titleKey="auth.forgotPasswordTitle"
                titleClassName="text-center text-xl font-bold tracking-wide px-2"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(750)}>
              {isSuccess ? (
                <VStack className="mt-6 gap-4">
                  <Text
                    className="text-center text-base leading-6"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('auth.forgotPasswordSent')}
                  </Text>
                  <Text
                    className="text-center text-sm leading-5"
                    style={{ color: theme.textTertiary }}
                  >
                    {t('auth.forgotPasswordLinkValidity')}
                  </Text>
                </VStack>
              ) : (
                <VStack className="mt-6 gap-6">
                  <Text
                    className="text-center text-base leading-6"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('auth.forgotPasswordBody')}
                  </Text>
                  <Box
                    className="rounded-3xl p-8"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                      ...cardShadow,
                    }}
                  >
                    <VStack className="gap-6">
                      <AuthInputField
                        ref={emailRef}
                        label={t('auth.email')}
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError('');
                        }}
                        error={emailError}
                        hasFormError={false}
                        focused={emailFocused}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        onSubmitEditing={handleSubmit}
                        icon="mail-outline"
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="done"
                        blurOnSubmit
                        editable={!isLoading}
                      />
                      <AuthSubmitButton
                        label={t('auth.forgotPassword')}
                        loadingLabel={t('common.loading')}
                        isLoading={isLoading}
                        onPress={handleSubmit}
                      />
                    </VStack>
                  </Box>
                </VStack>
              )}
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(400).duration(700)}
              className="mt-12 w-full items-center"
            >
              <View
                style={{
                  width: '100%',
                  height: 1,
                  backgroundColor: theme.cardBorder,
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  bzzt();
                  router.replace(routes.auth('login'));
                }}
                activeOpacity={0.7}
                className="mt-6"
                accessibilityRole="link"
                accessibilityLabel={t('auth.a11y.goToLogin')}
              >
                <Text
                  className="text-base font-semibold"
                  style={{ color: theme.buttonPrimary }}
                >
                  {t('auth.signIn')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Box>
        </FormScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
