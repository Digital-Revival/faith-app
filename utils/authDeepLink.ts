import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as SecureStore from 'expo-secure-store';

import { RECOVERY_URL_STORAGE_KEY } from '@/constants/auth';
import { authService } from '@/services/api/authService';

/** Holds the full recovery deep link until reset-password consumes it (avoids hash loss on router.replace). */
let capturedRecoveryUrl: string | null = null;

export function captureRecoveryUrl(url: string): void {
  if (hasRecoveryParams(url)) {
    capturedRecoveryUrl = url;
  }
}

export function getCapturedRecoveryUrl(): string | null {
  return capturedRecoveryUrl;
}

export function clearCapturedRecoveryUrl(): void {
  capturedRecoveryUrl = null;
}

export function resolveRecoveryUrl(
  linkUrl: string | null | undefined,
  initialUrl: string | null | undefined,
): string | null {
  const captured = getCapturedRecoveryUrl();
  if (captured) return captured;
  if (linkUrl && hasRecoveryParams(linkUrl)) return linkUrl;
  if (initialUrl && hasRecoveryParams(initialUrl)) return initialUrl;
  return linkUrl ?? initialUrl ?? null;
}

export function hasRecoveryParams(url: string): boolean {
  const { params } = QueryParams.getQueryParams(url);
  const { access_token, refresh_token, type } = params;
  return type === 'recovery' && !!access_token && !!refresh_token;
}

export async function createSessionFromRecoveryUrl(
  url: string,
): Promise<boolean> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token, type } = params;
  if (!access_token || !refresh_token || type !== 'recovery') return false;

  await authService.setRecoverySession(access_token, refresh_token);
  return true;
}

export async function isRecoveryUrlAlreadyProcessed(url: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(RECOVERY_URL_STORAGE_KEY);
  return stored === url;
}

export async function markRecoveryUrlProcessed(url: string): Promise<void> {
  await SecureStore.setItemAsync(RECOVERY_URL_STORAGE_KEY, url);
}

export async function clearProcessedRecoveryUrl(): Promise<void> {
  clearCapturedRecoveryUrl();
  await SecureStore.deleteItemAsync(RECOVERY_URL_STORAGE_KEY);
}
