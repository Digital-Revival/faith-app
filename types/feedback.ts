export type FeedbackCategory = 'bug' | 'idea' | 'other';

export interface SendFeedbackPayload {
  message: string;
  category: FeedbackCategory;
  displayName?: string;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
  locale: string;
}
