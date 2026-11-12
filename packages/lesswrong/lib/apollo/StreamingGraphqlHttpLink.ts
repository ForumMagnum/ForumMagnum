import { ApolloLink, type Operation } from "@apollo/client/core";
import type { BaseHttpLink } from "@apollo/client/link/http";
import {
  checkFetcher,
  defaultPrinter,
  fallbackHttpConfig,
  selectHttpOptionsAndBodyInternal,
  selectURI,
} from "@apollo/client/link/http";
import { ServerError, ServerParseError } from "@apollo/client/errors";
import { filterOperationVariables } from "@apollo/client/link/utils";
import { __DEV__ } from "@apollo/client/utilities/environment";
import { compact } from "@apollo/client/utilities/internal";
import { maybe } from "@apollo/client/utilities/internal/globals";
import { Observable } from "rxjs";

import { substituteFromObjectStore, type JsonObject, type JsonValue } from "./graphqlDeduplicatedObjectStore";

const backupFetch = maybe(() => fetch);

type RequestEntry = {
  operation: Operation;
  subscribers: Set<unknown>;
  next: Array<(value: ApolloLink.Result) => void>;
  error: Array<(error: unknown) => void>;
  complete: Array<() => void>;
};

/**
 * Yield the lines of a response body as they arrive.
 */
async function* readResponseLines(response: Response): AsyncGenerator<string> {
  const body = response.body;
  if (!body || typeof body.getReader !== "function") {
    yield* (await response.text()).split("\n");
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        yield buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf("\n");
      }
    }
    yield buffer + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

/**
 * Read a response in the format written by /api/streamGraphql: a JSON array
 * with one element per line, where elements are written as they become
 * available. Calls `onElement` with each element as it arrives. Returns whether
 * the array's closing bracket was received; if it wasn't, the response was cut
 * off (eg because the server crashed or timed out).
 */
async function readJsonArrayStreamObjects(
  response: Response,
  onElement: (obj: any) => void,
): Promise<boolean> {
  let sawClosingBracket = false;
  for await (const line of readResponseLines(response)) {
    if (line.trim() === "]") {
      sawClosingBracket = true;
      continue;
    }
    const parsed = parseJsonArrayStreamLine(line, response);
    if (parsed !== undefined) onElement(parsed);
  }
  return sawClosingBracket;
}

function parseJsonArrayStreamLine(line: string, response: Response): any | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  if (trimmed === "[" || trimmed === ",") return undefined;
  const withoutTrailingComma = trimmed.endsWith(",") ? trimmed.slice(0, -1).trim() : trimmed;
  if (!withoutTrailingComma) return undefined;
  try {
    return JSON.parse(withoutTrailingComma);
  } catch (e) {
    throw new ServerParseError(e, { response, bodyText: line });
  }
}

function getMissingResultError(operationName: string | undefined, uri: string, responseWasComplete: boolean): Error {
  const name = operationName || "(anonymous)";
  return new Error(responseWasComplete
    ? `Response from ${uri} did not include a result for operation ${name}`
    : `Response from ${uri} was cut off before the result for operation ${name} arrived`
  );
}

interface StreamingGraphQLHttpLinkContextOptions extends BaseHttpLink.ContextOptions {}

interface StreamingGraphQLHttpLinkOptions extends BaseHttpLink.Shared.Options {
  uri?: string;
  batchInterval?: number;
  batchDebounce?: boolean;
  batchMax?: number;
  batchKey?: (operation: Operation) => string;
  fetch?: typeof fetch;
  print?: typeof defaultPrinter;
  includeExtensions?: boolean;
  preserveHeaderCase?: boolean;
  includeUnusedVariables?: boolean;
}

/**
 * Browser-only link: we **do not** attempt request-body streaming (not reliable across browsers).
 * We still stream responses and deliver each operation as soon as its `{index,result}` line arrives.
 */
