import AiDigestReadyNotificationHover from '@/components/notifications/AiDigestReadyNotificationHover';
import CommentOnYourDraftNotificationHover from '@/components/notifications/CommentOnYourDraftNotificationHover';
import TypoSuggestionHover from '@/components/notifications/TypoSuggestionHover';
import type { ComponentType } from 'react';

export const onsiteHoverViewComponents: Partial<Record<string, () => ComponentType<{ notification: NotificationsList }>>> = {
  aiDigestReady: () => AiDigestReadyNotificationHover,
  newCommentOnDraft: () => CommentOnYourDraftNotificationHover,
  typoSuggestion: () => TypoSuggestionHover,
};
