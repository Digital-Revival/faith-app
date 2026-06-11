import { Box } from '@/components/ui/box';
import { FormControl } from '@/components/ui/form-control';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { COUNTRIES } from '@/constants/countries';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { bzzt } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useRef, useState } from 'react';

interface ProfileFieldsFormProps {
  phone: string;
  birthdate: string | null;
  country: string;
  city: string;
  onPhoneChange: (value: string) => void;
  onBirthdateChange: (value: string | null) => void;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  phoneError?: string;
  birthdateError?: string;
  editable?: boolean;
  onLastFieldSubmit?: () => void;
}

function formatDateForDisplay(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ProfileFieldsForm({
  phone,
  birthdate,
  country,
  city,
  onPhoneChange,
  onBirthdateChange,
  onCountryChange,
  onCityChange,
  phoneError,
  birthdateError,
  editable = true,
  onLastFieldSubmit,
}: ProfileFieldsFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const phoneRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return COUNTRIES;
    const q = countrySearchQuery.toLowerCase().trim();
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [countrySearchQuery]);

  const birthdateA11yLabel = birthdate
    ? `${t('auth.birthdate')}, ${formatDateForDisplay(birthdate)}`
    : `${t('auth.birthdate')}, ${t('auth.birthdatePlaceholder')}`;

  const countryA11yLabel = country
    ? `${t('auth.country')}, ${country}`
    : `${t('auth.country')}, ${t('auth.countryPlaceholder')}`;

  const handleDateChange = (event: { type: string }, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      onBirthdateChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleCountrySelect = (value: string) => {
    bzzt();
    onCountryChange(value);
    setShowCountryModal(false);
    setCountrySearchQuery('');
  };

  const handleCountryModalClose = () => {
    setShowCountryModal(false);
    setCountrySearchQuery('');
  };

  return (
    <VStack className="gap-4">
      <FormControl isInvalid={!!phoneError}>
        <VStack className="gap-2">
          <Text
            accessible={false}
            importantForAccessibility="no"
            className="text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >
            {t('auth.phone')}
          </Text>
          <Box
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: theme.inputBg,
              borderWidth: phoneError ? 1.5 : 1,
              borderColor: phoneError ? theme.buttonDecline : theme.cardBorder,
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
                    name="call-outline"
                    size={22}
                    color={phoneError ? theme.buttonDecline : theme.textTertiary}
                  />
                </InputIcon>
              </InputSlot>
              <InputField
                ref={phoneRef as React.Ref<React.ComponentRef<typeof InputField>>}
                placeholder={t('auth.phonePlaceholder')}
                value={phone}
                onChangeText={onPhoneChange}
                keyboardType="phone-pad"
                editable={editable}
                placeholderTextColor={theme.textTertiary}
                className="pl-3 pr-5 text-base"
                style={{ color: theme.textPrimary }}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() =>
                  requestAnimationFrame(() => cityRef.current?.focus())
                }
                accessibilityLabel={t('auth.phone')}
              />
            </Input>
          </Box>
          {phoneError && (
            <View accessibilityLiveRegion="polite">
              <Text className="text-xs mt-1" style={{ color: theme.buttonDecline }}>
                {phoneError}
              </Text>
            </View>
          )}
        </VStack>
      </FormControl>

      <FormControl isInvalid={!!birthdateError}>
        <VStack className="gap-2">
          <Text
            accessible={false}
            importantForAccessibility="no"
            className="text-sm font-medium"
            style={{ color: theme.textSecondary }}
          >
            {t('auth.birthdate')}
          </Text>
          <TouchableOpacity
            onPress={() => editable && (bzzt(), setShowDatePicker(true))}
            activeOpacity={editable ? 0.7 : 1}
            disabled={!editable}
            accessibilityRole="button"
            accessibilityLabel={birthdateA11yLabel}
            accessibilityHint={t('auth.a11y.opensDatePicker')}
            accessibilityState={{ disabled: !editable }}
          >
            <Box
              className="rounded-2xl h-14 px-5 flex-row items-center"
              style={{
                backgroundColor: theme.inputBg,
                borderWidth: birthdateError ? 1.5 : 1,
                borderColor: birthdateError ? theme.buttonDecline : theme.cardBorder,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={birthdateError ? theme.buttonDecline : theme.textTertiary}
              />
              <Text
                className="ml-3 text-base flex-1"
                style={{
                  color: birthdate
                    ? theme.textPrimary
                    : theme.textTertiary,
                }}
              >
                {birthdate ? formatDateForDisplay(birthdate) : t('auth.birthdatePlaceholder')}
              </Text>
              {editable && (
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              )}
            </Box>
          </TouchableOpacity>
          {birthdateError && (
            <View accessibilityLiveRegion="polite">
              <Text className="text-xs mt-1" style={{ color: theme.buttonDecline }}>
                {birthdateError}
              </Text>
            </View>
          )}
        </VStack>
      </FormControl>

      {showDatePicker && (
        <>
          {Platform.OS === 'ios' && (
            <Modal
              visible
              transparent
              animationType="slide"
              accessibilityViewIsModal
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalContainer}>
                <Pressable
                  style={[StyleSheet.absoluteFill, styles.backdrop]}
                  onPress={() => setShowDatePicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.a11y.dismissSheet')}
                />
                <View
                  style={[
                    styles.bottomSheet,
                    styles.dateBottomSheet,
                    {
                      backgroundColor: theme.pageBg,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                >
                  <SafeAreaView edges={['bottom']} style={styles.dateSheetContent}>
                    <Box
                      className="flex-row justify-between items-center px-4 py-3"
                      style={{ borderBottomWidth: 1, borderColor: theme.cardBorder }}
                    >
                      <Text
                        className="text-base font-medium"
                        style={{ color: theme.textSecondary }}
                      >
                        {t('auth.birthdate')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        className="cursor-pointer"
                        accessibilityRole="button"
                        accessibilityLabel={t('common.done')}
                      >
                        <Text
                          className="text-base font-semibold"
                          style={{ color: theme.buttonPrimary }}
                        >
                          {t('common.done')}
                        </Text>
                      </TouchableOpacity>
                    </Box>
                    <View style={styles.datePickerWrapper}>
                      <DateTimePicker
                        value={birthdate ? new Date(birthdate) : new Date()}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                      />
                    </View>
                  </SafeAreaView>
                </View>
              </View>
            </Modal>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={birthdate ? new Date(birthdate) : new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}
        </>
      )}

      <VStack className="gap-2">
        <Text
          accessible={false}
          importantForAccessibility="no"
          className="text-sm font-medium"
          style={{ color: theme.textSecondary }}
        >
          {t('auth.country')}
        </Text>
        <TouchableOpacity
          onPress={() => editable && (bzzt(), setShowCountryModal(true))}
          activeOpacity={editable ? 0.7 : 1}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel={countryA11yLabel}
          accessibilityHint={t('auth.a11y.opensCountryPicker')}
          accessibilityState={{ disabled: !editable }}
        >
          <Box
            className="rounded-2xl h-14 px-5 flex-row items-center"
            style={{
              backgroundColor: theme.inputBg,
              borderWidth: 1,
              borderColor: theme.cardBorder,
            }}
          >
            <Ionicons name="earth-outline" size={22} color={theme.textTertiary} />
            <Text
              className="ml-3 text-base flex-1"
              style={{
                color: country ? theme.textPrimary : theme.textTertiary,
              }}
            >
              {country || t('auth.countryPlaceholder')}
            </Text>
            {editable && (
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            )}
          </Box>
        </TouchableOpacity>
      </VStack>

      <Modal
        visible={showCountryModal}
        transparent
        animationType="slide"
        accessibilityViewIsModal
        onRequestClose={handleCountryModalClose}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.backdrop]}
            onPress={handleCountryModalClose}
            accessibilityRole="button"
            accessibilityLabel={t('auth.a11y.dismissSheet')}
          />
          <View
            style={[
              styles.bottomSheet,
              styles.countryBottomSheet,
              {
                backgroundColor: theme.pageBg,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <SafeAreaView edges={['bottom']} style={styles.countrySheetContent}>
              <Box className="p-4" style={{ borderBottomWidth: 1, borderColor: theme.cardBorder }}>
                <Text
                  className="text-lg font-semibold mb-3"
                  style={{ color: theme.textPrimary }}
                >
                  {t('auth.country')}
                </Text>
                <Box
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                  }}
                >
                  <Input variant="outline" size="lg" className="h-12 border-0 bg-transparent">
                    <InputSlot className="pl-4">
                      <InputIcon>
                        <Ionicons name="search-outline" size={20} color={theme.textTertiary} />
                      </InputIcon>
                    </InputSlot>
                    <InputField
                      placeholder={t('auth.countrySearchPlaceholder')}
                      value={countrySearchQuery}
                      onChangeText={setCountrySearchQuery}
                      placeholderTextColor={theme.textTertiary}
                      className="pl-3 pr-4 text-base"
                      style={{ color: theme.textPrimary }}
                      accessibilityLabel={t('auth.countrySearchPlaceholder')}
                    />
                  </Input>
                </Box>
              </Box>
              <View style={styles.countryListContainer}>
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item}
                  style={styles.countryList}
                  contentContainerStyle={styles.countryListContent}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  accessibilityLabel={t('auth.a11y.countryList')}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleCountrySelect(item)}
                      className="px-5 py-4"
                      accessibilityRole="button"
                      accessibilityLabel={item}
                      style={{
                        backgroundColor: country === item ? theme.cardBorder : 'transparent',
                      }}
                    >
                      <Text
                        className="text-base"
                        style={{ color: theme.textPrimary }}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      <VStack className="gap-2">
        <Text
          accessible={false}
          importantForAccessibility="no"
          className="text-sm font-medium"
          style={{ color: theme.textSecondary }}
        >
          {t('auth.city')}
        </Text>
        <Box
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: theme.inputBg,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          }}
        >
          <Input
            variant="outline"
            size="lg"
            className="h-14 border-0 bg-transparent"
          >
            <InputSlot className="pl-5">
              <InputIcon>
                <Ionicons name="location-outline" size={22} color={theme.textTertiary} />
              </InputIcon>
            </InputSlot>
            <InputField
              ref={cityRef as React.Ref<React.ComponentRef<typeof InputField>>}
              placeholder={t('auth.cityPlaceholder')}
              value={city}
              onChangeText={onCityChange}
              autoCapitalize="words"
              editable={editable}
              placeholderTextColor={theme.textTertiary}
              className="pl-3 pr-5 text-base"
              style={{ color: theme.textPrimary }}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={() => {
                Keyboard.dismiss();
                onLastFieldSubmit?.();
              }}
              accessibilityLabel={t('auth.city')}
            />
          </Input>
        </Box>
      </VStack>
    </VStack>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dateBottomSheet: {
    maxHeight: 380,
  },
  dateSheetContent: {
    paddingBottom: 8,
  },
  datePickerWrapper: {
    paddingVertical: 8,
  },
  countryBottomSheet: {
    height: Dimensions.get('window').height * 0.7,
  },
  countrySheetContent: {
    flex: 1,
    minHeight: 0,
  },
  countryListContainer: {
    flex: 1,
    minHeight: 200,
    maxHeight: Dimensions.get('window').height * 0.45,
  },
  countryList: {
    flex: 1,
  },
  countryListContent: {
    paddingBottom: 24,
  },
});
