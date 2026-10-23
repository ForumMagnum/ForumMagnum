import { generateText, stepCountIs, type ContentPart, type ModelMessage, type ToolSet } from "ai";
import { z } from "zod";
import LlmRuns from "@/server/collections/llmRuns/collection";
import LlmRunTranscriptEntries from "@/server/collections/llmRunTranscriptEntries/collection";

const MAX_MODEL_STEPS = 20;
/**
 * The SDK only takes another step after tools that our code runs. When a step
 * uses only tools the provider or Gateway runs (web search, web fetch), the
 * provider can hand the turn back before the model has written anything; we
 * then send the conversation back so the model continues.
 */
const MAX_CONTINUATIONS = 2;

const REASONING_PROVIDER_OPTIONS = {
  anthropic: { thinking: { type: "adaptive", display: "summarized" } },
  openai: { reasoningEffort: "high", reasoningSummary: "detailed" },
  google: { thinkingConfig: { thinkingLevel: "high", includeThoughts: true } },
  vertex: { thinkingConfig: { thinkingLevel: "high", includeThoughts: true } },
};

const toolErrorOutputSchema = z.looseObject({
  error: z.string(),
  message: z.string(),
});

const parallelSearchOutputSchema = z.looseObject({
  results: z.array(z.looseObject({
    url: z.string(),
    title: z.string().nullish(),
  })),
});

const browserbaseFetchOutputSchema = z.looseObject({
  content: z.union([z.string(), z.record(z.string(), z.unknown())]),
});

interface TranscriptEntryFields {
  type: LlmTranscriptEntryType,
  text: string | null,
  toolCallId: string | null,
  toolName: string | null,
  query: string | null,
  url: string | null,
  title: string | null,
  extra: Record<string, unknown> | null,
}

export async function generateLlmRunResponse(run: DbLlmRun, { contextMessage, tools }: {
  contextMessage: string,
  tools: ToolSet,
}): Promise<string> {
  await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { contextMessage, response: null } });
  const response = await generateWithContinuations(run, tools, [{ role: "user", content: contextMessage }], MAX_CONTINUATIONS);
  await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { response } });
  return response;
}

async function generateWithContinuations(run: DbLlmRun, tools: ToolSet, messages: ModelMessage[], continuationsLeft: number): Promise<string> {
  const result = await generateText({
    model: run.gatewayModelId,
    system: run.systemPrompt,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_MODEL_STEPS),
    providerOptions: REASONING_PROVIDER_OPTIONS,
    onStepFinish: (step) => saveTranscriptEntries(run, step.content),
  });
  if (result.text.trim()) {
    return result.text;
  }
  if (continuationsLeft === 0) {
    throw new Error(`The model finished without writing a response (finish reason: ${result.finishReason})`);
  }
  const continuedMessages: ModelMessage[] = [...messages, ...result.response.messages, { role: "user", content: "Continue." }];
  return await generateWithContinuations(run, tools, continuedMessages, continuationsLeft - 1);
}

async function saveTranscriptEntries(run: DbLlmRun, content: ContentPart<ToolSet>[]): Promise<void> {
  const entries = content.flatMap(toTranscriptEntries);
  const firstIndex = await LlmRunTranscriptEntries.find({ llmRunId: run._id, attempt: run.attemptCount }).count();
  await Promise.all(entries.map((entry, offset) => LlmRunTranscriptEntries.rawInsert({
    ...entry,
    createdAt: new Date(),
    llmRunId: run._id,
    attempt: run.attemptCount,
    index: firstIndex + offset,
  })));
}

function toTranscriptEntries(part: ContentPart<ToolSet>): TranscriptEntryFields[] {
  switch (part.type) {
    case "reasoning":
    case "text":
      return [makeEntry(part.type, { text: part.text, extra: getExtra({ providerMetadata: part.providerMetadata }) })];
    case "source":
      return [getSourceEntry(part)];
    case "tool-call":
      return [getToolCallEntry(part.toolCallId, part.toolName, part.input, getExtra({ providerExecuted: part.providerExecuted, providerMetadata: part.providerMetadata }))];
    case "tool-result":
      return getToolResultEntries(part.toolCallId, part.toolName, part.output);
    case "tool-error":
      return [getToolErrorEntry(part.toolCallId, part.toolName, part.error)];
    default:
      return [];
  }
}

