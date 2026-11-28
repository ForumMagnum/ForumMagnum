// @ts-check
// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/


const { getSentry } = require('@/lib/sentryWrapper');

const Sentry = getSentry();

Sentry?.init({
  dsn: "https://1ab1949fc8d04608b43132f37bb2a1b0@o195791.ingest.us.sentry.io/1301611",
  environment: process.env.NODE_ENV ?? "development",

  // Dedupe drops an error that is identical to the previous one, which is what
  // keeps a page stuck in an error loop from sending one report per error. It
  // has to run after NextjsClientStackFrameNormalization, which is the last of
  // the SDK's default integrations. That integration rewrites each stack
  // frame's filename in place (https://origin/... -> app:///...), including on
  // the previous event that Dedupe holds on to. In the default position Dedupe
  // compares the new event's raw filenames against the previous event's
  // rewritten ones, so it never matches and every repeat gets sent.
  integrations: (defaultIntegrations) => [
    ...defaultIntegrations.filter((integration) => integration.name !== 'Dedupe'),
    Sentry.extraErrorDataIntegration(),
    Sentry.dedupeIntegration(),
  ],

  beforeSend: (event, hint) => {
    // Suppress an uninformative error from ReCaptcha
    // See: https://github.com/getsentry/sentry-javascript/issues/2514
    if (hint?.originalException === "Timeout") {
      return null;
    }

    return event;
  },

  denyUrls: [/recaptcha/],

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  enabled: true,
});
