import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { useNavigation } from 'expo-router/react-navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthInputField } from '@/app/(auth)/_components/AuthInputField';
import { MainTopBar } from '@/app/(main)/_components/MainTopBar';
import { Box } from '@/components/ui/box';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import {
  validateConfirmPassword,
  validatePassword,
} from '@/utils/validators';
import { useChangePassword } from './_hooks/useChangePassword';

export default function ProfilePasswordScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const email = user?.email ?? '';

  const { changePassword, isLoading, isSuccess, reset } = useChangePassword(email);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [currentPasswordFocused, setCurrentPasswordFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const currentPasswordRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const hasInput =
    currentPassword.length > 0 || password.length > 0 || confirmPassword.length > 0;

  const clearForm = () => {
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
    setCurrentPasswordError('');
    setPasswordError('');
    setConfirmPasswordError('');
    reset();
  };

  const handleSubmit = async () => {
    bzzt();
    const currentErr = currentPassword.trim()
      ? ''
      : t('profile.currentPasswordRequired');
    const passwordErr = validatePassword(password, t);
    const confirmErr = validateConfirmPassword(confirmPassword, password, t);

    setCurrentPasswordError(currentErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    if (currentErr || passwordErr || confirmErr) return;

    try {
      await changePassword({
        currentPassword,
        password,
        confirmPassword,
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
        title={t('profile.changePassword')}
        currentSection="profile"
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
                {t('profile.changePasswordSubtitle')}
              </Text>

              <AuthInputField
                ref={currentPasswordRef}
                label={t('profile.currentPassword')}
                placeholder={t('profile.currentPasswordPlaceholder')}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (currentPasswordError) setCurrentPasswordError('');
                  if (isSuccess) reset();
                }}
                error={currentPasswordError}
                focused={currentPasswordFocused}
                onFocus={() => setCurrentPasswordFocused(true)}
                onBlur={() => setCurrentPasswordFocused(false)}
                onSubmitEditing={() =>
                  requestAnimationFrame(() => passwordRef.current?.focus())
                }
                icon="lock-closed-outline"
                secureTextEntry
                showPassword={showCurrentPassword}
                onTogglePassword={() => setShowCurrentPassword((v) => !v)}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="next"
                blurOnSubmit={false}
                editable={!isLoading}
              />

              <AuthInputField
                ref={passwordRef}
                label={t('auth.newPassword')}
                placeholder={t('auth.newPasswordPlaceholder')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                  if (isSuccess) reset();
                }}
                error={passwordError}
                focused={passwordFocused}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onSubmitEditing={() =>
                  requestAnimationFrame(() => confirmPasswordRef.current?.focus())
                }
                icon="lock-closed-outline"
                secureTextEntry
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((v) => !v)}
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
                  if (isSuccess) reset();
                }}
                error={confirmPasswordError}
                focused={confirmPasswordFocused}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                onSubmitEditing={handleSubmit}
                icon="lock-closed-outline"
                secureTextEntry
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword((v) => !v)}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                blurOnSubmit
                editable={!isLoading}
              />

              {(hasInput || isLoading) && (
                <Button
                  onPress={handleSubmit}
                  action="primary"
                  variant="solid"
                  size="lg"
                  className="h-14 cursor-pointer rounded-full mt-2"
                  isDisabled={isLoading}
                  style={{ backgroundColor: theme.buttonPrimary }}
                >
                  {isLoading && <ButtonSpinner className="mr-2" />}
                  <ButtonText
                    className="text-base font-semibold"
                    style={{ color: theme.buttonPrimaryContrast }}
                  >
                    {isLoading ? t('profile.saving') : t('profile.save')}
                  </ButtonText>
                </Button>
              )}

              {isSuccess && !hasInput && (
                <Text className="text-sm" style={{ color: theme.badgeSuccess }}>
                  {t('profile.passwordChanged')}
                </Text>
              )}
            </VStack>
          </Box>
        </Box>
      </FormScrollView>
    </Box>
  );
}
