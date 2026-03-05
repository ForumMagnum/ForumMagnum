'use client';
import React, { createContext, useContext } from "react";
import type { SSRQueryRuntimeContext } from "./ssrQueryRuntimeContext";

export const SSRResolverContext = createContext<SSRQueryRuntimeContext | null>(null);

export function useSSRResolverContext(): SSRQueryRuntimeContext {
  return useContext(SSRResolverContext)!;
}


