'use client';
import React, { createContext, useContext, useState } from "react";

export type SsrQueryCache = {
  queryPromises: Map<string, Promise<any>>;
};

const SSRQueryCacheContext = createContext<SsrQueryCache | null>(null);

export const SsrQueryCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const [cache] = useState<SsrQueryCache>(() => ({
    queryPromises: new Map<string, Promise<any>>()
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
