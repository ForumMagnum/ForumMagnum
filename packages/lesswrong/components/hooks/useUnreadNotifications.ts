import { useCallback, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useOnFocusTab } from '../hooks/useOnFocusTab';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';

/**
 * Get the number of unread notifications (the number displayed on the badge by
 * the bell icon). Refreshes on navigation and on restoring a background tab.
 *
 * This uses the dedicated unreadNotificationCounts resolver, to deal with a
 * particular subtlety: when refreshing after a navigation or tab focus, the
 * value we have on the client for currentUser.lastNotificationsCheck is not
 * necessarily up to date. In particular if you open a tab, leave it in the
 * background for awhile while checking notifications in other tabs, then
 * come back to the background tab, using the client-cached value for
 * lastNotificationsCheck would cause a spurious unread-notification count.
 */
export function useUnreadNotifications(): {
  unreadNotifications: number
  unreadPrivateMessages: number
  checkedAt: Date|null,
  refetch: ()=>Promise<void>
} {
  const currentUser = useCurrentUser();
  
  const { data, loading, refetch: refetchCounts } = useQuery(gql`
    query UnreadNotificationCountQuery {
      unreadNotificationCounts {
        unreadNotifications
        unreadPrivateMessages
        checkedAt
      }
    }
  `, {
    ssr: true
  });
  
  // Prefetch notifications. This matches the view that the notifications sidebar
  // opens to by default (in `NotificationsMenu`); it isn't actually *used* here
  // but having fetched it puts it into the cache, which saves a load-spinner
  // in the crucial "click the notifications icon after site load" interaction.
  const { refetch: refetchNotifications } = useMulti({
    terms: {
      view: "userNotifications",
      userId: currentUser?._id,
    },
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 20,
    enableTotal: false,
    skip: !currentUser?._id,
  });
  
  const refetchBoth = useCallback(async () => {
    if (currentUser?._id) {
      await Promise.all([
        refetchCounts(),
        refetchNotifications(),
      ]);
    }
  }, [currentUser?._id, refetchCounts, refetchNotifications]);

  useOnNavigate(refetchBoth);
  useOnFocusTab(refetchBoth);
  
  const unreadNotifications = data?.unreadNotificationCounts?.unreadNotifications ?? 0;
  const unreadPrivateMessages = data?.unreadNotificationCounts?.unreadPrivateMessages ?? 0;
  const checkedAt = data?.unreadNotificationCounts?.checkedAt || null;

  const refetchIfNewNotifications = useCallback((messageBlob: string) => {
    // TODO: figure out what's going on with messageBlob (which was formerly timestamp, but,
    // but not well typed)
    if (!checkedAt || messageBlob > checkedAt) {
      void refetchBoth();
    }
  }, [checkedAt, refetchBoth]);
  
  useOnNotificationsChanged(currentUser, refetchIfNewNotifications);

  return { unreadNotifications, unreadPrivateMessages, checkedAt, refetch: refetchBoth };
}

export const useOnNotificationsChanged = (currentUser: UsersCurrent|null, cb: (messageBlob: string)=>void) => {
  useEffect(() => {
    if (!currentUser)
      return;

    const onServerSentNotification = (messageBlob: string) => {
      void cb(messageBlob);
    }
    notificationEventListeners.push(onServerSentNotification);
    serverSentEventsAPI.setServerSentEventsActive?.(true);
    
    return () => {
      notificationEventListeners = notificationEventListeners.filter(l=>l!==onServerSentNotification);
      
      // When removing a server-sent event listener, wait 200ms (just in case this
      // is a rerender with a remove-and-immediately-add-back) then check whether
      // there are zero event listeners.
      setTimeout(() => {
        if (!notificationEventListeners.length)
          serverSentEventsAPI.setServerSentEventsActive?.(false);
      }, 200);
    }
  }, [currentUser, cb]);
}

let notificationEventListeners: Array<(messageBlob: string)=>void> = [];

export function onServerSentNotificationEvent(messageBlob: string) {
  for (let listener of [...notificationEventListeners]) {
    listener(messageBlob);
  }
}

// Provided by the client (if this is running on the client not the server),
// otherwise methods will be null. Methods are filled in by `initServerSentEvents`
// prior to React hydration.
type ServerSentEventsAPI = {
  setServerSentEventsActive: ((active:boolean)=>void)|null
}
export const serverSentEventsAPI: ServerSentEventsAPI = {
  setServerSentEventsActive: null,
};
