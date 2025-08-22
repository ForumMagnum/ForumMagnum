import { createContext, useContext } from "react";
// eslint-disable-next-line no-restricted-imports
import { useQuery as useQueryApollo, useSuspenseQuery } from "@apollo/client/react";
import type { SuspenseQueryHookFetchPolicy } from "@apollo/client/react";
import { debugSuspenseBoundaries, NamedSuspenseBoundary } from "@/components/common/SuspenseWrapper";
import type { DocumentNode, OperationDefinitionNode, print } from 'graphql';
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

export const EnableSuspenseContext = createContext(false);

type UseQueryOptions = {
  fetchPolicy: SuspenseQueryHookFetchPolicy,
  ssr?: boolean,
  skip?: boolean,
};

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
    const isNoSSR = (options && 'ssr' in options && !options.ssr)
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

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useSuspenseQuery(query, {
      ...options,
      skip: isSkipped
    });

    if (debugSuspenseBoundaries && !isSkipped) {
      // eslint-disable-next-line no-console
      console.log(`    ...returned query from cache`);
    }
    return {
      ...result,
      loading: !options?.skip && isNoSSR,
    };
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useQueryApollo(query, options);
    return {
      ...result,
      loading: result.loading && !options?.skip,
    };
  }
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
