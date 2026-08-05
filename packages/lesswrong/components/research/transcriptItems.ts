import {
  getConversationEventChunks,
  isPlainRecord,
  type ConversationEventChunk,
} from './conversationEventFormat';

export interface TranscriptEventLike {
  seq: number;
  kind: string;
  payload: unknown;
}

export interface TranscriptToolCall<T extends TranscriptEventLike> {
  event: T;
  chunk: ConversationEventChunk;
}

export type TranscriptRunEntry<T extends TranscriptEventLike> =
  | { kind: 'call'; event: T; chunk: ConversationEventChunk }
  | { kind: 'result'; event: T };

export type TranscriptItem<T extends TranscriptEventLike> =
  | { type: 'event'; event: T }
  | { type: 'tool'; entry: TranscriptRunEntry<T> }
  | { type: 'toolGroup'; key: string; entries: TranscriptRunEntry<T>[] }
  | {
      type: 'subagent';
      key: string;
      /** The spawning tool call; null for orphans (parent outside the loaded window). */
      call: TranscriptToolCall<T> | null;
      events: T[];
      items: TranscriptItem<T>[];
      resultEvent?: T;
    };

export function getParentToolUseId(event: { payload: unknown }): string | null {
  return isPlainRecord(event.payload) && typeof event.payload.parent_tool_use_id === 'string'
    ? event.payload.parent_tool_use_id
    : null;
}

export function groupCalls<T extends TranscriptEventLike>(
  entries: TranscriptRunEntry<T>[],
): TranscriptToolCall<T>[] {
  const calls: TranscriptToolCall<T>[] = [];
  for (const entry of entries) {
    if (entry.kind === 'call') calls.push({ event: entry.event, chunk: entry.chunk });
  }
  return calls;
}

interface BuildOptions<T extends TranscriptEventLike> {
  /** Events owned by an overlay (ask-user-question cards, hidden rows) render standalone. */
  isSpecialEvent?: (event: T) => boolean;
}

/**
 * Structures a flat event window for display: sidechain events (subagent
 * activity, marked by payload.parent_tool_use_id) nest under the tool call
 * that spawned them, and runs of consecutive tool calls (with their result
 * rows) collapse into a group. The trailing call of each level stays out of
 * its group while it is the most recent entry, so the "current" call reads
 * normally until the next event lands. Sidechain events whose parent lies
 * outside the loaded window surface as a parentless subagent item at the
 * window top (they merge under the real call once older pages load).
 */
export function buildTranscriptItems<T extends TranscriptEventLike>(
  events: T[],
  options: BuildOptions<T> = {},
): TranscriptItem<T>[] {
  const byParent = new Map<string, T[]>();
  const mainline: T[] = [];
  for (const event of events) {
    const parentId = getParentToolUseId(event);
    if (parentId !== null) {
      const group = byParent.get(parentId);
      if (group) group.push(event);
      else byParent.set(parentId, [event]);
    } else {
      mainline.push(event);
    }
  }

  const attachedParents = new Set<string>();
  const items = buildLevel(mainline, byParent, attachedParents, options);

  const orphanItems: TranscriptItem<T>[] = [];
  for (const [parentId, group] of byParent) {
    if (attachedParents.has(parentId)) continue;
    orphanItems.push({
      type: 'subagent',
      key: `orphan:${parentId}`,
      call: null,
      events: group,
      items: buildLevel(group, byParent, attachedParents, options),
    });
  }
  orphanItems.sort((a, b) => firstSeq(a) - firstSeq(b));
  return [...orphanItems, ...items];
}

function firstSeq<T extends TranscriptEventLike>(item: TranscriptItem<T>): number {
  return item.type === 'subagent' ? (item.events[0]?.seq ?? 0) : 0;
}

function resultAnswersSubagent<T extends TranscriptEventLike>(
  event: T,
  subagentKey: string,
): boolean {
  return getConversationEventChunks(event).some(
    (c) => c.kind === 'tool_result' && c.toolUseId === subagentKey,
  );
}

