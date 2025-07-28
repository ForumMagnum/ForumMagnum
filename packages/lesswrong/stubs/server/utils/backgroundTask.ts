
// Stub version for the client simply voids the promise (without any special
// handling for serverless even if it might be)
export const backgroundTask = <T>(promise: Promise<T>) => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  void promise;
}
