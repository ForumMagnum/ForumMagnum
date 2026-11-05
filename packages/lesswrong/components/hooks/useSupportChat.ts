import { useCallback } from 'react';
import { openHailbox, sendHailboxMessage } from 'hailbox';
import { useCurrentUser } from '@/components/common/withUser';
import { useForumType } from '@/components/hooks/useForumType';
import { useMessages } from '@/components/common/withMessages';
import { userHasHailbox } from '@/lib/betas';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';

const hailboxUnavailableMessage = "Couldn't open the support chat. It's unavailable if you've hidden it in your settings, haven't allowed functional cookies, or are on a page that doesn't show it.";

export const useOpenSupportChat = () => {
  const currentUser = useCurrentUser();
  const { forumType } = useForumType();
  const { flash } = useMessages();
  return useCallback((eventName: string) => {
    if (!userHasHailbox(currentUser, forumType)) {
      // eslint-disable-next-line babel/new-cap
      window.Intercom("trackEvent", eventName);
      return;
    }
    if (!openHailbox()) {
      flash({ messageString: hailboxUnavailableMessage, type: 'error' });
    }
  }, [currentUser, forumType, flash]);
}

export const useRequestPostFeedback = () => {
  const currentUser = useCurrentUser();
  const { forumType } = useForumType();
  const { flash } = useMessages();
  return useCallback((post: { _id: string, title: string }): boolean => {
    const url = getSiteUrl(forumType) + "posts/" + post._id;
    if (!userHasHailbox(currentUser, forumType)) {
      // eslint-disable-next-line babel/new-cap
      window.Intercom("trackEvent", "requested-feedback", { title: post.title, _id: post._id, url });
      return true;
    }
    const sent = sendHailboxMessage(`I'd like feedback on my post "${post.title}": ${url}`);
    if (!sent) {
      flash({ messageString: hailboxUnavailableMessage, type: 'error' });
    }
    return sent;
  }, [currentUser, forumType, flash]);
}
