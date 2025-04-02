import { ACCESS_FILTERED } from "@/lib/utils/schemaUtils";

export function wrapMutatorFunction<
  T extends (args: unknown, context: ResolverContext, skipValidation?: boolean) => Promise<any>,
  F extends (rawResult: Awaited<ReturnType<T>>, context: ResolverContext) => Promise<O>,
  O extends { [ACCESS_FILTERED]: true } | null
>(func: T, accessFilter: F) {
  return async (root: void, args: Parameters<T>[0], context: ResolverContext) => {
    const rawResult = await func(args, context);
    const filteredResult = await accessFilter(rawResult, context);
    return { data: filteredResult };
  };
}
