// @ts-check

function installUnhandledRejectionEventHandler() {
  // Log unhandled promise rejections, eg exceptions escaping from async
  // callbacks. The default node behavior is to silently ignore these exceptions,
  // which is terrible and has led to unnoticed bugs in the past.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on("unhandledRejection", (r) => {
      const { captureException } = require("@sentry/nextjs");
      captureException(r);
      
      //eslint-disable-next-line no-console
      console.log("Unhandled rejection");
      //eslint-disable-next-line no-console
      console.log(r);
      
      if (r.stack) {
        //eslint-disable-next-line no-console
        console.log(r.stack);
      }
    });
  }
}

export async function register() {
  installUnhandledRejectionEventHandler();

  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
    process.setSourceMapsEnabled(true);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = process.env.NODE_ENV === "production"
  ? require('@sentry/nextjs').captureRequestError
  : () => {};
