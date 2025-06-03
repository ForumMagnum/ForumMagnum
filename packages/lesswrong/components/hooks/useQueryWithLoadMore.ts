import { useQuery, type OperationVariables, type QueryHookOptions } from "@apollo/client";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { Kind } from "graphql";
import { useLoadMore } from "./useLoadMore";
import { apolloSSRFlag } from "@/lib/helpers";

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

export function useQueryWithLoadMore<
  TData extends Record<string, any>,
  TVariables extends OperationVariables
>(
  query: TypedDocumentNode<ValidPaginatedData<TData>, TVariables>,
  options: QueryHookOptions<ValidPaginatedData<TData>, TVariables> & PaginatedQueryOptions & {
    variables: TVariables & PaginatedQueryVariables;
  }
) {
  const {
    variables,
    ssr,
    notifyOnNetworkStatusChange = true,
    itemsPerPage = 10,
    alwaysShowLoadMore = false,
    ...remainingOptions
  } = options;

  const { limit, selector, ...remainingVariables } = variables ?? {};
  const initialLimit = (selector && 'limit' in selector && typeof selector.limit === 'number')
    ? selector.limit
    : (limit ?? 10);

  const patchedSsr = apolloSSRFlag(ssr);

  const optionsWithDefaults = {
    ...remainingOptions,
    ssr: patchedSsr,
    notifyOnNetworkStatusChange,
    variables: {
      ...({ selector, ...remainingVariables }) as TVariables,
      limit: initialLimit,
    }
  };

  const queryOutput = useQuery(query, optionsWithDefaults);
  const { data, loading, fetchMore } = queryOutput;

  const queryName = query.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION)?.selectionSet?.selections?.find(s => s.kind === Kind.FIELD)?.name?.value;
  const queryResult = data?.[queryName as keyof typeof data];

  const loadMoreProps = useLoadMore({
    data: queryResult,
    loading,
    fetchMore,
    initialLimit,
    itemsPerPage,
    alwaysShowLoadMore,
    enableTotal: variables.enableTotal,
    resetTrigger: variables.selector,
  });

  return {
    ...queryOutput,
    loadMoreProps,
  };
}
