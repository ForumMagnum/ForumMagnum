/**
 * Client-context Yjs→HTML conversion utility.
 *
 * This file lives outside of @/server/ so that it can statically import
 * PlaygroundNodes and PlaygroundEditorTheme (which are "use client" modules
 * with transitive React dependencies). A jsdom DOM environment is created
 * on the fly so that Lexical's DOM-dependent helpers can run in Node.js.
 *
 * We use jsdom rather than linkedom because Lexical's importDOM code paths
 * access CSS style properties that are undefined in linkedom (e.g.
 * style.textDecoration), but always return "" in a real browser and in jsdom.
 *
 * yjsBinaryToHtml flow:
 *   1. Apply the Yjs binary update to a fresh Y.Doc
 *   2. Create a headless Lexical editor with all PlaygroundNodes registered
 *   3. Use @lexical/yjs V1 binding to sync the Yjs state into Lexical
 *   4. Serialize the Lexical editor state to HTML via $generateHtmlFromNodes
 */
import { createEditor, $getRoot, type LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { createBinding } from '@lexical/yjs';
import type { Provider, Binding } from '@lexical/yjs';
import * as Y from 'yjs';
import allLexicalNodes from '@/components/lexical/nodes/allLexicalNodes';
import PlaygroundEditorTheme from '@/components/lexical/themes/PlaygroundEditorTheme';
import { withDomGlobals } from '@/server/editor/withDomGlobals';

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
 * Creates a headless Lexical editor configured with the universal node set.
 */
export function createHeadlessEditor(errorLabel: string) {
  return createEditor({
    nodes: allLexicalNodes,
    theme: PlaygroundEditorTheme,
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error(`[${errorLabel}] Lexical error:`, error);
    },
  });
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
 * Hydrate a caller-supplied headless Lexical editor from a Yjs binary state
 * (from Y.encodeStateAsUpdate) via the @lexical/yjs V1 binding and a mock
 * provider. Replaces the editor's current document with the Yjs content.
 */
function hydrateEditorFromYjsBinary(editor: LexicalEditor, binary: Uint8Array): void {
  const ydoc = new Y.Doc();
  Y.applyUpdate(ydoc, binary);

  const docMap = new Map<string, Y.Doc>([['main', ydoc]]);
  const mockProvider = createMockProvider();
  const binding = createBinding(editor, mockProvider, 'main', ydoc, docMap);

  editor.update(
    () => {
      $syncV1BindingToLexical(binding);
    },
    { discrete: true },
  );
}

/**
 * Converts a Yjs binary state into an HTML string by hydrating a headless
 * Lexical editor through the @lexical/yjs V1 binding.
 *
 * @param binary - The raw Yjs state (from Y.encodeStateAsUpdate)
 */
export function yjsBinaryToHtml(binary: Uint8Array): string {
  return withDomGlobals(() => {
    const editor = createHeadlessEditor('yjsBinaryToHtml');
    hydrateEditorFromYjsBinary(editor, binary);

    let html = '';
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });

    return html;
  });
}
