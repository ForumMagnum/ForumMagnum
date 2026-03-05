export interface SSRQueryRuntimeContext {
  isSsrQueryRuntimeContext: true;
  requestId: string;
  resolverContext?: ResolverContext;
}

export function isSSRQueryRuntimeContext(value: unknown): value is SSRQueryRuntimeContext {
  return !!value && typeof value === "object" && (value as SSRQueryRuntimeContext).isSsrQueryRuntimeContext === true;
}
