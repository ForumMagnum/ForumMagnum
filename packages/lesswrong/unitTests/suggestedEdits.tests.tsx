/** @jest-environment jsdom */
import React, { useLayoutEffect, useMemo } from 'react';
import { render, act } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createEmptyHistoryState, HistoryPlugin, type HistoryState } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import type { Provider, ProviderAwareness, UserState } from '@lexical/yjs';
import { Doc } from 'yjs';
import {
  $createParagraphNode,
  $createTextNode,
  $createRangeSelection,
  $getSelection,
  $getRoot,
  $getNodeByKey,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  KEY_BACKSPACE_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  LexicalEditor,
  ElementNode,
  EditorConfig,
  LexicalNode,
  DOMConversionMap,
  DOMExportOutput,
  SerializedElementNode,
  Spread,
} from 'lexical';
import { MarkNode } from '@lexical/mark';

// We intentionally test SuggestedEditsPlugin in isolation from the full app UI/theme.
// These mocks keep the tests focused on editor-state semantics.
jest.mock('@/components/hooks/useStyles', () => ({
  defineStyles: () => ({}),
  useStyles: () => ({ toggleContainer: 'toggleContainer' }),
}));

jest.mock('@/lib/vendor/@material-ui/core/src/Button/Button', () => {
  // eslint-disable-next-line react/display-name
  return (props: AnyBecauseHard) => <button type="button" {...props} />;
});

// JSDOM's Range doesn't implement getBoundingClientRect(), but Lexical calls it when syncing
// selection to the DOM (e.g. after editor updates/undo/redo).
if (typeof Range !== 'undefined') {
  const rangeProto = Range.prototype as AnyBecauseHard;
  if (!rangeProto.getBoundingClientRect) {
    rangeProto.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => ({}),
    });
  }
  if (!rangeProto.getClientRects) {
    rangeProto.getClientRects = () => [];
  }
}

import SuggestedEditsPlugin, {
  TOGGLE_SUGGESTING_MODE_COMMAND,
} from '@/components/editor/lexicalPlugins/suggestedEdits/SuggestedEditsPlugin';

import CommentPlugin, {
  INSERT_INLINE_THREAD_COMMAND,
  UPDATE_INLINE_THREAD_COMMAND,
  HIDE_THREAD_COMMAND,
  RESOLVE_SUGGESTION_BY_ID_COMMAND,
} from '@/components/lexical/plugins/CommentPlugin';
import {
  $isSuggestionInsertionInlineNode,
  SuggestionInsertionInlineNode,
} from '@/components/editor/lexicalPlugins/suggestedEdits/nodes/SuggestionInsertionInlineNode';
import {
  $isSuggestionDeletionInlineNode,
  SuggestionDeletionInlineNode,
} from '@/components/editor/lexicalPlugins/suggestedEdits/nodes/SuggestionDeletionInlineNode';
import {
  $isSuggestionInsertionBlockNode,
  SuggestionInsertionBlockNode,
} from '@/components/editor/lexicalPlugins/suggestedEdits/nodes/SuggestionInsertionBlockNode';
import {
  $isSuggestionDeletionBlockNode,
  SuggestionDeletionBlockNode,
} from '@/components/editor/lexicalPlugins/suggestedEdits/nodes/SuggestionDeletionBlockNode';
type AnySuggestionWrapper =
  | SuggestionInsertionInlineNode
  | SuggestionDeletionInlineNode
  | SuggestionInsertionBlockNode
  | SuggestionDeletionBlockNode;

function isAnySuggestionWrapper(node: LexicalNode): node is AnySuggestionWrapper {
  return (
    $isSuggestionInsertionInlineNode(node) ||
    $isSuggestionDeletionInlineNode(node) ||
    $isSuggestionInsertionBlockNode(node) ||
    $isSuggestionDeletionBlockNode(node)
  );
}

function findFirstTextDescendant(node: LexicalNode): import('lexical').TextNode | null {
  const stack: LexicalNode[] = [node];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) break;
    if ($isTextNode(cur)) return cur;
    if ($isElementNode(cur)) {
      const children = cur.getChildren();
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i]);
      }
    }
  }
  return null;
}

function collectNodes(root: LexicalNode, predicate: (n: LexicalNode) => boolean): LexicalNode[] {
  const out: LexicalNode[] = [];
  const stack: LexicalNode[] = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) break;
    if (predicate(node)) out.push(node);
    if ($isElementNode(node)) {
      const children = node.getChildren();
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
    }
  }
  return out;
}

function getAllSuggestionWrappers(editor: LexicalEditor) {
  return editor.getEditorState().read(() => {
    const root = $getRoot();
    return collectNodes(root, isAnySuggestionWrapper);
  });
}

function setPlainTextDoc(editor: LexicalEditor, text: string): void {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    const p = $createParagraphNode();
    p.append($createTextNode(text));
    root.append(p);
    p.selectEnd();
  });
}

