import { captureEvent } from '../lib/analyticsEvents';
import { browserProperties } from '../lib/utils/browserProperties';
import { getUserEmail } from "../lib/collections/users/helpers";
import { devicePrefersDarkMode } from "../components/themes/usePrefersDarkMode";
import { configureDatadogRum } from './datadogRum';
import type { UtmParam } from '@/server/analytics/utm-tracking';
import { CamelCaseify } from '@/lib/vulcan-lib/utils';
import { getIsolationScope } from '@sentry/nextjs';


// Initializing sentry on the client browser
function identifyUserToSentry(user: UsersCurrent | null) {
  // Set user in sentry scope, or clear user if they have logged out
  // Requests are carved up with isolation scopes
  const scope = getIsolationScope();
  scope.setUser(user ? {id: user._id, email: getUserEmail(user), username: user.username ?? undefined} : null);
}

function addUserIdToGoogleAnalytics(user: UsersCurrent | null) {
  const dataLayer = (window as any).dataLayer
  if (!dataLayer) {
    // eslint-disable-next-line no-console
    console.warn("Trying to call gtag before dataLayer has been initialized")
  } else {
    dataLayer.push({userId: user ? user._id : null})
  }
}


export function onUserChanged(user: UsersCurrent | null) {
  identifyUserToSentry(user);
  addUserIdToGoogleAnalytics(user);
  void configureDatadogRum(user);
}

window.addEventListener('load', ev => {
  const urlParams = new URLSearchParams(document.location?.search)

  const eventPayload: Record<CamelCaseify<UtmParam, '_'>, string | null> & Record<string, AnyBecauseIsInput> = {
    url: document.location?.href,
    referrer: document.referrer,
    utmSource: urlParams.get('utm_source'),
    utmMedium: urlParams.get('utm_medium'),
    utmCampaign: urlParams.get('utm_campaign'),
    utmContent: urlParams.get('utm_content'),
    utmTerm: urlParams.get('utm_term'),
    utmUserId: urlParams.get('utm_user_id'),
    browserProps: browserProperties(),
    prefersDarkMode: devicePrefersDarkMode(),
    performance: {
      memory: (window as any).performance?.memory?.usedJSHeapSize,
      timeOrigin: window.performance?.timeOrigin,
      timing: window.performance?.timing?.toJSON?.(),
    },
  }

  captureEvent("pageLoadFinished", eventPayload);
});
