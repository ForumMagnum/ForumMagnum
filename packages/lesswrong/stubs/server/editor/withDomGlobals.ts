export function withDomGlobals<T>(fn: () => T): T {
  throw new Error("withDomGlobals called from client-side code!");
}
