import { captureException } from "@sentry/nextjs";

/**
 * Run a task (promise), without waiting for the result. If in a serverless
 * context, this function is responsible for making sure the process doesn't
 * exit until the background task is finished. In a non-serverless context,
 * i.e. either run on a local dev instance or on the client, this has no effect.
 */
export const backgroundTask = <T>(promise: Promise<T>) => {
  ensureRequestHasBackgroundTaskHandler();
  pendingBackgroundTasks.push(promise);
}

let pendingBackgroundTasks: Promise<any>[] = [];

function ensureRequestHasBackgroundTaskHandler() {
  // Checks whether we're running in the context of a NextJS "request".
  // If so, calls `after` (from @next/server) to ensure that the Vercel function
  // doesn't exit until all background tasks are complete.
  // 
  // Getting the request context is as per https://nextjs.org/docs/app/api-reference/functions/after#platform-support
  // 
  // When run locally, this does nothing, as there is no request context, but background
  // tasks will still complete as long as you don't kill the running server instance.
  const RequestContext = (globalThis as any)[Symbol.for('@next/request-context')];
  if (RequestContext) {
    const contextValue = RequestContext?.get()
    if (contextValue && !contextValue.hasAddedWaitForBackgroundTasks) {
      contextValue.hasAddedWaitForBackgroundTasks = true;
      const { after }: typeof import("next/server") = require("next/server");
      after(async () => {
        await waitForBackgroundTasks();
      });
    }
  }
}

export async function waitForBackgroundTasks() {
  while (pendingBackgroundTasks.length > 0) {
    const taskGroup = pendingBackgroundTasks.map(task => task.catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Uncaught error in background task', err);
      captureException(err);
    }));
    pendingBackgroundTasks = [];
    await Promise.all(taskGroup);
  }
}
