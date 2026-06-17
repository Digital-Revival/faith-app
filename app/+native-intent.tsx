/**
 * Rewrites incoming native deep links so Expo Router opens the reset-password screen.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  const normalized = path.replace(/^\/+/, '');
  if (
    normalized === 'reset-password' ||
    normalized.startsWith('reset-password/') ||
    normalized.includes('reset-password')
  ) {
    return '/reset-password';
  }
  return path;
}
