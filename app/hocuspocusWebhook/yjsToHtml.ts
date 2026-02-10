/**
 * Client-context Yjs-to-HTML conversion.
 *
 * This file lives outside of @/server/ so that it can statically import
 * PlaygroundNodes and PlaygroundEditorTheme (which are "use client" modules
 * with transitive React dependencies). The linkedom DOM shim is injected
 * as a parameter since it lives in @/server/ and must be dynamically imported
 * by the caller during SSR.
 *
 * The conversion flow:
 *   1. Apply the Yjs binary update to a fresh Y.Doc
 *   2. Create a headless Lexical editor with all PlaygroundNodes registered
 *   3. Use @lexical/yjs V1 binding to sync the Yjs state into Lexical
 *   4. Serialize the Lexical editor state to HTML via $generateHtmlFromNodes
 */
import { createEditor, $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createBinding } from '@lexical/yjs';
import type { Provider, Binding } from '@lexical/yjs';
import * as Y from 'yjs';
import PlaygroundNodes from '@/components/lexical/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '@/components/lexical/themes/PlaygroundEditorTheme';

type ParseHTML = (html: string) => { document: Document; window: Window & typeof globalThis };

/**
 * Creates a no-op Provider that satisfies the @lexical/yjs Provider interface.
 * Used for server-side binding creation where no real WebSocket connection exists.
 */
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

/**
 * Sets up a minimal DOM environment using linkedom so that Lexical's
 * $generateHtmlFromNodes (which calls node.exportDOM → document.createElement)
 * can run in Node.js.
 */
function withLinkedomGlobals<T>(parseHTML: ParseHTML, fn: () => T): T {
  const { document, window } = parseHTML('<!DOCTYPE html><html><body></body></html>');

  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;

  globalThis.document = document;
  globalThis.window = window;

  try {
    return fn();
  } finally {
    if (prevDocument === undefined) {
      delete (globalThis as AnyBecauseHard).document;
    } else {
      globalThis.document = prevDocument;
    }
    if (prevWindow === undefined) {
      delete (globalThis as AnyBecauseHard).window;
    } else {
      globalThis.window = prevWindow;
    }
  }
}

/**
 * Syncs the V1 Yjs binding's collab tree into the Lexical editor.
 *
 * After createBinding, the binding.root is a CollabElementNode wrapping
 * the Y.XmlText at key 'root', but its _children are empty. We populate
 * them from the Yjs deltas and syncChildrenFromYjs converts them into
 * Lexical nodes (it internally calls createLexicalNodeFromCollabNode).
 *
 * Must be called inside an editor.update() context.
 */
function $syncV1BindingToLexical(binding: Binding): void {
  const root = $getRoot();
  root.clear();

  const xmlText: Y.XmlText = binding.root._xmlText;
  const delta = xmlText.toDelta();

  if (delta.length === 0) {
    return;
  }

  binding.root.applyChildrenYjsDelta(binding, delta);
  binding.root.syncChildrenFromYjs(binding);
}

/**
 * Converts a Yjs binary state into an HTML string by hydrating a headless
 * Lexical editor through the @lexical/yjs V1 binding.
 *
 * @param binary - The raw Yjs state (from Y.encodeStateAsUpdate)
 * @param parseHTML - The linkedom parseHTML function, dynamically imported by
 *   the caller from @/server/utils/wrapLinkedom since that module can't be
 *   statically imported in a client-context file.
 */
export function yjsBinaryToHtml(binary: Uint8Array, parseHTML: ParseHTML): string {
  return withLinkedomGlobals(parseHTML, () => {
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, binary);

    const editor = createEditor({
      nodes: [...PlaygroundNodes],
      theme: PlaygroundEditorTheme,
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error('[yjsBinaryToHtml] Lexical error:', error);
      },
    });

    const docMap = new Map<string, Y.Doc>([['main', ydoc]]);
    const mockProvider = createMockProvider();

    const binding = createBinding(editor, mockProvider, 'main', ydoc, docMap);

    editor.update(
      () => {
        $syncV1BindingToLexical(binding);
      },
      { discrete: true },
    );

    let html = '';
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });

    return html;
  });
}
