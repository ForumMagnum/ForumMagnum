import * as Sentry from '@sentry/browser';

// Initializing sentry on the client browser
Sentry.init({
  dsn: 'https://1ab1949fc8d04608b43132f37bb2a1b0@sentry.io/1301611',
  beforeBreadcrumb(breadcrumb, hint) {
    if (breadcrumb.level === "error" && breadcrumb.message) {
      Sentry.captureException(breadcrumb.message)
    }
    return breadcrumb
  },
});
