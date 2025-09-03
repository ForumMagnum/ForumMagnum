import type { RequestStore } from 'next/dist/server/app-render/work-unit-async-storage.external'

export function getInternalNextJsStore() {
  const { workUnitAsyncStorage }: typeof import("next/dist/server/app-render/work-unit-async-storage.external") = require("next/dist/server/app-render/work-unit-async-storage.external");
  const asyncLocalStorage = workUnitAsyncStorage.getStore() as RequestStore | undefined;

  if (!asyncLocalStorage) {
    // eslint-disable-next-line no-console
    console.error('No store found when calling getInternalNextJsStore; this probably means you are calling this outside of a request context.');
    throw new Error('No internal NextJS store found');
  }

  return asyncLocalStorage;
}
