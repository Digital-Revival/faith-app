import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { ProfileFieldsForm } from "@/components/common/ProfileFieldsForm";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { userService } from "@/services/api/userService";
import { queryKeys } from "@/services/queryKeys";
import { bzzt } from "@/utils/haptics";
import { getErrorMessage } from "@/utils/errors";
import { validateBirthdate, validateName, validatePhone } from "@/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "expo-router/react-navigation";
import { useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormScrollView } from "@/components/ui/FormScrollView";
import { MainTopBar } from "@/app/(main)/_components/MainTopBar";

export default function ProfileInformationScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [birthdate, setBirthdate] = useState<string | null>(profile?.birthdate ?? null);
  const [country, setCountry] = useState(profile?.country ?? "");
  const [city, setCity] = useState(profile?.city ?? "");

  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [birthdateError, setBirthdateError] = useState("");
  const [nameFocused, setNameFocused] = useState(false);

  const isDark = theme.isDark;

  const hasChanges = useMemo(
    () =>
      fullName.trim() !== (profile?.full_name ?? "").trim() ||
      phone.trim() !== (profile?.phone ?? "").trim() ||
      birthdate !== (profile?.birthdate ?? null) ||
      country.trim() !== (profile?.country ?? "").trim() ||
      city.trim() !== (profile?.city ?? "").trim(),
    [fullName, phone, birthdate, country, city, profile],
  );

  const updateMutation = useMutation({
    mutationFn: (updates: {
      full_name: string;
      phone?: string | null;
      birthdate?: string | null;
      country?: string | null;
      city?: string | null;
    }) => userService.updateUser(profile!.id, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.users.detail(updated.id), updated);
      bzzt();
    },
  });

  const handleSave = () => {
    bzzt();
    const nameErr = validateName(fullName, t);
    const phoneErr = validatePhone(phone, t);
    const birthdateErr = validateBirthdate(birthdate, t);
    setNameError(nameErr);
    setPhoneError(phoneErr);
    setBirthdateError(birthdateErr);
    if (nameErr || phoneErr || birthdateErr) return;
    if (!hasChanges || !profile?.id) return;
    updateMutation.mutate({
      full_name: fullName.trim() || (profile?.full_name ?? ''),
      phone: phone.trim() || null,
      birthdate: birthdate || null,
      country: country.trim() || null,
      city: city.trim() || null,
    });
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setBirthdate(profile.birthdate ?? null);
      setCountry(profile.country ?? "");
      setCity(profile.city ?? "");
    }
  }, [profile?.id, profile?.full_name, profile?.phone, profile?.birthdate, profile?.country, profile?.city]);

  if (profileLoading && user?.id) {
    return <LoadingScreen message={t("loading.section.profile")} />;
  }

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
        title={t("profile.information")}
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
              <FormControl isInvalid={!!nameError}>
                <VStack className="gap-2">
                  <Text
                    className="text-sm font-medium"
                    style={{ color: theme.textSecondary }}
                  >
                    {t("auth.fullName")}
                  </Text>
                  <Box
                    className="overflow-hidden rounded-2xl"
                    style={{
                      backgroundColor: isDark ? theme.cardBg : "#ffffff",
                      borderWidth: nameError ? 1.5 : nameFocused ? 1.5 : 1,
                      borderColor: nameError
                        ? theme.buttonDecline
                        : nameFocused
                          ? theme.buttonPrimary
                          : isDark
                            ? theme.cardBorder
                            : "#e5e7eb",
                    }}
                  >
                    <Input
                      variant="outline"
                      size="lg"
                      className="h-14 border-0 bg-transparent"
                    >
                      <InputSlot className="pl-5">
                        <InputIcon>
                          <Ionicons
                            name="person-outline"
                            size={22}
                            color={
                              nameError
                                ? theme.buttonDecline
                                : nameFocused
                                  ? theme.buttonPrimary
                                  : theme.textTertiary
                            }
                          />
                        </InputIcon>
                      </InputSlot>
                      <InputField
                        placeholder={t("auth.fullNamePlaceholder")}
                        value={fullName}
                        onChangeText={(text) => {
                          setFullName(text);
                          if (nameError) setNameError("");
                        }}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        editable={!updateMutation.isPending}
                        placeholderTextColor={theme.textTertiary}
                        className="pl-3 pr-5 text-base"
                        style={{ color: theme.textPrimary }}
                      />
                    </Input>
                  </Box>
                  {nameError && (
                    <Text
                      className="text-xs mt-1"
                      style={{ color: theme.buttonDecline }}
                    >
                      {nameError}
                    </Text>
                  )}
                </VStack>
              </FormControl>

              <VStack className="gap-2">
                <Text
                  className="text-sm font-medium"
                  style={{ color: theme.textSecondary }}
                >
                  {t("auth.email")}
                </Text>
                <Box
                  className="rounded-2xl h-14 px-5 flex-row items-center"
                  style={{
                    backgroundColor: isDark ? theme.cardBg : "#ffffff",
                    borderWidth: 1,
                    borderColor: isDark ? theme.cardBorder : "#e5e7eb",
                  }}
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={theme.textTertiary}
                  />
                  <Text
                    className="ml-3 text-base flex-1"
                    style={{ color: theme.textSecondary }}
                  >
                    {profile?.email ?? ""}
                  </Text>
                </Box>
              </VStack>

              <ProfileFieldsForm
                phone={phone}
                birthdate={birthdate}
                country={country}
                city={city}
                onPhoneChange={(v) => {
                  setPhone(v);
                  if (phoneError) setPhoneError("");
                }}
                onBirthdateChange={(v) => {
                  setBirthdate(v);
                  if (birthdateError) setBirthdateError("");
                }}
                onCountryChange={setCountry}
                onCityChange={setCity}
                phoneError={phoneError}
                birthdateError={birthdateError}
                editable={!updateMutation.isPending}
              />

              {hasChanges && (
                <Button
                  onPress={handleSave}
                  action="primary"
                  variant="solid"
                  size="lg"
                  className="h-14 cursor-pointer rounded-full mt-2"
                  isDisabled={updateMutation.isPending}
                  style={{
                    backgroundColor: theme.buttonPrimary,
                  }}
                >
                  {updateMutation.isPending && (
                    <ButtonSpinner className="mr-2" />
                  )}
                  <ButtonText
                    className="text-base font-semibold"
                    style={{ color: theme.buttonPrimaryContrast }}
                  >
                    {updateMutation.isPending
                      ? t("profile.saving")
                      : t("profile.save")}
                  </ButtonText>
                </Button>
              )}

              {updateMutation.isSuccess && !hasChanges && (
                <Text className="text-sm" style={{ color: theme.badgeSuccess }}>
                  {t("profile.saved")}
                </Text>
              )}
              {updateMutation.isError && (
                <Text
                  className="text-sm"
                  style={{ color: theme.buttonDecline }}
                >
                  {getErrorMessage(updateMutation.error, t("profile.saveFailed"))}
                </Text>
              )}
            </VStack>
          </Box>
        </Box>
      </FormScrollView>
    </Box>
  );
}
