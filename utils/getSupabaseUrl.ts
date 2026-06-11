import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

function getLocalDevIP(): string {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.replace(/^exp:\/\//, '').split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch {
    //
  }

  if (process.env.EXPO_PUBLIC_LOCAL_DEV_IP) {
    return process.env.EXPO_PUBLIC_LOCAL_DEV_IP;
  }

  return '192.168.1.100';
}

export function getSupabaseUrl(): string {
  if (!SUPABASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL is not set. Please configure it in your .env file.',
    );
  }

  if (!__DEV__) {
    return SUPABASE_URL;
  }

  if (Platform.OS === 'web') {
    return SUPABASE_URL;
  }

  const isLocalhost =
    SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1');
  const isProductionUrl =
    SUPABASE_URL.includes('supabase.co') || SUPABASE_URL.startsWith('https://');

  if (isProductionUrl && !isLocalhost) {
    return SUPABASE_URL;
  }

  if (isLocalhost) {
    const localDevIP = getLocalDevIP();
    return SUPABASE_URL.replace(/localhost|127\.0\.0\.1/g, localDevIP);
  }

  return SUPABASE_URL;
}
