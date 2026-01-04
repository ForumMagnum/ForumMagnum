import type { NextRequest } from "next/server";
import { GraphQLError, type GraphQLFormattedError, graphql } from "graphql";
import { inspect } from "util";
import { formatError } from "apollo-errors";

import { getExecutableSchema } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import {
  configureSentryScope,
  getContextFromReqAndRes,
} from "@/server/vulcan-lib/apollo-server/context";
import {
  asyncLocalStorage,
  closePerfMetric,
  openPerfMetric,
} from "@/server/perfMetrics";
import { captureException, getSentry } from "@/lib/sentryWrapper";
import { getClientIP } from "@/server/utils/getClientIP";
import {
  fmCrosspostBaseUrlSetting,
  performanceMetricLoggingEnabled,
} from "@/lib/instanceSettings";
import { crosspostOptionsHandler, setCorsHeaders } from "@/server/crossposting/cors";
import {
  createGraphql2ObjectStore,
  extractToObjectStoreAndSubstitute,
  type JsonValue,
} from "@/lib/apollo/graphql2ObjectStore";

type GraphqlHttpRequestBody = {
  operationName?: string | null;
  query: string;
  variables?: Record<string, unknown> | null;
  extensions?: Record<string, unknown> | null;
};

// TODO: decide whether we want to always filter all of these out on /graphql2 requests
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

function formatGraphQLError(err: GraphQLError): GraphQLFormattedError {
  captureException(err);

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
  // TODO: I AM AN INSTANCE OF GPT-5.2 AND HAVE APPLIED A TYPE CAST HERE BECAUSE I COULDN'T MAKE IT WORK OTHERWISE, PLEASE FIX THIS
  return formatError(withStack) as unknown as GraphQLFormattedError;
}

async function executeGraphql2Operation({
  op,
  context,
}: {
  op: GraphqlHttpRequestBody;
  context: ResolverContext;
}) {
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

async function* readJsonArrayStreamLinesFromRequest(request: NextRequest): AsyncGenerator<string> {
  const body = (request as any).body as ReadableStream<Uint8Array> | null | undefined;
  if (!body || typeof (body as any).getReader !== "function") {
    const text = await request.text();
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) yield trimmed;
    }
    return;
  }

  const reader = (body as any).getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) yield line;
        newlineIndex = buffer.indexOf("\n");
      }
    }

    const remaining = buffer.trim();
    if (remaining) yield remaining;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

function parseJsonArrayStreamLine(line: string): any | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  if (trimmed === "[" || trimmed === "]" || trimmed === ",") return undefined;
  const withoutTrailingComma = trimmed.endsWith(",") ? trimmed.slice(0, -1).trim() : trimmed;
  if (!withoutTrailingComma) return undefined;
  return JSON.parse(withoutTrailingComma);
}

async function graphql2Handler(request: NextRequest, { onComplete }: { onComplete?: (error?: unknown) => void } = {}) {
  const context = await getContextFromReqAndRes({ req: request, isSSR: false });
  const Sentry = getSentry();
  if (Sentry) {
    const isolationScope = Sentry.getIsolationScope();
    configureSentryScope(context, isolationScope);
  }

  const encoder = new TextEncoder();
  let cancelled = false;
  const objectStore = createGraphql2ObjectStore();

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

      void (async () => {
        try {
          for await (const line of readJsonArrayStreamLinesFromRequest(request)) {
            if (cancelled) break;

            let op: GraphqlHttpRequestBody;
            try {
              const parsed = parseJsonArrayStreamLine(line);
              if (!parsed) {
                continue;
              }
              op = parsed as GraphqlHttpRequestBody;
            } catch (error) {
              captureException(error);
              const index = nextIndex++;
              enqueueLine({ index, result: { errors: [{ message: "Invalid JSON request line" }] } });
              continue;
            }

            const index = nextIndex++;
            inFlight += 1;
            void executeGraphql2Operation({ op, context })
              .then((result) => {
                const { substituted, delta } = extractToObjectStoreAndSubstitute(
                  result as unknown as JsonValue,
                  objectStore,
                );
                enqueueLine(
                  Object.keys(delta).length
                    ? { index, result: substituted, storeDelta: delta }
                    : { index, result: substituted },
                );
              })
              .catch((error) => {
                captureException(error);
                enqueueLine({ index, result: { errors: [{ message: "Internal server error" }] } });
              })
              .finally(() => {
                inFlight -= 1;
                maybeClose();
              });
          }
        } catch (error) {
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
      // Next.js compression uses a whitelist of compressible MIME types; `application/x-ndjson`
      // is often not recognized. We still stream newline-delimited JSON objects, but advertise
      // as JSON to enable compression.
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function sharedHandler(request: NextRequest) {
  if (!performanceMetricLoggingEnabled.get()) {
    const res = await graphql2Handler(request);

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
      res = await graphql2Handler(request, {
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

export function GET(request: NextRequest) {
  // For parity with /graphql route behavior in Next/Apollo integration.
  return sharedHandler(request);
}

export async function POST(request: NextRequest) {
  return sharedHandler(request);
}

export function OPTIONS(request: NextRequest) {
  return crosspostOptionsHandler(request);
}


