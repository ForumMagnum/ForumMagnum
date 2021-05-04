import { captureException } from '@sentry/core';
import { captureEvent } from '../lib/analyticsEvents';
import { onStartup, isAnyTest } from '../lib/executionEnvironment';

import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { sentryUrlSetting, sentryEnvironmentSetting, sentryReleaseSetting } from '../lib/instanceSettings';

// Log unhandled promise rejections, eg exceptions escaping from async
// callbacks. The default node behavior is to silently ignore these exceptions,
// which is terrible and has led to unnoticed bugs in the past.
process.on("unhandledRejection", (r: any) => {
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

captureEvent("serverStarted", {});


onStartup(() => {
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
    if (!isAnyTest) {
      // eslint-disable-next-line no-console
      console.warn("Sentry is not configured. To activate error reporting, please set the sentry.url variable in your settings file.");
    }
  }
});

export const addSentryMiddlewares = (addConnectHandler) => {
  addConnectHandler(Sentry.Handlers.requestHandler());
  addConnectHandler(Sentry.Handlers.errorHandler());
}

