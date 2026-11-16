/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, KEY_BACKSPACE_COMMAND, type LexicalEditor } from 'lexical';
import { $createLinkNode, LinkNode } from '@lexical/link';
import { registerRichText } from '@lexical/rich-text';
import { $createMathNode, MathNode } from '@/components/editor/lexicalPlugins/math/MathNode';
import BlockCursorNavigationPlugin from '@/components/editor/lexicalPlugins/blockCursorNavigation/BlockCursorNavigationPlugin';
import { $createSentinelParagraphNode, $isSentinelParagraphNode, SentinelParagraphNode } from '@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode';

jest.mock('@/components/hooks/useStyles', () => ({
  defineStyles: () => ({}),
  useStyles: () => ({}),
}));

let editor: LexicalEditor;

function CaptureEditor() {
  const [lexicalEditor] = useLexicalComposerContext();
  React.useEffect(() => { editor = lexicalEditor; }, [lexicalEditor]);
  return null;
}

function setup() {
  render(<LexicalComposer initialConfig={{
    namespace: 'block-cursor-backspace-test',
    nodes: [MathNode, LinkNode, SentinelParagraphNode],
    onError: error => { throw error; },
  }}>
    <BlockCursorNavigationPlugin />
    <CaptureEditor />
  </LexicalComposer>);
}

async function updateEditor(update: () => void) {
  await act(async () => { editor.update(update, { discrete: true }); });
}

function cursorIsInSentinel(): boolean {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    return $isRangeSelection(selection) && $isSentinelParagraphNode(selection.anchor.getNode());
  });
}

afterEach(cleanup);

describe('Backspace after a display equation', () => {
  it.each(['math', 'formatted text', 'link'])('does not jump out of a paragraph when %s precedes offset zero', async preceding => {
    setup();
    await updateEditor(() => {
      const text = $createTextNode(' after');
      const paragraph = $createParagraphNode();
      const previous = preceding === 'math'
        ? $createMathNode('x')
        : $createTextNode('before').toggleFormat('bold');
      paragraph.append(previous, preceding === 'link' ? $createLinkNode('https://example.com').append(text) : text);
      $getRoot().append($createMathNode('y = 1', false), $createSentinelParagraphNode(), paragraph);
      text.select(0, 0);
    });
    const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
    let handled = false;
    await updateEditor(() => { handled = editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event); });
    expect(handled).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(cursorIsInSentinel()).toBe(false);
  });

  it.each(['text', 'link', 'empty paragraph'])('still moves into the sentinel at the start of %s', async content => {
    setup();
    await updateEditor(() => {
      const paragraph = $createParagraphNode();
      if (content !== 'empty paragraph') {
        const text = $createTextNode('after');
        paragraph.append(content === 'link' ? $createLinkNode('https://example.com').append(text) : text);
      }
      $getRoot().append($createMathNode('y = 1', false), $createSentinelParagraphNode(), paragraph);
      paragraph.selectStart();
    });
    const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
    await updateEditor(() => { editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event); });
    expect(event.defaultPrevented).toBe(true);
    expect(cursorIsInSentinel()).toBe(true);
  });
});

describe('Backspace with the normal rich-text command chain', () => {
  it.each(['text after math', 'link after math', 'last child math'])('deletes inline math for %s without deleting display math', async location => {
    setup();
    const unregister = registerRichText(editor);
    let mathKey = '';
    let displayKey = '';
    let paragraphKey = '';
    await updateEditor(() => {
      const math = $createMathNode('x');
      mathKey = math.getKey();
      const display = $createMathNode('y = 1', false);
      displayKey = display.getKey();
      const paragraph = $createParagraphNode();
      paragraphKey = paragraph.getKey();
      paragraph.append($createTextNode('before'), math);
      $getRoot().append(display, paragraph);
      if (location === 'last child math') {
        paragraph.select(2, 2);
      } else {
        const text = $createTextNode('after');
        paragraph.append(location === 'link after math' ? $createLinkNode('https://example.com').append(text) : text);
        text.select(0, 0);
      }
    });
    const event = new KeyboardEvent('keydown', { key: 'Backspace', cancelable: true });
    await updateEditor(() => { editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event); });
    editor.getEditorState().read(() => {
      expect($getNodeByKey(mathKey)).toBe(null);
      expect($getNodeByKey(displayKey)?.isAttached()).toBe(true);
      expect($getNodeByKey(paragraphKey)?.isAttached()).toBe(true);
    });
    expect(cursorIsInSentinel()).toBe(false);
    unregister();
  });
});
