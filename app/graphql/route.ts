import { getExecutableSchema } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer, ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { configureSentryScope, getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import type { NextRequest } from 'next/server';
import { asyncLocalStorage, closePerfMetric, closeRequestPerfMetric, openPerfMetric, setAsyncStoreValue } from '@/server/perfMetrics';
import { captureException, getSentry } from '@/lib/sentryWrapper';
import { getClientIP } from '@/server/utils/getClientIP';
import { performanceMetricLoggingEnabled } from '@/lib/instanceSettings';
import { GraphQLFormattedError } from 'graphql';
import { inspect } from 'util';
import { formatError } from 'apollo-errors';

class ApolloServerLogging implements ApolloServerPlugin<ResolverContext> {
  async requestDidStart({ request, contextValue: context }: GraphQLRequestContext<ResolverContext>) {
    const { operationName = 'unknownGqlOperation', query, variables } = request;

    //remove sensitive data from variables such as password
    let filteredVariables = variables;
    if (variables) {
      filteredVariables =  Object.keys(variables).reduce((acc, key) => {
        return (key === 'password') ?  acc : { ...acc, [key]: variables[key] };
      }, {});
    }

    let startedRequestMetric: IncompletePerfMetric;
    if (performanceMetricLoggingEnabled.get()) {
      startedRequestMetric = openPerfMetric({
        op_type: 'query',
        op_name: operationName,
        parent_trace_id: context.perfMetric?.trace_id,
        extra_data: filteredVariables,
        gql_string: query
      });  
    }
    
    return {
      async willSendResponse() { // hook for transaction finished
        if (performanceMetricLoggingEnabled.get()) {
          closePerfMetric(startedRequestMetric);
        }
      }
    };
  }
}

// TODO: decide whether we want to always filter all of these out on /graphql requests
const NOISY_ERROR_MESSAGES = new Set(['app.operation_not_allowed', 'app.missing_document', 'app.document_not_found']);

const server = new ApolloServer<ResolverContext>({
  schema: getExecutableSchema(),
  introspection: true,
  allowBatchedHttpRequests: true,
  csrfPrevention: false,
  includeStacktraceInErrorResponses: true,
  plugins: [new ApolloServerLogging()],
  formatError: (formattedError, error): GraphQLFormattedError => {
    captureException(error);
    const {message, ...properties} = formattedError;
    if (!NOISY_ERROR_MESSAGES.has(message)) {
      // eslint-disable-next-line no-console
      console.error(`[GraphQLError: ${message}]`, inspect(properties, {depth: null}), error);
    }

    // TODO: Replace sketchy apollo-errors package with something first-party
    // and that doesn't require a cast here
    return formatError(formattedError) as any;
  },
});


const handler = startServerAndCreateNextHandler<NextRequest, ResolverContext>(server, {
  context: async (req) => {
    const context = await getContextFromReqAndRes({ req, isSSR: false });
    const Sentry = getSentry();
    if (!Sentry) {
      return context;
    }
    
    const isolationScope = Sentry.getIsolationScope();
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
  
        const Sentry = getSentry();
        if (!Sentry) {
          return incompletePerfMetric;
        }

        const isolationScope = Sentry.getIsolationScope();
  
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
