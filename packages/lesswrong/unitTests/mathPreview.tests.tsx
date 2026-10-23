/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $isTextNode, UNDO_COMMAND, type LexicalEditor } from 'lexical';
import { MathPlugin, OPEN_MATH_EDITOR_COMMAND } from '@/components/editor/lexicalPlugins/math/MathPlugin';
import { MathNode, $createMathNode } from '@/components/editor/lexicalPlugins/math/MathNode';
import { MathComponent } from '@/components/editor/lexicalPlugins/math/MathComponent';
import * as mathJax from '@/components/editor/lexicalPlugins/math/loadMathJax';

jest.mock('@/components/hooks/useStyles', () => ({
  defineStyles: () => ({}),
  useStyles: () => ({}),
}));

jest.mock('@/components/editor/lexicalPlugins/math/loadMathJax', () => ({
  __esModule: true,
  loadMathJax: jest.fn(),
  renderEquation: jest.fn(async (equation: string, element: HTMLElement) => {
    element.textContent = equation;
  }),
}));

jest.mock('@/components/editor/lexicalPlugins/math/MathEditorPanel', () => ({
  __esModule: true,
  default: function Panel({ isOpen, initialEquation, onChange, onSubmit, onCancel }: {
    isOpen: boolean;
    initialEquation: string;
    onChange: (equation: string) => void;
    onSubmit: (equation: string) => void;
    onCancel: () => void;
  }) {
    const [equation, setEquation] = React.useState(initialEquation);
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => setEquation(initialEquation), [isOpen, initialEquation]);
    React.useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);
    if (!isOpen) return null;
    return <div>
      <input ref={inputRef} aria-label="Equation" value={equation} onChange={event => {
        setEquation(event.target.value);
        onChange(event.target.value);
      }} />
      <button onClick={() => onSubmit(equation)}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>;
  },
}));

let editor: LexicalEditor;

function CaptureEditor() {
  const [lexicalEditor] = useLexicalComposerContext();
  React.useEffect(() => { editor = lexicalEditor; }, [lexicalEditor]);
  return null;
}

function setup(initialState: () => void) {
  return render(<LexicalComposer initialConfig={{
    namespace: 'math-preview-test', nodes: [MathNode], editorState: initialState,
    onError: error => { throw error; },
  }}>
    <RichTextPlugin contentEditable={<ContentEditable aria-label="Document" tabIndex={0} />} ErrorBoundary={LexicalErrorBoundary} />
    <HistoryPlugin />
    <MathPlugin />
    <CaptureEditor />
  </LexicalComposer>);
}

async function updateEditor(update: () => void) {
  await act(async () => {
    await new Promise<void>(resolve => editor.update(update, { onUpdate: resolve }));
  });
}

function documentElement() {
  return screen.getByRole('textbox', { name: 'Document' });
}

function previewElement() {
  const preview = documentElement().querySelector('.math-preview');
  if (!preview) throw new Error('Missing in-document preview');
  return preview;
}

async function changeEquation(equation: string) {
  await act(async () => fireEvent.change(screen.getByLabelText('Equation'), { target: { value: equation } }));
  await waitFor(() => expect(previewElement().textContent).toBe(equation));
}

