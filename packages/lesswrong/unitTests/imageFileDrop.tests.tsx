/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $createTableCellNode, $createTableNode, $createTableRowNode, TableCellHeaderStates } from '@lexical/table';
import { $findMatchingParent } from '@lexical/utils';
import {
  $createNodeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $setSelection,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import allLexicalNodes from '@/components/lexical/nodes/allLexicalNodes';
import { $createImageNode, $isImageNode, type ImageNode } from '@/components/lexical/nodes/ImageNode';
import ImagesPlugin from '@/components/lexical/plugins/ImagesPlugin';
import DragDropPaste from '@/components/lexical/plugins/DragDropPastePlugin';
import SuggestedEditsPlugin from '@/components/editor/lexicalPlugins/suggestedEdits/SuggestedEditsPlugin';
import { $createSuggestionNode, $isSuggestionNode } from '@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode';
import { EditorUserMode } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';
import { $createContainerQuoteNode } from '@/components/editor/lexicalPlugins/quote/ContainerQuoteNode';
import { $createLayoutItemNode } from '@/components/lexical/nodes/LayoutItemNode';
import { $createCollapsibleSectionContentNode } from '@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionContentNode';
import { $createLLMContentBlockContentNode } from '@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockContentNode';

const mockUploadToCloudinary = jest.fn();

jest.mock('@/components/hooks/useStyles', () => ({
  ...jest.requireActual<typeof import('@/components/hooks/useStyles')>('@/components/hooks/useStyles'),
  useStyles: () => ({}),
}));
jest.mock('@/components/hooks/useForumType', () => ({
  useForumType: () => ({ forumType: 'LessWrong' }),
}));
jest.mock('@/components/common/withMessages', () => ({
  useMessages: () => ({ flash: jest.fn() }),
}));
jest.mock('@/components/lexical/nodes/ImageComponent', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/lexical/utils/cloudinaryUpload', () => ({
  __esModule: true,
  ImageUploadError: class ImageUploadError extends Error {},
  uploadToCloudinary: (...args: unknown[]) => mockUploadToCloudinary(...args),
}));
jest.mock('@/components/lexical/collaboration', () => ({
  useCanRejectSuggestion: () => true,
  useCollaboratorIdentity: () => ({ id: 'user', name: 'User', accessLevel: 'edit' }),
}));
jest.mock('@/components/editor/lexicalPlugins/suggestions/MarkNodesContext', () => ({
  useMarkNodesContext: () => ({ markNodeMap: new Map() }),
}));
jest.mock('@/components/lexical/commenting/CommentStoreContext', () => ({
  useCommentStoreContext: () => ({ commentStore: { isSynced: () => false } }),
}));

const OLD_SRC = 'https://example.com/old.png';
const NEW_SRC = 'https://example.com/new.png';

let editor: LexicalEditor;
let editorErrors: Error[];

function CaptureEditor() {
  const [lexicalEditor] = useLexicalComposerContext();
  React.useEffect(() => { editor = lexicalEditor; }, [lexicalEditor]);
  return null;
}

async function flushEditor(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
}

async function mountEditor(isSuggestionMode: boolean): Promise<void> {
  render(
    <LexicalComposer initialConfig={{
      namespace: 'imageFileDropTest',
      nodes: allLexicalNodes,
      onError: (error: Error) => editorErrors.push(error),
    }}>
      <RichTextPlugin contentEditable={<ContentEditable />} ErrorBoundary={LexicalErrorBoundary} />
      <ImagesPlugin />
      <DragDropPaste />
      <SuggestedEditsPlugin
        isSuggestionMode={isSuggestionMode}
        userMode={isSuggestionMode ? EditorUserMode.Suggest : EditorUserMode.Edit}
        onUserModeChange={() => undefined}
      />
      <CaptureEditor />
    </LexicalComposer>,
  );
  await flushEditor();
}

function $appendToRoot(node: ElementNode): ElementNode {
  $getRoot().append(node);
  return node;
}

function $appendTableCellToRoot(): ElementNode {
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $getRoot().append($createTableNode().append($createTableRowNode().append(cell)));
  return cell;
}

async function setupDocument($createImageParent: () => ElementNode): Promise<{ imageKey: string, parentKey: string }> {
  const keys = { imageKey: '', parentKey: '' };
  await act(async () => {
    editor.update(() => {
      $getRoot().clear().append($createParagraphNode());
      const image = $createImageNode({ src: OLD_SRC, altText: 'old', maxWidth: 500 });
      const parent = $createImageParent().append(image, $createParagraphNode());
      $getRoot().append($createParagraphNode());
      keys.imageKey = image.getKey();
      keys.parentKey = parent.getKey();
    }, { discrete: true });
  });
  await flushEditor();
  return keys;
}