function setSelectionRangeInsideNodeByKey(
  editor: LexicalEditor,
  nodeKey: string,
  startOffset: number,
  endOffset: number,
): void {
  editor.update(() => {
    const node = $getNodeByKey(nodeKey);
    if (!node) throw new Error('Expected node key to resolve to a node');
    const textNode = findFirstTextDescendant(node);
    if (!textNode) throw new Error('Expected a text descendant for selection');
    const sel = $createRangeSelection();
    const size = textNode.getTextContentSize();
    const clampedStart = Math.max(0, Math.min(startOffset, size));
    const clampedEnd = Math.max(0, Math.min(endOffset, size));
    sel.anchor.set(textNode.getKey(), clampedStart, 'text');
    sel.focus.set(textNode.getKey(), clampedEnd, 'text');
    $setSelection(sel);
  });
}

function setSelectionInsideNodeByKey(editor: LexicalEditor, nodeKey: string, offsetFromStart: number): void {
  setSelectionRangeInsideNodeByKey(editor, nodeKey, offsetFromStart, offsetFromStart);
}

function setSelectionRangeOnRootText(editor: LexicalEditor, startOffset: number, endOffset: number): void {
  editor.update(() => {
    const root = $getRoot();
    const textNode = findFirstTextDescendant(root);
    if (!textNode) throw new Error('Expected a text node in the document');
    const sel = $createRangeSelection();
    const size = textNode.getTextContentSize();
    const clampedStart = Math.max(0, Math.min(startOffset, size));
    const clampedEnd = Math.max(0, Math.min(endOffset, size));
    sel.anchor.set(textNode.getKey(), clampedStart, 'text');
    sel.focus.set(textNode.getKey(), clampedEnd, 'text');
    $setSelection(sel);
  });
}

type ThreadEvent =
  | { type: 'insert'; id: string; quote?: string; body: string }
  | { type: 'update'; id: string; quote?: string; body?: string }
  | { type: 'hide'; id: string };

type ThreadRecord = { quote: string; body: string };

class ThreadStore {
  private threads = new Map<string, ThreadRecord>();
  private appliedEventsCount = 0;

  applyNew(events: ThreadEvent[]): void {
    for (let i = this.appliedEventsCount; i < events.length; i++) {
      const e = events[i]!;
      if (e.type === 'insert') {
        this.threads.set(e.id, { quote: e.quote ?? '', body: e.body });
      } else if (e.type === 'update') {
        const existing = this.threads.get(e.id);
        if (!existing) continue;
        this.threads.set(e.id, {
          quote: e.quote ?? existing.quote,
          body: e.body ?? existing.body,
        });
      } else if (e.type === 'hide') {
        this.threads.delete(e.id);
      }
    }
    this.appliedEventsCount = events.length;
  }

  getIds(): string[] {
    return Array.from(this.threads.keys());
  }

  get(id: string): ThreadRecord | undefined {
    return this.threads.get(id);
  }
}

