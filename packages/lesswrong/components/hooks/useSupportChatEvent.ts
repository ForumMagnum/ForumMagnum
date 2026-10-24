import { useCallback } from 'react';
import { openHailbox } from 'hailbox';
import { useCurrentUser } from '@/components/common/withUser';
import { useForumType } from '@/components/hooks/useForumType';
import { userHasHailbox } from '@/lib/betas';

export const useSupportChatEvent = () => {
  const currentUser = useCurrentUser();
  const { forumType } = useForumType();
  return useCallback((eventName: string, metadata?: Record<string, string>) => {
    if (userHasHailbox(currentUser, forumType)) {
      openHailbox();
      return;
    }
    // eslint-disable-next-line babel/new-cap
    window.Intercom("trackEvent", eventName, metadata);
  }, [currentUser, forumType]);
}
