import { BrandedSplashScreen } from "@/components/ui/BrandedSplashScreen";
import { useAuth } from "@/contexts/AuthContext";
import { stackScreenOptions } from "@/constants/screenAnimationOptions";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <BrandedSplashScreen />;
  }

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={stackScreenOptions({
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      })}
    >
      <Stack.Screen name="login/index" options={{ title: "Inloggen" }} />
      <Stack.Screen
        name="register/index"
        options={{ title: "Registreren" }}
      />
      <Stack.Screen
        name="verify-email/index"
        options={{ title: "E-mail bevestigen" }}
      />
      <Stack.Screen
        name="forgot-password/index"
        options={{ title: "Wachtwoord vergeten" }}
      />
    </Stack>
  );
}
