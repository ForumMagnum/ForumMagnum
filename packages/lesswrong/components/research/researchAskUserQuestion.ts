import { isPlainRecord } from './conversationEventFormat';

/**
 * Client-side reading of AskUserQuestion prompts out of the persisted event
 * stream. The agent's `AskUserQuestion` tool call is persisted like any other
 * tool_use (an assistant message with a `tool_use` content block); when the
 * user answers, the supervisor un-pauses the turn and the CLI emits a
 * `tool_result` carrying the chosen `answers`. So both the prompt and its
 * eventual answer live in the transcript — the question card renders from here
 * and needs no separate event kind.
 */

export const ASK_USER_QUESTION_TOOL = 'AskUserQuestion';

export interface AskUserQuestionOption {
  label: string;
  description?: string;
}

export interface AskUserQuestionItem {
  question: string;
  header: string;
  multiSelect: boolean;
  options: AskUserQuestionOption[];
}

export interface AskUserQuestionPrompt {
  /** The tool_use id — the stable handle the answer mutation targets. */
  toolUseId: string;
  questions: AskUserQuestionItem[];
}

interface EventLike {
  kind: string;
  payload: unknown;
}

function parseOption(raw: unknown): AskUserQuestionOption | null {
  if (!isPlainRecord(raw) || typeof raw.label !== 'string') return null;
  return {
    label: raw.label,
    description: typeof raw.description === 'string' ? raw.description : undefined,
  };
}

function parseQuestion(raw: unknown): AskUserQuestionItem | null {
  if (!isPlainRecord(raw)) return null;
  if (typeof raw.question !== 'string' || !Array.isArray(raw.options)) return null;
  const options = raw.options.map(parseOption).filter((o): o is AskUserQuestionOption => o !== null);
  if (options.length === 0) return null;
  return {
    question: raw.question,
    header: typeof raw.header === 'string' ? raw.header : '',
    multiSelect: raw.multiSelect === true,
    options,
  };
}

/** The tool_use_id a tool_result answers, or null if it isn't a tool_result. */
export function toolResultToolUseId(event: EventLike): string | null {
  if (event.kind !== 'tool_result' || !isPlainRecord(event.payload)) return null;
  const message = isPlainRecord(event.payload.message) ? event.payload.message : null;
  const content = message && Array.isArray(message.content) ? message.content : null;
  if (!content) return null;
  for (const part of content) {
    if (isPlainRecord(part) && typeof part.tool_use_id === 'string') return part.tool_use_id;
  }
  return null;
}

/** Extract the AskUserQuestion tool_use block from an event, or null. */
export function extractAskUserQuestion(event: EventLike): AskUserQuestionPrompt | null {
  if (event.kind !== 'assistant' && event.kind !== 'tool_use') return null;
  if (!isPlainRecord(event.payload)) return null;
  const message = isPlainRecord(event.payload.message) ? event.payload.message : event.payload;
  const content = message.content;
  if (!Array.isArray(content)) return null;
  for (const part of content) {
    if (!isPlainRecord(part) || part.type !== 'tool_use' || part.name !== ASK_USER_QUESTION_TOOL) continue;
    if (typeof part.id !== 'string' || !isPlainRecord(part.input)) continue;
    const rawQuestions = part.input.questions;
    if (!Array.isArray(rawQuestions)) continue;
    const questions = rawQuestions.map(parseQuestion).filter((q): q is AskUserQuestionItem => q !== null);
    if (questions.length === 0) continue;
    return { toolUseId: part.id, questions };
  }
  return null;
}

/**
 * The tool_use_id → answers map from every AskUserQuestion tool_result in the
 * event list. A question with an entry here has been answered; its value maps
 * each question's text to the chosen answer string (multi-select comma-joined).
 */
export function collectAskUserQuestionAnswers(
  events: readonly EventLike[],
): Map<string, Record<string, string>> {
  const byToolUseId = new Map<string, Record<string, string>>();
  for (const event of events) {
    if (event.kind !== 'tool_result') continue;
    if (!isPlainRecord(event.payload)) continue;
    // The answers live on the top-level `tool_use_result` the CLI attaches to
    // the tool_result user line; the tool_use_id is on the content block.
    const toolUseResult = event.payload.tool_use_result;
    const message = isPlainRecord(event.payload.message) ? event.payload.message : null;
    const content = message && Array.isArray(message.content) ? message.content : null;
    const toolUseId = content
      ? content.map((p) => (isPlainRecord(p) && typeof p.tool_use_id === 'string' ? p.tool_use_id : null)).find((id): id is string => id !== null)
      : undefined;
    if (!toolUseId || !isPlainRecord(toolUseResult) || !isPlainRecord(toolUseResult.answers)) continue;
    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(toolUseResult.answers)) {
      if (typeof v === 'string') answers[k] = v;
    }
    byToolUseId.set(toolUseId, answers);
  }
  return byToolUseId;
}
