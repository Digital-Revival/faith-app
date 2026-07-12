import * as Haptics from 'expo-haptics';

let easyReadHapticsDisabled = false;

export function setEasyReadHapticsDisabled(disabled: boolean): void {
  easyReadHapticsDisabled = disabled;
}

export function bzzt(): void {
  if (easyReadHapticsDisabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function bzztMedium(): void {
  if (easyReadHapticsDisabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function bzztWarning(): void {
  if (easyReadHapticsDisabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
