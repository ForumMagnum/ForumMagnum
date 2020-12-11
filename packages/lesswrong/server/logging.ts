import { captureException } from '@sentry/core';
import { captureEvent } from '../lib/analyticsEvents';

// Log unhandled promise rejections, eg exceptions escaping from async
// callbacks. The default node behavior is to silently ignore these exceptions,
// which is terrible and has led to unnoticed bugs in the past.
process.on("unhandledRejection", (r: any) => {
  captureException(r);
  
  //eslint-disable-next-line no-console
  console.log(r);
  
  if (r.stack) {
    //eslint-disable-next-line no-console
    console.log(r.stack);
  }
});

captureEvent("serverStarted", {});
