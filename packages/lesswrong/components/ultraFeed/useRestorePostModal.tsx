import React, { useEffect, useRef } from 'react';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { useDialog } from '../common/withDialog';
import { useTracking } from '@/lib/analyticsEvents';
import UltraFeedPostDialogWrapper from './UltraFeedPostDialogWrapper';

/**
 * Hook that restores the UltraFeed post modal when modalPostId is present in the URL.
 * This allows sharing direct links to posts that open in the modal view.
 * Used in both UltraFeed and BookmarksFeed.
 */
export const useRestorePostModal = () => {
  const location = useSubscribedLocation();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const openedModalPostIdRef = useRef<string | null>(null);

  useEffect(() => {
    const modalPostId = location.query.modalPostId;
    
    if (modalPostId && modalPostId !== openedModalPostIdRef.current) {
      openedModalPostIdRef.current = modalPostId;
      captureEvent("ultraFeedPostDialogRestored", { source: "queryParam" });
      openDialog({
        name: "UltraFeedPostDialogWrapper",
        contents: ({onClose}) => <UltraFeedPostDialogWrapper onClose={onClose} postId={modalPostId} />
      });
    } else if (!modalPostId && openedModalPostIdRef.current) {
      openedModalPostIdRef.current = null;
    }
  }, [location.query.modalPostId, openDialog, captureEvent]);
}; 