beforeAll(() => {
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true, value: () => document.createElement('span').getBoundingClientRect(),
  });
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('in-place equation preview', () => {
  it('updates an existing equation in its paragraph and restores it on cancel', async () => {
    setup(() => $getRoot().append($createParagraphNode().append(
      $createTextNode('Before '), $createMathNode('x^2'), $createTextNode(' after'),
    )));
    await waitFor(() => expect(previewElement().textContent).toBe('x^2'));
    await act(async () => fireEvent.click(previewElement()));
    await changeEquation('x^3');
    expect(documentElement().textContent).toBe('Before x^3 after');
    await act(async () => fireEvent.click(screen.getByText('Cancel')));
    await waitFor(() => expect(documentElement().textContent).toBe('Before x^2 after'));
  });

  it.each([true, false])('previews a new equation in the document (inline: %s), then cancels it', async inline => {
    setup(() => $getRoot().append($createParagraphNode(), $createParagraphNode().append($createTextNode('Following'))));
    const before = editor.getEditorState().toJSON();
    await updateEditor(() => {
      $getRoot().getFirstChildOrThrow().selectStart();
      editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline });
    });
    expect(previewElement().textContent).toBe(inline ? '' : 'Equation');
    await changeEquation('a+b');
    expect(previewElement().classList.contains(inline ? 'math-inline' : 'math-display')).toBe(true);
    expect(documentElement().textContent).toBe('a+bFollowing');
    expect(document.querySelectorAll('.math-preview')).toHaveLength(1);
    await act(async () => fireEvent.click(screen.getByText('Cancel')));
    expect(documentElement().querySelector('.math-preview')).toBeNull();
    expect(documentElement().textContent).toBe('Following');
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it('commits without duplicating the preview and undoes the whole insertion in one step', async () => {
    setup(() => $getRoot().append($createParagraphNode().append($createTextNode('Before '))));
    await updateEditor(() => { $getRoot().getFirstChildOrThrow().selectEnd(); });
    await updateEditor(() => { editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: true }); });
    await changeEquation('x');
    await changeEquation('x^2');
    await act(async () => fireEvent.click(screen.getByText('Submit')));
    expect(documentElement().querySelectorAll('.math-preview')).toHaveLength(1);
    await act(async () => { editor.dispatchCommand(UNDO_COMMAND, undefined); });
    expect(documentElement().textContent).toBe('Before ');
  });

  it.each([true, false])('restores selected text and formatting on cancel (inline: %s)', async inline => {
    setup(() => $getRoot().append($createParagraphNode().append($createTextNode('Before selected after').toggleFormat('bold'))));
    const before = editor.getEditorState().toJSON();
    await updateEditor(() => {
      const text = $getRoot().getFirstDescendant();
      if (!$isTextNode(text)) throw new Error('Missing text');
      text.select(7, 15);
      editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline });
    });
    await changeEquation('x');
    await act(async () => fireEvent.click(screen.getByText('Cancel')));
    expect(documentElement().textContent).toBe('Before selected after');
    expect(documentElement().querySelector('strong')?.textContent).toBe('Before selected after');
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it('restores the sole empty paragraph on cancel', async () => {
    setup(() => $getRoot().append($createParagraphNode()));
    const before = editor.getEditorState().toJSON();
    await updateEditor(() => {
      $getRoot().getFirstChildOrThrow().selectStart();
      editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: false });
    });
    await changeEquation('x');
    await act(async () => fireEvent.click(screen.getByText('Cancel')));
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it('keeps focus in the display equation input when later document updates reconcile', async () => {
    setup(() => $getRoot().append($createParagraphNode()));
    await updateEditor(() => {
      $getRoot().getFirstChildOrThrow().selectStart();
      editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: false });
    });
    expect(document.activeElement).toBe(screen.getByLabelText('Equation'));
    await updateEditor(() => { $getRoot().append($createParagraphNode()); });
    expect(document.activeElement).toBe(screen.getByLabelText('Equation'));
    await changeEquation('x^2');
    await act(async () => fireEvent.click(screen.getByText('Submit')));
    expect(editor.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) && selection.isCollapsed();
    })).toBe(true);
  });

  it.each([0, 7, 12])('restores paragraph structure when canceling display math at offset %s', async offset => {
    setup(() => $getRoot().append($createParagraphNode().append($createTextNode('Before after'))));
    const before = editor.getEditorState().toJSON();
    await updateEditor(() => {
      const text = $getRoot().getFirstDescendant();
      if (!$isTextNode(text)) throw new Error('Missing text');
      text.select(offset, offset);
      editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: false });
    });
    await changeEquation('x');
    await act(async () => fireEvent.click(screen.getByText('Cancel')));
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it('does not let a slow render replace a newer preview', async () => {
    let completeOldRender = () => {};
    jest.spyOn(mathJax, 'renderEquation').mockImplementationOnce((equation, element) => new Promise<void>(resolve => {
      completeOldRender = () => { element.textContent = equation; resolve(); };
    }));
    const { container, rerender } = render(<MathComponent equation="old" inline nodeKey="test" />);
    rerender(<MathComponent equation="new" inline nodeKey="test" />);
    await waitFor(() => expect(container.textContent).toBe('new'));
    await act(async () => completeOldRender());
    expect(container.textContent).toBe('new');
  });
});
