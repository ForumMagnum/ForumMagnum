import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import {
  addGraphQLQuery,
  addGraphQLResolvers,
  addGraphQLSchema,
  getCollectionByTypeName
} from "../vulcan-lib";

/**
 * Checks if a graphql type passed in as a string literal is one of those that corresponds a collection's DbObject type
 * If so, return the corresponding DbObject type.  If not, return the manually specified type.
 */
type MaybeCollectionType<GraphQLType extends string, Fallback> =
  GraphQLType extends keyof ObjectsByTypeName
    ? ObjectsByTypeName[GraphQLType]
    : Fallback;

/**
 * Create a paginated resolver for use on the frontend with `usePaginatedResolver`.
 * This enables having custom SQL queries with a `useMulti`-like interface.
 */
export const createPaginatedResolver = <
  FallbackReturnType,
  GraphQLType extends string,
  ReturnType extends MaybeCollectionType<GraphQLType, FallbackReturnType>
>({
  name,
  graphQLType,
  callback,
  cacheMaxAgeMs = 0,
}: {
  /**
   * The name of the resolver - this should match `resolverName` in the call to
   * `usePaginatedResolver`
   */
  name: string,
  /**
   * The GraphQL type of the result (eg; "Comment"). Note that the result should
   * be an _array_ of this type.
   */
  graphQLType: GraphQLType,
  /**
   * The callback to fetch results, which will generally call into a repo (all
   * repos are available in `context.repos`).
   */
  callback: (context: ResolverContext, limit: number) => Promise<ReturnType[]>,
  /**
   * Optional cache TTL in milliseconds - if undefined or 0 no cache is used
   */
  cacheMaxAgeMs?: number,
}) => {
  let cachedAt = Date.now();
  let cached: ReturnType[] = [];

  // Try to get the collection for later permission checking if we're passed in a GraphQL type which would allow that
  let collection: CollectionBase<any, CollectionNameString> | undefined;
  try {
    collection = getCollectionByTypeName(graphQLType);
  } catch (err) {
    // Nothing to do anything in this case
    // We can't yet distinguish between getting passed a GraphQL type which is real but not a collection-derived type, and one that isn't real
  }

  addGraphQLResolvers({
    Query: {
      [name]: async (
        _: void,
        {limit}: {limit: number},
        context: ResolverContext,
      ): Promise<{results: ReturnType[]}> => {
        const accessFilterFunction = collection
          ? (records: (ReturnType & DbObject)[]) => accessFilterMultiple<ReturnType & DbObject>(context.currentUser, collection!, records, context)
          : undefined;

        if (
          cacheMaxAgeMs > 0 &&
          Date.now() - cachedAt < cacheMaxAgeMs &&
          cached.length >= limit
        ) {
          const filteredResults = await accessFilterFunction?.(cached as (ReturnType & DbObject)[]) ?? cached;
          return {results: filteredResults.slice(0, limit)};
        }
        const results = await callback(context, limit);
        cachedAt = Date.now();
        cached = results;
        const filteredResults = await accessFilterFunction?.(results as (ReturnType & DbObject)[]) ?? results;
        return {results: filteredResults};
      },
    },
  });

  addGraphQLSchema(`
    type ${name}Result {
      results: [${graphQLType}!]!
    }
  `);

  addGraphQLQuery(`${name}(limit: Int): ${name}Result`);
}
