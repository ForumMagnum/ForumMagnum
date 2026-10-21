'use client';
import { createContext, useContext } from "react";

export const SSRResolverContext = createContext<ResolverContext | null>(null);

export function useSSRResolverContext(): ResolverContext {
  return useContext(SSRResolverContext)!;
}


