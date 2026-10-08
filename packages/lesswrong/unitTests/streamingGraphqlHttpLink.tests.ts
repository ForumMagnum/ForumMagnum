import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { ServerError, ServerParseError } from "@apollo/client/errors";
import { parse } from "graphql";
import { StreamingGraphqlHttpLink } from "@/lib/apollo/StreamingGraphqlHttpLink";

interface OperationOutcome {
  result?: ApolloLink.Result
  error?: unknown
}

const client = new ApolloClient({ cache: new InMemoryCache(), link: ApolloLink.empty() });
const firstQuery = parse(`query First { first }`);
const secondQuery = parse(`query Second { second }`);

function resultLine(index: number, data: Record<string, unknown>) {
  return JSON.stringify({ index, result: { data } }) + "\n";
}

/**
 * A response whose body delivers one chunk per read, then either ends
 * normally or fails with `errorAtEnd`, like a connection that drops mid-stream.
 */
function streamingResponse(chunks: string[], options: { status?: number, errorAtEnd?: Error } = {}): Response {
  const encoder = new TextEncoder();
  let nextChunk = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (nextChunk < chunks.length) {
        controller.enqueue(encoder.encode(chunks[nextChunk++]));
      } else if (options.errorAtEnd) {
        controller.error(options.errorAtEnd);
      } else {
        controller.close();
      }
    },
  }, { highWaterMark: 0 });
  return new Response(body, { status: options.status ?? 200 });
}

function runOperation(link: ApolloLink, query: typeof firstQuery): Promise<OperationOutcome> {
  return new Promise((resolve) => {
    ApolloLink.execute(link, { query }, { client }).subscribe({
      next: (result) => resolve({ result }),
      error: (error) => resolve({ error }),
    });
  });
}

/** Run two operations, which get batched into a single request, against a canned response */
function runBatch(response: Response): Promise<OperationOutcome[]> {
  const link = new StreamingGraphqlHttpLink({
    uri: "/api/streamGraphql",
    fetch: async () => response,
  });
  return Promise.all([runOperation(link, firstQuery), runOperation(link, secondQuery)]);
}

function errorMessage(outcome: OperationOutcome) {
  return outcome.error instanceof Error ? outcome.error.message : undefined;
}

describe("StreamingGraphqlHttpLink", () => {
  it("delivers each operation's result", async () => {
    const [first, second] = await runBatch(streamingResponse([
      "[\n", resultLine(1, { second: 2 }), ",\n", resultLine(0, { first: 1 }), "]\n",
    ]));
    expect(first.result).toEqual({ data: { first: 1 } });
    expect(second.result).toEqual({ data: { second: 2 } });
  });

  it("reports a non-OK status as a ServerError", async () => {
    const outcomes = await runBatch(streamingResponse(["upstream timed out"], { status: 504 }));
    for (const outcome of outcomes) {
      expect(ServerError.is(outcome.error)).toBe(true);
      expect(errorMessage(outcome)).toContain("504");
    }
  });

  it("reports an error reading the stream to operations that didn't get a result", async () => {
    const networkError = new TypeError("network error");
    const [first, second] = await runBatch(streamingResponse(
      ["[\n", resultLine(0, { first: 1 }), ",\n"],
      { errorAtEnd: networkError },
    ));
    expect(first.result).toEqual({ data: { first: 1 } });
    expect(second.error).toBe(networkError);
  });

  it("reports a response that isn't in the expected format as a ServerParseError", async () => {
    const outcomes = await runBatch(streamingResponse(["<html>Something went wrong</html>\n"]));
    for (const outcome of outcomes) {
      expect(ServerParseError.is(outcome.error)).toBe(true);
    }
  });

  it("names the operation whose result is missing from a response that was cut off", async () => {
    const [first, second] = await runBatch(streamingResponse(["[\n", resultLine(0, { first: 1 }), ",\n"]));
    expect(first.result).toEqual({ data: { first: 1 } });
    expect(errorMessage(second)).toBe("Response from /api/streamGraphql was cut off before the result for operation Second arrived");
  });

  it("names the operation whose result is missing from a complete response", async () => {
    const [first, second] = await runBatch(streamingResponse(["[\n", resultLine(0, { first: 1 }), "]\n"]));
    expect(first.result).toEqual({ data: { first: 1 } });
    expect(errorMessage(second)).toBe("Response from /api/streamGraphql did not include a result for operation Second");
  });
});
