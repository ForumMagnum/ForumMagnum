import { typeDefs, resolvers } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from '@apollo/server';
import { getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import type { NextRequest } from 'next/server';
import { asyncLocalStorage, closeRequestPerfMetric, openPerfMetric } from '@/server/perfMetrics';
import { logAllQueries } from '@/server/sql/sqlClient';

const schema = makeExecutableSchema({ typeDefs, resolvers });

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

// export { handler as GET, handler as POST };

export function GET(request: NextRequest) {
  const perfMetric = openPerfMetric({
    op_type: 'request',
    op_name: request.url,
  });

  return asyncLocalStorage.run({ requestPerfMetric: perfMetric }, () => handler(request)).then(res => {
    closeRequestPerfMetric();
    return res;
  });
}

export async function POST(request: NextRequest) {
  const isSSRRequest = request.headers.get('isSSR') === 'true';
  
  const perfMetric = openPerfMetric({
    op_type: 'request',
    op_name: request.url,
  });

  const clonedRequest = request.clone();
  if (isSSRRequest && logAllQueries) {
    console.log(`Entering /graphql with traceId ${perfMetric.trace_id} and gql op ${(await clonedRequest.json())[0]?.operationName}`)
  }

  return asyncLocalStorage.run({ requestPerfMetric: perfMetric, isSSRRequest }, () => handler(request));
}