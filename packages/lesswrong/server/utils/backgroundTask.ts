
/**
 * Run a task (promise), without waiting for the result. If in a serverless
 * context, this function is responsible for making sure the process doesn't
 * exit until the background task is finished. In a non-serverless context,
 * this has no effect.
 */
export const backgroundTask = <T>(promise: Promise<T>) => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  void promise;
}
