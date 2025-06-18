import { typeDefs, resolvers } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import { initDatabases, initPostgres, initSettings } from '../../packages/lesswrong/server/serverStartup';
import type { NextRequest, NextResponse } from 'next/server';

const schema = makeExecutableSchema({ typeDefs, resolvers });

await initDatabases({
 postgresUrl: process.env.PG_URL || '',
 postgresReadUrl: process.env.PG_URL || '',
});
await initPostgres();
await initSettings();


const server = new ApolloServer<ResolverContext>({
 schema,
 introspection: true,
 allowBatchedHttpRequests: true,
 csrfPrevention: false,
});


const handler = startServerAndCreateNextHandler<NextRequest, ResolverContext>(server, {
 context: async (req, res) => await getContextFromReqAndRes({ req, res, isSSR: false }),
});




export { handler as GET, handler as POST };
