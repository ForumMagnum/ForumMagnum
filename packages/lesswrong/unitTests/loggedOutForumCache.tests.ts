import { ApolloClient, InMemoryCache } from '@apollo/client';
import { GraphQLObjectType, GraphQLSchema, GraphQLString, parse } from 'graphql';
import type { ForumTypeString } from '@/lib/instanceSettings';
import { LoggedOutCacheLink } from '@/server/rendering/loggedOutCacheLink';

function createClient(schema: GraphQLSchema, forumType: ForumTypeString) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new LoggedOutCacheLink(schema, forumType),
  });
}

describe('logged-out SSR forum cache', () => {
  it('executes and caches identical queries separately for LW and AF', async () => {
    const resolve = jest.fn((_source: unknown, _args: unknown, context: ResolverContext) => context.forumType);
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: { forum: { type: GraphQLString, resolve } },
      }),
    });
    const lw = createClient(schema, 'LessWrong');
    const af = createClient(schema, 'AlignmentForum');
    const query = parse('query ForumCacheTest { forum }');

    for (const client of [lw, af, lw, af]) {
      const result = await client.query({ query, context: { loggedOutCache: true }, fetchPolicy: 'no-cache' });
      expect(result.data).toEqual({ forum: client === lw ? 'LessWrong' : 'AlignmentForum' });
    }
    expect(resolve).toHaveBeenCalledTimes(2);
    lw.stop();
    af.stop();
  });
});
