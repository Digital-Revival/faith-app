import type { ComponentType } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { EasyReadToggle } from '../_components/EasyReadToggle';
import { ThemeSwitcher } from '../_components/ThemeSwitcher';
import { VideoQualitySelector } from '../_components/VideoQualitySelector';
import { NotificationToggle } from '../_components/NotificationToggle';

export interface SettingsRowConfig {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  component: ComponentType<Record<string, unknown>>;
  componentProps?: Record<string, unknown>;
  fullWidthChildren?: boolean;
  isLast?: boolean;
  useCard?: boolean;
  descriptionKey?: string;
}

export interface SettingsSectionConfig {
  id: string;
  titleKey: string;
  rows: SettingsRowConfig[];
}

export const SETTINGS_SECTIONS: SettingsSectionConfig[] = [
  {
    id: 'preferences',
    titleKey: 'settings.preferences',
    rows: [
      {
        id: 'language',
        icon: 'language',
        labelKey: 'settings.language',
        component: LanguageSwitcher,
        componentProps: { fullWidth: true },
        fullWidthChildren: true,
        useCard: true,
      },
      {
        id: 'easy-read',
        icon: 'accessibility',
        labelKey: 'settings.easyRead',
        descriptionKey: 'settings.easyReadDescription',
        component: EasyReadToggle,
        isLast: false,
      },
      {
        id: 'theme',
        icon: 'color-palette',
        labelKey: 'settings.theme',
        component: ThemeSwitcher,
        componentProps: { fullWidth: true },
        fullWidthChildren: true,
        isLast: true,
        useCard: true,
      },
    ],
  },
  {
    id: 'video',
    titleKey: 'settings.video',
    rows: [
      {
        id: 'video-quality',
        icon: 'videocam',
        labelKey: 'settings.videoQuality',
        component: VideoQualitySelector,
        componentProps: { fullWidth: true },
        fullWidthChildren: true,
        isLast: true,
        useCard: true,
        descriptionKey: 'settings.videoQualityDescription',
      },
    ],
  },
  {
    id: 'notifications',
    titleKey: 'settings.notifications',
    rows: [
      {
        id: 'notifications-master',
        icon: 'notifications',
        labelKey: 'settings.notificationsPush',
        component: NotificationToggle as unknown as ComponentType<Record<string, unknown>>,
        componentProps: { settingKey: 'notifications.enabled' },
        isLast: false,
      },
      {
        id: 'notifications-lessons',
        icon: 'book',
        labelKey: 'settings.notificationsLessonReminders',
        descriptionKey: 'settings.notificationsLessonRemindersDescription',
        component: NotificationToggle as unknown as ComponentType<Record<string, unknown>>,
        componentProps: { settingKey: 'notifications.lesson_reminders' },
        isLast: false,
      },
      {
        id: 'notifications-streak',
        icon: 'flame',
        labelKey: 'settings.notificationsStreakReminders',
        component: NotificationToggle as unknown as ComponentType<Record<string, unknown>>,
        componentProps: { settingKey: 'notifications.streak_reminders' },
        isLast: false,
      },
      {
        id: 'notifications-exam',
        icon: 'school',
        labelKey: 'settings.notificationsExamReminders',
        component: NotificationToggle as unknown as ComponentType<Record<string, unknown>>,
        componentProps: { settingKey: 'notifications.exam_reminders' },
        isLast: false,
      },
      {
        id: 'notifications-content',
        icon: 'sparkles',
        labelKey: 'settings.notificationsNewContent',
        component: NotificationToggle as unknown as ComponentType<Record<string, unknown>>,
        componentProps: { settingKey: 'notifications.new_content' },
        isLast: true,
      },
    ],
  },
];

const __expoRouterPrivateRoute_settingsSections = () => null;

export default __expoRouterPrivateRoute_settingsSections;
