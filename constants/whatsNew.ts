import type { Ionicons } from '@expo/vector-icons';

export type WhatsNewCategory = 'added' | 'improved' | 'fixed';

export interface WhatsNewItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descriptionKey: string;
  category: WhatsNewCategory;
}

export interface WhatsNewRelease {
  version: string;
  date: string;
  items: WhatsNewItem[];
}

export const WHATS_NEW_MAX_RELEASES = 10;

export const WHATS_NEW_RELEASES: WhatsNewRelease[] = [
  {
    version: '2.0.1',
    date: '2026-06-18',
    items: [
      {
        id: 'whatsNew',
        icon: 'sparkles-outline',
        titleKey: 'whatsNew.releases.v2_0_1.whatsNew.title',
        descriptionKey: 'whatsNew.releases.v2_0_1.whatsNew.description',
        category: 'added',
      },
      {
        id: 'passwordReset',
        icon: 'key-outline',
        titleKey: 'whatsNew.releases.v2_0_1.passwordReset.title',
        descriptionKey: 'whatsNew.releases.v2_0_1.passwordReset.description',
        category: 'added',
      },
      {
        id: 'changePassword',
        icon: 'lock-closed-outline',
        titleKey: 'whatsNew.releases.v2_0_1.changePassword.title',
        descriptionKey: 'whatsNew.releases.v2_0_1.changePassword.description',
        category: 'added',
      },
      {
        id: 'feedback',
        icon: 'chatbubble-ellipses-outline',
        titleKey: 'whatsNew.releases.v2_0_1.feedback.title',
        descriptionKey: 'whatsNew.releases.v2_0_1.feedback.description',
        category: 'added',
      },
    ],
  },
];
