import './reactFactoryShim';
import '@/lib/collections/lwevents/collection'
import '@/server.ts';
import { getGraphQLSchema } from '@/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { getContextFromReqAndRes } from '@/server/vulcan-lib/apollo-server/context';
import { initDatabases, initPostgres, initSettings } from '@/server/serverStartup';
import { createVoteableUnionType } from '@/server/votingGraphQL';
import '@/lib/collections/posts/voting';
import '@/lib/collections/conversations/collection';
import { addAllDefaultResolvers } from '@/server/resolvers/defaultResolvers';


addAllDefaultResolvers()
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
 includeStacktraceInErrorResponses: true,
});


const handler = startServerAndCreateNextHandler(server, {
 context: async (req, res) =>{
  try {
    return await getContextFromReqAndRes({ req, res, isSSR: false })
  } catch (e) {
    console.error(e)
    throw e
  }
 },

  
});


export default handler
