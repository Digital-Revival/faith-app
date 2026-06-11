import { AuthError } from '@supabase/supabase-js';

import { AppError, AppErrorCode } from './baseService';
import { supabase } from '@/services/supabase/client';
import type { LoginData, RegisterData } from '@/types/auth';

function normalizeAuthError(error: AuthError): AppError {
  const message = error.message || 'Authentication error';

  if (error.status === 400) {
    if (message.includes('already registered')) {
      return new AppError(
        'This email is already registered',
        AppErrorCode.AUTH_USER_EXISTS,
        error,
      );
    }
    if (message.includes('Invalid login credentials')) {
      return new AppError(
        'Invalid email or password',
        AppErrorCode.AUTH_INVALID_CREDENTIALS,
        error,
      );
    }
    if (message.includes('Password')) {
      return new AppError(
        'Password is too weak',
        AppErrorCode.AUTH_WEAK_PASSWORD,
        error,
      );
    }
  }

  if (error.status === 429) {
    return new AppError(
      'Too many attempts. Please try again later',
      AppErrorCode.RATE_LIMIT,
      error,
    );
  }

  if (
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504
  ) {
    return new AppError(
      'De authenticatieservice reageert niet (gateway). Controleer of Supabase draait (lokaal: supabase start) en probeer opnieuw.',
      AppErrorCode.NETWORK,
      error,
    );
  }

  return new AppError(message, AppErrorCode.UNKNOWN, error);
}

export const authService = {
  getClient() {
    return supabase;
  },

  async login(data: LoginData) {
    const LOGIN_TIMEOUT_MS = 20000;

    const loginPromise = (async () => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      if (error) throw error;
      if (!authData.user) throw new Error('Login failed');
      return authData;
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              'Verbinding timed out. Controleer je internet en of EXPO_PUBLIC_SUPABASE_URL in .env naar de remote Supabase wijst (niet localhost).',
            ),
          ),
        LOGIN_TIMEOUT_MS,
      );
    });

    try {
      return await Promise.race([loginPromise, timeoutPromise]);
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        'message' in err
      ) {
        throw normalizeAuthError(err as AuthError);
      }
      const msg =
        err instanceof Error ? err.message.toLowerCase() : String(err);
      if (
        msg.includes('network') ||
        msg.includes('fetch failed') ||
        msg.includes('request failed') ||
        msg.includes('connection') ||
        msg.includes('timeout') ||
        msg.includes('econnrefused') ||
        msg.includes('enotfound')
      ) {
        throw new Error(
          'Geen verbinding met de server. Controleer je internet en EXPO_PUBLIC_SUPABASE_URL in .env.',
        );
      }
      throw err;
    }
  },

  async signUp(data: RegisterData) {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: data.fullName ? { full_name: data.fullName } : undefined,
        },
      });
      if (error) throw error;
      if (!authData.user) throw new Error('Failed to create user');
      return authData;
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        'message' in err
      ) {
        throw normalizeAuthError(err as AuthError);
      }
      const msg =
        err instanceof Error ? err.message.toLowerCase() : String(err);
      if (
        msg.includes('network') ||
        msg.includes('fetch failed') ||
        msg.includes('request failed') ||
        msg.includes('connection') ||
        msg.includes('timeout') ||
        msg.includes('econnrefused') ||
        msg.includes('enotfound')
      ) {
        throw new Error(
          'Geen verbinding met de server. Controleer je internet en EXPO_PUBLIC_SUPABASE_URL in .env.',
        );
      }
      throw err;
    }
  },

  async resendSignupConfirmation(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });
      if (error) throw error;
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        'message' in err
      ) {
        throw normalizeAuthError(err as AuthError);
      }
      throw err;
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};