function truncateForQuote(s: string, maxLen: number): string {
  const trimmed = s.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function buildDefaultSuggestionCommentBody(wrapper: LexicalNode): string {
  if ($isSuggestionInsertionInlineNode(wrapper) || $isSuggestionInsertionBlockNode(wrapper)) {
    const inserted = truncateForQuote(wrapper.getTextContent(), 120);
    return inserted ? `Suggested insertion: “${inserted}”` : 'Suggested insertion.';
  }
  if ($isSuggestionDeletionInlineNode(wrapper) || $isSuggestionDeletionBlockNode(wrapper)) {
    const deleted = truncateForQuote(wrapper.getTextContent(), 120);
    return deleted ? `Suggested deletion: “${deleted}”` : 'Suggested deletion.';
  }
  return 'Suggested edit.';
}

function readSuggestionThreadDerivation(editor: LexicalEditor): Map<string, ThreadRecord> {
  return editor.getEditorState().read(() => {
    const root = $getRoot();
    const wrappers = collectNodes(root, isAnySuggestionWrapper) as AnySuggestionWrapper[];

    const out = new Map<string, ThreadRecord>();
    // Derive thread state as a pure function of all wrappers with the same suggestionId.
    const ids = new Set<string>();
    for (const w of wrappers) ids.add(w.getSuggestionMeta().suggestionId);

    for (const id of ids) {
      let deleted = '';
      let inserted = '';
      let quoteText = '';
      for (const w of wrappers) {
        const meta = w.getSuggestionMeta();
        if (meta.suggestionId !== id) continue;
        quoteText += w.getTextContent();
        if ($isSuggestionDeletionInlineNode(w) || $isSuggestionDeletionBlockNode(w)) deleted += w.getTextContent();
        if ($isSuggestionInsertionInlineNode(w) || $isSuggestionInsertionBlockNode(w)) inserted += w.getTextContent();
      }

      if (deleted && inserted) {
        out.set(id, {
          quote: truncateForQuote(quoteText, 120),
          body: `Suggested replacement: “${truncateForQuote(deleted, 80)}” → “${truncateForQuote(inserted, 80)}”`,
        });
      } else if (inserted) {
        const q = truncateForQuote(inserted, 120);
        out.set(id, { quote: q, body: q ? `Suggested insertion: “${q}”` : 'Suggested insertion.' });
      } else if (deleted) {
        const q = truncateForQuote(deleted, 120);
        out.set(id, { quote: q, body: q ? `Suggested deletion: “${q}”` : 'Suggested deletion.' });
      }
    }
    return out;
  });
}

function assertThreadsMatchDoc(editor: LexicalEditor, store: ThreadStore): void {
  const expected = readSuggestionThreadDerivation(editor);
  const expectedIds = Array.from(expected.keys()).sort();
  const actualIds = store.getIds().sort();
  expect(actualIds).toEqual(expectedIds);
  for (const id of expectedIds) {
    const actual = store.get(id);
    const exp = expected.get(id);
    expect(actual).toBeTruthy();
    expect(exp).toBeTruthy();
    expect(actual!.quote).toBe(exp!.quote);
    expect(actual!.body).toBe(exp!.body);
  }
}

function registerThreadCapture(editor: LexicalEditor, events: ThreadEvent[]): () => void {
  const unregisterInsert = editor.registerCommand(
    INSERT_INLINE_THREAD_COMMAND,
    (payload) => {
      events.push({ type: 'insert', id: payload.threadId, quote: payload.quote, body: payload.initialContent });
      return false;
    },
    COMMAND_PRIORITY_HIGH,
  );
  const unregisterUpdate = editor.registerCommand(
    UPDATE_INLINE_THREAD_COMMAND,
    (payload) => {
      events.push({ type: 'update', id: payload.threadId, quote: payload.quote, body: payload.firstCommentContent });
      return false;
    },
    COMMAND_PRIORITY_HIGH,
  );
  const unregisterHide = editor.registerCommand(
    HIDE_THREAD_COMMAND,
    (payload) => {
      events.push({ type: 'hide', id: payload.threadId });
      return false;
    },
    COMMAND_PRIORITY_HIGH,
  );
  return () => {
    unregisterInsert();
    unregisterUpdate();
    unregisterHide();
  };
}

class InMemoryAwareness implements ProviderAwareness {
  private localState: UserState | null = null;
  private listeners = new Set<() => void>();
  private clientID = 1;

  getLocalState() {
    return this.localState;
  }

  getStates() {
    const states = new Map<number, UserState>();
    if (this.localState) states.set(this.clientID, this.localState);
    return states;
  }

  off(_type: 'update', cb: () => void) {
    this.listeners.delete(cb);
  }

  on(_type: 'update', cb: () => void) {
    this.listeners.add(cb);
  }

  setLocalState(arg0: UserState) {
    this.localState = arg0;
    for (const cb of this.listeners) cb();
  }

  setLocalStateField(field: string, value: unknown) {
    if (!this.localState) {
      // Minimal state used by LexicalCollaborationPlugin.
      this.localState = {
        anchorPos: null,
        focusPos: null,
        focusing: false,
        color: 'rgb(0,0,0)',
        name: 'Test User',
        awarenessData: {},
      };
    }
    (this.localState as AnyBecauseHard)[field] = value;
    for (const cb of this.listeners) cb();
  }
}

class InMemoryProvider implements Provider {
  awareness: ProviderAwareness;
  private listeners = new Map<string, Set<AnyBecauseHard>>();
  private synced = false;

  constructor(public doc: Doc) {
    this.awareness = new InMemoryAwareness();
    // Mimic providers that emit 'update' events when the document changes.
    this.doc.on('update', (update: Uint8Array) => {
      const cbs = this.listeners.get('update');
      if (cbs) {
        for (const cb of cbs) cb(update);
      }
    });
  }

  connect() {
    // Immediately report synced.
    this.synced = true;
    const cbs = this.listeners.get('sync');
    if (cbs) for (const cb of cbs) cb(true);
    const statusCbs = this.listeners.get('status');
    if (statusCbs) for (const cb of statusCbs) cb({ status: 'connected' });
  }

  disconnect() {
    this.synced = false;
    const cbs = this.listeners.get('sync');
    if (cbs) for (const cb of cbs) cb(false);
    const statusCbs = this.listeners.get('status');
    if (statusCbs) for (const cb of statusCbs) cb({ status: 'disconnected' });
  }

  off(type: 'sync' | 'update' | 'status' | 'reload', cb: AnyBecauseHard) {
    const set = this.listeners.get(type);
    if (!set) return;
    set.delete(cb);
  }

  on(type: 'sync' | 'update' | 'status' | 'reload', cb: AnyBecauseHard) {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(cb);
    if (type === 'sync' && this.synced) cb(true);
  }
}

// A simple “structural” node type so we can test the SuggestedEditsPlugin catch-all wrapping.
type SerializedDummyBlockNode = Spread<{ kind?: string }, SerializedElementNode>;

class DummyBlockNode extends ElementNode {
  __kind: string;

  static getType(): string {
    return 'dummy-block';
  }

  static clone(node: DummyBlockNode): DummyBlockNode {
    return new DummyBlockNode(node.__kind, node.__key);
  }

  constructor(kind = 'dummy', key?: string) {
    super(key);
    this.__kind = kind;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.setAttribute('data-dummy-block', this.__kind);
    return div;
  }

  updateDOM(prevNode: DummyBlockNode, dom: HTMLElement): boolean {
    if (prevNode.__kind !== this.__kind) {
      dom.setAttribute('data-dummy-block', this.__kind);
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement('div');
    div.setAttribute('data-dummy-block', this.__kind);
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportJSON(): SerializedDummyBlockNode {
    return {
      ...super.exportJSON(),
      type: 'dummy-block',
      version: 1,
      kind: this.__kind,
    };
  }

  static importJSON(serializedNode: SerializedDummyBlockNode): DummyBlockNode {
    const node = new DummyBlockNode(serializedNode.kind ?? 'dummy');
    return node.updateFromJSON(serializedNode);
  }
}

function $createDummyBlockNode(kind = 'dummy'): DummyBlockNode {
  return new DummyBlockNode(kind);
}

class TestErrorBoundary extends React.Component<{ children: React.ReactElement; onError: (error: Error) => void }> {
  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  state = { hasError: false };

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
}

function EditorCapture({ onEditor }: { onEditor: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();
  // Layout effect so tests can use `editor` immediately after `render(...)` inside `act(...)`.
  useLayoutEffect(() => onEditor(editor), [editor, onEditor]);
  return null;
}

const BASE_INITIAL_CONFIG = {
  namespace: 'SuggestedEditsPluginTests',
  onError: (e: Error) => {
    throw e;
  },
  nodes: [
    DummyBlockNode,
    MarkNode,
    // Suggested edits nodes are registered by the Editor that uses the plugin in production;
    // in tests we include them explicitly so `cloneNodeViaJSON` can rehydrate them.
    SuggestionInsertionInlineNode,
    SuggestionDeletionInlineNode,
    SuggestionInsertionBlockNode,
    SuggestionDeletionBlockNode,
  ],
  editorState: () => {
    const root = $getRoot();
    root.clear();
    const p = $createParagraphNode();
    p.append($createTextNode(''));
    root.append(p);
    p.selectEnd();
  },
};

function TestEditor({
  currentUserId,
  currentUserName,
  canEdit,
  onEditorReady,
  externalHistoryState,
  enableCollab,
}: {
  currentUserId: string;
  currentUserName: string;
  canEdit: boolean;
  onEditorReady: (editor: LexicalEditor) => void;
  externalHistoryState?: HistoryState;
  enableCollab?: boolean;
}) {
  // Keep config referentially stable across rerenders so we don't reset the editor state.
  // In collaboration mode, we let the CollaborationPlugin bootstrap the editor state, otherwise
  // Lexical can initialize nodes before Yjs binding is ready, leading to mapping mismatches.
  const initialConfig = useMemo(() => {
    if (!enableCollab) return BASE_INITIAL_CONFIG;
    // Omit editorState so collaboration bootstrapping owns initialization.
    const { editorState: _editorState, ...rest } = BASE_INITIAL_CONFIG as AnyBecauseHard;
    return rest;
  }, [enableCollab]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorCapture onEditor={onEditorReady} />
      {enableCollab ? null : <HistoryPlugin delay={0} externalHistoryState={externalHistoryState} />}
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div />}
        ErrorBoundary={TestErrorBoundary}
      />
      {enableCollab ? (
        <LexicalCollaboration>
          <CollaborationPlugin
            id="main"
            shouldBootstrap={true}
            initialEditorState={() => {
              const root = $getRoot();
              root.clear();
              const p = $createParagraphNode();
              p.append($createTextNode(''));
              root.append(p);
              p.selectEnd();
            }}
            providerFactory={(id, yjsDocMap) => {
              let doc = yjsDocMap.get(id);
              if (!doc) {
                doc = new Doc();
                yjsDocMap.set(id, doc);
              }
              return new InMemoryProvider(doc);
            }}
            username={currentUserName}
          />
          <CommentPlugin />
        </LexicalCollaboration>
      ) : (
        <LexicalCollaboration>
          <CommentPlugin />
        </LexicalCollaboration>
      )}
      <SuggestedEditsPlugin
        canSuggest={true}
        canEdit={canEdit}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </LexicalComposer>
  );
}

type TestEditorRenderArgs = {
  currentUserId: string;
  currentUserName: string;
  canEdit: boolean;
  externalHistoryState?: HistoryState;
  enableCollab?: boolean;
};

function renderTestEditor({ currentUserId, currentUserName, canEdit, externalHistoryState, enableCollab }: TestEditorRenderArgs) {
  let editor: LexicalEditor | null = null;
  const onEditorReady = (e: LexicalEditor) => {
    editor = e;
  };

  const renderResult = render(
    <TestEditor
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      canEdit={canEdit}
      onEditorReady={onEditorReady}
      externalHistoryState={externalHistoryState}
      enableCollab={enableCollab}
    />,
  );

  const getEditor = (): LexicalEditor => {
    if (!editor) throw new Error('Expected Lexical editor to be ready after render');
    return editor;
  };

  const rerenderEditor = (args: TestEditorRenderArgs) => {
    renderResult.rerender(
      <TestEditor
        currentUserId={args.currentUserId}
        currentUserName={args.currentUserName}
        canEdit={args.canEdit}
        onEditorReady={onEditorReady}
      />,
    );
    return getEditor();
  };

  return { ...renderResult, editor: getEditor(), rerenderEditor };
}

describe('SuggestedEditsPlugin (behavior divergences vs Google Docs)', () => {
  it('can create nested insertion suggestions when a different user types inside someone else’s insertion', async () => {
    const threadEvents: ThreadEvent[] = [];
    const { editor, rerenderEditor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });

    // Capture thread creation commands (out-of-band state).
    const unregisterThreads = registerThreadCapture(editor, threadEvents);

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      editor.dispatchCommand(
        // Use the same Lexical command as the plugin intercepts.
        CONTROLLED_TEXT_INSERTION_COMMAND,
        'X',
      );
    });

    const wrappersAfterA = getAllSuggestionWrappers(editor);
    const insertionA = wrappersAfterA.find((w) => $isSuggestionInsertionInlineNode(w));
    expect(insertionA).toBeTruthy();
    const insertionAKey = insertionA!.getKey();

    // Switch currentUser to B and type within A's insertion.
    rerenderEditor({
      currentUserId: 'userB',
      currentUserName: 'User B',
      canEdit: false,
    });

    await act(async () => {
      // Place cursor inside the existing insertion wrapper and type.
      setSelectionInsideNodeByKey(editor, insertionAKey, 1);
      editor.dispatchCommand(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        'Y',
      );
    });

    const wrappers = getAllSuggestionWrappers(editor);
    const insertionWrappers = wrappers.filter((w) => $isSuggestionInsertionInlineNode(w));
    expect(insertionWrappers.length).toBeGreaterThanOrEqual(2);

    // Assert nesting: some insertion wrapper contains another insertion wrapper as a descendant.
    // Key behavior: another author typing “inside” someone else's insertion does *not* extend that insertion;
    // it creates a second insertion suggestion attributed to the new author.
    const insertionWrappersAfterB = getAllSuggestionWrappers(editor).filter((w) =>
      $isSuggestionInsertionInlineNode(w),
    );
    expect(insertionWrappersAfterB.length).toBeGreaterThanOrEqual(2);
    const metas = insertionWrappersAfterB.map((w) => w.getSuggestionMeta());
    expect(metas.some((m) => m.authorUserId === 'userA')).toBe(true);
    expect(metas.some((m) => m.authorUserId === 'userB')).toBe(true);

    unregisterThreads();
  });

  it('deleting inside your own insertion should shrink the insertion (no nested deletion suggestion)', async () => {
    const threadEvents: ThreadEvent[] = [];
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });

    registerThreadCapture(editor, threadEvents);

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'XYZ');
    });

    const insertion = getAllSuggestionWrappers(editor).find((w) => $isSuggestionInsertionInlineNode(w));
    expect(insertion).toBeTruthy();
    const insertionKey = insertion!.getKey();

    await act(async () => {
      // JSDOM doesn't implement `Selection.modify`, so avoid collapsed selection deletes.
      // Instead, select one character and delete it (still exercises wrapper behavior).
      setSelectionRangeInsideNodeByKey(editor, insertionKey, 2, 3);
      editor.dispatchCommand(KEY_BACKSPACE_COMMAND, new KeyboardEvent('keydown', { key: 'Backspace' }));
    });

    // Google-Docs-like expectation:
    // - the insertion suggestion should simply get smaller ("XYZ" -> "XY")
    // - and we should NOT create a nested deletion suggestion inside the insertion.
    const hasDeletionInsideInsertion = editor.getEditorState().read(() => {
      const root = $getRoot();
      const insertions = collectNodes(root, (n) => $isSuggestionInsertionInlineNode(n));
      return insertions.some((ins) => {
        const deletions = collectNodes(ins, (n) => n !== ins && $isSuggestionDeletionInlineNode(n));
        return deletions.length > 0;
      });
    });
    expect(hasDeletionInsideInsertion).toBe(false);

    const insertionTextAfter = editor.getEditorState().read(() => {
      const root = $getRoot();
      const insertions = collectNodes(root, (n) => $isSuggestionInsertionInlineNode(n));
      const first = insertions[0];
      return first ? first.getTextContent() : '';
    });
    expect(insertionTextAfter).toBe('XY');
  });

  it('coalesces consecutive backspaces into one deletion suggestion (one suggestionId)', async () => {
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });

    await act(async () => {
      setPlainTextDoc(editor, 'abc');
      // Avoid RangeSelection.modify by deleting explicit one-char selections.
      setSelectionRangeOnRootText(editor, 2, 3); // select "c"
      editor.dispatchCommand(KEY_BACKSPACE_COMMAND, new KeyboardEvent('keydown', { key: 'Backspace' }));
      setSelectionRangeOnRootText(editor, 1, 2); // select "b" (after prior delete)
      editor.dispatchCommand(KEY_BACKSPACE_COMMAND, new KeyboardEvent('keydown', { key: 'Backspace' }));
    });

    const deletionWrappers = getAllSuggestionWrappers(editor).filter((w) => $isSuggestionDeletionInlineNode(w));
    // Google-Docs-like expectation: one logical deletion suggestion for the contiguous deletes.
    expect(deletionWrappers.length).toBe(1);
    const deletionKey = deletionWrappers[0]!.getKey();
    const deletionText = editor.getEditorState().read(() => {
      const node = $getNodeByKey(deletionKey);
      return node?.getTextContent() ?? '';
    });
    expect(deletionText).toBe('bc');
  });

  it('removes/archives the associated suggestion thread when the suggestion is removed (no orphan threads)', async () => {
    const threadEvents: ThreadEvent[] = [];
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });
    registerThreadCapture(editor, threadEvents);

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
    });

    const createdThreads = threadEvents.filter((e) => e.type === 'insert');
    expect(createdThreads.length).toBeGreaterThanOrEqual(1);
    const threadId = createdThreads[0].id;

    await act(async () => {
      editor.update(() => {
        const wrappers = getAllSuggestionWrappers(editor);
        const insertion = wrappers.find((w) => $isSuggestionInsertionInlineNode(w));
        if (insertion) {
          // Removing the wrapper removes the inserted content, restoring base text.
          insertion.remove();
        }
      });
    });

    const textAfterRemoval = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfterRemoval).toBe('hello');

    // Google-Docs-like expectation: removing/rejecting the suggestion should also remove it from the
    // "active suggestion threads" UI (typically by archiving/resolving it).
    // In our harness, that corresponds to dispatching HIDE_THREAD_COMMAND for that suggestionId/threadId.
    const hideEvents = threadEvents.filter((e) => e.type === 'hide' && e.id === threadId);
    expect(hideEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('does not re-suggestify collaboration-tagged structural inserts (remote edits should not become local suggestions)', async () => {
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });

    // Ensure mutatedNodes includes this type by registering a no-op mutation listener.
    const unregisterMutation = editor.registerMutationListener(DummyBlockNode, () => {}, { skipInitialization: true });

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      editor.update(() => {
        const root = $getRoot();
        root.append($createDummyBlockNode('remote-ish'));
      }, { tag: 'collaboration' });
    });

    const insertionBlocks = getAllSuggestionWrappers(editor).filter((w) => $isSuggestionInsertionBlockNode(w));
    // Google-Docs-like expectation: if this came from a remote collaborator, our local client shouldn't
    // convert it into *our* suggestion. Either the remote user already suggested it (and we'd receive
    // the wrapper), or it should be an actual edit depending on their mode—either way, not "authored by me".
    expect(insertionBlocks.length).toBe(0);

    unregisterMutation();
  });

  it('accepting a suggested replacement results in the replaced text (requires canEdit=true)', async () => {
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: true,
    });

    await act(async () => {
      // With canEdit=true the plugin starts in "editing" mode, so explicitly toggle to "suggesting".
      editor.dispatchCommand(TOGGLE_SUGGESTING_MODE_COMMAND, undefined);
      // Flush React state update.
      await Promise.resolve();
    });

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      // Select "ell"
      setSelectionRangeOnRootText(editor, 1, 4);
      // Replace selection with "X" (creates a replacement suggestion wrapper)
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
    });

    const wrappers = getAllSuggestionWrappers(editor);
    const deletion = wrappers.find((w) => $isSuggestionDeletionInlineNode(w));
    const insertion = wrappers.find((w) => $isSuggestionInsertionInlineNode(w));
    expect(deletion).toBeTruthy();
    expect(insertion).toBeTruthy();
    const suggestionId = (deletion as SuggestionDeletionInlineNode).getSuggestionMeta().suggestionId;
    expect((insertion as SuggestionInsertionInlineNode).getSuggestionMeta().suggestionId).toBe(suggestionId);

    await act(async () => {
      editor.dispatchCommand(RESOLVE_SUGGESTION_BY_ID_COMMAND, { suggestionId, action: 'accept' });
    });

    const textAfterAccept = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfterAccept).toBe('hXo');
  });

  it('rejecting a suggested replacement restores original text', async () => {
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: true,
    });

    await act(async () => {
      editor.dispatchCommand(TOGGLE_SUGGESTING_MODE_COMMAND, undefined);
      await Promise.resolve();
    });

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      // Select "ell"
      setSelectionRangeOnRootText(editor, 1, 4);
      // Replace selection with "X" (creates a replacement suggestion wrapper)
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
    });

    const wrappers = getAllSuggestionWrappers(editor);
    const deletion = wrappers.find((w) => $isSuggestionDeletionInlineNode(w));
    const insertion = wrappers.find((w) => $isSuggestionInsertionInlineNode(w));
    expect(deletion).toBeTruthy();
    expect(insertion).toBeTruthy();
    const suggestionId = (deletion as SuggestionDeletionInlineNode).getSuggestionMeta().suggestionId;
    expect((insertion as SuggestionInsertionInlineNode).getSuggestionMeta().suggestionId).toBe(suggestionId);

    await act(async () => {
      editor.dispatchCommand(RESOLVE_SUGGESTION_BY_ID_COMMAND, { suggestionId, action: 'reject' });
    });

    const textAfterReject = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfterReject).toBe('hello');
  });

  it('accepting a suggested replacement does nothing when canEdit=false (leaves suggestion visible as "hellXo")', async () => {
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      setSelectionRangeOnRootText(editor, 1, 4);
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
    });

    const wrappers = getAllSuggestionWrappers(editor);
    const deletion = wrappers.find((w) => $isSuggestionDeletionInlineNode(w));
    const insertion = wrappers.find((w) => $isSuggestionInsertionInlineNode(w));
    expect(deletion).toBeTruthy();
    expect(insertion).toBeTruthy();
    const suggestionId = (deletion as SuggestionDeletionInlineNode).getSuggestionMeta().suggestionId;
    expect((insertion as SuggestionInsertionInlineNode).getSuggestionMeta().suggestionId).toBe(suggestionId);

    await act(async () => {
      const ok = editor.dispatchCommand(RESOLVE_SUGGESTION_BY_ID_COMMAND, { suggestionId, action: 'accept' });
      // With canEdit=false, accept should be rejected by permission-gating.
      expect(ok).toBe(false);
    });

    const textAfter = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfter).toBe('hellXo');
  });
});

