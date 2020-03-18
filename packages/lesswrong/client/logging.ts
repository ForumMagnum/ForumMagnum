import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import { getSetting, addCallback } from '../lib/vulcan-lib';
import { captureEvent, AnalyticsUtil } from '../lib/analyticsEvents';
import { browserProperties } from '../lib/utils/browserProperties';

const sentryUrl = getSetting<string|undefined>('sentry.url');
const sentryEnvironment = getSetting<string|undefined>('sentry.environment');
const sentryRelease = getSetting<string|undefined>('sentry.release')

Sentry.init({
  dsn: sentryUrl,
  environment: sentryEnvironment,
  release: sentryRelease,
  integrations: [
    new SentryIntegrations.Dedupe(),
    new SentryIntegrations.ExtraErrorData(),
  ],
});
// Initializing sentry on the client browser

function identifyUserToSentry(user) {
  // Set user in sentry scope
  Sentry.configureScope((scope) => {
    scope.setUser({id: user._id, email: user.email, username: user.username});
  });
}

addCallback('events.identify', identifyUserToSentry)

function addUserIdToGoogleAnalytics(user) {
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

addCallback("router.onUpdate", ({oldLocation, newLocation}) => {
  captureEvent("navigate", {
    from: oldLocation.pathname,
    to: newLocation.pathname,
  });
});

// Put the tabId, which was injected into the page as a global variable, into
// the analytics context vars. See apollo-ssr/renderPage.js
AnalyticsUtil.clientContextVars.tabId = (window as any).tabId
