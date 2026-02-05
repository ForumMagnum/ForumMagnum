import React from 'react';
import { cookies } from 'next/headers';

declare global {
  var cachedAssignRequestId: (() => Promise<string>)|undefined;
  var requestIdCounter: number | undefined;
}

async function assignRequestId(): Promise<string> {
  const nextId = (globalThis.requestIdCounter ?? 0) + 1;
  globalThis.requestIdCounter = nextId;
  return `req-${nextId}`;
}

if (!globalThis.cachedAssignRequestId) {
  globalThis.cachedAssignRequestId = React.cache(assignRequestId);
}

/**
 * Gets an ID for the request that is currently being rendered. Must be called
 * from inside either a server component, or generateMetadata. The value will be 
 * the same in generateMetadata as in server components, if they belong to the same
 * request. The result is unique within a given nodejs process, but _not_ unique
 * globally. This is used for getting a ResolverContext in getResolverContextForSSR
 * and shouldn't be used for much else.
 */
export async function getRequestIdForServerComponentOrGenerateMetadata(): Promise<string> {
  return await globalThis.cachedAssignRequestId!();
}

