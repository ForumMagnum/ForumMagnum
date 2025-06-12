// import './reactFactoryShim';
// import '@/server.ts';
import { typeDefs, resolvers } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import { initDatabases, initPostgres, initSettings } from '../../packages/lesswrong/server/serverStartup';
// import { createVoteableUnionType } from '@/server/votingGraphQL';


// createVoteableUnionType();
const schema = makeExecutableSchema({ typeDefs, resolvers });

await initDatabases({
 postgresUrl: process.env.PG_URL || '',
 postgresReadUrl: process.env.PG_URL || '',
});
await initPostgres();
await initSettings();


const server = new ApolloServer({
 schema,
 introspection: true,
});


const handler = startServerAndCreateNextHandler(server, {
 context: async (req, res) =>
   await getContextFromReqAndRes({ req, res, isSSR: false }),
});


export default handler
