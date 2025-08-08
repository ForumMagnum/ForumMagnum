// @ts-check

export async function register() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

if (process.env.NODE_ENV === "production") {
  const Sentry = require('@sentry/nextjs');
  module.exports.onRequestError = Sentry.captureRequestError;
}