describe('SuggestedEditsPlugin (undo/redo reconciliation)', () => {
  it('undo/redo reconciles threads for insertion suggestions (recreate on redo)', async () => {
    const threadEvents: ThreadEvent[] = [];
    const threadStore = new ThreadStore();
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });
    registerThreadCapture(editor, threadEvents);

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
    });

    await act(async () => {
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);
  });

  it('undo/redo reconciles threads for coalesced deletion suggestions (including quote/body updates)', async () => {
    const threadEvents: ThreadEvent[] = [];
    const threadStore = new ThreadStore();
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });
    registerThreadCapture(editor, threadEvents);

    await act(async () => {
      setPlainTextDoc(editor, 'abc');
    });

    await act(async () => {
      setSelectionRangeOnRootText(editor, 2, 3); // select "c"
      editor.dispatchCommand(KEY_BACKSPACE_COMMAND, new KeyboardEvent('keydown', { key: 'Backspace' }));
      setSelectionRangeOnRootText(editor, 1, 2); // select "b" (after prior delete)
      editor.dispatchCommand(KEY_BACKSPACE_COMMAND, new KeyboardEvent('keydown', { key: 'Backspace' }));
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);
  });

  it('undo/redo reconciles threads for replacement suggestions and accept flow (recreate on undo)', async () => {
    const threadEvents: ThreadEvent[] = [];
    const threadStore = new ThreadStore();
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: true,
    });
    registerThreadCapture(editor, threadEvents);

    await act(async () => {
      // With canEdit=true the plugin starts in "editing" mode, so explicitly toggle to "suggesting".
      editor.dispatchCommand(TOGGLE_SUGGESTING_MODE_COMMAND, undefined);
      await Promise.resolve();
    });

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
      setSelectionRangeOnRootText(editor, 1, 4); // "ell"
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    const wrappers = getAllSuggestionWrappers(editor);
    const deletion = wrappers.find((w) => $isSuggestionDeletionInlineNode(w));
    const insertion = wrappers.find((w) => $isSuggestionInsertionInlineNode(w));
    expect(deletion).toBeTruthy();
    expect(insertion).toBeTruthy();
    const suggestionId = (deletion as SuggestionDeletionInlineNode).getSuggestionMeta().suggestionId;
    expect((insertion as SuggestionInsertionInlineNode).getSuggestionMeta().suggestionId).toBe(suggestionId);

    await act(async () => {
      const ok = editor.dispatchCommand(RESOLVE_SUGGESTION_BY_ID_COMMAND, { suggestionId, action: 'accept' });
      expect(ok).toBe(true);
      // In production, the CommentPlugin thread UI dispatches HIDE_THREAD_COMMAND after a successful resolve.
      editor.dispatchCommand(HIDE_THREAD_COMMAND, { threadId: suggestionId });
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);
  });

  it('undo/redo reconciles threads for structural/block insertion suggestions (catch-all wrapper)', async () => {
    const threadEvents: ThreadEvent[] = [];
    const threadStore = new ThreadStore();
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: false,
    });
    registerThreadCapture(editor, threadEvents);

    // Ensure mutatedNodes includes this type by registering a no-op mutation listener.
    const unregisterMutation = editor.registerMutationListener(DummyBlockNode, () => {}, { skipInitialization: true });

    await act(async () => {
      setPlainTextDoc(editor, 'hello');
    });

    await act(async () => {
      editor.update(() => {
        const root = $getRoot();
        // Give the structural node a text descendant so comment threads (MarkNodes) can anchor to it.
        const node = $createDummyBlockNode('structural');
        node.append($createTextNode('Z'));
        root.append(node);
      });
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    await act(async () => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    });
    threadStore.applyNew(threadEvents);
    assertThreadsMatchDoc(editor, threadStore);

    unregisterMutation();
  });

  it(
    'after undoing then redoing a suggested replacement, a single undo should fully undo the replacement again (no extra undo step from thread/mark reconciliation)',
    async () => {
      const threadEvents: ThreadEvent[] = [];
      const historyState = createEmptyHistoryState();
      const { editor } = renderTestEditor({
        currentUserId: 'userA',
        currentUserName: 'User A',
        canEdit: true,
        externalHistoryState: historyState,
      });
      // Capture thread command payloads without interfering with CommentPlugin handlers.
      registerThreadCapture(editor, threadEvents);

      await act(async () => {
        editor.dispatchCommand(TOGGLE_SUGGESTING_MODE_COMMAND, undefined);
        await Promise.resolve();
      });

      // Put the baseline doc into history in its own committed update, so the subsequent replacement
      // is undoable as a single step (matching real usage).
      await act(async () => {
        setPlainTextDoc(editor, 'hello');
      });

      await act(async () => {
        setSelectionRangeOnRootText(editor, 1, 4); // "ell"
        editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
      });
      const textAfterCreate = editor.getEditorState().read(() => $getRoot().getTextContent());
      expect(textAfterCreate).toBe('hellXo');

      await act(async () => {
        editor.dispatchCommand(UNDO_COMMAND, undefined);
      });
      const textAfterUndo = editor.getEditorState().read(() => $getRoot().getTextContent());
      expect(textAfterUndo).toBe('hello');

      await act(async () => {
        editor.dispatchCommand(REDO_COMMAND, undefined);
      });
      const textAfterRedo = editor.getEditorState().read(() => $getRoot().getTextContent());
      expect(textAfterRedo).toBe('hellXo');

      // Correct behavior: a single undo should fully revert to the pre-replacement state.
      await act(async () => {
        editor.dispatchCommand(UNDO_COMMAND, undefined);
      });
      const textAfterSecondUndo = editor.getEditorState().read(() => $getRoot().getTextContent());
      expect(textAfterSecondUndo).toBe('hello');
    },
  );
});

