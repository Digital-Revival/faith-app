import type { Href } from "expo-router";

export const routes = {
  onboarding: () => '/onboarding' as Href,
  main: () => "/(main)" as Href,
  bibleschool: () => "/(main)/bibleschool" as Href,
  bibleschoolIntro: () => "/(main)/bibleschool/intro" as Href,
  bibleschoolModuleLesson: (moduleId: string, lessonId: string): Href =>
    `/(main)/bibleschool/modules/${moduleId}/${lessonId}` as Href,
  bibleschoolModules: () => "/(main)/bibleschool/modules" as Href,
  bibleschoolVoortgang: () => "/(main)/bibleschool/voortgang" as Href,
  bibleschoolModule: (moduleId: string): Href =>
    `/(main)/bibleschool/modules/${moduleId}` as Href,
  bibleschoolModuleExam: (moduleId: string): Href =>
    `/(main)/bibleschool/modules/${moduleId}/exam` as Href,
  admin: (path?: string): Href =>
    (path ? `/(main)/admin/${path}` : "/(main)/admin") as Href,
  auth: (screen: "login" | "register" | "forgot-password") =>
    `/(auth)/${screen}` as Href,
  authForgotPassword: () => "/(auth)/forgot-password" as Href,
  authResetPassword: () => "/reset-password" as Href,
  authVerifyEmail: (email: string) =>
    `/(auth)/verify-email?email=${encodeURIComponent(email)}` as Href,
  profile: (sub?: "information" | "password"): Href =>
    (sub ? `/(main)/profile/${sub}` : "/(main)/profile") as Href,
  badges: (badgeId?: string): Href =>
    (badgeId
      ? `/(main)/badges?badgeId=${encodeURIComponent(badgeId)}`
      : "/(main)/badges") as Href,
  settings: (sub?: "preferences" | "video" | "notifications"): Href =>
    (sub ? `/(main)/settings/${sub}` : "/(main)/settings") as Href,
  podcasts: () => "/(main)/podcasts" as Href,
  sermons: () => "/(main)/sermons" as Href,
  faithBusinessSchool: () => "/(main)/faith-business-school" as Href,
  hubTeaser: (section: string) =>
    `/(main)/hub-teaser?section=${encodeURIComponent(section)}` as Href,
};
