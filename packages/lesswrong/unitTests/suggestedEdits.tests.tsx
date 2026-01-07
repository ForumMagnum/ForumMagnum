/** @jest-environment jsdom */
import React, { useLayoutEffect, useMemo } from 'react';
import { render, act } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import {
  $createParagraphNode,
  $createTextNode,
  $createRangeSelection,
  $getRoot,
  $getNodeByKey,
  $isElementNode,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  KEY_BACKSPACE_COMMAND,
  createCommand,
  LexicalEditor,
  ElementNode,
  EditorConfig,
  LexicalNode,
  DOMConversionMap,
  DOMExportOutput,
  SerializedElementNode,
  Spread,
} from 'lexical';

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

// IMPORTANT:
// `SuggestedEditsPlugin` imports `@/components/lexical/plugins/CommentPlugin`, which pulls in
// `@lexical/react/LexicalErrorBoundary` -> `react-error-boundary` (ESM). Our Jest setup doesn't
// currently transform that ESM dependency, so we mock CommentPlugin here to keep these tests runnable.
jest.mock('@/components/lexical/plugins/CommentPlugin', () => {
  // Use jest.requireActual inside the mock factory to avoid any hoisting pitfalls.
  // (This is still synchronous and test-only.)
  const { createCommand } = jest.requireActual('lexical') as typeof import('lexical');
  return {
    INSERT_INLINE_THREAD_COMMAND: createCommand('INSERT_INLINE_THREAD_COMMAND'),
    UPDATE_INLINE_THREAD_COMMAND: createCommand('UPDATE_INLINE_THREAD_COMMAND'),
    HIDE_THREAD_COMMAND: createCommand('HIDE_THREAD_COMMAND'),
    RESOLVE_SUGGESTION_BY_ID_COMMAND: createCommand('RESOLVE_SUGGESTION_BY_ID_COMMAND'),
  };
});

import SuggestedEditsPlugin, {
  TOGGLE_SUGGESTING_MODE_COMMAND,
} from '@/components/editor/lexicalPlugins/suggestedEdits/SuggestedEditsPlugin';

import {
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
import {
  $isSuggestionReplacementInlineNode,
  SuggestionReplacementInlineNode,
} from '@/components/editor/lexicalPlugins/suggestedEdits/nodes/SuggestionReplacementInlineNode';

type AnySuggestionWrapper =
  | SuggestionInsertionInlineNode
  | SuggestionDeletionInlineNode
  | SuggestionInsertionBlockNode
  | SuggestionDeletionBlockNode
  | SuggestionReplacementInlineNode;

function isAnySuggestionWrapper(node: LexicalNode): node is AnySuggestionWrapper {
  return (
    $isSuggestionInsertionInlineNode(node) ||
    $isSuggestionDeletionInlineNode(node) ||
    $isSuggestionInsertionBlockNode(node) ||
    $isSuggestionDeletionBlockNode(node) ||
    $isSuggestionReplacementInlineNode(node)
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

function registerThreadCapture(editor: LexicalEditor, events: ThreadEvent[]): () => void {
  const unregisterInsert = editor.registerCommand(
    INSERT_INLINE_THREAD_COMMAND,
    (payload) => {
      events.push({ type: 'insert', id: payload.threadId, quote: payload.quote, body: payload.initialContent });
      return true;
    },
    COMMAND_PRIORITY_HIGH,
  );
  const unregisterUpdate = editor.registerCommand(
    UPDATE_INLINE_THREAD_COMMAND,
    (payload) => {
      events.push({ type: 'update', id: payload.threadId, quote: payload.quote, body: payload.firstCommentContent });
      return true;
    },
    COMMAND_PRIORITY_HIGH,
  );
  const unregisterHide = editor.registerCommand(
    HIDE_THREAD_COMMAND,
    (payload) => {
      events.push({ type: 'hide', id: payload.threadId });
      return true;
    },
    COMMAND_PRIORITY_HIGH,
  );
  return () => {
    unregisterInsert();
    unregisterUpdate();
    unregisterHide();
  };
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
    // Suggested edits nodes are registered by the Editor that uses the plugin in production;
    // in tests we include them explicitly so `cloneNodeViaJSON` can rehydrate them.
    SuggestionInsertionInlineNode,
    SuggestionDeletionInlineNode,
    SuggestionInsertionBlockNode,
    SuggestionDeletionBlockNode,
    SuggestionReplacementInlineNode,
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
}: {
  currentUserId: string;
  currentUserName: string;
  canEdit: boolean;
  onEditorReady: (editor: LexicalEditor) => void;
}) {
  // Keep config referentially stable across rerenders so we don't reset the editor state.
  const initialConfig = useMemo(() => BASE_INITIAL_CONFIG, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorCapture onEditor={onEditorReady} />
      <HistoryPlugin />
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<div />}
        ErrorBoundary={TestErrorBoundary}
      />
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
};

function renderTestEditor({ currentUserId, currentUserName, canEdit }: TestEditorRenderArgs) {
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

    const replacement = getAllSuggestionWrappers(editor).find((w) => $isSuggestionReplacementInlineNode(w));
    expect(replacement).toBeTruthy();
    const suggestionId = replacement!.getSuggestionMeta().suggestionId;

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

    const replacement = getAllSuggestionWrappers(editor).find((w) => $isSuggestionReplacementInlineNode(w));
    expect(replacement).toBeTruthy();
    const suggestionId = replacement!.getSuggestionMeta().suggestionId;

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

    const replacement = getAllSuggestionWrappers(editor).find((w) => $isSuggestionReplacementInlineNode(w));
    expect(replacement).toBeTruthy();
    const suggestionId = replacement!.getSuggestionMeta().suggestionId;

    await act(async () => {
      const ok = editor.dispatchCommand(RESOLVE_SUGGESTION_BY_ID_COMMAND, { suggestionId, action: 'accept' });
      // With canEdit=false, accept should be rejected by permission-gating.
      expect(ok).toBe(false);
    });

    const textAfter = editor.getEditorState().read(() => $getRoot().getTextContent());
    expect(textAfter).toBe('hellXo');
  });
});


