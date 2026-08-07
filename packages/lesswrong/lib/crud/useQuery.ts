'use client';

import React, { createContext, use, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
// eslint-disable-next-line no-restricted-imports
import { useQuery as useQueryApollo, useSuspenseQuery as useSuspenseQueryApollo, useReadQuery as useReadQueryApollo, useBackgroundQuery as useBackgroundQueryApollo, useApolloClient, type SuspenseQueryHookFetchPolicy } from "@apollo/client/react";
import { CombinedGraphQLErrors, NetworkStatus } from "@apollo/client";
import { debugSuspenseBoundaries, NamedSuspenseBoundary } from "@/components/common/SuspenseWrapper";
import type { DocumentNode, GraphQLFormattedError, OperationDefinitionNode } from 'graphql';
import { print } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import jsonStringifyDeterministic from "json-stringify-deterministic";
import { SsrQueryCache, useSsrQueryCache } from "./ssrQueryCache";
import { useSSRResolverContext } from "./ssrResolverContext";
import { addTypenameToDocument } from "@apollo/client/utilities";
import { escapeInlineScriptJson, useInjectHTML } from "@/components/hooks/useInjectHTML";
import { extractToObjectStoreAndSubstitute, substituteFromObjectStore, type JsonObject, type JsonValue } from "@/lib/apollo/graphqlDeduplicatedObjectStore";

export const EnableSuspenseContext = createContext(false);

const noOp = () => {};
const doubleNoOp = () => noOp;

export type UseQueryOptions = {
  fetchPolicy?: SuspenseQueryHookFetchPolicy,
  ssr?: boolean,
  skip?: boolean,
};

declare global {
  interface Window {
    __LW_SSR_GQL__?: Record<string, { data: any, errors?: GraphQLFormattedError[] }>;
    __LW_SSR_GQL_STORE_MAP__?: Map<string, JsonObject>;
    __lwSsrGql?: {
      get: (key: string) => unknown;
      subscribe: (key: string, cb: () => void) => () => void;
      inject: (key: string, payload: unknown, storeDelta?: Record<string, JsonObject>) => void;
    };
  }
}

/**
 * Detect whether we are doing a "hydration render", ie, we're rendering a
 * component that was in the SSR, and this is either the first render or all
 * previous renders suspended.
 *
 * The way this works is a hack: `useSyncExternalStore` takes three arguments,
 * a subscribe function (which we ignore), a client-side getter, and a
 * server-side-or-hydration getter. We want to detect which of these two
 * functions was called. But, we also need them to return the same value,
 * because returning different values will trigger a spurious rerender; so,
 * both functions return `true`, and communicate the actual result through
 * side effects.
 */
function useIsHydrationWithNoRerender(): boolean {
  const isHydrationRef = useRef(false);
  isHydrationRef.current = false;

  const _ignored = useSyncExternalStore(
    doubleNoOp,
    () => { isHydrationRef.current = false; return true; },
    () => { isHydrationRef.current = true; return true; },
  );

  return isHydrationRef.current;
}

const waitForInjectionsPromises: Record<string, Promise<void> | null> = {};
function waitForInjection(injectedKey: string): Promise<void> | null {
  if (waitForInjectionsPromises[injectedKey]) {
    return waitForInjectionsPromises[injectedKey];
  }
  if (typeof globalThis === "undefined") return null;

  const api = (globalThis as unknown as Window).__lwSsrGql;
  if (!api) return null;
  if (api.get(injectedKey) !== undefined) {
    return null;
  }

  waitForInjectionsPromises[injectedKey] = new Promise<void>((resolve) => {
    let doneRef = {done: false};
    let unsubscribe: (() => void) | undefined;
    const finish = () => {
      if (doneRef.done) return;
      doneRef.done = true;
      if (unsubscribe) unsubscribe();
      resolve();
    };

    unsubscribe = api.subscribe(injectedKey, () => {
      finish();
    });
    // Safety valve: if something goes wrong with injection, don't hang hydration forever.
    setTimeout(finish, 3000);
    // Re-check in case it arrived between `get()` and `subscribe()`.
    if (api.get(injectedKey) !== undefined) {
      finish();
    }
  });
  return waitForInjectionsPromises[injectedKey];
}

function useHydrationWaitForInjectedKey(injectedKey: string, shouldWait: boolean) {
  const isHydrationRender = useIsHydrationWithNoRerender();
  if (isHydrationRender && shouldWait) {
    const promise = waitForInjection(injectedKey);
    if (promise) {
      use(promise);
    }
  }
}

function replaceUndefinedForJsonStringify(value: any): any {
  if (value === undefined) {
    return "__LW_UNDEFINED__";
  }
  if (Array.isArray(value)) {
    return value.map(replaceUndefinedForJsonStringify);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceUndefinedForJsonStringify(v)]));
  }
  return value;
}

