import { captureException } from "@/lib/sentryWrapper";

/**
 * Run a task (promise), without waiting for the result. If in a serverless
 * context, this function is responsible for making sure the process doesn't
 * exit until the background task is finished. In a non-serverless context,
 * i.e. either run on a local dev instance or on the client, this has no effect.
 */
export const backgroundTask = <T>(promise: Promise<T>) => {
  ensureRequestHasBackgroundTaskHandler();
  const tracked: Promise<unknown> = promise
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Uncaught error in background task', err);
      captureException(err);
    })
    .finally(() => {
      pendingBackgroundTasks = pendingBackgroundTasks.filter((task) => task !== tracked);
    });
  pendingBackgroundTasks.push(tracked);
}

let pendingBackgroundTasks: Promise<unknown>[] = [];

// The NextJS request context, if this is running inside a request. Obtained as
// per https://nextjs.org/docs/app/api-reference/functions/after#platform-support
function getRequestContext() {
  const RequestContext = (globalThis as any)[Symbol.for('@next/request-context')];
  return RequestContext?.get?.();
}

export function isInRequestContext(): boolean {
  return !!getRequestContext();
}

function ensureRequestHasBackgroundTaskHandler() {
  // If running inside a NextJS request, calls `after` (from @next/server) to
  // ensure that the Vercel function doesn't exit until all background tasks
  // are complete.
  //
  // When run locally, there is no request context, but background tasks will
  // still complete as long as you don't kill the running server instance.
  const contextValue = getRequestContext();
  if (!contextValue) {
    warnOnExitIfTasksPending();
    return;
  }
  if (!contextValue.hasAddedWaitForBackgroundTasks) {
    contextValue.hasAddedWaitForBackgroundTasks = true;
    const { after }: typeof import("next/server") = require("next/server");
    after(async () => {
      await waitForBackgroundTasks();
    });
  }
}

let exitWarningRegistered = false;

// Scripts (yarn repl, migrations) exit as soon as their entrypoint resolves,
// dropping any background task still running.
function warnOnExitIfTasksPending() {
  if (exitWarningRegistered) return;
  exitWarningRegistered = true;
  process.on('exit', () => {
    if (pendingBackgroundTasks.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`Exiting with ${pendingBackgroundTasks.length} background task(s) still pending; their work was not completed`);
    }
  });
}

export async function waitForBackgroundTasks() {
  while (pendingBackgroundTasks.length > 0) {
    const taskGroup = [...pendingBackgroundTasks];
    pendingBackgroundTasks = [];
    await Promise.all(taskGroup);
  }
}
