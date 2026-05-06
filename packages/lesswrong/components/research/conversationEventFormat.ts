interface ResearchConversationEventLike {
  kind: string;
  payload: unknown;
}

const visibleAgentBlockEventKinds = new Set([
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

export function isVisibleAgentBlockEvent(event: { kind: string }): boolean {
  return visibleAgentBlockEventKinds.has(event.kind);
}

export function getConversationEventText(event: ResearchConversationEventLike): string {
  const { payload } = event;
  if (typeof payload === 'string') return payload;
  if (!isPlainRecord(payload)) return formatJSON(payload);

  const inner = isPlainRecord(payload.message) ? payload.message : payload;

  if (typeof inner.text === 'string') return inner.text;
  if (typeof inner.content === 'string') return inner.content;
  if (Array.isArray(inner.content)) {
    const parts = inner.content
      .map(formatContentPart)
      .filter((part) => part.length > 0);
    if (parts.length > 0) return parts.join('\n');
  }

  if (event.kind === 'tool_use' && typeof inner.name === 'string') {
    return `${inner.name}(${formatJSON(inner.input)})`;
  }
  if (event.kind === 'tool_result') {
    return formatJSON(inner.output ?? inner.result ?? inner);
  }
  return formatJSON(payload);
}

function formatContentPart(part: unknown): string {
  if (typeof part === 'string') return part;
  if (!isPlainRecord(part)) return '';
  if (typeof part.text === 'string') return part.text;
  if (part.type === 'tool_use' && typeof part.name === 'string') {
    return `${part.name}(${formatJSON(part.input)})`;
  }
  if (part.type === 'tool_result') {
    return formatToolResultContent(part.content);
  }
  return '';
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