function getQueryString(query: unknown): string {
  if (typeof query === "string") {
    return query;
  }
  try {
    return print(query as DocumentNode);
  } catch {
    return String(query);
  }
}

function useGetInjectedQueryKey(query: unknown, variables: unknown): string {
  const queryString = useMemo(() => getQueryString(query), [query]);
  const variablesString = useMemo(() => {
    const normalizedVariables = replaceUndefinedForJsonStringify(variables ?? {});
    return jsonStringifyDeterministic(normalizedVariables);
  }, [variables]);
  return `${queryString}\n::\n${variablesString}`;
}

/**
 * When queries run with `runQuery` (which reduces to the `graphql` library),
 * the results are returned as objects without prototypes (presumably to
 * reduce risk of prototypal inheritance). However this isn't the case for
 * query results that passed through apollo-client, so we have downstream
 * code that does things that expect the prototypes to be there, eg calling
 * object.hasOwnProperty(), which doesn't work for no-prototype objects.
 * Put all the prototypes back, by JSON stringifying and then parsing.
 */
function normalizeQueryResult(result: any): any {
  return JSON.parse(JSON.stringify(result));
}

/**
 * Serialize GraphQL errors for inclusion in an injected SSR payload. Only the
 * message and path are kept: they're all that downstream error classification
 * (eg isMissingDocumentError) needs, and other fields such as
 * extensions.stacktrace must not leak into the HTML.
 */
function serializeGraphQLErrors(errors: readonly GraphQLFormattedError[]): GraphQLFormattedError[] {
  return errors.map(({ message, path }) => ({ message, ...(path ? { path } : {}) }));
}

/**
 * Get the cached promise for an SSR query, creating and caching it if this is
 * the first hook to ask for this query+variables combination. The promise
 * never rejects on GraphQL errors: to match the client-side useQuery contract
 * (apollo's errorPolicy "none"), it resolves to `{data: undefined, error}` so
 * that components can render their error states during SSR.
 */
function getOrCreateSsrQueryPromise(
  ssrCache: SsrQueryCache,
  injectedKey: string,
  query: any,
  variables: any,
  resolverContext: ResolverContext,
  injectHTML: (html: string) => void,
): Promise<any> {
  const existingPromise = ssrCache.queryPromises.get(injectedKey);
  if (existingPromise) {
    return existingPromise;
  }
  const queryPromise = (async () => {
    const { runQueryNonThrowing } = await import("@/server/vulcan-lib/query");
    // Modify selection sets to add __typename. Because apollo-client will
    // do this transform when the same query is given to useQuery, we need
    // to do it for the injected version, or else there would be a mismatch in
    // whether the __typename field is present on some objects, which causes
    // apollo-client to look for fields in the wrong place and return
    //  incorrect empty objects.
    const transformedQuery = addTypenameToDocument(query);
    const result = await runQueryNonThrowing(transformedQuery, variables, resolverContext);

    if (result.errors?.length) {
      const serializedErrors = serializeGraphQLErrors(result.errors);
      injectQueryResult(injectHTML, injectedKey, null, ssrCache, serializedErrors);
      return {
        data: undefined,
        error: new CombinedGraphQLErrors({ errors: serializedErrors }),
        networkStatus: NetworkStatus.error,
      };
    }

    const payloadData = ((result as any)?.data ?? null) as JsonValue;
    injectQueryResult(injectHTML, injectedKey, payloadData, ssrCache);
    return normalizeQueryResult(result);
  })();
  ssrCache.queryPromises.set(injectedKey, queryPromise);
  return queryPromise;
}

/**
 * Wrapper around apollo-client's useQuery, which uses Suspense
 * (useSuspenseQuery) for SSR, then switches to to regular useQuery afterwards.
 * We do this because handling non-first-time loading states (ie Load More
 * buttons) is generally easier with useQuery returning `loading: true` rather
 * than suspending the component that used it, and we have a lot of preexisting
 * code with loading states built around this idiom that should keep working.
 * Wrapping useQuery this way also gives us better options for working around
 * apollo-client bugs than if we were using apollo directly.
 */