function buildLevel<T extends TranscriptEventLike>(
  levelEvents: T[],
  byParent: Map<string, T[]>,
  attachedParents: Set<string>,
  options: BuildOptions<T>,
): TranscriptItem<T>[] {
  const items: TranscriptItem<T>[] = [];
  let run: TranscriptRunEntry<T>[] = [];

  const flushRun = () => {
    if (run.length === 0) return;
    const calls = groupCalls(run);
    if (calls.length >= 2) {
      const first = calls[0];
      items.push({
        type: 'toolGroup',
        key: `${first.event.seq}:${first.chunk.toolUseId ?? '?'}`,
        entries: run,
      });
    } else {
      for (const entry of run) items.push({ type: 'tool', entry });
    }
    run = [];
  };

  for (const event of levelEvents) {
    if (options.isSpecialEvent?.(event)) {
      flushRun();
      items.push({ type: 'event', event });
      continue;
    }
    if (event.kind === 'tool_result') {
      if (run.length > 0) {
        run.push({ kind: 'result', event });
        continue;
      }
      const last = items[items.length - 1];
      if (last?.type === 'subagent' && !last.resultEvent && resultAnswersSubagent(event, last.key)) {
        last.resultEvent = event;
        continue;
      }
      if (last?.type === 'tool') {
        run.push(last.entry, { kind: 'result', event });
        items.pop();
        continue;
      }
      items.push({ type: 'event', event });
      continue;
    }
    const chunks = getConversationEventChunks(event);
    if (chunks.length === 0) continue;
    const toolOnly = event.kind === 'assistant' && chunks.every((c) => c.kind === 'tool_use');
    if (!toolOnly) {
      flushRun();
      items.push({ type: 'event', event });
      continue;
    }
    for (const chunk of chunks) {
      const spawned = chunk.toolUseId ? byParent.get(chunk.toolUseId) : undefined;
      if (spawned && chunk.toolUseId) {
        flushRun();
        attachedParents.add(chunk.toolUseId);
        items.push({
          type: 'subagent',
          key: chunk.toolUseId,
          call: { event, chunk },
          events: spawned,
          items: buildLevel(spawned, byParent, attachedParents, options),
        });
      } else {
        run.push({ kind: 'call', event, chunk });
      }
    }
  }

  // Tail rule: the level's final call (and its result) stays standalone
  // until something follows it.
  if (run.length > 0) {
    let lastCallIdx = run.length - 1;
    while (lastCallIdx >= 0 && run[lastCallIdx].kind !== 'call') lastCallIdx--;
    const tail = lastCallIdx >= 0 ? run.splice(lastCallIdx) : run.splice(0);
    flushRun();
    for (const entry of tail) items.push({ type: 'tool', entry });
  }
  return items;
}

const TOOL_PHRASES: Record<string, [singular: string, plural: string]> = {
  Bash: ['ran 1 shell command', 'ran # shell commands'],
  Read: ['read 1 file', 'read # files'],
  Grep: ['searched for 1 pattern', 'searched for # patterns'],
  Glob: ['matched 1 glob', 'matched # globs'],
  LS: ['listed 1 directory', 'listed # directories'],
  Edit: ['made 1 edit', 'made # edits'],
  MultiEdit: ['made 1 edit', 'made # edits'],
  NotebookEdit: ['made 1 edit', 'made # edits'],
  Write: ['wrote 1 file', 'wrote # files'],
  WebFetch: ['fetched 1 page', 'fetched # pages'],
  WebSearch: ['ran 1 web search', 'ran # web searches'],
  TodoWrite: ['updated the plan 1 time', 'updated the plan # times'],
};

/**
 * `Searched for 4 patterns, read 3 files, ran 2 shell commands` — phrases in
 * first-appearance order, unknown tools as `ToolName ×N`.
 */
export function describeToolGroup<T extends TranscriptEventLike>(
  calls: TranscriptToolCall<T>[],
): string {
  const counts = new Map<string, number>();
  for (const call of calls) {
    const name = call.chunk.toolName ?? 'Tool';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const phrases: string[] = [];
  for (const [name, n] of counts) {
    const phrase = TOOL_PHRASES[name];
    if (!phrase) {
      phrases.push(n === 1 ? name : `${name} ×${n}`);
    } else {
      phrases.push(n === 1 ? phrase[0] : phrase[1].replace('#', String(n)));
    }
  }
  const joined = phrases.join(', ');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}
