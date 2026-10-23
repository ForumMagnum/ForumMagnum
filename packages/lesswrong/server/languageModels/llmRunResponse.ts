import { generateText, stepCountIs, type ContentPart, type ModelMessage, type ToolSet } from "ai";
import LlmRuns from "@/server/collections/llmRuns/collection";

const MAX_MODEL_STEPS = 20;
/**
 * The SDK only takes another step after tools that our code runs. When a step
 * uses only tools the provider or Gateway runs (web search, web fetch), the
 * provider can hand the turn back before the model has written anything; we
 * then send the conversation back so the model continues.
 */
const MAX_CONTINUATIONS = 2;

/**
 * Ask every provider to return the model's reasoning. Each provider only
 * reads its own entry. All of them return summaries rather than the full
 * reasoning.
 */
const REASONING_PROVIDER_OPTIONS = {
  anthropic: { thinking: { type: "adaptive", display: "summarized" } },
  openai: { reasoningEffort: "high", reasoningSummary: "detailed" },
  // Gemini goes through Google AI or Vertex depending on Gateway routing
  google: { thinkingConfig: { thinkingLevel: "high", includeThoughts: true } },
  vertex: { thinkingConfig: { thinkingLevel: "high", includeThoughts: true } },
};

/**
 * Run the model with the run's system prompt and the given context message
 * and tools. The context message, the transcript (after every step, so run
 * pages can show progress) and the final response are saved on the run.
 */
export async function generateLlmRunResponse(run: DbLlmRun, { contextMessage, tools }: {
  contextMessage: string,
  tools: ToolSet,
}): Promise<string> {
  await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { contextMessage, transcript: [], response: null } });

  let transcript: LlmTranscriptEntry[] = [];
  let messages: ModelMessage[] = [{ role: "user", content: contextMessage }];
  for (let continuation = 0; ; continuation++) {
    const result = await generateText({
      model: run.gatewayModelId,
      system: run.systemPrompt,
      messages,
      tools,
      stopWhen: stepCountIs(MAX_MODEL_STEPS),
      providerOptions: REASONING_PROVIDER_OPTIONS,
      onStepFinish: async (step) => {
        transcript = appendTranscriptEntries(transcript, step.content.flatMap(toTranscriptEntries));
        await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { transcript } });
      },
    });

    const response = result.text;
    if (response.trim()) {
      await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { response } });
      return response;
    }
    if (continuation >= MAX_CONTINUATIONS) {
      throw new Error(`The model finished without writing a response (finish reason: ${result.finishReason})`);
    }
    messages = [...messages, ...result.response.messages, { role: "user", content: "Continue." }];
  }
}

/**
 * Some providers split one answer into many text parts (e.g. around
 * citations), so consecutive text is merged into a single entry.
 */
function appendTranscriptEntries(transcript: LlmTranscriptEntry[], entries: LlmTranscriptEntry[]): LlmTranscriptEntry[] {
  return entries.reduce((merged, entry) => {
    const last = merged[merged.length - 1];
    if (entry.type === "text" && last?.type === "text") {
      return [...merged.slice(0, -1), { type: "text", text: last.text + entry.text }];
    }
    return [...merged, entry];
  }, transcript);
}

function toTranscriptEntries(part: ContentPart<ToolSet>): LlmTranscriptEntry[] {
  switch (part.type) {
    case "reasoning":
      return part.text ? [{ type: "reasoning", text: part.text }] : [];
    case "text":
      return part.text ? [{ type: "text", text: part.text }] : [];
    case "tool-call":
      return [{ type: "tool-call", toolCallId: part.toolCallId, toolName: part.toolName, input: part.input }];
    case "tool-result":
      return [{ type: "tool-result", toolCallId: part.toolCallId, toolName: part.toolName, output: part.output }];
    case "tool-error":
      return [{ type: "tool-error", toolCallId: part.toolCallId, toolName: part.toolName, error: String(part.error) }];
    case "source":
      return part.sourceType === "url" ? [{ type: "source", url: part.url, title: part.title ?? null }] : [];
    default:
      return [];
  }
}
