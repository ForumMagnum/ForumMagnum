import { captureException } from '@sentry/core';
import { captureEvent } from '../lib/analyticsEvents';
import { onStartup, isAnyTest } from '../lib/executionEnvironment';
import { DatabaseServerSetting } from './databaseSettings';
import { checkForMemoryLeaks } from './vulcan-lib/apollo-ssr/pageCache';

import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { sentryUrlSetting, sentryEnvironmentSetting, sentryReleaseSetting } from '../lib/instanceSettings';
import * as _ from 'underscore';
import fs from 'fs';

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
  
  checkForCoreDumps();
});

export const addSentryMiddlewares = (addConnectHandler: (handler: any)=>void) => {
  addConnectHandler(Sentry.Handlers.requestHandler());
  addConnectHandler(Sentry.Handlers.errorHandler());
}

const gigabytes = 1024*1024*1024;
const consoleLogMemoryUsageThreshold = new DatabaseServerSetting<number>("consoleLogMemoryUsage", 1.5*gigabytes);
const sentryErrorMemoryUsageThreshold = new DatabaseServerSetting<number>("sentryErrorMemoryUsage", 2.1*gigabytes);
const memoryUsageCheckInterval = new DatabaseServerSetting<number>("memoryUsageCheckInterval", 2000);

onStartup(() => {
  setInterval(() => {
    const memoryUsage = process.memoryUsage()?.heapTotal;
    if (memoryUsage > consoleLogMemoryUsageThreshold.get()) {
      // eslint-disable-next-line no-console
      console.log(`Memory usage is high: ${memoryUsage} bytes (warning threshold: ${consoleLogMemoryUsageThreshold.get()})`);
      checkForMemoryLeaks();
    }
    if (memoryUsage > sentryErrorMemoryUsageThreshold.get()) {
      Sentry.captureException(new Error("Memory usage is high"));
    }
  }, memoryUsageCheckInterval.get());
});

function checkForCoreDumps() {
  const files = fs.readdirSync(".");
  const coreFiles = _.filter(files, filename => filename.startsWith("core."));
  if (coreFiles.length > 0) {
    Sentry.captureException(new Error("Server restarted after core dump"));
    for (let coreFile of coreFiles) {
      //eslint-disable-next-line no-console
      console.log("Removing core file: "+coreFile);
      fs.unlinkSync(coreFile);
    }
  }
}
