import { typeDefs, resolvers } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import { initDatabases, initSettings } from '../../packages/lesswrong/server/serverStartup';
import type { NextRequest } from 'next/server';

const schema = makeExecutableSchema({ typeDefs, resolvers });

await initDatabases({
 postgresUrl: process.env.PG_URL || '',
 postgresReadUrl: process.env.PG_READ_URL || '',
});
await initSettings();


const server = new ApolloServer<ResolverContext>({
 schema,
 introspection: true,
 allowBatchedHttpRequests: true,
 csrfPrevention: false,
});


const handler = startServerAndCreateNextHandler<NextRequest, ResolverContext>(server, {
  // IDK if that cast is actually safe/correct; I'm pretty sure the conditional type provided for `res` is wrong
  // but :shrug:
 context: async (req) => await getContextFromReqAndRes({ req, isSSR: false }),
});

export { handler as GET, handler as POST };
