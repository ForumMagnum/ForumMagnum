import React, {useContext, useEffect} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { clientContextVars, flushClientEvents, captureEvent } from '../../lib/analyticsEvents';
import { useCurrentUser } from './withUser';
import withErrorBoundary from './withErrorBoundary';
import { ABTestGroupsUsedContext } from '@/components/common/sharedContexts';
import { CLIENT_ID_COOKIE, LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { isLWorAF } from '../../lib/instanceSettings';
import { getAllUserABTestGroups } from '@/lib/abTestImpl';

export const AnalyticsClient = () => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookiesWithConsent([
    CLIENT_ID_COOKIE,
    LAST_VISITED_FRONTPAGE_COOKIE,
  ]);
  const abTestGroupsUsed = useContext(ABTestGroupsUsedContext);
  
  const currentUserId = currentUser?._id;
  const clientId = cookies[CLIENT_ID_COOKIE];
  useEffect(() => {
    clientContextVars.userId = currentUserId;
    clientContextVars.clientId = clientId;
    clientContextVars.tabId = window.tabId;
    if (!isLWorAF()) {
      clientContextVars.abTestGroupsUsed = abTestGroupsUsed;
    }
    // There may be events waiting for the client context vars to be set, so flush them now
    flushClientEvents(true);
  }, [currentUserId, clientId, currentUser, abTestGroupsUsed]);

  // Fire a one-time per-tab lifecycle event when a new tab/app instance starts
  useEffect(() => {
    const tabId = window.tabId;
    if (!tabId) return;
    const firedKey = `tabStartedFired:${tabId}`;
    if (sessionStorage.getItem(firedKey)) return;

    const userAgent = navigator.userAgent ?? null;
    const abTestGroups = getAllUserABTestGroups(currentUser ? { user: currentUser } : { clientId });

    captureEvent("tabStarted", {
      tabId,
      userAgent,
      abTestGroups,
      cookies: {
        isReturningVisitor: !!cookies[LAST_VISITED_FRONTPAGE_COOKIE],
      },
    });
    sessionStorage.setItem(firedKey, "1");
    flushClientEvents(true);
  // Intentionally run once per mount/tab, not on user or cookie changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return <></>;
}

export default registerComponent("AnalyticsClient", AnalyticsClient, {
  hocs: [withErrorBoundary]
});


