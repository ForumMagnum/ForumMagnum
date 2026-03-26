/**
 * Converts HTML to a Yjs binary state by importing it into a headless Lexical
 * editor bound to a Y.Doc via @lexical/yjs.
 *
 * This file transitively imports PlaygroundNodes (which has CSS imports),
 * so it cannot be statically imported by code that runs during codegen.
 * Use a dynamic import() instead.
 */
import { createEditor, $getRoot, $insertNodes } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { createBinding, syncLexicalUpdateToYjs } from '@lexical/yjs';
import type { Provider } from '@lexical/yjs';
import * as Y from 'yjs';
import { JSDOM } from 'jsdom';
import PlaygroundNodes from '@/components/lexical/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '@/components/lexical/themes/PlaygroundEditorTheme';
import { withDomGlobals } from './withDomGlobals';

function createMockProvider(): Provider {
  return {
    awareness: {
      getLocalState: () => null,
      getStates: () => new Map(),
      off: () => {},
      on: () => {},
      setLocalState: () => {},
      setLocalStateField: () => {},
    },
    connect: () => {},
    disconnect: () => {},
    off: () => {},
    on: () => {},
  };
}

export function htmlToYjsBinary(html: string): Uint8Array {
  return withDomGlobals(() => {
    const ydoc = new Y.Doc();
    const editor = createEditor({
      nodes: [...PlaygroundNodes],
      theme: PlaygroundEditorTheme,
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error('[htmlToYjsBinary] Lexical error:', error);
      },
    });
    const docMap = new Map<string, Y.Doc>([['main', ydoc]]);
    const mockProvider = createMockProvider();
    const binding = createBinding(editor, mockProvider, 'main', ydoc, docMap);

    editor.registerUpdateListener(({
      prevEditorState,
      editorState,
      dirtyLeaves,
      dirtyElements,
      normalizedNodes,
      tags,
    }) => {
      syncLexicalUpdateToYjs(
        binding,
        mockProvider,
        prevEditorState,
        editorState,
        dirtyElements,
        dirtyLeaves,
        normalizedNodes,
        tags,
      );
    });

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const dom = new JSDOM(html);
        const nodes = $generateNodesFromDOM(editor, dom.window.document);
        $insertNodes(nodes);
      },
      { discrete: true },
    );

    return Y.encodeStateAsUpdate(ydoc);
  });
}