export class StreamingGraphqlHttpLink extends ApolloLink {
  private readonly uri: string;
  private readonly preferredFetch?: typeof fetch;
  private readonly print: typeof defaultPrinter;
  private readonly includeUnusedVariables: boolean;
  private readonly linkConfig: {
    http: { includeExtensions?: boolean; preserveHeaderCase?: boolean };
    options?: RequestInit;
    credentials?: RequestCredentials;
    headers?: Record<string, string>;
  };

  private readonly batchDebounce?: boolean;
  private readonly batchInterval: number;
  private readonly batchMax: number;
  private readonly batchKey: (operation: Operation) => string;

  private batchesByKey = new Map<string, Set<RequestEntry>>();
  private scheduledBatchTimerByKey = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(options: StreamingGraphQLHttpLinkOptions = {}) {
    super();

    const {
      uri = "/api/streamGraphql",
      fetch: preferredFetch,
      print = defaultPrinter,
      includeExtensions,
      preserveHeaderCase,
      batchInterval,
      batchDebounce,
      batchMax,
      batchKey,
      includeUnusedVariables = false,
      ...requestOptions
    } = options;

    if (__DEV__) {
      checkFetcher(preferredFetch || backupFetch);
    }

    this.uri = uri;
    this.preferredFetch = preferredFetch;
    this.print = print;
    this.includeUnusedVariables = includeUnusedVariables;

    this.linkConfig = {
      http: compact({ includeExtensions, preserveHeaderCase }),
      options: requestOptions.fetchOptions,
      credentials: requestOptions.credentials,
      headers: requestOptions.headers as any,
    };

    this.batchDebounce = batchDebounce;
    this.batchInterval = batchInterval || 10;
    this.batchMax = batchMax || 10;

    this.batchKey =
      batchKey ||
      ((operation) => {
        const context = operation.getContext();
        const contextConfig = {
          http: context.http,
          options: context.fetchOptions,
          credentials: context.credentials,
          headers: context.headers,
        };
        return selectURI(operation, uri) + JSON.stringify(contextConfig);
      });
  }

  request(operation: Operation, _forward?: ApolloLink.ForwardFunction) {
    const key = this.batchKey(operation);
    const entry: RequestEntry = {
      operation,
      subscribers: new Set(),
      next: [],
      error: [],
      complete: [],
    };

    return new Observable<ApolloLink.Result>((observer) => {
      const isFirstSubscriber = entry.subscribers.size === 0;
      entry.subscribers.add(observer);

      if (observer.next) entry.next.push(observer.next.bind(observer));
      if (observer.error) entry.error.push(observer.error.bind(observer));
      if (observer.complete) entry.complete.push(observer.complete.bind(observer));

      if (isFirstSubscriber) {
        let batch = this.batchesByKey.get(key);
        if (!batch) {
          batch = new Set();
          this.batchesByKey.set(key, batch);
        }

        const isFirstEnqueuedRequest = batch.size === 0;
        batch.add(entry);

        if (isFirstEnqueuedRequest || this.batchDebounce) {
          this.scheduleQueueConsumption(key);
        }

        if (batch.size === this.batchMax) {
          this.consumeQueue(key);
        }
      }

      return () => {
        entry.subscribers.delete(observer);
        if (entry.subscribers.size > 0) return;

        const batch = this.batchesByKey.get(key);
        if (!batch) return;
        batch.delete(entry);
        if (batch.size < 1) {
          this.consumeQueue(key);
        }
      };
    });
  }

  private scheduleQueueConsumption(key: string) {
    clearTimeout(this.scheduledBatchTimerByKey.get(key));
    this.scheduledBatchTimerByKey.set(
      key,
      setTimeout(() => {
        this.consumeQueue(key);
        this.scheduledBatchTimerByKey.delete(key);
      }, this.batchInterval),
    );
  }

