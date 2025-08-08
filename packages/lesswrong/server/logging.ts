import { captureException } from '@sentry/nextjs';
import { isAnyTest } from '../lib/executionEnvironment';
import { consoleLogMemoryUsageThreshold, sentryErrorMemoryUsageThreshold, memoryUsageCheckInterval, logGraphqlQueriesSetting, logGraphqlMutationsSetting } from './databaseSettings';
import { printInFlightRequests } from '@/server/rendering/pageCache';

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

export function startMemoryUsageMonitor() {
  if (!isAnyTest) {
    setInterval(() => {
      const memoryUsage = process.memoryUsage()?.heapTotal;
      if (memoryUsage > consoleLogMemoryUsageThreshold.get()) {
        // eslint-disable-next-line no-console
        console.log(`Memory usage is high: ${memoryUsage} bytes (warning threshold: ${consoleLogMemoryUsageThreshold.get()})`);
        logInFlightStuff();
      }
      if (memoryUsage > sentryErrorMemoryUsageThreshold.get()) {
        captureException(new Error("Memory usage is high"));
      }
    }, memoryUsageCheckInterval.get());
  }
}


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
  const operationsInProgress = Object.keys(queriesInProgress)
    .filter((operationName)=>queriesInProgress[operationName]>0)
    .map((operationName) => queriesInProgress[operationName]>1 ? `${operationName}(${queriesInProgress[operationName]})` : operationName);
  if (operationsInProgress.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Graphql queries in progress: ${operationsInProgress.join(", ")}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Graphql queries in progress: None`);
  }
}

export function logInFlightStuff() {
  printInFlightRequests();
  printInFlightGraphqlQueries();
}
