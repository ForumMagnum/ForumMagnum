import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getUser } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { LoggedOutCacheLink } from "@/server/rendering/loggedOutCacheLink";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { ApolloLink, Observable } from "@apollo/client";
import { headerLink, createErrorLink } from "@/lib/apollo/links";
import { type ExecutionResult, type GraphQLSchema } from "graphql";
import { SchemaLink } from "@apollo/client/link/schema";
import type { SSRQueryRuntimeContext } from "@/lib/crud/ssrQueryRuntimeContext";
import type { WorkerContextInitPayload } from "./ssrGraphqlWorkerProtocol";

export const createSchemaLink = (schema: GraphQLSchema, context: ResolverContext) =>
  // We are doing `context: () => ({...context})` rather than just context to fix a bug in datadog, see: https://github.com/DataDog/dd-trace-js/issues/709
  new SchemaLink({ schema, context: () => ({...context}) });

const SSR_CONTEXT_TTL_MS = 30_000;

interface SSRQueryRuntimeEntry {
  runtimePromise: Promise<SSRQueryRuntimeContext>;
  requestPayloadPromise: Promise<WorkerContextInitPayload>;
  fallbackResolverContextPromise?: Promise<ResolverContext>;
  timeoutId: ReturnType<typeof setTimeout>;
}

declare global {
  var cachedSsrQueryRuntimeByRequestId: Map<string, SSRQueryRuntimeEntry> | undefined;
}

function isSsrGraphqlWorkerEnabled(): boolean {
  return process.env.SSR_GRAPHQL_WORKER_ENABLED === "true";
}

function getSSRQueryRuntimeMap() {
  if (!globalThis.cachedSsrQueryRuntimeByRequestId) {
    globalThis.cachedSsrQueryRuntimeByRequestId = new Map();
  }
  return globalThis.cachedSsrQueryRuntimeByRequestId;
}

