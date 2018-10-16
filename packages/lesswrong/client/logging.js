import * as Sentry from '@sentry/browser';
import { getSetting } from 'meteor/vulcan:core'

const sentryUrl = getSetting('sentry.url');
const sentryEnvironment = getSetting('sentry.environment');

Sentry.init({
  dsn: sentryUrl,
  beforeBreadcrumb(breadcrumb, hint) {
    if (breadcrumb.level === "error" && breadcrumb.message) {
      Sentry.captureException(breadcrumb.message)
    }
    return breadcrumb
  },
  environment: sentryEnvironment
});
// Initializing sentry on the client browser
