import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { routes } from '@/constants/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCardShadow } from '@/hooks/useShadows';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { authService } from '@/services/api/authService';
import {
  clearCapturedRecoveryUrl,
  createSessionFromRecoveryUrl,
  isRecoveryUrlAlreadyProcessed,
  markRecoveryUrlProcessed,
  resolveRecoveryUrl,
} from '@/utils/authDeepLink';
import { bzzt } from '@/utils/haptics';
import {
  validateConfirmPassword,
  validatePassword,
} from '@/utils/validators';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthBackgroundDecor } from '../(auth)/_components/AuthBackgroundDecor';
import { AuthErrorBox } from '../(auth)/_components/AuthErrorBox';
import { AuthHeader } from '../(auth)/_components/AuthHeader';
import { AuthInputField } from '../(auth)/_components/AuthInputField';
import { AuthSubmitButton } from '../(auth)/_components/AuthSubmitButton';
import { useResetPassword } from './_hooks/useResetPassword';

type ResetPhase = 'loading' | 'invalid' | 'link-error' | 'form';

function mapRecoveryInitError(err: unknown, t: (key: string) => string): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  if (msg.includes('expired')) {
    return t('auth.passwordResetLinkExpired');
  }
  if (msg.includes('invalid token') || msg.includes('already been used')) {
    return t('auth.passwordResetLinkUsed');
  }
  return t('auth.resetPasswordFailed');
}

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardShadow = useAuthCardShadow();
  const { signOut, setPendingPasswordRecovery } = useAuth();

  const passwordUpdatedRef = useRef(false);
  const sessionEstablishedRef = useRef(false);
  const recoveryInitStartedRef = useRef(false);
  const [phase, setPhase] = useState<ResetPhase>('loading');
  const [linkError, setLinkError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const { resetPassword, isLoading, error, clearError } = useResetPassword({
    onSuccess: () => {
      passwordUpdatedRef.current = true;
    },
  });

  useEffect(() => {
    if (recoveryInitStartedRef.current) return;
    recoveryInitStartedRef.current = true;

    let cancelled = false;

    async function showFormIfRecoverySessionActive(): Promise<boolean> {
      const session = await authService.getSession();
      if (!session) return false;

      sessionEstablishedRef.current = true;
      if (!cancelled) setPhase('form');
      return true;
    }

    async function initRecovery() {
      const initialUrl = await Linking.getInitialURL();
      const incomingUrl = resolveRecoveryUrl(undefined, initialUrl);

      if (!incomingUrl) {
        if (await showFormIfRecoverySessionActive()) return;
        if (!cancelled) setPhase('invalid');
        return;
      }

      if (await isRecoveryUrlAlreadyProcessed(incomingUrl)) {
        if (await showFormIfRecoverySessionActive()) return;
        if (!cancelled) {
          setLinkError(t('auth.passwordResetLinkUsed'));
          setPhase('link-error');
        }
        return;
      }

      try {
        const sessionCreated = await createSessionFromRecoveryUrl(incomingUrl);
        if (!sessionCreated) {
          if (await showFormIfRecoverySessionActive()) return;
          if (!cancelled) setPhase('invalid');
          return;
        }

        await markRecoveryUrlProcessed(incomingUrl);
        clearCapturedRecoveryUrl();
        setPendingPasswordRecovery(true);
        sessionEstablishedRef.current = true;
        if (!cancelled) setPhase('form');
      } catch (err) {
        if (await showFormIfRecoverySessionActive()) return;
        if (!cancelled) {
          setLinkError(mapRecoveryInitError(err, t));
          setPhase('link-error');
        }
      }
    }

    void initRecovery();

    return () => {
      cancelled = true;
    };
  }, [setPendingPasswordRecovery, t]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (sessionEstablishedRef.current && !passwordUpdatedRef.current) {
          void signOut();
          setPendingPasswordRecovery(false);
        }
      };
    }, [signOut, setPendingPasswordRecovery]),
  );

  const gradientColors = [
    theme.pageBg,
    theme.isDark ? theme.cardBg : theme.emptyBg,
  ] as [string, string];

  const handleSubmit = async () => {
    bzzt();
    clearError();
    const pwdErr = validatePassword(password, t);
    const confirmErr = validateConfirmPassword(confirmPassword, password, t);
    setPasswordError(pwdErr);
    setConfirmPasswordError(confirmErr);
    if (pwdErr || confirmErr) return;

    try {
      await resetPassword(password);
    } catch {
      //
    }
  };

  const goToForgotPassword = () => {
    bzzt();
    router.replace(routes.authForgotPassword());
  };

  if (phase === 'loading') {
    return <LoadingScreen message={t('common.loading')} />;
  }

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <AuthBackgroundDecor />
        <FormScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Box className="flex-1 justify-center px-6 pt-4 pb-8">
            <Animated.View entering={FadeIn.duration(700)}>
              <AuthHeader
                showLogo
                titleKey="auth.resetPasswordTitle"
                titleClassName="text-center text-xl font-bold tracking-wide px-2"
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(750)}>
              {phase === 'invalid' && (
                <VStack className="mt-6 gap-6 items-center">
                  <Text
                    className="text-center text-base leading-6"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('auth.resetPasswordFailed')}
                  </Text>
                  <Button
                    onPress={goToForgotPassword}
                    action="primary"
                    size="lg"
                    className="h-14 rounded-full w-full"
                  >
                    <ButtonText className="text-base font-semibold">
                      {t('auth.requestNewResetLink')}
                    </ButtonText>
                  </Button>
                </VStack>
              )}

              {phase === 'link-error' && linkError && (
                <VStack className="mt-6 gap-6 items-center">
                  <Text
                    className="text-center text-base leading-6"
                    style={{ color: theme.textSecondary }}
                  >
                    {linkError}
                  </Text>
                  <Button
                    onPress={goToForgotPassword}
                    action="primary"
                    size="lg"
                    className="h-14 rounded-full w-full"
                  >
                    <ButtonText className="text-base font-semibold">
                      {t('auth.requestNewResetLink')}
                    </ButtonText>
                  </Button>
                </VStack>
              )}

              {phase === 'form' && (
                <VStack className="mt-6 gap-6">
                  <Text
                    className="text-center text-base leading-6"
                    style={{ color: theme.textSecondary }}
                  >
                    {t('auth.resetPasswordSubtitle')}
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
                      <VStack className="gap-5">
                        <AuthInputField
                          ref={passwordRef}
                          label={t('auth.newPassword')}
                          placeholder={t('auth.newPasswordPlaceholder')}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (passwordError) setPasswordError('');
                            if (error) clearError();
                          }}
                          error={passwordError}
                          hasFormError={!!error}
                          focused={passwordFocused}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          onSubmitEditing={() =>
                            confirmPasswordRef.current?.focus()
                          }
                          icon="lock-closed-outline"
                          secureTextEntry
                          showPassword={showPassword}
                          onTogglePassword={() => setShowPassword(!showPassword)}
                          keyboardType="default"
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="next"
                          blurOnSubmit={false}
                          editable={!isLoading}
                        />

                        <AuthInputField
                          ref={confirmPasswordRef}
                          label={t('auth.confirmPassword')}
                          placeholder={t('auth.confirmPasswordPlaceholder')}
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (confirmPasswordError) setConfirmPasswordError('');
                            if (error) clearError();
                          }}
                          error={confirmPasswordError}
                          hasFormError={!!error}
                          focused={confirmPasswordFocused}
                          onFocus={() => setConfirmPasswordFocused(true)}
                          onBlur={() => setConfirmPasswordFocused(false)}
                          onSubmitEditing={handleSubmit}
                          icon="lock-closed-outline"
                          secureTextEntry
                          showPassword={showConfirmPassword}
                          onTogglePassword={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          keyboardType="default"
                          autoComplete="new-password"
                          textContentType="newPassword"
                          returnKeyType="done"
                          blurOnSubmit
                          editable={!isLoading}
                        />
                      </VStack>

                      {error && <AuthErrorBox message={error} />}

                      <AuthSubmitButton
                        label={t('auth.resetPasswordTitle')}
                        loadingLabel={t('common.loading')}
                        isLoading={isLoading}
                        onPress={handleSubmit}
                      />
                    </VStack>
                  </Box>
                </VStack>
              )}
            </Animated.View>

            {(phase === 'invalid' || phase === 'link-error') && (
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
            )}
          </Box>
        </FormScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
