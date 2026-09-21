import { buildTranscriptItems, describeToolGroup, groupCalls } from '@/components/research/transcriptItems';

let seqCounter = 0;
function assistantEvent(blocks: unknown[], parent?: string) {
  return {
    seq: ++seqCounter,
    kind: 'assistant',
    payload: {
      type: 'assistant',
      parent_tool_use_id: parent ?? null,
      message: { content: blocks },
    },
  };
}
function userEvent(text: string) {
  return {
    seq: ++seqCounter,
    kind: 'user',
    payload: { type: 'user', parent_tool_use_id: null, message: { content: text } },
  };
}
function resultEvent(toolUseId: string, parent?: string, isError = false) {
  return {
    seq: ++seqCounter,
    kind: 'tool_result',
    payload: {
      type: 'user',
      parent_tool_use_id: parent ?? null,
      message: {
        content: [{ type: 'tool_result', tool_use_id: toolUseId, content: 'ok', is_error: isError }],
      },
    },
  };
}
const tool = (id: string, name = 'Bash', input: unknown = { command: 'ls' }) => ({
  type: 'tool_use',
  id,
  name,
  input,
});
const text = (t: string) => ({ type: 'text', text: t });
const emptyThinking = () => ({ type: 'thinking', thinking: '', signature: 'x' });

describe('buildTranscriptItems', () => {
  it('collapses a run of calls and their results, closed by a text event', () => {
    seqCounter = 0;
    const items = buildTranscriptItems([
      userEvent('go'),
      assistantEvent([tool('a')]),
      resultEvent('a'),
      assistantEvent([tool('b', 'Read', { file_path: '/x' })]),
      resultEvent('b'),
      assistantEvent([tool('c', 'Read', { file_path: '/y' })]),
      resultEvent('c'),
      assistantEvent([text('done')]),
    ]);
    expect(items.map((i) => i.type)).toEqual(['event', 'toolGroup', 'event']);
    const group = items[1];
    if (group.type !== 'toolGroup') throw new Error('expected group');
    expect(groupCalls(group.entries)).toHaveLength(3);
    expect(group.entries).toHaveLength(6);
  });

  it('keeps the trailing call and its result out of the group (tail rule)', () => {
    seqCounter = 0;
    const items = buildTranscriptItems([
      assistantEvent([tool('a')]),
      resultEvent('a'),
      assistantEvent([tool('b')]),
      resultEvent('b'),
      assistantEvent([tool('c')]),
      resultEvent('c'),
    ]);
    expect(items.map((i) => i.type)).toEqual(['toolGroup', 'tool', 'tool']);
    const group = items[0];
    if (group.type !== 'toolGroup') throw new Error('expected group');
    expect(groupCalls(group.entries).map((c) => c.chunk.toolUseId)).toEqual(['a', 'b']);
  });

  it('ignores empty-thinking events inside a run', () => {
    seqCounter = 0;
    const items = buildTranscriptItems([
      assistantEvent([tool('a')]),
      assistantEvent([emptyThinking()]),
      assistantEvent([tool('b')]),
      assistantEvent([tool('c')]),
      assistantEvent([text('done')]),
    ]);
    expect(items.map((i) => i.type)).toEqual(['toolGroup', 'event']);
  });

  it('nests sidechain events under the spawning tool call and attaches its result', () => {
    seqCounter = 0;
    const items = buildTranscriptItems([
      userEvent('go'),
      assistantEvent([tool('task1', 'Task', { subagent_type: 'Explore', description: 'map' })]),
      assistantEvent([tool('sub-a')], 'task1'),
      resultEvent('sub-a', 'task1'),
      assistantEvent([text('sub summary')], 'task1'),
      resultEvent('task1'),
      assistantEvent([text('main done')]),
    ]);
    expect(items.map((i) => i.type)).toEqual(['event', 'subagent', 'event']);
    const sub = items[1];
    if (sub.type !== 'subagent') throw new Error('expected subagent');
    expect(sub.key).toBe('task1');
    expect(sub.call?.chunk.toolName).toBe('Task');
    expect(sub.events).toHaveLength(3);
    expect(sub.resultEvent?.seq).toBe(6);
  });

  it('surfaces orphaned sidechain events as a parentless subagent item first', () => {
    seqCounter = 0;
    const items = buildTranscriptItems([
      assistantEvent([tool('sub-a')], 'missing-task'),
      assistantEvent([text('sub text')], 'missing-task'),
      userEvent('hello'),
    ]);
    expect(items.map((i) => i.type)).toEqual(['subagent', 'event']);
    const sub = items[0];
    if (sub.type !== 'subagent') throw new Error('expected subagent');
    expect(sub.call).toBeNull();
    expect(sub.key).toBe('orphan:missing-task');
  });

  it('treats overlay-special events as run breaks', () => {
    seqCounter = 0;
    const special = assistantEvent([tool('ask', 'AskUserQuestion', {})]);
    const items = buildTranscriptItems(
      [assistantEvent([tool('a')]), assistantEvent([tool('b')]), special, assistantEvent([tool('c')])],
      { isSpecialEvent: (e) => e === special },
    );
    expect(items.map((i) => i.type)).toEqual(['toolGroup', 'event', 'tool']);
  });

  it('handles nested subagents recursively', () => {
    seqCounter = 0;
    const items = buildTranscriptItems([
      assistantEvent([tool('outer', 'Task', {})]),
      assistantEvent([tool('inner', 'Task', {})], 'outer'),
      assistantEvent([text('deep')], 'inner'),
      assistantEvent([text('done')]),
    ]);
    const sub = items[0];
    if (sub.type !== 'subagent') throw new Error('expected subagent');
    const inner = sub.items[0];
    if (inner.type !== 'subagent') throw new Error('expected nested subagent');
    expect(inner.key).toBe('inner');
  });
});

describe('describeToolGroup', () => {
  it('aggregates by tool with first-appearance order and pluralization', () => {
    seqCounter = 0;
    const items = buildTranscriptItems([
      assistantEvent([tool('1', 'Grep', {})]),
      assistantEvent([tool('2', 'Read', {})]),
      assistantEvent([tool('3', 'Grep', {})]),
      assistantEvent([tool('4', 'Bash', {})]),
      assistantEvent([tool('5', 'Frobnicate', {})]),
      assistantEvent([text('end')]),
    ]);
    const group = items[0];
    if (group.type !== 'toolGroup') throw new Error('expected group');
    expect(describeToolGroup(groupCalls(group.entries))).toBe(
      'Searched for 2 patterns, read 1 file, ran 1 shell command, Frobnicate',
    );
  });
});
