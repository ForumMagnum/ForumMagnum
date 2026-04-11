import { getExecutableSchema } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/initGraphQL';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer, ApolloServerPlugin, GraphQLRequestContext, GraphQLRequestContextWillSendResponse } from '@apollo/server';
import { configureSentryScope, getContextFromReqAndRes } from '../../packages/lesswrong/server/vulcan-lib/apollo-server/context';
import type { NextRequest } from 'next/server';
import { asyncLocalStorage, closePerfMetric, closeRequestPerfMetric, openPerfMetric, setAsyncStoreValue } from '@/server/perfMetrics';
import { captureException, getSentry } from '@/lib/sentryWrapper';
import { getClientIP } from '@/server/utils/getClientIP';
import { fmCrosspostBaseUrlSetting, performanceMetricLoggingEnabled } from '@/lib/instanceSettings';
import { GraphQLFormattedError } from 'graphql';
import { inspect } from 'util';
import { formatError } from 'apollo-errors';
import { crosspostOptionsHandler, setCorsHeaders, setSandboxedIframeCorsHeaders } from "@/server/crossposting/cors";
import { NOISY_GRAPHQL_ERROR_MESSAGES, shouldCaptureGraphQLErrorInSentry } from '@/server/utils/graphqlErrorUtil';

// Vercel's serverless functions drop response bodies larger than ~4.5 MB and
// return a 200 with a truncated/empty body, which surfaces on the client as a
// generic "missing response" error (see #m_bugs-channel thread on Chase's
// draft-save failures, 2026-04-01). Emit a Sentry warning before we cross that
// line so we can correlate the symptom with a specific GraphQL operation
// instead of chasing it through client-side error logs.
const GRAPHQL_RESPONSE_SIZE_WARN_BYTES = 4 * 1024 * 1024; // 4 MB
const GRAPHQL_RESPONSE_SIZE_HARD_LIMIT_BYTES = 4.5 * 1024 * 1024; // ~Vercel limit

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
      async willSendResponse(requestContext: GraphQLRequestContextWillSendResponse<ResolverContext>) { // hook for transaction finished
        if (performanceMetricLoggingEnabled.get()) {
          closePerfMetric(startedRequestMetric);
        }

        // Check the response body size and warn when it gets close to
        // Vercel's serverless response-body cap. We measure by serializing
        // the `singleResult` payload; batched requests produce one
        // willSendResponse per operation, so each sub-response is measured
        // independently (and total batch size is at least the sum).
        try {
          const responseBody = requestContext.response.body;
          if (responseBody.kind === 'single') {
            const serialized = JSON.stringify(responseBody.singleResult);
            const byteLength = Buffer.byteLength(serialized, 'utf8');
            if (byteLength >= GRAPHQL_RESPONSE_SIZE_WARN_BYTES) {
              const overLimit = byteLength >= GRAPHQL_RESPONSE_SIZE_HARD_LIMIT_BYTES;
              const message = overLimit
                ? `GraphQL response OVER Vercel body size limit: ${operationName} = ${byteLength} bytes (limit ~${GRAPHQL_RESPONSE_SIZE_HARD_LIMIT_BYTES})`
                : `GraphQL response approaching Vercel body size limit: ${operationName} = ${byteLength} bytes (warn ${GRAPHQL_RESPONSE_SIZE_WARN_BYTES}, limit ~${GRAPHQL_RESPONSE_SIZE_HARD_LIMIT_BYTES})`;
              // eslint-disable-next-line no-console
              console.warn(`[graphql] ${message}`);
              const err = new Error(message);
              err.name = overLimit ? 'GraphQLResponseOverSizeLimit' : 'GraphQLResponseNearSizeLimit';
              captureException(err);
            }
          }
        } catch {
          // Measurement must never break the response path.
        }
      }
    };
  }
}

const server = new ApolloServer<ResolverContext>({
  schema: getExecutableSchema(),
  introspection: true,
  allowBatchedHttpRequests: true,
  csrfPrevention: false,
  includeStacktraceInErrorResponses: true,
  plugins: [new ApolloServerLogging()],
  formatError: (formattedError, error): GraphQLFormattedError => {
    if (shouldCaptureGraphQLErrorInSentry(error)) {
      captureException(error);
    }
    const {message, ...properties} = formattedError;
    if (!NOISY_GRAPHQL_ERROR_MESSAGES.has(message)) {
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

function isSandboxedIframeRequest(request: NextRequest) {
  return request.headers.get('origin') === 'null';
}

function isCrossSiteRequest(request: NextRequest) {
  const fmCrosspostBaseUrl = fmCrosspostBaseUrlSetting.get();
  if (!fmCrosspostBaseUrl) {
    return false;
  }

  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin) {
    return false;
  }

  try {
    const crossSiteHostname = new URL(fmCrosspostBaseUrl).hostname;
    const requestOriginHostname = new URL(requestOrigin).hostname;
    return requestOriginHostname === crossSiteHostname;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error parsing fmCrosspostBaseUrl when determining if request is cross-site for setting CORS headers", error);
    return false;
  }
}

async function sharedHandler(request: NextRequest) {
  if (!performanceMetricLoggingEnabled.get()) {
    const res = await handler(request);

    if (isSandboxedIframeRequest(request)) {
      setSandboxedIframeCorsHeaders(res);
    } else if (isCrossSiteRequest(request)) {
      setCorsHeaders(res);
    }
    return res;
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

    if (isSandboxedIframeRequest(request)) {
      setSandboxedIframeCorsHeaders(res);
    } else if (isCrossSiteRequest(request)) {
      setCorsHeaders(res);
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

export function OPTIONS(req: NextRequest) {
  if (isSandboxedIframeRequest(req)) {
    const res = new Response(null, { status: 204 });
    setSandboxedIframeCorsHeaders(res);
    return res;
  }
  return crosspostOptionsHandler(req);
}
