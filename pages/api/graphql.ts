import './reactFactoryShim';
import '@/server.ts';
import { getGraphQLSchema } from '@/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { getContextFromReqAndRes } from '@/server/vulcan-lib/apollo-server/context';
import { initDatabases, initPostgres, initSettings } from '@/server/serverStartup';
import { createVoteableUnionType } from '@/server/votingGraphQL';
import '@/lib/collections/posts/voting';


createVoteableUnionType();
const {typeDefs, resolvers } = getGraphQLSchema();
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
