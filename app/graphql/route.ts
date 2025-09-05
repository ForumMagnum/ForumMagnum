import { getExecutableSchema } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { configureSentryScope, getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import type { NextRequest } from 'next/server';
import { asyncLocalStorage, closeRequestPerfMetric, openPerfMetric, setAsyncStoreValue } from '@/server/perfMetrics';
import { captureException, getIsolationScope } from '@sentry/nextjs';
import { getClientIP } from '@/server/utils/getClientIP';
import { performanceMetricLoggingEnabled } from '@/lib/instanceSettings';

const server = new ApolloServer<ResolverContext>({
  schema: getExecutableSchema(),
  introspection: true,
  allowBatchedHttpRequests: true,
  csrfPrevention: false,
  includeStacktraceInErrorResponses: true,
});


const handler = startServerAndCreateNextHandler<NextRequest, ResolverContext>(server, {
  context: async (req) => {
    const context = await getContextFromReqAndRes({ req, isSSR: false });
    const isolationScope = getIsolationScope();
    configureSentryScope(context, isolationScope);
    return context;
  }
});

function sharedHandler(request: NextRequest) {
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
    let res;
    try {
      res = await handler(request);
    } catch (error) {
      captureException(error);
      throw error;
    } finally {
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
    }

    return res;
  });
}

export function GET(request: NextRequest) {
  return sharedHandler(request);
}

export async function POST(request: NextRequest) {
  return sharedHandler(request);
}
