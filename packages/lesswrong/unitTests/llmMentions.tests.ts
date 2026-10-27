import { mocked } from "jest-mock";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import type { LanguageModelV3Content, LanguageModelV3FinishReason, LanguageModelV3GenerateResult } from "@ai-sdk/provider";
import { MockLanguageModelV3 } from "ai/test";
import { tool, gateway, type LanguageModel, type ToolSet } from "ai";
import { z } from "zod";
import { generateLlmRunResponse } from "@/server/languageModels/llmRunResponse";
import { getFirstMentionedLlm } from "@/server/llmReplies/mentionedLlms";
import { getLlmReplyHtml } from "@/server/llmReplies/llmReplyHtml";
import { siteUrlSetting } from "@/lib/instanceSettings";
import { POST } from "../../../app/api/llmRuns/run/route";
import { runLlmRun } from "@/server/languageModels/llmRuns";
import LlmRuns from "@/server/collections/llmRuns/collection";
import LlmRunTranscriptEntries from "@/server/collections/llmRunTranscriptEntries/collection";
import transcriptSchema from "@/lib/collections/llmRunTranscriptEntries/newSchema";

const mockEntries: DbLlmRunTranscriptEntry[] = [];
jest.mock("@/server/languageModels/llmRuns", () => ({ runLlmRun: jest.fn(async () => {}) }));

beforeEach(() => {
  jest.restoreAllMocks();
  mockEntries.length = 0;
  jest.spyOn(LlmRuns, "rawUpdateOne").mockResolvedValue(1);
  jest.spyOn(LlmRunTranscriptEntries, "find").mockImplementation(() => ({ count: async () => mockEntries.length }));
  jest.spyOn(LlmRunTranscriptEntries, "rawInsert").mockImplementation(async entry => { mockEntries.push({ ...entry, schemaVersion: 1, _id: String(mockEntries.length), createdAt: new Date() }); return String(mockEntries.length); });
  mocked(runLlmRun).mockClear();
  jest.spyOn(siteUrlSetting, "get").mockReturnValue("https://www.lesswrong.com");
});

const run: DbLlmRun = {
  _id: "adversarial", schemaVersion: 1, attemptCount: 1, systemPrompt: "Reply concisely.",
  createdAt: new Date(), claimedAt: new Date(), completedAt: null, contextMessage: null,
  error: null, gatewayModelId: "test", invocationContext: "commentReply", modelName: "test",
  response: null, status: "running", triggerCommentId: "trigger",
};
function result(content: LanguageModelV3Content[], finishReason: LanguageModelV3FinishReason["unified"] = "stop"): LanguageModelV3GenerateResult {
  return { content, finishReason: { unified: finishReason, raw: finishReason }, warnings: [],
    usage: { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 10, text: 10, reasoning: 0 } } };
}
function generate(model: LanguageModel, tools: ToolSet = {}) {
  return generateLlmRunResponse(run, { model, contextMessage: "Test", tools });
}

test("reasoning-only responses continue and eventually produce an answer", async () => {
  const model = new MockLanguageModelV3({ doGenerate: [result([{ type: "reasoning", text: "Thinking" }]), result([{ type: "text", text: "Answer" }])] });
  expect(await generate(model)).toBe("Answer");
  expect(model.doGenerateCalls).toHaveLength(2);
  expect(model.doGenerateCalls[1].prompt.at(-1)?.content).toEqual([{ type: "text", text: "Continue." }]);
});

test("three empty responses terminate with an error", async () => {
  const model = new MockLanguageModelV3({ doGenerate: result([{ type: "reasoning", text: "Thinking" }]) });
  await expect(generate(model)).rejects.toThrow("without writing a response");
  expect(model.doGenerateCalls).toHaveLength(3);
});

test("a failed local tool is recorded and the model can recover", async () => {
  const model = new MockLanguageModelV3({ doGenerate: [
    result([{ type: "tool-call", toolCallId: "t1", toolName: "read", input: '{}' }], "tool-calls"),
    result([{ type: "text", text: "The page could not be read." }]),
  ] });
  expect(await generate(model, { read: tool({ inputSchema: z.object({}), execute: async (): Promise<string> => { throw new Error("HTTP 503"); } }) })).toBe("The page could not be read.");
  expect(mockEntries.some(e => e.type === "toolError" && e.text === "HTTP 503")).toBe(true);
});