export const useQuery: typeof useQueryApollo = ((query: any, options?: UseQueryOptions) => {
  const isNoSSR = (options && 'ssr' in options && !options.ssr);
  const isSkipped = options?.skip || isNoSSR;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (bundleIsServer) {
    const injectHTML = useInjectHTML();
    const ssrCache = useSsrQueryCache();
    const resolverContext = useSSRResolverContext();

    if (debugSuspenseBoundaries) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const suspenseBoundaryName = useContext(NamedSuspenseBoundary);
      const queryDescription = `${suspenseBoundaryName}/${getOperationName(query)}`
      if (debugSuspenseBoundaries && !isSkipped) {
        // eslint-disable-next-line no-console
        console.log(`Checked query: ${queryDescription}`);
      }
    }

    const variables = (options as any)?.variables ?? {};
    const injectedKey = useGetInjectedQueryKey(query, variables);

    if (isSkipped) {
      return {
        data: undefined,
        error: undefined,
        loading: isNoSSR && !(options?.skip),
        networkStatus: 7,
      } as any;
    }

    const queryPromise = getOrCreateSsrQueryPromise(ssrCache, injectedKey, query, variables, resolverContext, injectHTML);

    const result = use(queryPromise);

    if (debugSuspenseBoundaries && !isSkipped) {
      // eslint-disable-next-line no-console
      console.log(`    ...returned query from cache`);
    }
    return {
      ...(result as any),
      loading: false,
    } as any;
  } else {
    const apolloClient = useApolloClient();
    const variables = (options as any)?.variables ?? {};
    const injectedKey = useGetInjectedQueryKey(query, variables);
    const firstRender = useRef(true);

    const injectedStoreBeforeWait = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL__ : undefined;
    const storeMap = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL_STORE_MAP__ : undefined;
    const injectedBeforeWait = injectedStoreBeforeWait?.[injectedKey];

    // During hydration, it's possible to render before the injected <script>
    // for this key has executed. If we're in a hydration render pass and this
    // query isn't skipped, wait briefly for injection before letting apollo
    // fire a duplicate request.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHydrationWaitForInjectedKey(injectedKey, !isSkipped && !injectedBeforeWait);

    const injectedStoreAfterWait = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL__ : undefined;
    const injectedAfterWait = injectedStoreAfterWait?.[injectedKey];
    const injected = injectedAfterWait ?? injectedBeforeWait;
    const injectedStore = injectedStoreAfterWait ?? injectedStoreBeforeWait;

    const injectedErrors = injected?.errors;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const injectedErrorRef = useRef<{ key: string, error: CombinedGraphQLErrors } | null>(null);
    if (firstRender.current && injectedErrors?.length) {
      injectedErrorRef.current = { key: injectedKey, error: new CombinedGraphQLErrors({ errors: injectedErrors }) };
    }
    const injectedError = injectedErrorRef.current?.key === injectedKey ? injectedErrorRef.current.error : undefined;

    const shouldUseInjected = !!injected && !injectedErrors?.length && firstRender.current;
    firstRender.current = false;

    const hydratedInjectedData = shouldUseInjected
      ? (storeMap
        ? substituteFromObjectStore((injected as any)!.data as JsonValue, storeMap) as any
        : (injected as any)!.data)
      : undefined;

    if (shouldUseInjected) {
      apolloClient.writeQuery({
        query,
        variables,
        data: hydratedInjectedData,
      });

      // Once the injected payload has been written into the apollo cache, we no
      // longer want it to be reusable on future mounts (eg after navigating
      // away and back). Future reads should come from apollo cache and follow
      // normal fetchPolicy semantics (modulo the short `prioritizeCacheValues`
      // window right after hydration).
      if (injectedStore) {
        //delete injectedStore[injectedKey];
        // If we've consumed the last injected query payload, we can also clear
        // the shared dedupe store to avoid unbounded growth in long-lived tabs.
        // JB: Commented out because I don't think this is actually safe (there may still be suspended components coming that will rely on this store)
        /*if (!Object.keys(injectedStore).length) {
          (globalThis as unknown as Window).__LW_SSR_GQL_STORE_MAP__?.clear?.();
        }*/
      }
    }

    // While this instance holds an SSR-injected error, skip apollo's own
    // query: unlike injected data (which primes the apollo cache), an error
    // can't be written to the cache, so without skip apollo would refetch and
    // transiently flash a loading state on the way to the same error.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useQueryApollo(query, injectedError ? { ...options, skip: true } : options);

    if (injectedError) {
      return {
        ...result,
        data: undefined,
        error: injectedError,
        loading: false,
        networkStatus: NetworkStatus.error,
      } as any;
    } else if (shouldUseInjected) {
      return {
        ...result,
        data: hydratedInjectedData,
        loading: false,
      } as any;
    } else {
      return {
        ...result,
        loading: result.loading && !options?.skip,
      };
    }
  }
}) as any;

