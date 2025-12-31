'use client';

import React, { createContext, use, useContext, useMemo, useRef } from "react";
// eslint-disable-next-line no-restricted-imports
import { useQuery as useQueryApollo, useSuspenseQuery as useSuspenseQueryApollo } from "@apollo/client/react";
import type { SuspenseQueryHookFetchPolicy } from "@apollo/client/react";
import { debugSuspenseBoundaries, NamedSuspenseBoundary } from "@/components/common/SuspenseWrapper";
import type { DocumentNode, OperationDefinitionNode } from 'graphql';
import { print } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import jsonStringifyDeterministic from "json-stringify-deterministic";
import { useApolloClient } from "@apollo/client/react";
import { useSsrQueryCache } from "./ssrQueryCache";
import { useSSRResolverContext } from "./ssrResolverContext";
import { addTypenameToDocument } from "@apollo/client/utilities";
import { escapeInlineScriptJson, useInjectHTML } from "@/components/hooks/useInjectHTML";

export const EnableSuspenseContext = createContext(false);

export type UseQueryOptions = {
  fetchPolicy: SuspenseQueryHookFetchPolicy,
  ssr?: boolean,
  skip?: boolean,
};

declare global {
  interface Window {
    __LW_SSR_GQL__?: Record<string, { data: any }>;
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

function getInjectedQueryKey(query: unknown, variables: unknown): string {
  const queryString = getQueryString(query);
  const normalizedVariables = replaceUndefinedForJsonStringify(variables ?? {});
  const variablesString = jsonStringifyDeterministic(normalizedVariables);
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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (bundleIsServer && useContext(EnableSuspenseContext)) {
    const injectHTML = useInjectHTML();
    const ssrCache = useSsrQueryCache();
    const resolverContext = useSSRResolverContext();

    const isNoSSR = (options && 'ssr' in options && !options.ssr);
    const isSkipped = options?.skip || isNoSSR;

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
    const injectedKey = useMemo(() => getInjectedQueryKey(query, variables), [query, variables]);

    if (isSkipped) {
      return {
        data: undefined,
        error: undefined,
        loading: false,
        networkStatus: 7,
      } as any;
    }

    const existingPromise = ssrCache.queryPromises.get(injectedKey);
    const queryPromise = existingPromise ?? (async () => {
      const [{ runQuery }] = await Promise.all([
        import("@/server/vulcan-lib/query"),
      ]);
      const context = resolverContext;
      // Modify selection sets to add __typename. Because apollo-client will
      // do this transform when the same query is given to useQuery, we need
      // to do it for the injected version, or else there would be a mismatch in
      // whether the __typename field is present on some objects, which causes
      // apollo-client to look for fields in the wrong place and return
      //  incorrect empty objects.
      const transformedQuery = addTypenameToDocument(query);
      const result = await runQuery(transformedQuery, variables, context);

      const payload = { data: (result as any)?.data };
      const keyJson = escapeInlineScriptJson(JSON.stringify(injectedKey));
      const payloadJson = escapeInlineScriptJson(JSON.stringify(payload));
      injectHTML(`(window.__LW_SSR_GQL__??={})[${keyJson}]=${payloadJson};`);
      return normalizeQueryResult(result);
    })();
    if (!existingPromise) {
      ssrCache.queryPromises.set(injectedKey, queryPromise);
    }

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
    const injectedKey = useMemo(() => getInjectedQueryKey(query, variables), [query, variables]);
    const firstRender = useRef(true);

    const injected = typeof globalThis !== "undefined" ? (globalThis as unknown as Window).__LW_SSR_GQL__?.[injectedKey] : undefined;
    const shouldUseInjected = !!injected && firstRender.current;
    firstRender.current = false;

    if (shouldUseInjected) {
      apolloClient.writeQuery({
        query,
        variables,
        data: injected!.data,
      });
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useQueryApollo(query, options);

    if (shouldUseInjected) {
      return {
        ...result,
        data: injected!.data,
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

export const useSuspenseQuery: typeof useSuspenseQueryApollo = useSuspenseQueryApollo;

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
