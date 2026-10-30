import { workAsyncStorage, type WorkStore } from "next/dist/server/app-render/work-async-storage.external";
import { workUnitAsyncStorage } from "next/dist/server/app-render/work-unit-async-storage.external";
import { captureException } from "@/lib/sentryWrapper";

/**
 * Run a task (promise), without waiting for the result. If inside a NextJS
 * request, this function is responsible for making sure the serverless process
 * doesn't exit until the background task is finished. Outside a request, i.e.
 * in a script or on the client, this has no effect.
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
const requestsWaitingForBackgroundTasks = new WeakSet<WorkStore>();

// Checks the stores `after` requires, which NextJS sets while handling a
// request. Vercel's NextJS adapter (used since Next 16.3) doesn't set the
// `@next/request-context` global, so that can't be used to detect requests.
function getRequestWorkStore(): WorkStore | undefined {
  const workStore = workAsyncStorage.getStore();
  return workStore && workUnitAsyncStorage.getStore() ? workStore : undefined;
}

export function isInRequestContext(): boolean {
  return !!getRequestWorkStore();
}

function ensureRequestHasBackgroundTaskHandler() {
  // If running inside a NextJS request, calls `after` (from @next/server) to
  // ensure that the Vercel function doesn't exit until all background tasks
  // are complete.
  const workStore = getRequestWorkStore();
  if (!workStore) {
    warnOnExitIfTasksPending();
    return;
  }
  if (!requestsWaitingForBackgroundTasks.has(workStore)) {
    requestsWaitingForBackgroundTasks.add(workStore);
    // Not a static import: this module is also bundled for client component
    // SSR, where `next build` (but not the dev server) rejects static imports
    // of `after`.
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