async function getRequestPayloadForSSR(searchParamsStr: string, requestId: string): Promise<WorkerContextInitPayload> {
  const { cookies, headers } = await import('next/headers');
  const [serverCookies, serverHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const headerEntries: Array<[string, string]> = [];
  serverHeaders.forEach((value, key) => {
    headerEntries.push([key, value]);
  });

  const searchParams = JSON.parse(searchParamsStr) as Record<string, string>;
  return {
    requestId,
    loginToken: serverCookies.get("loginToken")?.value ?? null,
    cookies: serverCookies.getAll().map(({ name, value }) => ({ name, value })),
    headerEntries,
    searchParamEntries: Object.entries(searchParams),
  };
}

async function createResolverContextFromPayload(payload: WorkerContextInitPayload): Promise<ResolverContext> {
  const user = await getUser(payload.loginToken);
  return computeContextFromUser({
    user,
    cookies: payload.cookies,
    headers: new Headers(payload.headerEntries),
    searchParams: new URLSearchParams(payload.searchParamEntries),
    isSSR: true,
  });
}

async function createSSRQueryRuntimeForRequest(
  requestPayloadPromise: Promise<WorkerContextInitPayload>,
  requestId: string,
): Promise<SSRQueryRuntimeContext> {
  const requestPayload = await requestPayloadPromise;
  if (!isSsrGraphqlWorkerEnabled()) {
    const resolverContext = await createResolverContextFromPayload(requestPayload);
    return {
      isSsrQueryRuntimeContext: true,
      requestId,
      resolverContext,
    };
  }

  const { getSSRGraphqlWorkerManager } = await import("./ssrGraphqlWorkerManager");
  await getSSRGraphqlWorkerManager().initContext(requestPayload);
  return {
    isSsrQueryRuntimeContext: true,
    requestId,
  };
}

async function deleteSSRQueryRuntimeEntry(requestId: string): Promise<void> {
  const cache = getSSRQueryRuntimeMap();
  const entry = cache.get(requestId);
  if (!entry) {
    return;
  }

  clearTimeout(entry.timeoutId);
  cache.delete(requestId);

  if (isSsrGraphqlWorkerEnabled()) {
    try {
      const { getSSRGraphqlWorkerManager } = await import("./ssrGraphqlWorkerManager");
      await getSSRGraphqlWorkerManager().disposeContext(requestId);
    } catch {
      // Ignore cleanup failures in request teardown.
    }
  }
}

export async function getFallbackResolverContextForSSR(requestId: string, searchParamsStr?: string): Promise<ResolverContext> {
  const cache = getSSRQueryRuntimeMap();
  let entry = cache.get(requestId);
  if (!entry) {
    if (!searchParamsStr) {
      throw new Error(`Missing SSR runtime entry for requestId=${requestId}`);
    }
    await getSSRQueryRuntimeForSSR(searchParamsStr, requestId);
    entry = cache.get(requestId);
  }

  if (!entry) {
    throw new Error(`Unable to initialize SSR runtime entry for requestId=${requestId}`);
  }

  if (!entry.fallbackResolverContextPromise) {
    entry.fallbackResolverContextPromise = entry.requestPayloadPromise.then(createResolverContextFromPayload);
  }
  return await entry.fallbackResolverContextPromise;
}

/**
 * Gets SSR GraphQL query runtime state for use during SSR (and metadata generation), given a requestId
 * (from getRequestIdForServerComponentOrGenerateMetadata) and search params from the URL.
 * This is deduplicated between the SSR and metadata generation.
 */
export async function getSSRQueryRuntimeForSSR(searchParamsStr: string, requestId: string): Promise<SSRQueryRuntimeContext> {
  const cache = getSSRQueryRuntimeMap();
  const existingEntry = cache.get(requestId);
  if (existingEntry) {
    return await existingEntry.runtimePromise;
  }

  const requestPayloadPromise = getRequestPayloadForSSR(searchParamsStr, requestId);
  const runtimePromise = createSSRQueryRuntimeForRequest(requestPayloadPromise, requestId);
  const timeoutId = setTimeout(() => {
    // Runtime entries should be deleted from the request map in an after() callback
    // when the request is complete, but we also have a TTL just in case some error
    // scenario causes the after() callback to not run, so we don't leak memory.
    void deleteSSRQueryRuntimeEntry(requestId);
  }, SSR_CONTEXT_TTL_MS);

  cache.set(requestId, { runtimePromise, requestPayloadPromise, timeoutId });

  const { after } = await import("next/server");
  after(() => {
    void deleteSSRQueryRuntimeEntry(requestId);
  });
  return await runtimePromise;
}

export async function executeSSRWorkerQuery({
  requestId,
  querySource,
  variables,
  operationName,
}: {
  requestId: string;
  querySource: string;
  variables: Record<string, unknown>;
  operationName?: string;
}): Promise<ExecutionResult> {
  const { getSSRGraphqlWorkerManager } = await import("./ssrGraphqlWorkerManager");
  return await getSSRGraphqlWorkerManager().runQuery({
    requestId,
    querySource,
    variables,
    operationName,
  });
}

export async function recordSSRWorkerFallback() {
  if (!isSsrGraphqlWorkerEnabled()) {
    return;
  }
  const { getSSRGraphqlWorkerManager } = await import("./ssrGraphqlWorkerManager");
  getSSRGraphqlWorkerManager().recordFallback();
}

/**
 * Gets a ResolverContext for use during SSR (and metadata generation), given a requestId
 * (from getRequestIdForServerComponentOrGenerateMetadata) and search params from the URL.
 * This is deduplicated between the SSR and metadata generation.
 */
export async function getResolverContextForSSR(searchParamsStr: string, requestId: string): Promise<ResolverContext> {
  const runtimeContext = await getSSRQueryRuntimeForSSR(searchParamsStr, requestId);
  if (runtimeContext.resolverContext) {
    return runtimeContext.resolverContext;
  }
  return await getFallbackResolverContextForSSR(requestId, searchParamsStr);
}

function getWorkerModeApolloClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      headerLink,
      createErrorLink(),
      new ApolloLink(() => new Observable((observer) => {
        observer.error(new Error("SSR GraphQL worker mode does not support Apollo SchemaLink execution on the render thread"));
      })),
    ]),
  });
}

export async function getApolloClientForSSRRuntime(runtimeContext: SSRQueryRuntimeContext) {
  if (!runtimeContext.resolverContext) {
    return getWorkerModeApolloClient();
  }
  return await getApolloClientForSSRWithContext(runtimeContext.resolverContext);
}

export async function getApolloClientForSSRWithContext(context: ResolverContext) {
  const { getExecutableSchema } = await import("../vulcan-lib/apollo-server/initGraphQL");
  const schema = getExecutableSchema();

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      headerLink,
      createErrorLink(),
      new LoggedOutCacheLink(schema),
      createSchemaLink(schema, context)
    ]),
  });
}