test("text at the tool-step limit must not be mistaken for the final answer", async () => {
  let step = 0;
  const model = new MockLanguageModelV3({ doGenerate: async () => result([
    { type: "text", text: "I will keep researching before answering." },
    { type: "tool-call", toolCallId: `t${++step}`, toolName: "read", input: '{}' },
  ], "tool-calls") });
  await expect(generate(model, { read: tool({ inputSchema: z.object({}), execute: async () => "A result" }) })).rejects.toThrow("before finishing");
  expect(model.doGenerateCalls).toHaveLength(20);
});

test("a length-truncated response must not silently count as a completed answer", async () => {
  const model = new MockLanguageModelV3({ doGenerate: result([{ type: "text", text: "The three reasons are: first," }], "length") });
  await expect(generate(model)).rejects.toThrow("finish reason: length");
  expect(model.doGenerateCalls).toHaveLength(1);
});

test("provider search results and source URLs survive transcript conversion", async () => {
  const model = new MockLanguageModelV3({ doGenerate: result([
    { type: "tool-call", toolCallId: "s", toolName: "parallel_search", input: '{"objective":"test"}', providerExecuted: true },
    { type: "tool-result", toolCallId: "s", toolName: "parallel_search", result: { results: [{ url: "https://example.com", title: "Example", excerpt: "Text" }] } },
    { type: "source", sourceType: "url", id: "source1", url: "https://example.com", title: "Example" },
    { type: "text", text: "Answer" },
  ]) });
  await generate(model, { parallel_search: gateway.tools.parallelSearch() });
  expect(mockEntries.map(e => e.type)).toEqual(["toolCall", "toolResult", "resultLink", "source", "text"]);
  expect(mockEntries.map(e => e.index)).toEqual([0, 1, 2, 3, 4]);
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

test.each([
  ['<a href="/users/grok?mention=user">@Grok</a>', "Grok4.7"],
  ['<a href="https://www.alignmentforum.org/users/grok?mention=user&amp;model=Grok4.7">@Grok</a>', "Grok4.7"],
  ['<a href="/users/fable?mention=user">@Fable</a><a href="/users/grok?mention=user">@Grok</a>', "Fable5.1"],
  ['<a href="/users/human?mention=user">@Human</a><a href="/users/grok?mention=user">@Grok</a>', "Grok4.7"],
  ['<a href="https://lesswrong.com.evil.example/users/grok?mention=user">@Grok</a>', null],
  ['<a href="/users/grok?mention=user&model=not-a-model">@Grok</a>', null],
  ['<a href="/users/grok">@Grok</a>', null],
  ['<pre>&lt;a href="/users/grok?mention=user"&gt;@Grok&lt;/a&gt;</pre>', null],
  ['<p>@Grok please answer</p>', null],
])("mention parsing: %s", (html, expected) => {
  expect(getFirstMentionedLlm(html, "LessWrong")?.version.name ?? null).toBe(expected);
});

test("model Markdown cannot inject executable HTML or javascript links", () => {
  const html = getLlmReplyHtml('Grok" onmouseover="alert(1)', '<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n[click](javascript:alert(1))');
  expect(html).not.toMatch(/<script|<img[^>]*onerror|href="javascript:|data-model-name="[^"]*" onmouseover=/);
});

test.each([undefined, "Bearer wrong", "", "Basic test"])("kickoff rejects invalid authorization %s", async (authorization) => {
  process.env.CRON_SECRET = "test-only-secret";
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  const response = await POST(new NextRequest("http://localhost/api/llmRuns/run", { method: "POST", headers, body: JSON.stringify({ runId: "test" }) }));
  expect(response.status).toBe(401);
  expect(runLlmRun).not.toHaveBeenCalled();
});

test("kickoff accepts authenticated requests and passes only the run ID", async () => {
  process.env.CRON_SECRET = "test-only-secret";
  const response = await POST(new NextRequest("http://localhost/api/llmRuns/run", { method: "POST", headers: { authorization: "Bearer test-only-secret" }, body: JSON.stringify({ runId: "test", forumType: "AlignmentForum" }) }));
  expect(response.status).toBe(202);
  expect(runLlmRun).toHaveBeenCalledWith("test");
});
