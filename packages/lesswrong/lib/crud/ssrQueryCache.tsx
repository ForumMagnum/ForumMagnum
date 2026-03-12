'use client';
import React, { createContext, useContext, useState } from "react";
import { createGraphqlDeduplicatedObjectStore, type Graphql2ObjectStore } from "@/lib/apollo/graphqlDeduplicatedObjectStore";

export type SsrQueryCache = {
  queryPromises: Map<string, Promise<any>>;
  deduplicatedObjectStore: Graphql2ObjectStore;
};

const SSRQueryCacheContext = createContext<SsrQueryCache | null>(null);

export const SsrQueryCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const [cache] = useState<SsrQueryCache>(() => ({
    queryPromises: new Map<string, Promise<any>>(),
    deduplicatedObjectStore: createGraphqlDeduplicatedObjectStore(),
  }));

  return <SSRQueryCacheContext.Provider value={cache}>
    {children}
  </SSRQueryCacheContext.Provider>
};

export function useSsrQueryCache(): SsrQueryCache {
  const cache = useContext(SSRQueryCacheContext);
  if (!cache) {
    throw new Error("useSsrQueryCache called outside of SsrQueryCacheProvider");
  }
  return cache;
}
