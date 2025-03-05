import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import { captureEvent, AnalyticsUtil } from '../lib/analyticsEvents';
import { browserProperties } from '../lib/utils/browserProperties';
import { sentryUrlSetting, sentryReleaseSetting, sentryEnvironmentSetting } from '../lib/instanceSettings';
import { getUserEmail } from "../lib/collections/users/helpers";
import { devicePrefersDarkMode } from "../components/themes/usePrefersDarkMode";

const sentryUrl = sentryUrlSetting.get()
const sentryEnvironment = sentryEnvironmentSetting.get()
const sentryRelease = sentryReleaseSetting.get()

if (sentryUrl && sentryEnvironment && sentryRelease) {
  Sentry.init({
    dsn: sentryUrl,
    environment: sentryEnvironment,
    release: sentryRelease,
    integrations: [
      new SentryIntegrations.Dedupe(),
      new SentryIntegrations.ExtraErrorData(),
    ],
    beforeSend: (event, hint) => {
      // Suppress an uninformative error from ReCaptcha
      // See: https://github.com/getsentry/sentry-javascript/issues/2514
      if (hint?.originalException === "Timeout") {
        return null;
      }
      
      return event;
    }
  });
} else {
  // eslint-disable-next-line no-console
  console.log("Unable to find sentry credentials, so sentry logging is disabled")
}


// Initializing sentry on the client browser
function identifyUserToSentry(user: UsersCurrent | null) {
  // Set user in sentry scope, or clear user if they have logged out
  Sentry.configureScope((scope) => {
    scope.setUser(user ? {id: user._id, email: getUserEmail(user), username: user.username} : null);
  });
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


export function onUserChanged(user: UsersCurrent) {
  identifyUserToSentry(user);
  addUserIdToGoogleAnalytics(user);
}

window.addEventListener('load', ev => {
  const urlParams = new URLSearchParams(document.location?.search)

  captureEvent("pageLoadFinished", {
    url: document.location?.href,
    referrer: document.referrer,
    utmSource: urlParams.get('utm_source'),
    utmMedium: urlParams.get('utm_medium'),
    utmCampaign: urlParams.get('utm_campaign'),
    utmContent: urlParams.get('utm_content'),
    utmTerm: urlParams.get('utm_term'),
    browserProps: browserProperties(),
    prefersDarkMode: devicePrefersDarkMode(),
    performance: {
      memory: (window as any).performance?.memory?.usedJSHeapSize,
      timeOrigin: window.performance?.timeOrigin,
      timing: window.performance?.timing?.toJSON?.(),
    },
  });
});