  private consumeQueue(key: string) {
    const batch = this.batchesByKey.get(key);
    this.batchesByKey.delete(key);
    clearTimeout(this.scheduledBatchTimerByKey.get(key));
    this.scheduledBatchTimerByKey.delete(key);

    if (!batch || !batch.size) return;

    const entries = Array.from(batch);
    const operations = entries.map((e) => e.operation);
    const chosenURI = selectURI(operations[0], this.uri);
    const context = operations[0].getContext();
    const contextConfig = {
      http: context.http,
      options: context.fetchOptions,
      credentials: context.credentials,
      headers: context.headers,
    };

    const optsAndBody = operations.map((op) => {
      const result = selectHttpOptionsAndBodyInternal(
        op,
        this.print,
        fallbackHttpConfig,
        this.linkConfig,
        contextConfig,
      );
      if (result.body.variables && !this.includeUnusedVariables) {
        result.body.variables = filterOperationVariables(result.body.variables, op.query);
      }
      return result;
    });

    const httpOptions: any = { ...optsAndBody[0].options };
    httpOptions.headers = { ...(httpOptions.headers ?? {}) };
    httpOptions.headers["content-type"] = "application/json; charset=utf-8";

    if (httpOptions.method === "GET") {
      const error = new Error("streamGraphql does not support GET requests");
      entries.forEach((e) => e.error.forEach((fn) => fn(error)));
      return;
    }

    httpOptions.body = JSON.stringify(optsAndBody.flatMap(({ body }) => body));

    let controller: AbortController | undefined;
    if (!httpOptions.signal && typeof AbortController !== "undefined") {
      controller = new AbortController();
      httpOptions.signal = controller.signal;
    }

    const currentFetch = this.preferredFetch || maybe(() => fetch) || backupFetch;
    if (!currentFetch) {
      const error = new Error("Missing fetch implementation for StreamingBatchGraphql2EndpointHttpLink");
      entries.forEach((e) => e.error.forEach((fn) => fn(error)));
      return;
    }

    const finished = new Array<boolean>(entries.length).fill(false);
    const objectStore = new Map<string, JsonObject>();

    const onBatchError = (error: unknown) => {
      entries.forEach((entry, i) => {
        if (!finished[i]) {
          entry.error.forEach((fn) => fn(error));
        }
      });
      if (controller) controller.abort();
    };

    void currentFetch(chosenURI, httpOptions)
      .then(async (response) => {
        operations.forEach((op) => op.setContext({ response }));

        // The server responds with status 200 once it starts running
        // operations, even if they have errors, so any other status means
        // something went wrong before that or outside of the request handler
        // (eg a failure setting up the request, a timeout, or a proxy error)
        if (!response.ok) {
          const bodyText = await response.text();
          throw new ServerError(`Response not successful: Received status code ${response.status}`, { response, bodyText });
        }

        const responseWasComplete = await readJsonArrayStreamObjects(response, (obj) => {
          const index = obj?.index;
          const rawResult = obj?.result;
          const storeDelta = obj?.storeDelta;
          if (typeof index !== "number" || index < 0 || index >= entries.length) return;
          if (finished[index]) return;

          if (storeDelta && typeof storeDelta === "object" && !Array.isArray(storeDelta)) {
            for (const [k, v] of Object.entries(storeDelta as Record<string, JsonObject>)) {
              if (v && typeof v === "object" && !Array.isArray(v)) {
                objectStore.set(k, v);
              }
            }
          }

          const hydrated = substituteFromObjectStore(rawResult as JsonValue, objectStore);
          entries[index].next.forEach((n) => n(hydrated as any));
          entries[index].complete.forEach((c) => c());
          finished[index] = true;
        });

        for (let i = 0; i < entries.length; i++) {
          if (!finished[i]) {
            const error = getMissingResultError(entries[i].operation.operationName, chosenURI, responseWasComplete);
            entries[i].error.forEach((fn) => fn(error));
          }
        }
      })
      .catch(onBatchError);
  }
}


