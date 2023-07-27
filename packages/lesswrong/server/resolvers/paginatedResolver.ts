import {
  addGraphQLQuery,
  addGraphQLResolvers,
  addGraphQLSchema,
} from "../vulcan-lib";

export const createPaginatedResolver = <T>({name, graphQLType, callback}: {
  name: string,
  graphQLType: string,
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
