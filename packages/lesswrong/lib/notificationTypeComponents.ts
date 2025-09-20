import CommentOnYourDraftNotificationHover from '@/components/notifications/CommentOnYourDraftNotificationHover';
import type { ComponentType } from 'react';

export const onsiteHoverViewComponents: Partial<Record<string, () => ComponentType<{ notification: NotificationsList }>>> = {
  newCommentOnDraft: () => CommentOnYourDraftNotificationHover,
};
