/** @jest-environment jsdom */

import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { Observable, type Subscriber } from "rxjs";
import { parse, print } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

interface SpotlightData {
  spotlights: {
    results: { __typename: "Spotlight", _id: string }[];
  };
}

interface SpotlightVariables {
  limit: number;
  selector: Record<string, unknown>;
}

// A minimal query fixture; both Apollo and the application's useQuery run normally.
const query: TypedDocumentNode<SpotlightData, SpotlightVariables> = parse(`
  query PaginationTest($limit: Int, $selector: SpotlightSelector) {
    spotlights(limit: $limit, selector: $selector) {
      results { _id }
    }
  }
`);

interface PendingRequest {
  limit: number;
  observer: Subscriber<ApolloLink.Result>;
}

function spotlightData(count: number): SpotlightData {
  return {
    spotlights: {
      results: Array.from({ length: count }, (_, i) => ({ __typename: "Spotlight", _id: `${i}` })),
    },
  };
}

function respond(request: PendingRequest, count: number) {
  request.observer.next({ data: spotlightData(count) });
  request.observer.complete();
}

function setupPagination(fetchPolicy: "network-only" | "cache-first" | "no-cache" = "network-only") {
  const requests: PendingRequest[] = [];
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(operation => new Observable(observer => {
      requests.push({ limit: operation.variables.limit, observer });
    })),
  });
  const wrapper = ({ children }: React.PropsWithChildren) => <ApolloProvider client={client}>{children}</ApolloProvider>;
  const hook = renderHook((selector: Record<string, unknown>) => useQueryWithLoadMore(query, {
    variables: { limit: 1, selector },
    fetchPolicy,
    nextFetchPolicy: fetchPolicy,
    itemsPerPage: 50,
  }), { wrapper, initialProps: {} });
  return { ...hook, client, requests };
}

describe("useQueryWithLoadMore", () => {
  beforeEach(() => {
    Object.assign(globalThis, { bundleIsServer: false });
    window.__LW_SSR_GQL__ = {
      [`${print(query)}\n::\n{"limit":1,"selector":{}}`]: { data: spotlightData(1) },
    };
  });

  afterEach(() => {
    Object.assign(globalThis, { bundleIsServer: true });
    delete window.__LW_SSR_GQL__;
  });

  it.each([true, false])("retains expanded results with the initial response arriving last: %s", async (initialResponseLast) => {
    const { result, client, requests } = setupPagination();
    await waitFor(() => expect(requests).toHaveLength(1));
    expect(result.current.data?.spotlights.results).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    let loadingMore: Promise<void>;
    act(() => { loadingMore = result.current.loadMoreProps.loadMore(); });
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].limit).toBe(51);
    expect(result.current.data?.spotlights.results).toHaveLength(1);
    expect(result.current.loading).toBe(true);
    if (!initialResponseLast) {
      await act(async () => { respond(requests[0], 1); });
    }
    await act(async () => {
      respond(requests[1], 51);
      await loadingMore;
    });
    if (initialResponseLast) {
      await act(async () => { respond(requests[0], 1); });
    }

    expect(result.current.data?.spotlights.results).toHaveLength(51);
    expect(result.current.loadMoreProps.hidden).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.variables.limit).toBe(51);
    expect(requests).toHaveLength(2);

    // A later refetch must also preserve the expanded limit.
    let refetching: Promise<unknown>;
    act(() => { refetching = result.current.refetch(); });
    await waitFor(() => expect(requests).toHaveLength(3));
    expect(requests[2].limit).toBe(51);
    await act(async () => {
      respond(requests[2], 51);
      await refetching;
    });

    act(() => { loadingMore = result.current.loadMoreProps.loadMore(); });
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(requests[3].limit).toBe(101);
    expect(result.current.data?.spotlights.results).toHaveLength(51);
    await act(async () => {
      respond(requests[3], 70);
      await loadingMore;
    });
    expect(result.current.data?.spotlights.results).toHaveLength(70);
    expect(result.current.loadMoreProps.hidden).toBe(true);
    client.stop();
  });

  it("keeps the list and allows retrying the same page after an error", async () => {
    const { result, client, requests } = setupPagination();
    await act(async () => { respond(requests[0], 1); });
    let loadingMore: Promise<void>;
    act(() => { loadingMore = result.current.loadMoreProps.loadMore(); });
    await act(async () => {
      const rejected = expect(loadingMore).rejects.toThrow("Network failure");
      requests[1].observer.error(new Error("Network failure"));
      await rejected;
    });
    expect(result.current.data?.spotlights.results).toHaveLength(1);
    expect(result.current.loadMoreProps.hidden).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.loadMoreProps.limit).toBe(1);

    act(() => { loadingMore = result.current.loadMoreProps.loadMore(); });
    expect(requests[2].limit).toBe(51);
    await act(async () => {
      respond(requests[2], 51);
      await loadingMore;
    });
    expect(result.current.data?.spotlights.results).toHaveLength(51);
    expect(result.current.loadMoreProps.limit).toBe(51);
    client.stop();
  });

  it.each<"cache-first" | "no-cache">(["cache-first", "no-cache"])("loads more with %s", async (fetchPolicy) => {
    const { result, client, requests } = setupPagination(fetchPolicy);
    if (requests.length) {
      await act(async () => { respond(requests[0], 1); });
    }
    const initialRequestCount = requests.length;
    let loadingMore: Promise<void>;
    act(() => { loadingMore = result.current.loadMoreProps.loadMore(); });
    expect(result.current.data?.spotlights.results).toHaveLength(1);
    expect(requests[initialRequestCount].limit).toBe(51);
    await act(async () => {
      respond(requests[initialRequestCount], 51);
      await loadingMore;
    });
    expect(result.current.data?.spotlights.results).toHaveLength(51);
    expect(result.current.loadMoreProps.hidden).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(requests).toHaveLength(initialRequestCount + 1);
    client.stop();
  });

  it("resets pagination when the selector changes during a request", async () => {
    const { result, rerender, client, requests } = setupPagination();
    await act(async () => { respond(requests[0], 1); });
    let loadingMore: Promise<void>;
    act(() => { loadingMore = result.current.loadMoreProps.loadMore(); });
    rerender({ otherView: {} });
    expect(requests[2].limit).toBe(1);
    expect(result.current.data).toBeUndefined();
    await act(async () => {
      respond(requests[2], 1);
      respond(requests[1], 51);
      await loadingMore;
    });
    expect(result.current.data?.spotlights.results).toHaveLength(1);
    expect(result.current.variables.limit).toBe(1);
    expect(result.current.loadMoreProps.limit).toBe(1);
    expect(result.current.loadMoreProps.hidden).toBe(false);
    expect(requests).toHaveLength(3);
    client.stop();
  });
});
