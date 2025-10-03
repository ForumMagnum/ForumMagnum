// @ts-check
// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/


const { getSentry } = require('@/lib/sentryWrapper');

const Sentry = getSentry();

Sentry?.init({
  dsn: "https://1ab1949fc8d04608b43132f37bb2a1b0@o195791.ingest.us.sentry.io/1301611",
  environment: process.env.NODE_ENV ?? "development",

  integrations: [
    Sentry.dedupeIntegration(),
    Sentry.extraErrorDataIntegration(),
  ],

  beforeSend: (event, hint) => {
    // Suppress an uninformative error from ReCaptcha
    // See: https://github.com/getsentry/sentry-javascript/issues/2514
    if (hint?.originalException === "Timeout") {
      return null;
    }

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  enabled: true,
});
