import React, {useContext, useEffect} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { clientContextVars } from '../../lib/analyticsEvents';
import { useCurrentUser } from './withUser';
import withErrorBoundary from './withErrorBoundary';
import { ABTestGroupsUsedContext } from '../../lib/abTestImpl';
import { CLIENT_ID_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { isLWorAF } from '../../lib/instanceSettings';

export const AnalyticsClient = () => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookiesWithConsent([CLIENT_ID_COOKIE]);
  const abTestGroupsUsed = useContext(ABTestGroupsUsedContext);
  
  const currentUserId = currentUser?._id;
  const clientId = cookies[CLIENT_ID_COOKIE];
  useEffect(() => {
    clientContextVars.userId = currentUserId;
    clientContextVars.clientId = clientId;
    clientContextVars.tabId = window.tabId;
    if (!isLWorAF) {
      clientContextVars.abTestGroupsUsed = abTestGroupsUsed;
    }
  }, [currentUserId, clientId, currentUser, abTestGroupsUsed]);
  
  return <div/>;
}

export default registerComponent("AnalyticsClient", AnalyticsClient, {
  hocs: [withErrorBoundary]
});


