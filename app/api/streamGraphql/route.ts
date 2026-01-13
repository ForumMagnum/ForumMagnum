import type { NextRequest } from "next/server";
import { GraphQLError, type GraphQLFormattedError, graphql } from "graphql";
import { inspect } from "util";
import { formatError } from "apollo-errors";

import { getExecutableSchema } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { configureSentryScope, getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { asyncLocalStorage, closePerfMetric, openPerfMetric } from "@/server/perfMetrics";
import { captureException, getSentry } from "@/lib/sentryWrapper";
import { getClientIP } from "@/server/utils/getClientIP";
import { fmCrosspostBaseUrlSetting, performanceMetricLoggingEnabled } from "@/lib/instanceSettings";
import { crosspostOptionsHandler, setCorsHeaders } from "@/server/crossposting/cors";
import { createGraphqlDeduplicatedObjectStore, extractToObjectStoreAndSubstitute } from "@/lib/apollo/graphqlDeduplicatedObjectStore";

type GraphqlHttpRequestBody = {
  operationName?: string | null;
  query: string;
  variables?: Record<string, unknown> | null;
  extensions?: Record<string, unknown> | null;
};

// TODO: decide whether we want to always filter all of these out on /api/streamingGraphql requests
const NOISY_ERROR_MESSAGES = new Set([
  "app.operation_not_allowed",
  "app.missing_document",
  "app.document_not_found",
]);

function isCrossSiteRequest(request: NextRequest) {
  const fmCrosspostBaseUrl = fmCrosspostBaseUrlSetting.get();
  if (!fmCrosspostBaseUrl) {
    return false;
  }

  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) {
    return false;
  }

  try {
    const crossSiteHostname = new URL(fmCrosspostBaseUrl).hostname;
    const requestOriginHostname = new URL(requestOrigin).hostname;
    return requestOriginHostname === crossSiteHostname;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "Error parsing fmCrosspostBaseUrl when determining if request is cross-site for setting CORS headers",
      error,
    );
    return false;
  }
}

function formatGraphQLError(err: any): any {
  captureException(err);
  if (err instanceof GraphQLError) {
    const formatted = err.toJSON();
    const { message, ...properties } = formatted;
    if (!NOISY_ERROR_MESSAGES.has(message)) {
      // eslint-disable-next-line no-console
      console.error(`[GraphQLError: ${message}]`, inspect(properties, { depth: null }), err);
    }
  
    // ApolloServer includes stack traces; mimic that shape for parity.
    const stack =
      err.originalError?.stack ??
      err.stack ??
      undefined;
  
    const withStack: GraphQLFormattedError = {
      ...formatted,
      extensions: {
        ...(formatted.extensions ?? {}),
        exception: {
          ...(typeof formatted.extensions?.exception === "object"
            ? (formatted.extensions.exception as Record<string, unknown>)
            : {}),
          stacktrace: stack ? stack.split("\n") : undefined,
        },
      },
    };
  
    // TODO: Replace sketchy apollo-errors package with something first-party
    // and that doesn't require a cast here
    return formatError(withStack) as unknown as GraphQLFormattedError;
  } else {
    return err?.message ?? JSON.stringify(err);
  }
}

async function executeGraphqlOperation({ op, context }: {
  op: GraphqlHttpRequestBody;
  context: ResolverContext;
}): Promise<any> {
  const schema = getExecutableSchema();
  const result = await graphql({
    schema,
    source: op.query,
    rootValue: {},
    contextValue: context,
    variableValues: op.variables ?? undefined,
    operationName: op.operationName ?? undefined,
  });

  if (result.errors?.length) {
    return {
      ...result,
      errors: result.errors.map(formatGraphQLError),
    };
  }

  return result;
}

