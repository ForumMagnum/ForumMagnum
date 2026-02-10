import { createEditor, $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createBinding } from '@lexical/yjs';
import type { Provider, Binding } from '@lexical/yjs';
import * as Y from 'yjs';
import PlaygroundNodes from '@/components/lexical/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '@/components/lexical/themes/PlaygroundEditorTheme';
import { getLinkedom } from '@/server/utils/wrapLinkedom';

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
 *
 * Returns a cleanup function that restores the previous global state.
 */
function withLinkedomGlobals<T>(fn: () => T): T {
  const parseHTML = getLinkedom();
  const { document, window } = parseHTML('<!DOCTYPE html><html><body></body></html>');

  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;

  // Lexical's exportDOM uses the global `document` for createElement, etc.
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

  // Access the underlying XmlText to get the Yjs deltas.
  // _xmlText is a conventional-private field on CollabElementNode.
  const xmlText: Y.XmlText = binding.root._xmlText;
  const delta = xmlText.toDelta();

  if (delta.length === 0) {
    return;
  }

  // Populate the collab tree from the Yjs deltas, then sync the children
  // into the Lexical editor. syncChildrenFromYjs walks the collab tree and
  // creates Lexical nodes for each entry, attaching them to the root.
  binding.root.applyChildrenYjsDelta(binding, delta);
  binding.root.syncChildrenFromYjs(binding);
}

/**
 * Converts a Yjs binary state (from a Hocuspocus document) into an HTML string
 * by hydrating a headless Lexical editor through the @lexical/yjs V1 binding.
 *
 * This is the server-side equivalent of the client's $generateHtmlFromNodes flow.
 * It uses linkedom to provide the DOM shim that $generateHtmlFromNodes needs.
 */
export function yjsBinaryToHtml(binary: Uint8Array): string {
  return withLinkedomGlobals(() => {
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

    // createBinding reads doc.get('root', XmlText) and wraps it in a
    // CollabElementNode with _key='root', linking it to the Lexical root.
    const binding = createBinding(editor, mockProvider, 'main', ydoc, docMap);

    // Sync the Yjs state into the Lexical editor
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

/**
 * Extracts the post ID from a Hocuspocus document name.
 * Document names follow the pattern "post-{postId}" or "post-{postId}/{subDocId}".
 */
export function documentNameToPostId(documentName: string): string {
  const match = documentName.match(/^post-([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error(`Invalid document name: ${documentName}`);
  }
  return match[1];
}
