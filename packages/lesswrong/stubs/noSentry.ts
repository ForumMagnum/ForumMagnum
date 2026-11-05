
export const captureException = () => {};

export function withIsolationScope<T>(callback: () => T): T {
  return callback();
}

export interface Scope {}

export function getSentry(): null {
  return null;
}
