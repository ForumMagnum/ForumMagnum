import { collectionNameToGraphQLType } from '../vulcan-lib/collections';

export interface DefaultResolverOptions {
  cacheMaxAge: number
}

export const defaultResolverOptions: Partial<Record<
  CollectionNameString,
  Partial<DefaultResolverOptions>
>> = {};

/**
 * Default resolvers. Provides `single` and `multi` resolvers, which power the
 * useSingle and useMulti hooks.
 */
export function getDefaultResolvers<N extends CollectionNameString>(
  collectionName: N,
  options?: Partial<DefaultResolverOptions>,
) {
  const typeName = collectionNameToGraphQLType(collectionName);
  defaultResolverOptions[collectionName] = options;

  return {
    /**
     * Resolver for returning a list of documents based on a set of query terms
     * Implementation in `@/server/resolvers/defaultResolvers.ts`
     */
    multi: {
      description: `A list of ${typeName} documents matching a set of query terms`,
    },

    /**
     * Resolver for returning a single document queried based on id or slug
     * Implementation in `@/server/resolvers/defaultResolvers.ts`
     */
    single: {
      description: `A single ${typeName} document fetched by ID or slug`,
    },
  };
}
