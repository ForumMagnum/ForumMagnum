import { useCallback } from 'react';
import { useRejectContent } from '@/components/hooks/useRejectContent';
import { useRejectContentAndRemoveFromQueue } from './useRejectContentAndRemoveFromQueue';
import { isPost, type ContentItem } from './helpers';
import type { RejectSidebarTab } from './sidebarTabs';

const SUBMIT_LABELS: Record<RejectSidebarTab, string> = {
  reject: 'Reject',
  rejectAndRemove: 'Reject & Remove',
  // Nothing happens until the DM is sent, so this reads as the step it is
  rejectRestrictAndNotify: 'Continue to DM',
};

/**
 * What submitting the rejection composer does, which depends on which of the
 * reject tabs the moderator opened it from: rejecting the content on its own,
 * rejecting it and taking the author out of the review queue, or handing the
 * composed reason to the DM composer, which restricts the author when it sends.
 */
export function useRejectPanelSubmit({ user, focusedContent, rejectTab, addToUndoQueue, onComposeRestrictNotifyDm }: {
  user: SunshineUsersList,
  focusedContent: ContentItem,
  rejectTab: RejectSidebarTab,
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void,
  onComposeRestrictNotifyDm: (rejectedReason: string) => void,
}) {
  const { rejectContent } = useRejectContent();
  const rejectContentAndRemoveFromQueue = useRejectContentAndRemoveFromQueue();

  const submitRejection = useCallback((rejectedReason: string) => {
    if (rejectTab === 'rejectRestrictAndNotify') {
      onComposeRestrictNotifyDm(rejectedReason);
      return;
    }

    if (rejectTab === 'rejectAndRemove') {
      addToUndoQueue('Rejected & Removed', () => rejectContentAndRemoveFromQueue({
        userId: user._id,
        documentId: focusedContent._id,
        collectionName: isPost(focusedContent) ? 'Posts' : 'Comments',
        rejectedReason,
      }));
      return;
    }

    if (isPost(focusedContent)) {
      void rejectContent({ collectionName: 'Posts', document: focusedContent, reason: rejectedReason });
    } else {
      void rejectContent({ collectionName: 'Comments', document: focusedContent, reason: rejectedReason });
    }
  }, [rejectTab, user._id, focusedContent, rejectContent, rejectContentAndRemoveFromQueue, addToUndoQueue, onComposeRestrictNotifyDm]);

  return { submitLabel: SUBMIT_LABELS[rejectTab], submitRejection };
}
