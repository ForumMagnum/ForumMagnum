/**
 * Run a task (promise), without waiting for the result. If in a serverless
 * context, this function is responsible for making sure the process doesn't
 * exit until the background task is finished. In a non-serverless context,
 * this has no effect.
 */
export const backgroundTask = <T>(promise: Promise<T>) => {
  ensureRequestHasBackgroundTaskHandler();
  pendingBackgroundTasks.push(promise);
}

let pendingBackgroundTasks: Promise<any>[] = [];

function ensureRequestHasBackgroundTaskHandler() {
  // TODO
  // According to https://nextjs.org/docs/app/api-reference/functions/after#platform-support
  // we might be able to get the context of the current request from something
  // like thread-local storage with something like:
  //     const RequestContext = globalThis[Symbol.for('@next/request-context')]
  // But empirically that doesn't work (inside a graphql handler, the most
  // relevant case, we just get undefined). So I think we have to do this
  // manually on each entry point.
  const RequestContext = (globalThis as any)[Symbol.for('@next/request-context')];
  if (RequestContext) {
    const contextValue = RequestContext?.get()
    if (contextValue && !contextValue.hasAddedWaitForBackgroundTasks) {
      console.log("Installing waitForBackgroundTasks handler");
      contextValue.hasAddedWaitForBackgroundTasks = true;
      const after = require("next/server");
      after(async () => {
        console.log("Waiting for background tasks");
        await waitForBackgroundTasks();
      });
    }
  }
}

export async function waitForBackgroundTasks() {
  while (pendingBackgroundTasks.length > 0) {
    const taskGroup = pendingBackgroundTasks;
    pendingBackgroundTasks = [];
    await Promise.all(taskGroup);
  }
}
