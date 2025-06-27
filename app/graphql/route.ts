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
  // IDK if that cast is actually safe/correct; I'm pretty sure the conditional type provided for `res` is wrong
  // but :shrug:
 context: async (req, res) => await getContextFromReqAndRes({ req, res: res as unknown as NextResponse, isSSR: false }),
});


export function GET(req: NextRequest) {
  return handler(req);
}

export function POST(req: NextRequest) {
  return handler(req);
}
