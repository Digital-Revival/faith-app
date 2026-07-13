import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppViewMode = "member" | "admin";

const ADMIN_VIEW_MODE_KEY = (userId: string) =>
  `@faith_app:admin_view_mode:${userId}`;

export async function getStoredAdminViewMode(
  userId: string,
): Promise<AppViewMode> {
  try {
    const storedMode = await AsyncStorage.getItem(ADMIN_VIEW_MODE_KEY(userId));
    return storedMode === "admin" ? "admin" : "member";
  } catch {
    return "member";
  }
}

export async function setStoredAdminViewMode(
  userId: string,
  mode: AppViewMode,
): Promise<void> {
  await AsyncStorage.setItem(ADMIN_VIEW_MODE_KEY(userId), mode);
}
