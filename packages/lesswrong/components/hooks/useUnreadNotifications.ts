import { useCallback, useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useOnFocusTab } from '../hooks/useOnFocusTab';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from './useUpdateCurrentUser';
import { faviconUrlSetting, faviconWithBadgeSetting } from '../../lib/instanceSettings';
import type { NotificationCountsResult } from '../../lib/collections/notifications/schema';


/**
 * Provided by the client (if this is running on the client not the server),
 * otherwise methods will be null. Methods are filled in by `initServerSentEvents`
 * prior to React hydration.
 */
type ServerSentEventsAPI = {
  setServerSentEventsActive: ((active:boolean)=>void)|null
}
export const serverSentEventsAPI: ServerSentEventsAPI = {
  setServerSentEventsActive: null,
};

export type TypingIndicatorMessage = {
  eventType: 'typingIndicator',
  typingIndicators: TypingIndicatorInfo[],
}

export type NotificationCheckMessage = {
  eventType: 'notificationCheck',
  stop?: boolean,
  newestNotificationTime?: string //stringified date
}

export type ServerSentEventsMessage = TypingIndicatorMessage | NotificationCheckMessage;

const notificationsCheckedAtLocalStorageKey = "notificationsCheckedAt";

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
  notificationsOpened: ()=>Promise<void>
  faviconBadgeNumber: number
} {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  
  function updateFavicon(result: { unreadNotificationCounts: NotificationCountsResult }) {
    const faviconBadgeNumber = result.unreadNotificationCounts?.faviconBadgeNumber;
    setFaviconBadge(faviconBadgeNumber);
  }
  
  const { data, refetch: refetchCounts } = useQuery(gql`
    query UnreadNotificationCountQuery {
      unreadNotificationCounts {
        unreadNotifications
        unreadPrivateMessages
        faviconBadgeNumber
        checkedAt
      }
    }
  `, {
    ssr: true,
    onCompleted: updateFavicon,
  });

  const unreadNotifications = data?.unreadNotificationCounts?.unreadNotifications ?? 0;
  const unreadPrivateMessages = data?.unreadNotificationCounts?.unreadPrivateMessages ?? 0;
  const faviconBadgeNumber = data?.unreadNotificationCounts?.faviconBadgeNumber ?? 0;
  const checkedAt = data?.unreadNotificationCounts?.checkedAt || null;
  
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
      void refetchNotifications();

      const newCounts = await refetchCounts();
      updateFavicon(newCounts.data);
    }
  }, [currentUser?._id, refetchCounts, refetchNotifications]);

  // Subscribe to localStorage change events. The localStorage key
  // "notificationsCheckedAt" contains a date; when the user checks
  // notifications they write that key. If there's a badge notification,
  // other tabs handle the event by clearing the badge.
  useEffect(() => {
    const storageEventListener = (event: StorageEvent) => {
      if (
        event.key === notificationsCheckedAtLocalStorageKey
        && event.newValue
      ) {
        const newCheckedAt = new Date(event.newValue);
        if (checkedAt && newCheckedAt>checkedAt) {
          void refetchCounts();
        }
      }
    };
    window.addEventListener("storage", storageEventListener);

    return () => {
      window.removeEventListener("storage", storageEventListener);
    };
  }, [refetchCounts, checkedAt, refetchBoth, updateCurrentUser]);

  useOnNavigate(refetchBoth);
  useOnFocusTab(refetchBoth);
  
  const refetchIfNewNotifications = useCallback((message: ServerSentEventsMessage) => {
    if (message.eventType === 'notificationCheck') {
      const timestamp = message.newestNotificationTime;
      if (!checkedAt || (timestamp && new Date(timestamp) > new Date(checkedAt))) {
        void refetchBoth();
      }
    }
  }, [checkedAt, refetchBoth]);
  
  useOnNotificationsChanged(currentUser, refetchIfNewNotifications);
  
  const notificationsOpened = useCallback(async () => {
    const now = new Date();
    await updateCurrentUser({
      lastNotificationsCheck: now,
    });
    await refetchBoth();
    window.localStorage.setItem(notificationsCheckedAtLocalStorageKey, now.toISOString());
  }, [refetchBoth, updateCurrentUser]);

  return {
    unreadNotifications,
    unreadPrivateMessages,
    faviconBadgeNumber,
    checkedAt,
    notificationsOpened
  };
}

export const useOnNotificationsChanged = (currentUser: UsersCurrent|null, cb: (message: ServerSentEventsMessage)=>void) => {
  useEffect(() => {
    if (!currentUser)
      return;

    const onServerSentNotification = (message: ServerSentEventsMessage) => {
      void cb(message);
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

/**
 * Set whether or not this tab's favicon has a badge (indicating unread
 * messages) on it. This takes a notification count, but only pays attention to
 * whether it's >0 or not (because the tab-bar icon is too small to display a
 * number in practice).
 *
 * This works by finding the <link rel="icon" href="..."> in the page's <head>
 * block and editing it directly. That <link rel> isn't owned by React (it's
 * part of the page-template that gets set up by SSR). We do it in this non-
 * Reacty way because React doesn't rerender components while the tab is in the
 * background.
 */
function setFaviconBadge(notificationCount: number) {
  const faviconLinkRel = document.querySelector("link[rel$=icon]");
  if (faviconLinkRel) {
    if (notificationCount > 0) {
      faviconLinkRel.setAttribute("href", faviconWithBadgeSetting.get() ?? faviconUrlSetting.get());
    } else {
      faviconLinkRel.setAttribute("href", faviconUrlSetting.get());
    }
  }
}

let notificationEventListeners: Array<(message: ServerSentEventsMessage)=>void> = [];

export function onServerSentNotificationEvent(message: ServerSentEventsMessage) {
  for (let listener of [...notificationEventListeners]) {
    listener(message);
  }
}
