import React, { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useOnNavigate } from '../hooks/useOnNavigate';
import { useOnFocusTab } from '../hooks/useOnFocusTab';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from './useUpdateCurrentUser';
import { type QueryRef, useBackgroundQuery, useReadQuery } from '@apollo/client/react';
import { NotificationsListMultiQuery } from '../notifications/NotificationsListMultiQuery';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import type { ResultOf } from '@graphql-typed-document-node/core';
import ErrorBoundary from '../common/ErrorBoundary';
import { useIdlenessDetection } from './useIdlenessDetection';
import { usePageVisibility } from './usePageVisibility';
import { faviconUrlSetting, faviconWithBadgeSetting } from '../../lib/instanceSettings';

export type NotificationCountsResult = {
  checkedAt: Date,
  unreadNotifications: number
  unreadPrivateMessages: number
  faviconBadgeNumber: number
};

const notificationsCheckedAtLocalStorageKey = "notificationsCheckedAt";

// Polling interval in milliseconds (5 seconds)
const POLLING_INTERVAL = 5 * 1000;

const UnreadNotificationCountsQuery = gql(`
    query UnreadNotificationCountQuery {
      unreadNotificationCounts {
        unreadNotifications
        unreadPrivateMessages
        faviconBadgeNumber
        checkedAt
      }
    }
  `)

type UnreadNotificationsContext = {
  unreadNotificationCountsQueryRef: QueryRef<ResultOf<typeof UnreadNotificationCountsQuery>> | null,
  notificationsOpened: () => Promise<void>,
  refetchUnreadNotifications: () => Promise<void>,
}

const unreadNotificationsContext = createContext<UnreadNotificationsContext>({
  unreadNotificationCountsQueryRef: null,
  notificationsOpened: async () => {},
  refetchUnreadNotifications: async () => {},
});

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
export const UnreadNotificationsContextProvider: FC<{
  children: ReactNode,
}> = ({children}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  
  //function updateFavicon(unreadNotificationCounts: NotificationCountsResult) {
    /*
     * TODO: this is disabled right now because it's not a great experience showing up on all tabs for all notifications.
     * Will re-enable it when we figure out a better ontology, i.e. showing it only on dialogue pages for new dialogue content,
     * or only showing it on the page where a user is actively in a conversation and got a new DM.
     */
    // const faviconBadgeNumber = result.unreadNotificationCounts?.faviconBadgeNumber;
    // setFaviconBadge(faviconBadgeNumber);
  //}
  
  const [unreadNotificationCountsQueryRef, {refetch: refetchCounts}] = useBackgroundQuery(UnreadNotificationCountsQuery, {
    skip: !currentUser?._id,
    //onCompleted: (data) => updateFavicon(withDateFields(data.unreadNotificationCounts, ['checkedAt'])),
  });

  // Prefetch notifications. This matches the view that the notifications sidebar
  // opens to by default (in `NotificationsMenu`); it isn't actually *used* here
  // but having fetched it puts it into the cache, which saves a load-spinner
  // in the crucial "click the notifications icon after site load" interaction.
  const [_queryRef, {refetch: refetchNotifications}] = useBackgroundQuery(NotificationsListMultiQuery, {
    variables: {
      selector: { userNotifications: { userId: currentUser?._id } },
      limit: 20,
      enableTotal: false,
    },
    skip: !currentUser?._id,
  });
  
  const refetchBoth = useCallback(async () => {
    if (currentUser?._id) {
      void refetchNotifications();

      const newCounts = await refetchCounts();
      //updateFavicon(withDateFields(newCounts.data.unreadNotificationCounts, ['checkedAt']));
    }
  }, [currentUser?._id, refetchCounts, refetchNotifications]);

  useOnNavigate(refetchBoth);
  useOnFocusTab(refetchBoth);
  
  const notificationsOpened = useCallback(async () => {
    const now = new Date();
    await updateCurrentUser({
      lastNotificationsCheck: now,
    });
    await refetchBoth();
    window.localStorage.setItem(notificationsCheckedAtLocalStorageKey, now.toISOString());
  }, [refetchBoth, updateCurrentUser]);

  const providedContext: UnreadNotificationsContext = useMemo(() => ({
    unreadNotificationCountsQueryRef: unreadNotificationCountsQueryRef!,
    notificationsOpened,
    refetchUnreadNotifications: refetchBoth,
  }), [ unreadNotificationCountsQueryRef, notificationsOpened, refetchBoth ]);

  return (
    <unreadNotificationsContext.Provider value={providedContext}>
      {unreadNotificationCountsQueryRef && <ErrorBoundary hideMessage>
        <SuspenseWrapper name="useUnreadNotifications">
          <NotificationsEffects queryRef={unreadNotificationCountsQueryRef} refetchCounts={refetchCounts} refetchBoth={refetchBoth} />
        </SuspenseWrapper>
      </ErrorBoundary>}
      {children}
    </unreadNotificationsContext.Provider>
  );
}

export const useUnreadNotifications = () => useContext(unreadNotificationsContext);

const NotificationsEffects = ({queryRef, refetchCounts, refetchBoth}: {
  queryRef: QueryRef<ResultOf<typeof UnreadNotificationCountsQuery>>,
  refetchCounts: () => void
  refetchBoth: () => void
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const unreadNotificationCounts = useReadQuery(queryRef);
  const checkedAt = unreadNotificationCounts.data.unreadNotificationCounts.checkedAt;
  const { userIsIdle } = useIdlenessDetection(30);
  const { pageIsVisible } = usePageVisibility();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        if (checkedAt && newCheckedAt.getTime() > new Date(checkedAt).getTime()) {
          void refetchCounts();
        }
      }
    };
    window.addEventListener("storage", storageEventListener);

    return () => {
      window.removeEventListener("storage", storageEventListener);
    };
  }, [refetchCounts, checkedAt, refetchBoth, updateCurrentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Only start polling if user is active and page is visible
      if (!userIsIdle && pageIsVisible) {
        pollingIntervalRef.current = setInterval(() => {
          void refetchBoth();
        }, POLLING_INTERVAL);
      }
    };

    startPolling();

    // Reset polling state when idle/visibility state changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentUser, userIsIdle, pageIsVisible, refetchBoth]);

  return null;
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

