import { getMarkdownItNoMathjax } from "@/lib/utils/markdownItPlugins";
import { sanitize } from "@/lib/utils/sanitize";
import { stripLeadingSystemReminder } from "@/lib/research/systemReminderFormat";
import {
  isTurnActivity,
  FLUSH_RESULT_SUBTYPE,
  TURN_OPENING_SYSTEM_SUBTYPE,
} from "@/lib/research/turnActivity";

interface ResearchConversationEventLike {
  kind: string;
  payload: unknown;
  createdAt?: string | Date;
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

// Only user/assistant turns count as "messages" (e.g. for the unread pill); tool
// calls and thinking blocks would inflate the count past what reads as messages.
export function isMessageEvent(event: { kind: string }): boolean {
  return event.kind === 'user' || event.kind === 'assistant';
}

// Highest message seq among the given events, or -1 if there are none.
export function maxMessageSeq(events: { kind: string; seq: number }[]): number {
  let max = -1;
  for (const event of events) if (isMessageEvent(event) && event.seq > max) max = event.seq;
  return max;
}

/**
 * A user message dispatched while another turn runs is persisted immediately
 * but queued by Claude Code, so it can sit *before* the running turn's
 * `result` in seq order — masked from the since-last-result scan below. Such
 * a message counts as in flight while recent. The time bound exists because
 * older transcripts (from the per-turn supervisor era) don't reliably contain
 * a `system:init` after every user event, and an unbounded "user turn never
 * started" clause would wedge them as permanently in flight; the real
 * queued-turn gap is seconds, so fifteen minutes is generous.
 */
const RECENT_UNSTARTED_USER_TURN_MS = 15 * 60 * 1000;

/**
 * Whether the transcript currently has a running (or queued) turn. Claude
 * Code emits exactly one `result` per turn, but turns aren't always
 * user-initiated — a finishing background task re-invokes the agent with no
 * user event, and a crashed process gets its turn closed by a synthetic
 * supervisor result — so counting user events against results drifts apart
 * over a conversation's lifetime. Instead:
 *
 *  1. any turn content since the most recent `result` (shared definition in
 *     `@/lib/research/turnActivity`, mirrored by the supervisor's busy state
 *     and the repo's `hasIncompleteTurn`) means a turn is in flight;
 *  2. a recent user message that no turn-opening `system:init` or synthetic
 *     flush result has answered yet means a turn is queued (see above).
 *
 * Clause 2 needs the current time, which the caller must supply — calling
 * `Date.now()` here would run during React render (this is computed in
 * useMemo) and trip Next's prerender purity check. With `nowMs` omitted the
 * queued-turn clause is skipped, which only under-reports during the brief
 * gap before a queued turn opens.
 */
export function isTurnInFlight(
  events: readonly ResearchConversationEventLike[],
  nowMs?: number,
): boolean {
  let lastResultIdx = -1;
  let lastActivityIdx = -1;
  let lastUserIdx = -1;
  let lastTurnStartOrFlushIdx = -1;
  let lastUserEvent: ResearchConversationEventLike | null = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const subtype = isPlainRecord(event.payload) && typeof event.payload.subtype === 'string'
      ? event.payload.subtype
      : undefined;
    if (event.kind === 'result') {
      lastResultIdx = i;
      if (subtype === FLUSH_RESULT_SUBTYPE) lastTurnStartOrFlushIdx = i;
      continue;
    }
    if (isTurnActivity(event.kind, subtype)) lastActivityIdx = i;
    if (event.kind === 'user') {
      lastUserIdx = i;
      lastUserEvent = event;
    }
    if (event.kind === 'system' && subtype === TURN_OPENING_SYSTEM_SUBTYPE) {
      lastTurnStartOrFlushIdx = i;
    }
  }

  if (lastActivityIdx > lastResultIdx) return true;

  if (nowMs !== undefined && lastUserIdx >= 0 && lastUserIdx > lastTurnStartOrFlushIdx && lastUserEvent?.createdAt) {
    const createdMs = new Date(lastUserEvent.createdAt).valueOf();
    if (!Number.isNaN(createdMs) && nowMs - createdMs < RECENT_UNSTARTED_USER_TURN_MS) {
      return true;
    }
  }

  return false;
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

/**
 * Rewrite anchor tags so chat links open in a new tab (with `noopener`/
 * `noreferrer`). Applied before `sanitize`, which keeps `target`/`rel` and
 * normalizes the output. Anchors that already declare a `target` are left as-is.
 * (The shared markdown-it instance is a singleton used elsewhere, so we can't
 * configure its link rule; scoping the rewrite here keeps it to chat content.)
 */
export function openChatLinksInNewTab(html: string): string {
  return html.replace(/<a\b(?![^>]*\btarget=)/gi, '<a target="_blank" rel="noopener noreferrer"');
}

export function renderChunkMarkdownToHtml(text: string): string {
  return sanitize(openChatLinksInNewTab(getMarkdownItNoMathjax().render(text)));
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
