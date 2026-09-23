/** @jest-environment jsdom */
import { $createParagraphNode, $createTextNode, $getRoot, createEditor, type LexicalEditor } from 'lexical';
import { $getMathEditorAnchor } from '@/components/editor/lexicalPlugins/math/mathEditorAnchor';

function updateEditor(editor: LexicalEditor, update: () => void): Promise<void> {
  return new Promise(resolve => editor.update(update, { onUpdate: resolve }));
}

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left, y: top, left, top, width, height,
    right: left + width, bottom: top + height,
    toJSON: () => ({}),
  };
}

describe('math editor anchor', () => {
  let editor: LexicalEditor;
  let root: HTMLDivElement;
  const getRangeRect = jest.fn<DOMRect, []>();

  beforeEach(() => {
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: getRangeRect });
    getRangeRect.mockReturnValue(makeRect(40, 100, 0, 20));
    root = document.createElement('div');
    document.body.append(root);
    editor = createEditor();
    editor.setRootElement(root);
  });

  afterEach(() => {
    editor.setRootElement(null);
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('anchors to the Lexical insertion point even when the browser selection is in the menu', async () => {
    await updateEditor(editor, () => {
      const text = $createTextNode('Some text');
      $getRoot().append($createParagraphNode().append(text));
      text.selectEnd();
    });
    const menu = document.createElement('div');
    menu.textContent = 'Inline Equation';
    document.body.append(menu);
    const range = document.createRange();
    range.selectNodeContents(menu);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const anchor = editor.getEditorState().read(() => $getMathEditorAnchor(editor));
    expect(anchor?.contextElement?.textContent).toBe('Some text');
    expect(root.contains(anchor?.contextElement ?? null)).toBe(true);
    expect(anchor?.getBoundingClientRect()).toMatchObject({ left: 40, top: 100, width: 0, height: 20 });
  });

  it('falls back to the empty paragraph after removing slash text, not the whole editor', async () => {
    await updateEditor(editor, () => {
      const text = $createTextNode('/inline');
      $getRoot().append($createParagraphNode().append(text), $createParagraphNode().append($createTextNode('Later content')));
      text.selectEnd();
      text.remove();
    });
    const paragraph = root.querySelector('p');
    if (!paragraph) throw new Error('Missing paragraph');
    getRangeRect.mockReturnValue(makeRect(0, 0, 0, 0));
    jest.spyOn(paragraph, 'getBoundingClientRect').mockReturnValue(makeRect(8, 100, 300, 28));
    jest.spyOn(root, 'getBoundingClientRect').mockReturnValue(makeRect(8, 100, 300, 1000));

    const anchor = editor.getEditorState().read(() => $getMathEditorAnchor(editor));
    expect(anchor?.contextElement).toBe(paragraph);
    expect(anchor?.getBoundingClientRect().bottom).toBe(128);
  });

  it('remeasures the insertion point when scrolling or layout changes', async () => {
    await updateEditor(editor, () => {
      const text = $createTextNode('Some text');
      $getRoot().append($createParagraphNode().append(text));
      text.selectEnd();
    });
    const anchor = editor.getEditorState().read(() => $getMathEditorAnchor(editor));
    expect(anchor?.getBoundingClientRect().top).toBe(100);
    getRangeRect.mockReturnValue(makeRect(40, 60, 0, 20));
    expect(anchor?.getBoundingClientRect().top).toBe(60);
  });
});