async function selectImage(imageKey: string): Promise<void> {
  await act(async () => {
    editor.update(() => {
      const selection = $createNodeSelection();
      selection.add(imageKey);
      $setSelection(selection);
    }, { discrete: true });
  });
}

async function dropFileOnImage(imageKey: string): Promise<void> {
  const renderNodeKey = editor.getEditorState().read(() => $getNodeByKey<ImageNode>(imageKey)?.getFirstChild()?.getKey());
  const renderDom = renderNodeKey ? editor.getElementByKey(renderNodeKey) : null;
  const rootElement = editor.getRootElement();
  if (!renderDom || !rootElement) {
    throw new Error('Image is not in the DOM');
  }
  const dropCaret = document.createRange();
  dropCaret.setStart(renderDom, 0);
  document.caretRangeFromPoint = () => dropCaret;

  const dropEvent = Object.assign(new MouseEvent('drop', { bubbles: true, cancelable: true }), {
    dataTransfer: {
      types: ['Files'],
      files: [new File(['image'], 'new.png', { type: 'image/png' })],
      getData: () => '',
    },
  });
  await act(async () => {
    rootElement.dispatchEvent(dropEvent);
  });
  await flushEditor();
}

function $collectImages(node: LexicalNode): ImageNode[] {
  if ($isImageNode(node)) {
    return [node];
  }
  return $isElementNode(node) ? node.getChildren().flatMap($collectImages) : [];
}

const IMAGE_PARENTS: Array<[string, () => ElementNode]> = [
  ['the root', $getRoot],
  ['a table cell', $appendTableCellToRoot],
  ['a container quote', () => $appendToRoot($createContainerQuoteNode())],
  ['a layout item', () => $appendToRoot($createLayoutItemNode())],
  ['a collapsible section', () => $appendToRoot($createCollapsibleSectionContentNode())],
  ['an LLM content block', () => $appendToRoot($createLLMContentBlockContentNode())],
  ['a suggestion wrapper', () => $appendToRoot($createSuggestionNode('existing', 'insert-image'))],
];

describe('dropping an image file on an image', () => {
  beforeAll(() => {
    // Lexical identifies drag events by constructor name, and jsdom has no DragEvent.
    Object.assign(globalThis, { DragEvent: MouseEvent });
  });

  beforeEach(() => {
    editorErrors = [];
    mockUploadToCloudinary.mockReset();
    mockUploadToCloudinary.mockResolvedValue({ secure_url: NEW_SRC, width: 10, height: 10 });
  });

  afterEach(cleanup);

  it.each(IMAGE_PARENTS)('in edit mode, replaces an image inside %s and moves the caret off it', async (_name, $createImageParent) => {
    await mountEditor(false);
    const { imageKey, parentKey } = await setupDocument($createImageParent);

    await dropFileOnImage(imageKey);

    expect(editorErrors).toEqual([]);
    editor.getEditorState().read(() => {
      const images = $collectImages($getRoot());
      expect(images.map((image) => image.getSrc())).toEqual([NEW_SRC]);
      expect(images[0].getParent()?.getKey()).toBe(parentKey);
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        throw new Error('Expected a range selection after the replacement');
      }
      expect($findMatchingParent(selection.anchor.getNode(), $isImageNode)).toBeNull();
    });
  });

  it.each(IMAGE_PARENTS.slice(0, 2))('in suggestion mode, suggests replacing a selected image inside %s', async (_name, $createImageParent) => {
    await mountEditor(true);
    const { imageKey } = await setupDocument($createImageParent);
    await selectImage(imageKey);

    await dropFileOnImage(imageKey);

    expect(mockUploadToCloudinary).toHaveBeenCalledTimes(1);
    expect(editorErrors).toEqual([]);
    editor.getEditorState().read(() => {
      const suggestedImages = $collectImages($getRoot()).map((image) => ({
        src: image.getSrc(),
        suggestionType: $findMatchingParent(image, $isSuggestionNode)?.getSuggestionTypeOrThrow(),
      }));
      expect(suggestedImages).toEqual([
        { src: OLD_SRC, suggestionType: 'delete-image' },
        { src: NEW_SRC, suggestionType: 'insert-image' },
      ]);
    });
  });
});