export const useSuspenseQuery: typeof useSuspenseQueryApollo = ((query: any, options?: UseQueryOptions) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (bundleIsServer) {
    // On the server, `useQuery` already suspends (via `use(queryPromise)`), so
    // this is equivalent, except that useQuery returns GraphQL errors as
    // values while apollo's useSuspenseQuery (errorPolicy "none") throws them.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useQuery(query, options) as any;
    if (result?.error) {
      throw result.error;
    }
    return result;
  }

  const apolloClient = useApolloClient();
  const variables = (options as any)?.variables ?? {};
  const injectedKey = useGetInjectedQueryKey(query, variables);
  const firstRender = useRef(true);

  const injectedStoreBeforeWait = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL__ : undefined;
  const storeMap = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL_STORE_MAP__ : undefined;
  const injectedBeforeWait = injectedStoreBeforeWait?.[injectedKey];

  const isNoSSR = (options && 'ssr' in options && !options.ssr);
  const isSkipped = (options as any)?.skip || isNoSSR;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useHydrationWaitForInjectedKey(injectedKey, !isSkipped && !injectedBeforeWait);

  const injectedStoreAfterWait = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL__ : undefined;
  const injectedAfterWait = injectedStoreAfterWait?.[injectedKey];
  const injected = injectedAfterWait ?? injectedBeforeWait;
  const injectedStore = injectedStoreAfterWait ?? injectedStoreBeforeWait;
  // Error payloads can't prime the apollo cache; let apollo run the query
  // itself, which will throw the error to the nearest boundary as usual.
  const shouldUseInjected = !!injected && !injected.errors?.length && firstRender.current;
  firstRender.current = false;

  const hydratedInjectedData = shouldUseInjected
    ? (storeMap
      ? substituteFromObjectStore((injected as any)!.data as JsonValue, storeMap) as any
      : (injected as any)!.data)
    : undefined;

  if (shouldUseInjected) {
    apolloClient.writeQuery({
      query,
      variables,
      data: hydratedInjectedData,
    });

    if (injectedStore) {
      //delete injectedStore[injectedKey];
      // Note: we intentionally do not clear `__LW_SSR_GQL_STORE_MAP__` here,
      // because more injected queries may arrive later and reference it.
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSuspenseQueryApollo(query, options as any);
}) as any;

const noopSsrBackgroundQueryFunction = () => {
  // No-op in SSR contexts.
};

type LwSsrBackgroundQueryRef = {
  __lwSsrInjectedKey: string;
};

type LwClientBackgroundQueryRef = {
  __lwApolloQueryRef: unknown;
  __lwInjectedKey: string;
};

function injectQueryResult(injectHTML: (html: string) => void, injectedKey: string, payloadData: JsonValue, ssrCache: SsrQueryCache, serializedErrors?: GraphQLFormattedError[]) {
  const { substituted, delta } = extractToObjectStoreAndSubstitute(payloadData, ssrCache.deduplicatedObjectStore);
  const payload = serializedErrors?.length ? { data: substituted, errors: serializedErrors } : { data: substituted };
  const keyJson = escapeInlineScriptJson(JSON.stringify(injectedKey));
  const payloadJson = escapeInlineScriptJson(JSON.stringify(payload));
  const deltaJson = Object.keys(delta).length
    ? escapeInlineScriptJson(JSON.stringify(delta))
    : "undefined";
  injectHTML(`window.__lwSsrGql.inject(${keyJson},${payloadJson},${deltaJson})`);
}

export const useBackgroundQuery: typeof useBackgroundQueryApollo = ((query: any, options?: any) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (bundleIsServer) {
    const injectHTML = useInjectHTML();
    const ssrCache = useSsrQueryCache();
    const resolverContext = useSSRResolverContext();

    const isNoSSR = (options && 'ssr' in options && !options.ssr);
    const isSkipped = options?.skip || isNoSSR;

    const variables = (options as any)?.variables ?? {};
    const injectedKey = useGetInjectedQueryKey(query, variables);

    const queryRef = useMemo<LwSsrBackgroundQueryRef | undefined>(() => {
      if (isSkipped) return undefined;
      return { __lwSsrInjectedKey: injectedKey };
    }, [injectedKey, isSkipped]);

    if (!isSkipped) {
      // The promise is cached in ssrCache and consumed by useReadQuery.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      getOrCreateSsrQueryPromise(ssrCache, injectedKey, query, variables, resolverContext, injectHTML);
    }

    return [
      queryRef as any,
      {
        refetch: noopSsrBackgroundQueryFunction,
        fetchMore: noopSsrBackgroundQueryFunction,
        subscribeToMore: noopSsrBackgroundQueryFunction,
      } as any,
    ];
  } else {
    const apolloClient = useApolloClient();
    const variables = (options as any)?.variables ?? {};
    const injectedKey = useGetInjectedQueryKey(query, variables);
    const firstRender = useRef(true);

    const injectedStoreBeforeWait = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL__ : undefined;
    const storeMap = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL_STORE_MAP__ : undefined;
    const injectedBeforeWait = injectedStoreBeforeWait?.[injectedKey];

    const isNoSSR = (options && 'ssr' in options && !options.ssr);
    const isSkipped = options?.skip || isNoSSR;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHydrationWaitForInjectedKey(injectedKey, !isSkipped && !injectedBeforeWait);

    const injectedStoreAfterWait = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL__ : undefined;
    const injectedAfterWait = injectedStoreAfterWait?.[injectedKey];
    const injected = injectedAfterWait ?? injectedBeforeWait;
    const injectedStore = injectedStoreAfterWait ?? injectedStoreBeforeWait;
    // Error payloads can't prime the apollo cache; let apollo run the query
    // itself, which will surface the error through the QueryRef as usual.
    const shouldUseInjected = !!injected && !injected.errors?.length && firstRender.current;
    firstRender.current = false;

    const hydratedInjectedData = shouldUseInjected
      ? (storeMap
        ? substituteFromObjectStore((injected as any)!.data as JsonValue, storeMap) as any
        : (injected as any)!.data)
      : undefined;

    if (shouldUseInjected) {
      apolloClient.writeQuery({
        query,
        variables,
        data: hydratedInjectedData,
      });

      if (injectedStore) {
        //delete injectedStore[injectedKey];
        // Note: we intentionally do not clear `__LW_SSR_GQL_STORE_MAP__` here,
        // because more injected queries may arrive later and reference it.
      }
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [queryRef, result] = useBackgroundQueryApollo(query, options);

    // Wrap the QueryRef so `useReadQuery` can identify it (and so we can carry
    // the injectedKey along if we need to wait for injection during hydration).
    const wrappedRef = queryRef
      ? { __lwApolloQueryRef: queryRef, __lwInjectedKey: injectedKey }
      : queryRef;

    return [wrappedRef as any, result];
  }
}) as any;

export const useReadQuery: typeof useReadQueryApollo = ((queryRef: any) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (bundleIsServer) {
    const ssrCache = useSsrQueryCache();
    const injectedKey = (queryRef as LwSsrBackgroundQueryRef | undefined)?.__lwSsrInjectedKey;
    if (!injectedKey) {
      return {
        data: undefined,
        error: undefined,
        networkStatus: 7,
      } as any;
    }

    const promise = ssrCache.queryPromises.get(injectedKey);
    if (!promise) {
      return {
        data: undefined,
        error: undefined,
        networkStatus: 7,
      } as any;
    }

    const result = use(promise);
    // Apollo's useReadQuery (errorPolicy "none") throws GraphQL errors rather
    // than returning them.
    if ((result as any)?.error) {
      throw (result as any).error;
    }
    return {
      ...(result as any),
      loading: false,
      networkStatus: 7,
    } as any;
  }

  // On the client, useBackgroundQuery has already copied any injected results
  // into the apollo cache before creating a QueryRef.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const maybeWrapped = queryRef as LwClientBackgroundQueryRef | undefined;
  if (maybeWrapped && typeof maybeWrapped === "object" && "__lwApolloQueryRef" in maybeWrapped) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useReadQueryApollo((maybeWrapped as any).__lwApolloQueryRef);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useReadQueryApollo(queryRef);
}) as any;

/**
 * Returns the operation name (e.g. `GetUser`) from a parsed GraphQL document.
 * If the document has no named operation, `undefined` is returned. For
 * debugging purposes only.
 */
export function getOperationName<TData = unknown, TVars = unknown>(
  doc: TypedDocumentNode<TData, TVars> | DocumentNode
): string | undefined {
  // Find the first OperationDefinition inside the Document
  const opDef = doc.definitions.find(
    (d): d is OperationDefinitionNode => d.kind === 'OperationDefinition'
  );

  // A named operation has .name?.value
  return opDef?.name?.value;
}
