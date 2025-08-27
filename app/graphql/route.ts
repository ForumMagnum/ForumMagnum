import { getExecutableSchema } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { configureSentryScope, getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import type { NextRequest } from 'next/server';
import { asyncLocalStorage, closeRequestPerfMetric, openPerfMetric, setAsyncStoreValue } from '@/server/perfMetrics';
import { logAllQueries } from '@/server/sql/sqlClient';
import { getIsolationScope } from '@sentry/nextjs';
import { getClientIP } from '@/server/utils/getClientIP';
import { performanceMetricLoggingEnabled } from '@/lib/instanceSettings';

const server = new ApolloServer<ResolverContext>({
  schema: getExecutableSchema(),
  introspection: true,
  allowBatchedHttpRequests: true,
  csrfPrevention: false,
});


const handler = startServerAndCreateNextHandler<NextRequest, ResolverContext>(server, {
  context: async (req) => {
    const context = await getContextFromReqAndRes({ req, isSSR: false });
    const isolationScope = getIsolationScope();
    configureSentryScope(context, isolationScope);
    return context;
  }
});

export function GET(request: NextRequest) {
  if (!performanceMetricLoggingEnabled.get()) {
    return handler(request);
  }
  
  const perfMetric = openPerfMetric({
    op_type: 'request',
    op_name: request.url,
    client_path: request.headers.get('request-origin-path') ?? undefined,
    ip: getClientIP(request.headers),
    user_agent: request.headers.get('user-agent') ?? undefined,
  });

  return asyncLocalStorage.run({ requestPerfMetric: perfMetric }, async () => {
    const res = await handler(request);
    
    setAsyncStoreValue('requestPerfMetric', (incompletePerfMetric) => {
      if (!incompletePerfMetric) {
        return;
      }

      const isolationScope = getIsolationScope();
      const userId = isolationScope.getUser()?.id;

      return {
        ...incompletePerfMetric,
        user_id: userId?.toString(),
      };
    });

    closeRequestPerfMetric();

    return res;
  });
}

export async function POST(request: NextRequest) {
  if (!performanceMetricLoggingEnabled.get()) {
    return handler(request);
  }

  const isSSRRequest = request.headers.get('isSSR') === 'true';
  
  const perfMetric = openPerfMetric({
    op_type: 'request',
    op_name: request.url,
    client_path: request.headers.get('request-origin-path') ?? undefined,
    ip: getClientIP(request.headers),
    user_agent: request.headers.get('user-agent') ?? undefined,
  });

  const clonedRequest = request.clone();
  if (isSSRRequest && logAllQueries) {
    console.log(`Entering /graphql with traceId ${perfMetric.trace_id} and gql op ${(await clonedRequest.json())[0]?.operationName}`)
  }

  return asyncLocalStorage.run({ requestPerfMetric: perfMetric, isSSRRequest }, async () => {
    const res = await handler(request);

    setAsyncStoreValue('requestPerfMetric', (incompletePerfMetric) => {
      if (!incompletePerfMetric) {
        return;
      }

      const isolationScope = getIsolationScope();

      const userId = isolationScope.getUser()?.id;

      return {
        ...incompletePerfMetric,
        user_id: userId?.toString(),
      };
    });

    closeRequestPerfMetric();

    return res;
  });
}
