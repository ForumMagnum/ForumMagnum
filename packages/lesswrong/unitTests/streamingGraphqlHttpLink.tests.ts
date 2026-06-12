import { readJsonArrayStreamObjects } from "@/lib/apollo/StreamingGraphqlHttpLink";

function streamResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  }));
}

function failingStreamResponse(error: Error): Response {
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      controller.error(error);
    },
  }));
}

describe("readJsonArrayStreamObjects", () => {
  it("parses streamed JSON array items", async () => {
    const parsed: unknown[] = [];

    await readJsonArrayStreamObjects(
      streamResponse(["[\n", "{\"index\":0,\"result\":{\"data\":true}}\n", "]\n"]),
      (obj) => parsed.push(obj),
    );

    expect(parsed).toEqual([{ index: 0, result: { data: true } }]);
  });

  it("preserves stream read errors instead of swallowing them", async () => {
    const streamError = new Error("stream interrupted");

    await expect(
      readJsonArrayStreamObjects(failingStreamResponse(streamError), () => undefined),
    ).rejects.toThrow("stream interrupted");
  });

  it("preserves JSON parse errors instead of turning them into missing batch responses", async () => {
    await expect(
      readJsonArrayStreamObjects(streamResponse(["[\n", "not-json\n", "]\n"]), () => undefined),
    ).rejects.toThrow(SyntaxError);
  });
});
