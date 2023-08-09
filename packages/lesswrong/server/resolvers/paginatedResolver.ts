import {
  addGraphQLQuery,
  addGraphQLResolvers,
  addGraphQLSchema,
} from "../vulcan-lib";

/**
 * Create a paginated resolver for use on the frontend with `usePaginatedResolver`.
 * This enables having custom SQL queries with a `useMulti`-like interface.
 */
export const createPaginatedResolver = <T>({name, graphQLType, callback}: {
  /**
   * The name of the resolver - this should match `resolverName` in the call to
   * `usePaginatedResolver`
   */
  name: string,
  /**
   * The GraphQL type of the result (eg; "Comment"). Note that the result should
   * be an _array_ of this type.
   */
  graphQLType: string,
  /**
   * The callback to fetch results, which will generally call into a repo (all
   * repos are available in `context.repos`).
   */
  callback: (context: ResolverContext, limit: number) => Promise<T[]>,
}) => {
  addGraphQLResolvers({
    Query: {
      [name]: async (
        _: void,
        {limit}: {limit: number},
        context: ResolverContext,
      ) => {
        const results = await callback(context, limit);
        return {results};
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
