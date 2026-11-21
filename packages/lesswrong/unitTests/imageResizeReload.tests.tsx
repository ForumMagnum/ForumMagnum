/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, type LexicalEditor } from 'lexical';
import { $createImageNode, $isImageNode, ImageNode, ImageRenderNode, ImageCaptionNode } from '@/components/lexical/nodes/ImageNode';
import { imageCache } from '@/components/lexical/nodes/imageCache';

jest.mock('@/components/hooks/useStyles', () => ({ defineStyles: () => ({}), useStyles: () => ({}) }));
jest.mock('@/components/common/withMessages', () => ({ useMessages: () => ({ flash: jest.fn() }) }));

const SRC = 'https://example.com/resize-regression.png';
let editor: LexicalEditor;
let loadingImage: HTMLImageElement;

function CaptureEditor() {
  const [lexicalEditor] = useLexicalComposerContext();
  React.useEffect(() => { editor = lexicalEditor; }, [lexicalEditor]);
  return null;
}

function setup() {
  return render(<LexicalComposer initialConfig={{
    namespace: 'image-resize-reload-test', nodes: [ImageNode, ImageRenderNode, ImageCaptionNode],
    editorState: () => $getRoot().append($createImageNode({src: SRC, altText: 'Resized image', widthPercent: 40})),
    onError: error => { throw error; },
  }}>
    <RichTextPlugin contentEditable={<ContentEditable aria-label="Document" />} ErrorBoundary={LexicalErrorBoundary} />
    <CaptureEditor />
  </LexicalComposer>);
}

async function finishImageLoad() {
  await act(async () => { loadingImage.dispatchEvent(new Event('load')); });
}

async function resize(widthPercent: number | null) {
  await act(async () => {
    editor.update(() => {
      const node = $getRoot().getFirstChild();
      if (!$isImageNode(node)) throw new Error('Missing image');
      node.setWidthPercent(widthPercent);
    }, { discrete: true });
  });
}

beforeEach(() => {
  imageCache.delete(SRC);
  jest.spyOn(window, 'Image').mockImplementation(() => {
    loadingImage = document.createElement('img');
    Object.defineProperties(loadingImage, { naturalWidth: { value: 800 }, naturalHeight: { value: 600 } });
    return loadingImage;
  });
});

afterEach(() => {
  cleanup();
  imageCache.delete(SRC);
  jest.restoreAllMocks();
});

describe('resized images loading after the editor mounts', () => {
  it('applies the saved width even when image loading suspends', async () => {
    const { container } = setup();
    await waitFor(() => expect(window.Image).toHaveBeenCalled());
    expect(container.querySelector('img')).toBeNull();
    await finishImageLoad();
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('figure')?.style.width).toBe('40%');
  });

  it('applies size changes and resets while the image is loading', async () => {
    const { container } = setup();
    await waitFor(() => expect(window.Image).toHaveBeenCalled());
    await resize(25);
    expect(container.querySelector('figure')?.style.width).toBe('25%');
    await finishImageLoad();
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('figure')?.style.width).toBe('25%');
    await resize(null);
    expect(container.querySelector('figure')?.style.width).toBe('');
  });
});
