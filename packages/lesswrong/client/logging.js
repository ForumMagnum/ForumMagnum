import * as Sentry from '@sentry/browser';
import { getSetting, addCallback } from '../lib/vulcan-lib';
import { captureEvent, AnalyticsUtil } from '../lib/analyticsEvents';
import { browserProperties } from '../lib/utils/browserProperties';

/*global tabId*/

const sentryUrl = getSetting('sentry.url');
const sentryEnvironment = getSetting('sentry.environment');
const sentryRelease = getSetting('sentry.release')

Sentry.init({
  dsn: sentryUrl,
  environment: sentryEnvironment,
  release: sentryRelease,
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
  if (window && window.ga) {
    window.ga('set', 'userId', user._id); // Set the user ID using signed-in user_id.
  }
}

addCallback('events.identify', addUserIdToGoogleAnalytics)

window.addEventListener('load', ev => {
  captureEvent("pageLoadFinished", {
    url: document.location?.href,
    referrer: document.referrer,
    browserProps: browserProperties(),
    performance: {
      memory: window.performance?.memory?.usedJSHeapSize,
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
AnalyticsUtil.clientContextVars.tabId = tabId
