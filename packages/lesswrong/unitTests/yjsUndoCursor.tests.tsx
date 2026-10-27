/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $isTextNode, HISTORY_PUSH_TAG, PASTE_TAG, REDO_COMMAND, UNDO_COMMAND, type LexicalEditor } from 'lexical';
import { type Provider, type UserState } from '@lexical/yjs';
import { Doc } from 'yjs';
import { $createMathNode, MathNode } from '@/components/editor/lexicalPlugins/math/MathNode';
import YjsUndoCursorPlugin from '@/components/lexical/plugins/YjsUndoCursorPlugin';

jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: () => ({}), useStyles: () => ({}) }));

let editor: LexicalEditor;

function CaptureEditor() {
  const [lexicalEditor] = useLexicalComposerContext();
  React.useEffect(() => { editor = lexicalEditor; }, [lexicalEditor]);
  return null;
}

function createProvider(id: string, docMap: Map<string, Doc>): Provider {
  docMap.set(id, new Doc());
  let localState: UserState | null = null;
  return {
    awareness: {
      getLocalState: () => localState,
      getStates: () => new Map(),
      setLocalState: value => { localState = value; },
      setLocalStateField: () => {}, on: () => {}, off: () => {},
    },
    connect: () => {}, disconnect: () => {}, on: () => {}, off: () => {},
  };
}

function setup() {
  render(<LexicalCollaboration><LexicalComposer initialConfig={{
    namespace: 'yjs-undo-test', nodes: [MathNode], editorState: null,
    onError: error => { throw error; },
  }}>
    <CollaborationPlugin id="main" providerFactory={createProvider} shouldBootstrap={false} />
    <YjsUndoCursorPlugin />
    <CaptureEditor />
  </LexicalComposer></LexicalCollaboration>);
}

async function updateEditor(update: () => void, tag?: string) {
  await act(async () => { editor.update(update, { discrete: true, tag }); });
}

function selectionPosition() {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    return { text: selection.anchor.getNode().getTextContent(), offset: selection.anchor.offset, collapsed: selection.isCollapsed() };
  });
}

afterEach(cleanup);

describe('collaborative paste undo cursor', () => {
  it('preserves the cursor when redo has no history', async () => {
    setup();
    await updateEditor(() => {
      const text = $createTextNode('before after');
      $getRoot().append($createParagraphNode().append(text));
      text.select(7, 7);
    }, HISTORY_PUSH_TAG);
    const before = selectionPosition();
    await act(async () => { editor.dispatchCommand(REDO_COMMAND, undefined); });
    expect(selectionPosition()).toEqual(before);
  });

  it('restores a selection replaced by a paste', async () => {
    setup();
    await updateEditor(() => {
      $getRoot().append($createParagraphNode().append($createTextNode('before selected after')));
    }, HISTORY_PUSH_TAG);
    await updateEditor(() => {
      const text = $getRoot().getFirstDescendant();
      if (!$isTextNode(text)) throw new Error('Missing text');
      text.select(7, 15);
    });
    await updateEditor(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) throw new Error('Missing selection');
      selection.insertNodes([$createTextNode('replacement')]);
    }, PASTE_TAG);
    await act(async () => { editor.dispatchCommand(UNDO_COMMAND, undefined); });
    expect(editor.getEditorState().read(() => $getSelection()?.getTextContent())).toBe('selected');
    expect(selectionPosition()).toEqual({text: 'before selected after', offset: 7, collapsed: false});
  });

  it.each(['text', 'math after cursor', 'pasted math', 'multiple paragraphs'])('restores the insertion point when undoing a paste of %s', async scenario => {
    setup();
    await updateEditor(() => {
      const paragraph = $createParagraphNode().append($createTextNode('before after'));
      if (scenario === 'math after cursor') paragraph.append($createMathNode('x'), $createTextNode(' end'));
      $getRoot().append(paragraph);
    }, HISTORY_PUSH_TAG);
    await updateEditor(() => {
      const text = $getRoot().getFirstDescendant();
      if (!$isTextNode(text)) throw new Error('Missing text');
      text.select(7, 7);
    });
    await updateEditor(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) throw new Error('Missing selection');
      selection.insertNodes(scenario === 'pasted math'
        ? [$createTextNode('pasted '), $createMathNode('z'), $createTextNode(' text')]
        : scenario === 'multiple paragraphs'
          ? [$createParagraphNode().append($createTextNode('first')), $createParagraphNode().append($createTextNode('second'))]
          : [$createTextNode('pasted')]);
    }, PASTE_TAG);
    const afterPaste = selectionPosition();
    await act(async () => { editor.dispatchCommand(UNDO_COMMAND, undefined); });
    expect(selectionPosition()).toEqual({text: 'before after', offset: 7, collapsed: true});
    await act(async () => { editor.dispatchCommand(REDO_COMMAND, undefined); });
    if (scenario === 'text' || scenario === 'math after cursor') {
      expect(selectionPosition()).toEqual(afterPaste);
    }
    await act(async () => { editor.dispatchCommand(UNDO_COMMAND, undefined); });
    expect(selectionPosition()).toEqual({text: 'before after', offset: 7, collapsed: true});
  });
});
