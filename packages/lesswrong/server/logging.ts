import { captureException } from '@sentry/core';
import { captureEvent } from '../lib/analyticsEvents';
import { isAnyTest } from '../lib/executionEnvironment';
import { DatabaseServerSetting } from './databaseSettings';
import { printInFlightRequests, checkForMemoryLeaks } from './vulcan-lib/apollo-ssr/pageCache';

import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { sentryUrlSetting, sentryEnvironmentSetting, sentryReleaseSetting } from '../lib/instanceSettings';
import * as _ from 'underscore';
import fs from 'fs';
import { printInProgressCallbacks } from './utils/callbackHooks';
import type { AddMiddlewareType } from './apolloServer';

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


export function serverInitSentry() {
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
}

export const addSentryMiddlewares = (addConnectHandler: AddMiddlewareType) => {
  addConnectHandler(Sentry.Handlers.requestHandler());
  addConnectHandler(Sentry.Handlers.errorHandler());
}

const gigabytes = 1024*1024*1024;
const consoleLogMemoryUsageThreshold = new DatabaseServerSetting<number>("consoleLogMemoryUsage", 1.5*gigabytes);
const sentryErrorMemoryUsageThreshold = new DatabaseServerSetting<number>("sentryErrorMemoryUsage", 2.1*gigabytes);
const memoryUsageCheckInterval = new DatabaseServerSetting<number>("memoryUsageCheckInterval", 2000);

export function startMemoryUsageMonitor() {
  if (!isAnyTest) {
    setInterval(() => {
      const memoryUsage = process.memoryUsage()?.heapTotal;
      if (memoryUsage > consoleLogMemoryUsageThreshold.get()) {
        // eslint-disable-next-line no-console
        console.log(`Memory usage is high: ${memoryUsage} bytes (warning threshold: ${consoleLogMemoryUsageThreshold.get()})`);
        checkForMemoryLeaks();
        
        logInFlightStuff();
      }
      if (memoryUsage > sentryErrorMemoryUsageThreshold.get()) {
        Sentry.captureException(new Error("Memory usage is high"));
      }
    }, memoryUsageCheckInterval.get());
  }
}

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

const logGraphqlQueriesSetting = new DatabaseServerSetting<boolean>("logGraphqlQueries", false);
const logGraphqlMutationsSetting = new DatabaseServerSetting<boolean>("logGraphqlMutations", false);

const queriesInProgress: Record<string,number> = {}; // operationName => number of copies in progress

export function logGraphqlQueryStarted(operationName: string, queryString: string, variables: any) {
  if (operationName in queriesInProgress) {
    queriesInProgress[operationName]++;
  } else {
    queriesInProgress[operationName] = 1;
  }
  
  if (logGraphqlQueriesSetting.get() && queryString && queryString.startsWith("query")) {
    const view = variables?.input?.terms?.view;
    if (view) {
      // eslint-disable-next-line no-console
      console.log(`query: ${operationName} with view: ${variables?.input?.terms?.view}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`query: ${operationName}`);
    }
  }
  if (logGraphqlMutationsSetting.get() && queryString && queryString.startsWith("mutation")) {
    const editedFields = variables?.data;
    if (editedFields) {
      // eslint-disable-next-line no-console
      console.log(`mutation: ${operationName} editing ${JSON.stringify(Object.keys(editedFields))}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`mutation: ${operationName}`);
    }
  }
}

export function logGraphqlQueryFinished(operationName: string, queryString: string) {
  if (operationName in queriesInProgress) {
    if (queriesInProgress[operationName] > 1)
      queriesInProgress[operationName]--;
    else
      delete queriesInProgress[operationName];
  }
  
  if (logGraphqlQueriesSetting.get() && queryString && queryString.startsWith("query")) {
    // eslint-disable-next-line no-console
    console.log(`Finished query: ${operationName}`);
  }
  if (logGraphqlMutationsSetting.get() && queryString && queryString.startsWith("mutation")) {
    // eslint-disable-next-line no-console
    console.log(`Finished mutation: ${operationName}`);
  }
}

function printInFlightGraphqlQueries() {
  const operationsInProgress = _.map(
    _.filter(Object.keys(queriesInProgress), (operationName)=>queriesInProgress[operationName]>0),
    (operationName) => queriesInProgress[operationName]>1 ? `${operationName}(${queriesInProgress[operationName]})` : operationName);
  if (operationsInProgress.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Graphql queries in progress: ${operationsInProgress.join(", ")}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Graphql queries in progress: None`);
  }
}

function logInFlightStuff() {
  printInFlightRequests();
  printInFlightGraphqlQueries();
  printInProgressCallbacks();
}
