import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { StepManager } from "@/components/ui/StepManager";
import { useStepManager } from "@/hooks/useStepManager";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { routes } from "@/constants/routes";
import { bzzt } from "@/utils/haptics";
import {
  validateBirthdate,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "@/utils/validators";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { AuthTopBar } from "../_components/AuthTopBar";
import { AuthBackgroundDecor } from "../_components/AuthBackgroundDecor";
import { AuthHeader } from "../_components/AuthHeader";
import { RegisterAccountStep } from "./_components/RegisterAccountStep";
import { RegisterProfileStep } from "./_components/RegisterProfileStep";
import { useRegister } from "./_hooks/useRegister";
import { useState } from "react";

const TOTAL_STEPS = 2;

export default function RegisterScreen() {
  const { register, isLoading, error } = useRegister();
  const theme = useTheme();
  const { t } = useTranslation();
  const { currentStep, isLastStep, nextStep, prevStep } = useStepManager(TOTAL_STEPS);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [birthdateError, setBirthdateError] = useState("");

  const gradientColors = [
    theme.pageBg,
    theme.isDark ? theme.cardBg : theme.emptyBg,
  ] as [string, string];

  const handleNext = async () => {
    bzzt();
    if (currentStep === 0) {
      const nameErr = validateName(name, t);
      const emailErr = validateEmail(email, t);
      const passwordErr = validatePassword(password, t);
      const confirmErr = validateConfirmPassword(confirmPassword, password, t);
      setNameError(nameErr);
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      setConfirmPasswordError(confirmErr);
      if (nameErr || emailErr || passwordErr || confirmErr) return;
      nextStep();
    } else {
      const phoneErr = validatePhone(phone, t);
      const birthdateErr = validateBirthdate(birthdate, t);
      setPhoneError(phoneErr);
      setBirthdateError(birthdateErr);
      if (phoneErr || birthdateErr) return;
      await register({
        name,
        email,
        password,
        confirmPassword,
        phone: phone.trim() || undefined,
        birthdate: birthdate || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
      });
    }
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <AuthBackgroundDecor />
        <AuthTopBar
          showBackButton
          onBack={currentStep > 0 ? prevStep : () => router.back()}
        />
        <FormScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Box className="flex-1 justify-center px-6 pt-4 pb-8">
            <Animated.View entering={FadeIn.duration(600)}>
              <AuthHeader showLogo />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(600)}>
              <StepManager
                currentStep={currentStep}
                totalSteps={TOTAL_STEPS}
                onPrevious={currentStep > 0 ? prevStep : undefined}
                onNext={handleNext}
                nextLabelKey="auth.next"
                completeLabelKey="auth.createAccount"
                isLastStep={isLastStep}
                showStepIndicator
                stepIndicatorVariant="dots"
                showBackButton={false}
                isNextLoading={isLoading}
              >
                {currentStep === 0 ? (
                  <RegisterAccountStep
                    name={name}
                    email={email}
                    password={password}
                    confirmPassword={confirmPassword}
                    onNameChange={setName}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    nameError={nameError}
                    emailError={emailError}
                    passwordError={passwordError}
                    confirmPasswordError={confirmPasswordError}
                    setNameError={setNameError}
                    setEmailError={setEmailError}
                    setPasswordError={setPasswordError}
                    setConfirmPasswordError={setConfirmPasswordError}
                    error={error}
                    isLoading={isLoading}
                    onSubmit={handleNext}
                  />
                ) : (
                  <RegisterProfileStep
                    phone={phone}
                    birthdate={birthdate}
                    country={country}
                    city={city}
                    onPhoneChange={setPhone}
                    onBirthdateChange={setBirthdate}
                    onCountryChange={setCountry}
                    onCityChange={setCity}
                    phoneError={phoneError}
                    birthdateError={birthdateError}
                    isLoading={isLoading}
                    onSubmit={handleNext}
                  />
                )}
              </StepManager>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(400).duration(700)}
              className="mt-12 w-full items-center"
            >
              <VStack className="w-full items-center gap-4">
                <View
                  style={{
                    width: "100%",
                    height: 1,
                    backgroundColor: theme.cardBorder,
                  }}
                />
                <HStack className="items-center gap-2">
                  <Text
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("auth.alreadyHaveAccount")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      bzzt();
                      router.push(routes.auth("login"));
                    }}
                    activeOpacity={0.7}
                    className="cursor-pointer"
                    accessibilityRole="link"
                    accessibilityLabel={t("auth.a11y.goToLogin")}
                    accessibilityHint={t("auth.a11y.goToLoginHint")}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: theme.buttonPrimary }}
                    >
                      {t("auth.signIn")}
                    </Text>
                  </TouchableOpacity>
                </HStack>
              </VStack>
            </Animated.View>
          </Box>
        </FormScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
