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

export function getConversationEventChunks(event: ResearchConversationEventLike): ConversationEventChunk[] {
  const { payload } = event;
  if (typeof payload === 'string') return [{ kind: 'text', text: payload }];
  if (!isPlainRecord(payload)) return [];

  const inner = isPlainRecord(payload.message) ? payload.message : payload;

  if (typeof inner.text === 'string') return [{ kind: 'text', text: inner.text }];
  if (typeof inner.content === 'string') return [{ kind: 'text', text: inner.content }];
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

/**
 * Flatten an event to a single string. Kept for tests and any caller that
 * doesn't care to distinguish thinking from text — UI surfaces should prefer
 * `getConversationEventChunks` so they can style each chunk separately.
 */
export function getConversationEventText(event: ResearchConversationEventLike): string {
  return getConversationEventChunks(event).map((c) => c.text).join('\n');
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
