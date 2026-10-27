import assert from "node:assert/strict";
import type { LanguageModelV3Content, LanguageModelV3FinishReason, LanguageModelV3GenerateResult } from "@ai-sdk/provider";
import { MockLanguageModelV3 } from "ai/test";
import { tool, gateway, type LanguageModel, type ToolSet } from "ai";
import { z } from "zod";
import { generateLlmRunResponse } from "@/server/languageModels/llmRunResponse";
import LlmRuns from "@/server/collections/llmRuns/collection";
import LlmRunTranscriptEntries from "@/server/collections/llmRunTranscriptEntries/collection";
import transcriptSchema from "@/lib/collections/llmRunTranscriptEntries/newSchema";

const mockEntries: DbLlmRunTranscriptEntry[] = [];

beforeEach(() => {
  jest.restoreAllMocks();
  mockEntries.length = 0;
  jest.spyOn(LlmRuns, "rawUpdateOne").mockResolvedValue(1);
  jest.spyOn(LlmRunTranscriptEntries, "find").mockImplementation(() => ({ count: async () => mockEntries.length }));
  jest.spyOn(LlmRunTranscriptEntries, "rawInsert").mockImplementation(async entry => {
    const id = String(mockEntries.length);
    mockEntries.push({ ...entry, schemaVersion: 1, _id: id, createdAt: new Date() });
    return id;
  });
});

const run: DbLlmRun = {
  _id: "adversarial", schemaVersion: 1, attemptCount: 1, systemPrompt: "Reply concisely.",
  createdAt: new Date(), claimedAt: new Date(), completedAt: null, contextMessage: null,
  error: null, gatewayModelId: "test", invocationContext: "commentReply", modelName: "test",
  response: null, status: "running", triggerCommentId: "trigger",
};
function result(content: LanguageModelV3Content[], finishReason: LanguageModelV3FinishReason["unified"] = "stop"): LanguageModelV3GenerateResult {
  return {
    content,
    finishReason: { unified: finishReason, raw: finishReason },
    warnings: [],
    usage: {
      inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 10, text: 10, reasoning: 0 },
    },
  };
}
function generate(model: LanguageModel, tools: ToolSet = {}) {
  return generateLlmRunResponse(run, { model, contextMessage: "Test", tools });
}

test("text at the tool-step limit must not be mistaken for the final answer", async () => {
  const model = new MockLanguageModelV3({ doGenerate: result([
    { type: "text", text: "I will keep researching before answering." },
    { type: "tool-call", toolCallId: "read", toolName: "read", input: '{}' },
  ], "tool-calls") });
  await expect(generate(model, { read: tool({ inputSchema: z.object({}), execute: async () => "A result" }) })).rejects.toThrow("before finishing");
});

test("a length-truncated response must not silently count as a completed answer", async () => {
  const model = new MockLanguageModelV3({ doGenerate: result([{ type: "text", text: "The three reasons are: first," }], "length") });
  await expect(generate(model)).rejects.toThrow("finish reason: length");
  expect(model.doGenerateCalls).toHaveLength(1);
});

test("structured fetch content should be readable without querying raw extra", async () => {
  const model = new MockLanguageModelV3({ doGenerate: result([
    { type: "tool-call", toolCallId: "f", toolName: "browserbase_fetch", input: '{"url":"https://example.com"}', providerExecuted: true },
    { type: "tool-result", toolCallId: "f", toolName: "browserbase_fetch", result: { content: { markdown: "Fetched document body" } } },
    { type: "text", text: "Answer" },
  ]) });
  await generate(model, { browserbase_fetch: gateway.tools.browserbaseFetch({ format: "markdown" }) });
  const entry = mockEntries.find(e => e.type === "toolResult");
  assert(entry);
  const text = transcriptSchema.text.graphql.resolver(entry);
  expect(text).toContain("Fetched document body");
});
