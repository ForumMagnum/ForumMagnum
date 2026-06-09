import { getMarkdownItNoMathjax } from "@/lib/utils/markdownItPlugins";
import { sanitize } from "@/lib/utils/sanitize";
import { stripLeadingSystemReminder } from "@/lib/research/systemReminderFormat";

interface ResearchConversationEventLike {
  kind: string;
  payload: unknown;
}

/**
 * Kinds that the Chat pane and AgentBlock both render to the user.
 * Excludes:
 *   - `system` — supervisor init handshake; pure machine bookkeeping that
 *     dumps a long JSON of the available tool list etc.
 *   - `result` — Claude Code's final session-result wrapper.
 *   - `unknown` / `rate_limit_event` — meta events the supervisor passes
 *     through but that aren't a part of the user-visible turn transcript.
 *
 * These are still persisted (well, the persisted ones are) so admins / replay
 * tools can inspect them — we just don't show them in the chat surface.
 */
const visibleConversationEventKinds = new Set([
  'user',
  'assistant',
  'thinking',
  'tool_use',
  'tool_result',
  'error',
]);

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isVisibleConversationEvent(event: { kind: string }): boolean {
  return visibleConversationEventKinds.has(event.kind);
}

/**
 * Whether the transcript has an unanswered turn. Claude Code emits exactly one
 * `result` per turn, so `userCount > resultCount` means a turn is still
 * running (or queued waiting for its sandbox to start).
 */
export function isTurnInFlight(events: readonly { kind: string }[]): boolean {
  let userCount = 0;
  let resultCount = 0;
  for (const event of events) {
    if (event.kind === 'user') userCount++;
    else if (event.kind === 'result') resultCount++;
  }
  return userCount > resultCount;
}

/**
 * One renderable piece of an event's payload. Most events produce a single
 * chunk, but assistant turns with extended-thinking can have multiple parts
 * (`thinking` followed by `text`) which we render with different styles so
 * the user can tell the model's internal reasoning from its actual reply.
 */
export type ConversationEventChunkKind =
  | 'text'
  | 'thinking'
  | 'tool_use'
  | 'tool_result';

export interface ConversationEventChunk {
  kind: ConversationEventChunkKind;
  text: string;
}

export function renderChunkMarkdownToHtml(text: string): string {
  return sanitize(getMarkdownItNoMathjax().render(text));
}

export function getConversationEventChunks(event: ResearchConversationEventLike): ConversationEventChunk[] {
  const { payload } = event;
  if (typeof payload === 'string') return [{ kind: 'text', text: stripLeadingSystemReminder(payload) }];
  if (!isPlainRecord(payload)) return [];

  const inner = isPlainRecord(payload.message) ? payload.message : payload;

  if (typeof inner.text === 'string') return [{ kind: 'text', text: stripLeadingSystemReminder(inner.text) }];
  if (typeof inner.content === 'string') return [{ kind: 'text', text: stripLeadingSystemReminder(inner.content) }];
  if (Array.isArray(inner.content)) {
    return inner.content
      .map(toContentChunk)
      .filter((c): c is ConversationEventChunk => c !== null && c.text.length > 0);
  }

  if (event.kind === 'tool_use' && typeof inner.name === 'string') {
    return [{ kind: 'tool_use', text: `${inner.name}(${formatJSON(inner.input)})` }];
  }
  if (event.kind === 'tool_result') {
    return [{ kind: 'tool_result', text: formatJSON(inner.output ?? inner.result ?? inner) }];
  }
  return [];
}

function toContentChunk(part: unknown): ConversationEventChunk | null {
  if (typeof part === 'string') return { kind: 'text', text: part };
  if (!isPlainRecord(part)) return null;
  if (part.type === 'thinking' && typeof part.thinking === 'string') {
    return { kind: 'thinking', text: part.thinking };
  }
  if (typeof part.text === 'string') return { kind: 'text', text: part.text };
  if (part.type === 'tool_use' && typeof part.name === 'string') {
    return { kind: 'tool_use', text: `${part.name}(${formatJSON(part.input)})` };
  }
  if (part.type === 'tool_result') {
    return { kind: 'tool_result', text: formatToolResultContent(part.content) };
  }
  return null;
}

function formatToolResultContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return formatJSON(content);
  return content
    .map((part) => {
      if (isPlainRecord(part) && typeof part.text === 'string') {
        return part.text;
      }
      return formatJSON(part);
    })
    .join('\n');
}

function formatJSON(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export interface TranscriptTurn {
  seq: number;
  role: 'user' | 'assistant' | 'thinking' | 'tool_use' | 'tool_result' | 'error';
  text: string;
}

export interface TranscriptOptions {
  withThinking?: boolean;
  withToolPayloads?: boolean;
}

interface TranscriptInputEvent {
  seq: number;
  kind: string;
  payload: unknown;
}

export function getAgentTranscriptTurns(
  events: TranscriptInputEvent[],
  options: TranscriptOptions = {},
): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  for (const event of events) {
    if (!isVisibleConversationEvent(event)) continue;
    const chunks = getConversationEventChunks(event);
    if (chunks.length === 0) continue;

    const filtered: ConversationEventChunk[] = [];
    for (const chunk of chunks) {
      if (chunk.kind === 'thinking' && !options.withThinking) continue;
      if (chunk.kind === 'tool_result' && !options.withToolPayloads) continue;
      if (chunk.kind === 'tool_use' && !options.withToolPayloads) {
        filtered.push({ kind: chunk.kind, text: stripToolArgs(chunk.text) });
        continue;
      }
      filtered.push(chunk);
    }
    if (filtered.length === 0) continue;

    turns.push({
      seq: event.seq,
      role: normalizeTranscriptRole(event.kind),
      text: filtered.map((c) => c.text).join('\n'),
    });
  }
  return turns;
}

// `getConversationEventChunks` formats tool_use chunk text as
// `${name}(${formatJSON(input)})`; trim everything from the first `(` onward
// when the consumer doesn't want payloads.
function stripToolArgs(text: string): string {
  const parenIdx = text.indexOf('(');
  return parenIdx === -1 ? text : text.slice(0, parenIdx);
}

function normalizeTranscriptRole(kind: string): TranscriptTurn['role'] {
  switch (kind) {
    case 'user':
    case 'assistant':
    case 'thinking':
    case 'tool_use':
    case 'tool_result':
    case 'error':
      return kind;
    default:
      // Only reachable if `visibleConversationEventKinds` diverges from this role union.
      return 'assistant';
  }
}
