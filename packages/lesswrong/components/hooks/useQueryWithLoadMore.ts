import { useState } from "react";
import { type OperationVariables } from "@apollo/client";
import { useQuery } from "@/lib/crud/useQuery";
import { useQuery as useQueryApollo } from "@apollo/client/react";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { Kind } from "graphql";
import { apolloSSRFlag } from "@/lib/helpers";
import isEqual from "lodash/isEqual";
import { useStabilizedCallbackAsync } from "./useDebouncedCallback";

export type LoadMoreCallback = () => Promise<unknown> | void;

export type LoadMoreProps = {
  loadMore: LoadMoreCallback;
  count: number;
  totalCount?: number;
  loading: boolean;
  hidden?: boolean;
};

interface PaginatedQueryVariables extends OperationVariables {
  selector?: Record<string, unknown>;
  limit?: number;
  enableTotal?: boolean;
}

interface PaginatedQueryOptions {
  itemsPerPage?: number;
  alwaysShowLoadMore?: boolean;
}

// Type constraint for paginated results
interface PaginatedResult {
  results: any[];
  totalCount?: number | null;
}

// Helper to check if a query returns paginated data
type HasPaginatedField<TData> = {
  [K in keyof TData]: TData[K] extends PaginatedResult | null | undefined ? K : never;
}[keyof TData];

// Constrain TData to have at least one field with paginated results
type ValidPaginatedData<TData> = HasPaginatedField<TData> extends never | undefined ? never : TData;

export type WrappedFetchMore = () => Promise<void>

export function useQueryWithLoadMore<
  TData extends Record<string, any>,
  TVariables extends OperationVariables
>(
  query: TypedDocumentNode<ValidPaginatedData<TData>, TVariables>,
  options: useQueryApollo.Options<NoInfer<ValidPaginatedData<TData>>, NoInfer<TVariables>> & PaginatedQueryOptions & {
    variables: TVariables & PaginatedQueryVariables;
    // Prevent anyone from pointlessly passing `true`, which we assign by default inside the hook.
    notifyOnNetworkStatusChange?: false;
  }
) {
  const {
    variables,
    ssr = true,
    notifyOnNetworkStatusChange = true,
    itemsPerPage = 10,
    alwaysShowLoadMore = false,
    ...remainingOptions
  } = options;

  const { limit, selector, ...remainingVariables } = variables ?? {};
  const initialLimit = (selector && 'limit' in selector && typeof selector.limit === 'number')
    ? selector.limit
    : (limit ?? 10);

  const queryOutput = useQuery(query, {
    ...remainingOptions,
    ssr: apolloSSRFlag(ssr),
    notifyOnNetworkStatusChange,
    variables: {
      ...({ selector, ...remainingVariables }) as TVariables,
      limit: initialLimit,
    }
  });
  const { data, loading, fetchMore } = queryOutput;

  const queryName = query.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION)?.selectionSet?.selections?.find(s => s.kind === Kind.FIELD)?.name?.value;
  const queryResult = data?.[queryName as keyof typeof data];

  const [limitState, setLimitState] = useState(initialLimit);
  const resetTrigger = variables.selector;
  const [lastResetTrigger, setLastResetTrigger] = useState(resetTrigger);
  const enableTotal = variables.enableTotal;

  let effectiveLimit = limitState;
  if (!isEqual(resetTrigger, lastResetTrigger)) {
    setLastResetTrigger(resetTrigger);
    setLimitState(initialLimit);
    effectiveLimit = initialLimit;
  }

  const count = data?.results?.length ?? 0;
  const totalCount = data?.totalCount ?? undefined;

  const showLoadMore = alwaysShowLoadMore || (enableTotal ? (count < (totalCount ?? 0)) : (count >= effectiveLimit));

  const loadMore = useStabilizedCallbackAsync<void>(async () => {
    const newLimit: number = effectiveLimit + itemsPerPage;
    
    const result = await fetchMore({
      variables: { limit: newLimit } as AnyBecauseHard,
      updateQuery: (prev, {fetchMoreResult}) => fetchMoreResult ?? prev,
    });
    setLimitState(newLimit);
  });

  return {
    ...queryOutput,
    loadMoreProps: {
      loadMore,
      count,
      totalCount,
      loading,
      hidden: !showLoadMore,
      limit: effectiveLimit,
      showLoadMore,
    },
  };
}