async function graphqlStreamingHandler(request: NextRequest, { onComplete }: { onComplete?: (error?: unknown) => void } = {}) {
  const context = await getContextFromReqAndRes({ req: request, isSSR: false });
  const Sentry = getSentry();
  if (Sentry) {
    const isolationScope = Sentry.getIsolationScope();
    configureSentryScope(context, isolationScope);
  }

  const encoder = new TextEncoder();
  let cancelled = false;
  const objectStore = createGraphqlDeduplicatedObjectStore();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let nextIndex = 0;
      let inFlight = 0;
      let requestDone = false;
      let wroteOpenBracket = false;
      let wroteAnyItem = false;

      const enqueueLine = (obj: unknown) => {
        if (cancelled) return;
        if (!wroteOpenBracket) {
          controller.enqueue(encoder.encode("[\n"));
          wroteOpenBracket = true;
        }
        if (wroteAnyItem) {
          controller.enqueue(encoder.encode(",\n"));
        }
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        wroteAnyItem = true;
      };

      const maybeClose = () => {
        if (cancelled) return;
        if (requestDone && inFlight === 0) {
          if (!wroteOpenBracket) {
            controller.enqueue(encoder.encode("[\n"));
            wroteOpenBracket = true;
          }
          controller.enqueue(encoder.encode("]\n"));
          controller.close();
          onComplete?.();
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      void (async () => {
        try {
          const requestQueries = await request.json();
          for (const query of requestQueries) {
            if (cancelled) break;

            const index = nextIndex++;
            inFlight += 1;
            (async () => {
              try {
                const result = await executeGraphqlOperation({ op: query, context });
                const { substituted, delta } = extractToObjectStoreAndSubstitute(result, objectStore);
                enqueueLine(
                  Object.keys(delta).length
                    ? { index, result: substituted, storeDelta: delta }
                    : { index, result: substituted },
                );
              } catch(error) {
                captureException(error);
                // eslint-disable-next-line no-console
                console.log(error);
                enqueueLine({ index, result: { errors: [{ message: "Internal server error" }] } });
              } finally {
                inFlight -= 1;
                maybeClose();
              }
            })();
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
          captureException(error);
        } finally {
          requestDone = true;
          maybeClose();
        }
      })();
    },
    cancel(reason) {
      cancelled = true;
      onComplete?.(reason);
    },
  });

  return new Response(stream, {
    // Status code doesn't matter; errors are in the response body.
    status: 200,
    headers: {
      // None: Next.js compression uses a whitelist of compressible MIME types;
      // we need to be careful with the content-type response header or we'll
      // get uncnompressed responses
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function sharedHandler(request: NextRequest) {
  if (!performanceMetricLoggingEnabled.get()) {
    const res = await graphqlStreamingHandler(request);

    if (isCrossSiteRequest(request)) {
      setCorsHeaders(res);
    }
    return res;
  }

  const perfMetric = openPerfMetric({
    op_type: "request",
    op_name: request.url,
    client_path: request.headers.get("request-origin-path") ?? undefined,
    ip: getClientIP(request.headers),
    user_agent: request.headers.get("user-agent") ?? undefined,
  });

  return asyncLocalStorage.run({ requestPerfMetric: perfMetric }, async () => {
    let res: Response;
    try {
      res = await graphqlStreamingHandler(request, {
        onComplete: () => {
          const Sentry = getSentry();
          const userId = Sentry?.getIsolationScope().getUser()?.id;
          if (userId) {
            perfMetric.user_id = userId.toString();
          }
          closePerfMetric(perfMetric);
        },
      });
    } catch (error) {
      captureException(error);
      throw error;
    }

    if (isCrossSiteRequest(request)) {
      setCorsHeaders(res);
    }

    return res;
  });
}

// GraphQL requests can be GET or POST. By convention, GET requests are for
// batches containing only read-queries and POST requests are for requests
// containing mutations, but this is only a convention and not enforced.
//
// OPTIONS requests are for preflighting cross-site requests for
// crossposting-related purposes.
export function GET(request: NextRequest) {
  return sharedHandler(request);
}

export async function POST(request: NextRequest) {
  return sharedHandler(request);
}

export function OPTIONS(request: NextRequest) {
  return crosspostOptionsHandler(request);
}


