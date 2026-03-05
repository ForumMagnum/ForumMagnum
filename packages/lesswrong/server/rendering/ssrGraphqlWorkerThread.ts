import { isMainThread, parentPort, workerData, type MessagePort } from "worker_threads";
import type { ExecutionResult } from "graphql";
import type { WorkerContextInitPayload, WorkerErrorResponse, WorkerRequestMessage, WorkerResponseMessage, WorkerRunQueryPayload, WorkerSuccessResponse } from "./ssrGraphqlWorkerProtocol";

interface WorkerDataShape {
  workerKind?: string;
}

const SSR_GRAPHQL_WORKER_KIND = "lw-ssr-graphql";

const sendSuccess = (port: MessagePort, messageId: number, payload: unknown): void => {
  const message: WorkerSuccessResponse = {
    messageId,
    ok: true,
    payload,
  };
  port.postMessage(message satisfies WorkerResponseMessage);
};

const sendError = (port: MessagePort, messageId: number, error: unknown): void => {
  const payload: WorkerErrorResponse = {
    messageId,
    ok: false,
    error: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
  };
  port.postMessage(payload satisfies WorkerResponseMessage);
};

async function buildResolverContext(payload: WorkerContextInitPayload): Promise<ResolverContext> {
  const [{ computeContextFromUser }, { getUser }] = await Promise.all([
    import("@/server/vulcan-lib/apollo-server/context"),
    import("@/server/vulcan-lib/apollo-server/getUserFromReq"),
  ]);

  const user = await getUser(payload.loginToken);
  return computeContextFromUser({
    user,
    cookies: payload.cookies,
    headers: new Headers(payload.headerEntries),
    searchParams: new URLSearchParams(payload.searchParamEntries),
    isSSR: true,
  });
}

async function executeWorkerQuery(
  payload: WorkerRunQueryPayload,
  contextByRequestId: Map<string, ResolverContext>,
): Promise<ExecutionResult> {
  const context = contextByRequestId.get(payload.requestId);
  if (!context) {
    throw new Error(`Missing SSR resolver context in worker for requestId=${payload.requestId}`);
  }

  const [{ graphql }, { getExecutableSchema }] = await Promise.all([
    import("graphql"),
    import("@/server/vulcan-lib/apollo-server/initGraphQL"),
  ]);

  return await graphql({
    schema: getExecutableSchema(),
    source: payload.querySource,
    rootValue: {},
    contextValue: context,
    variableValues: payload.variables,
    operationName: payload.operationName,
  });
}

async function startSsrGraphqlWorker(port: MessagePort): Promise<void> {
  const contextByRequestId = new Map<string, ResolverContext>();

  port.on("message", async (message: WorkerRequestMessage) => {
    try {
      switch (message.type) {
        case "initContext": {
          const context = await buildResolverContext(message.payload);
          contextByRequestId.set(message.payload.requestId, context);
          sendSuccess(port, message.messageId, { initialized: true });
          return;
        }
        case "runQuery": {
          const result = await executeWorkerQuery(message.payload, contextByRequestId);
          sendSuccess(port, message.messageId, result);
          return;
        }
        case "disposeContext": {
          contextByRequestId.delete(message.payload.requestId);
          sendSuccess(port, message.messageId, { disposed: true });
          return;
        }
        case "health": {
          sendSuccess(port, message.messageId, {
            status: "ok",
            activeContexts: contextByRequestId.size,
          });
          return;
        }
      }
    } catch (error) {
      sendError(port, message.messageId, error);
    }
  });
}

const typedWorkerData = workerData as WorkerDataShape | undefined;
if (!isMainThread && parentPort && typedWorkerData?.workerKind === SSR_GRAPHQL_WORKER_KIND) {
  void startSsrGraphqlWorker(parentPort).catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Fatal error in SSR GraphQL worker:", error);
    process.exit(1);
  });
}
