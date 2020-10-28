import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import { addCallback } from '../lib/vulcan-lib';
import type { RouterLocation } from '../lib/vulcan-lib/routes';
import { captureEvent, AnalyticsUtil } from '../lib/analyticsEvents';
import { browserProperties } from '../lib/utils/browserProperties';
import { sentryUrlSetting, sentryReleaseSetting, sentryEnvironmentSetting } from '../lib/instanceSettings';

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
  });
} else {
  // eslint-disable-next-line no-console
  console.log("Unable to find sentry credentials, so sentry logging is disabled")
}


// Initializing sentry on the client browser

function identifyUserToSentry(user: UsersCurrent) {
  // Set user in sentry scope
  Sentry.configureScope((scope) => {
    scope.setUser({id: user._id, email: user.email, username: user.username});
  });
}

addCallback('events.identify', identifyUserToSentry)

function addUserIdToGoogleAnalytics(user: UsersCurrent) {
  if (window && (window as any).ga) {
    (window as any).ga('set', 'userId', user._id); // Set the user ID using signed-in user_id.
  }
}

addCallback('events.identify', addUserIdToGoogleAnalytics)

window.addEventListener('load', ev => {
  captureEvent("pageLoadFinished", {
    url: document.location?.href,
    referrer: document.referrer,
    browserProps: browserProperties(),
    performance: {
      memory: (window as any).performance?.memory?.usedJSHeapSize,
      timeOrigin: window.performance?.timeOrigin,
      timing: window.performance?.timing,
    },
  });
});

addCallback("router.onUpdate", ({oldLocation, newLocation}: {oldLocation: RouterLocation, newLocation: RouterLocation}) => {
  captureEvent("navigate", {
    from: oldLocation.pathname,
    to: newLocation.pathname,
  });
});

// Put the tabId, which was injected into the page as a global variable, into
// the analytics context vars. See apollo-ssr/renderPage.js
AnalyticsUtil.clientContextVars.tabId = (window as any).tabId