function getSourceEntry(part: Extract<ContentPart<ToolSet>, { type: "source" }>): TranscriptEntryFields {
  if (part.sourceType === "url") {
    return makeEntry("source", { url: part.url, title: part.title ?? null, extra: getExtra({ providerMetadata: part.providerMetadata }) });
  }
  return makeEntry("source", { title: part.title, extra: getExtra({ mediaType: part.mediaType, filename: part.filename, providerMetadata: part.providerMetadata }) });
}

function getToolCallEntry(toolCallId: string, toolName: string, input: unknown, callExtra: Record<string, unknown> | null): TranscriptEntryFields {
  const { query, objective, url, ...otherInput } = getObjectFields(input) ?? { input };
  return makeEntry("toolCall", {
    toolCallId,
    toolName,
    query: getString(query) ?? getString(objective),
    url: getString(url),
    extra: getExtra({ ...otherInput, ...callExtra }),
  });
}

function getToolResultEntries(toolCallId: string, toolName: string, output: unknown): TranscriptEntryFields[] {
  const toolFields = { toolCallId, toolName };
  const toolError = toolErrorOutputSchema.safeParse(output);
  if (toolError.success) {
    const { message, ...errorExtra } = toolError.data;
    return [makeEntry("toolError", { ...toolFields, text: message, extra: getExtra(errorExtra) })];
  }
  if (typeof output === "string") {
    return [makeEntry("toolResult", { ...toolFields, text: output })];
  }
  const searchResults = toolName === "parallel_search" ? parallelSearchOutputSchema.safeParse(output) : null;
  if (searchResults?.success) {
    const { results, ...searchExtra } = searchResults.data;
    return [
      makeEntry("toolResult", { ...toolFields, extra: getExtra(searchExtra) }),
      ...results.map(({ url, title, ...resultExtra }) => makeEntry("resultLink", { ...toolFields, url, title: title ?? null, extra: getExtra(resultExtra) })),
    ];
  }
  const fetchedPage = toolName === "browserbase_fetch" ? browserbaseFetchOutputSchema.safeParse(output) : null;
  if (fetchedPage?.success) {
    const { content, ...fetchExtra } = fetchedPage.data;
    if (typeof content === "string") {
      return [makeEntry("toolResult", { ...toolFields, text: content, extra: getExtra(fetchExtra) })];
    }
    return [makeEntry("toolResult", { ...toolFields, extra: getExtra({ ...fetchExtra, content }) })];
  }
  return [makeEntry("toolResult", { ...toolFields, extra: { output } })];
}

function makeEntry(type: LlmTranscriptEntryType, fields: Partial<Omit<TranscriptEntryFields, "type">>): TranscriptEntryFields {
  return { type, text: null, toolCallId: null, toolName: null, query: null, url: null, title: null, extra: null, ...fields };
}

function getExtra(fields: Record<string, unknown>): Record<string, unknown> | null {
  const definedFields = Object.entries(fields).filter(([, value]) => value !== undefined);
  return definedFields.length ? Object.fromEntries(definedFields) : null;
}

function getObjectFields(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getToolErrorEntry(toolCallId: string, toolName: string, error: unknown): TranscriptEntryFields {
  const toolFields = { toolCallId, toolName };
  if (error instanceof Error) {
    return makeEntry("toolError", { ...toolFields, text: error.message });
  }
  if (typeof error === "string") {
    return makeEntry("toolError", { ...toolFields, text: error });
  }
  const { message, ...errorExtra } = getObjectFields(error) ?? { error };
  return makeEntry("toolError", { ...toolFields, text: getString(message) ?? JSON.stringify(error), extra: getExtra(errorExtra) });
}