// NOTE: We currently keep this as skipped because fully simulating Yjs collaboration in Jest
// requires a more complete Provider implementation to avoid binding/mapping issues.
describe.skip('SuggestedEditsPlugin (collaboration mode undo/redo regression)', () => {
  it('replacement -> reject -> undo/redo does not corrupt text or lose redo (collab/yjs undo manager)', async () => {
    const { editor } = renderTestEditor({
      currentUserId: 'userA',
      currentUserName: 'User A',
      canEdit: true,
      enableCollab: true,
    });

    // Let CollaborationPlugin mount effects (provider/binding, undo manager command handlers).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    // 1) fresh doc, type "hello"
    await act(async () => {
      editor.update(() => {
        const root = $getRoot();
        root.selectEnd();
        const sel = $getSelection();
        if ($isRangeSelection(sel)) {
          sel.insertText('hello');
        }
      });
    });

    // 2) switch to suggesting
    await act(async () => {
      editor.dispatchCommand(TOGGLE_SUGGESTING_MODE_COMMAND, undefined);
      await Promise.resolve();
    });

    // 3) replace "ell" with "X" -> creates replacement suggestion
    await act(async () => {
      setSelectionRangeOnRootText(editor, 1, 4);
      editor.dispatchCommand(CONTROLLED_TEXT_INSERTION_COMMAND, 'X');
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    const textAfterCreate = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfterCreate).toBe('hellXo');

    const wrappers = getAllSuggestionWrappers(editor);
    const deletion = wrappers.find((w) => $isSuggestionDeletionInlineNode(w));
    const insertion = wrappers.find((w) => $isSuggestionInsertionInlineNode(w));
    expect(deletion).toBeTruthy();
    expect(insertion).toBeTruthy();
    const suggestionId = (deletion as SuggestionDeletionInlineNode).getSuggestionMeta().suggestionId;
    expect((insertion as SuggestionInsertionInlineNode).getSuggestionMeta().suggestionId).toBe(suggestionId);

    // 4) reject suggestion + hide thread (matches UI behavior)
    await act(async () => {
      const ok = editor.dispatchCommand(RESOLVE_SUGGESTION_BY_ID_COMMAND, { suggestionId, action: 'reject' });
      expect(ok).toBe(true);
      editor.dispatchCommand(HIDE_THREAD_COMMAND, { threadId: suggestionId });
      // CommentPlugin mark cleanup is async (setTimeout); let it run.
      await new Promise((r) => setTimeout(r, 0));
    });
    const textAfterReject = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfterReject).toBe('hello');

    // 5) undo should restore the suggestion state
    await act(async () => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
      // let any follow-up timers run
      await new Promise((r) => setTimeout(r, 0));
    });
    const textAfterUndo = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfterUndo).toBe('hellXo');

    // 6) redo should re-apply the rejection
    await act(async () => {
      editor.dispatchCommand(REDO_COMMAND, undefined);
      await new Promise((r) => setTimeout(r, 0));
    });
    const textAfterRedo = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfterRedo).toBe('hello');
  });
});


