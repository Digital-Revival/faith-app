import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { useAuthCardShadow } from '@/hooks/useShadows';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { routes } from '@/constants/routes';
import { bzzt } from '@/utils/haptics';
import { validateEmail, validatePasswordForLogin } from '@/utils/validators';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { AuthErrorBox } from '../../_components/AuthErrorBox';
import { AuthInputField } from '../../_components/AuthInputField';
import { AuthSubmitButton } from '../../_components/AuthSubmitButton';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const cardShadow = useAuthCardShadow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    bzzt();
    const emailErr = validateEmail(email, t);
    const passwordErr = validatePasswordForLogin(password, t);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;
    try {
      await onSubmit(email, password);
    } catch {
    }
  };

  return (
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
            ref={emailRef}
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            error={emailError}
            hasFormError={!!error}
            focused={emailFocused}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            onSubmitEditing={() => passwordRef.current?.focus()}
            icon="mail-outline"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            blurOnSubmit={false}
            editable={!isLoading}
          />

          <AuthInputField
            ref={passwordRef}
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            error={passwordError}
            hasFormError={!!error}
            focused={passwordFocused}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            onSubmitEditing={handleSubmit}
            icon="lock-closed-outline"
            secureTextEntry
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            keyboardType="default"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="done"
            blurOnSubmit
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={() => {
              bzzt();
              router.push(routes.authForgotPassword());
            }}
            activeOpacity={0.7}
            className="self-end"
            accessibilityRole="link"
            accessibilityLabel={t('auth.forgotPassword')}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: theme.buttonPrimary }}
            >
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </VStack>

        {error && <AuthErrorBox message={error} />}

        <AuthSubmitButton
          label={t('auth.login')}
          loadingLabel={t('auth.loggingIn')}
          isLoading={isLoading}
          onPress={handleSubmit}
        />
      </VStack>
    </Box>
  );
}

const __expoRouterPrivateRoute_LoginForm = () => null;

export default __expoRouterPrivateRoute_LoginForm;
