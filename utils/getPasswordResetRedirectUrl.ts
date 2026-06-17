import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const NATIVE_RESET_REDIRECT = 'faithapp://reset-password';

/**
 * Redirect URL embedded in Supabase reset emails (redirect_to param).
 * Must exactly match an entry in Supabase Auth redirect allow list.
 */
export function getPasswordResetRedirectUrl(): string {
  // Expo Go uses exp:// — dev/production native builds use faithapp://
  if (Constants.appOwnership === 'expo') {
    return Linking.createURL('/reset-password');
  }

  if (Platform.OS === 'web') {
    return Linking.createURL('/reset-password');
  }

  return NATIVE_RESET_REDIRECT;
}
