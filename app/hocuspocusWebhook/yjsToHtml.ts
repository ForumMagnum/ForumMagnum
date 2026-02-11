/**
 * Client-context Yjs↔HTML conversion utilities.
 *
 * This file lives outside of @/server/ so that it can statically import
 * PlaygroundNodes and PlaygroundEditorTheme (which are "use client" modules
 * with transitive React dependencies). A jsdom DOM environment is created
 * on the fly for each conversion call so that Lexical's DOM-dependent
 * helpers ($generateHtmlFromNodes, $generateNodesFromDOM) work in Node.js.
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
 *
 * htmlToYjsBinary flow (inverse):
 *   1. Create a fresh Y.Doc and headless Lexical editor with V1 binding
 *   2. Parse HTML into DOM, then into Lexical nodes via $generateNodesFromDOM
 *   3. The binding propagates Lexical changes back to the Y.Doc
 *   4. Encode the Y.Doc as a binary update
 *
 * replaceYjsDocumentContent flow (selective restore):
 *   1. Load the existing Y.Doc from a binary state
 *   2. Create a headless Lexical editor bound to that Y.Doc
 *   3. Sync the existing Yjs content into Lexical (initializing the binding)
 *   4. Clear the root and import new HTML content
 *   5. The binding propagates changes to the Y.Doc's root shared type only;
 *      the 'comments' YArray and other shared types are untouched
 *   6. Encode the modified Y.Doc as a binary update
 */
import { createEditor, $getRoot, $insertNodes } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { createBinding, syncLexicalUpdateToYjs } from '@lexical/yjs';
import type { Provider, Binding } from '@lexical/yjs';
import * as Y from 'yjs';
import PlaygroundNodes from '@/components/lexical/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '@/components/lexical/themes/PlaygroundEditorTheme';
// import { JSDOM } from 'jsdom';

/**
 * Computes the Yjs state vector for a given binary state.
 *
 * This must run in the same module context as the conversion functions
 * because the yjs/lib0 imports need to be resolved by Turbopack in the
 * client bundle context (where they work correctly).
 */
export function computeStateVector(state: Uint8Array): Uint8Array {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  const sv = Y.encodeStateVector(doc);
  doc.destroy();
  return sv;
}

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
 * Creates a headless Lexical editor configured with all PlaygroundNodes.
 */
function createHeadlessEditor(errorLabel: string) {
  return createEditor({
    nodes: [...PlaygroundNodes],
    theme: PlaygroundEditorTheme,
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error(`[${errorLabel}] Lexical error:`, error);
    },
  });
}

/**
 * Sets up a jsdom DOM environment so that Lexical's DOM-dependent helpers
 * ($generateHtmlFromNodes, $generateNodesFromDOM) can run in Node.js.
 *
 * jsdom is used instead of linkedom because Lexical's importDOM code paths
 * access CSS style properties (e.g. style.textDecoration) that linkedom
 * returns as undefined for unset properties, whereas jsdom (like browsers)
 * returns "".
 */
async function withDomGlobals<T>(fn: () => T): Promise<T> {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;

  globalThis.document = dom.window.document as unknown as Document;
  globalThis.window = dom.window as unknown as Window & typeof globalThis;

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
 * Imports HTML content into a Lexical editor by clearing the root and
 * inserting nodes generated from the parsed DOM.
 *
 * Must be called inside an editor.update() context and inside a
 * withDomGlobals block. We set the HTML on globalThis.document.body
 * so that $generateNodesFromDOM reads DOM nodes from the same jsdom
 * context as the rest of Lexical.
 */
function $importHtmlIntoLexical(
  editor: ReturnType<typeof createEditor>,
  html: string,
): void {
  const dom = globalThis.document;
  const prevBodyContent = dom.body.innerHTML;
  dom.body.innerHTML = html;
  const nodes = $generateNodesFromDOM(editor, dom);
  dom.body.innerHTML = prevBodyContent;
  const root = $getRoot();
  root.clear();
  $insertNodes(nodes);
}

/**
 * Converts a Yjs binary state into an HTML string by hydrating a headless
 * Lexical editor through the @lexical/yjs V1 binding.
 *
 * @param binary - The raw Yjs state (from Y.encodeStateAsUpdate)
 */
export async function yjsBinaryToHtml(binary: Uint8Array): Promise<string> {
  return withDomGlobals(() => {
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, binary);

    const editor = createHeadlessEditor('yjsBinaryToHtml');
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

/**
 * Registers an update listener that syncs Lexical changes to the Y.Doc,
 * performs the given editor update, then unregisters the listener.
 *
 * This mirrors how Lexical's CollaborationPlugin works: it uses
 * registerUpdateListener (which receives the dirty elements/leaves/tags
 * as callback args) to call syncLexicalUpdateToYjs at the right time.
 *
 * The update function is called inside editor.update() with discrete: true,
 * so the listener fires synchronously before this function returns.
 */
function updateEditorAndSyncToYjs(
  editor: ReturnType<typeof createEditor>,
  binding: Binding,
  provider: Provider,
  updateFn: () => void,
): void {
  const removeListener = editor.registerUpdateListener(({
    prevEditorState,
    editorState,
    dirtyLeaves,
    dirtyElements,
    normalizedNodes,
    tags,
  }) => {
    syncLexicalUpdateToYjs(
      binding,
      provider,
      prevEditorState,
      editorState,
      dirtyElements,
      dirtyLeaves,
      normalizedNodes,
      tags,
    );
  });

  editor.update(updateFn, { discrete: true });

  removeListener();
}

/**
 * Converts an HTML string into a Yjs binary state by populating a headless
 * Lexical editor from the HTML and syncing to a fresh Y.Doc via the V1 binding.
 *
 * @param html - The HTML to convert (typically from a revision's originalContents.data)
 * @returns The Yjs state as a Uint8Array (from Y.encodeStateAsUpdate)
 */
export async function htmlToYjsBinary(html: string): Promise<Uint8Array> {
  return withDomGlobals(() => {
    const ydoc = new Y.Doc();
    const editor = createHeadlessEditor('htmlToYjsBinary');
    const docMap = new Map<string, Y.Doc>([['main', ydoc]]);
    const mockProvider = createMockProvider();
    const binding = createBinding(editor, mockProvider, 'main', ydoc, docMap);

    updateEditorAndSyncToYjs(editor, binding, mockProvider, () => {
      $importHtmlIntoLexical(editor, html);
    });

    return Y.encodeStateAsUpdate(ydoc);
  });
}

/**
 * Replaces only the document content in an existing Yjs state, preserving
 * other shared types (notably the 'comments' YArray).
 *
 * This is used for revision restoration on collaborative Lexical documents.
 * By operating on the existing Y.Doc rather than creating a fresh one, the
 * comments shared type (which stores inline comment threads) is left intact.
 * Comment anchors (MarkNodes in the document tree) will be lost because the
 * document content is fully replaced, but the thread data itself survives as
 * orphaned/archived comments.
 *
 * @param existingState - The current Yjs binary state (from YjsDocuments table)
 * @param html - The HTML to restore (from the target revision's originalContents.data)
 * @returns The modified Yjs state, or null if the replacement failed
 */
export async function replaceYjsDocumentContent(
  existingState: Uint8Array,
  html: string,
): Promise<Uint8Array | null> {
  return withDomGlobals(() => {
    // Load the existing Y.Doc (preserving comments, suggestions, and other shared types)
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, existingState);

    const editor = createHeadlessEditor('replaceYjsDocumentContent');
    const docMap = new Map<string, Y.Doc>([['main', ydoc]]);
    const mockProvider = createMockProvider();
    const binding = createBinding(editor, mockProvider, 'main', ydoc, docMap);

    // Capture state vector before modifications to measure delta later
    const svBeforeReplace = Y.encodeStateVector(ydoc);

    // Step 1: Sync existing Yjs content into Lexical to initialize the binding
    editor.update(
      () => {
        $syncV1BindingToLexical(binding);
      },
      { discrete: true },
    );

    // Read the Lexical content after syncing from Yjs (for diagnostics)
    let htmlBeforeReplace = '';
    editor.getEditorState().read(() => {
      htmlBeforeReplace = $generateHtmlFromNodes(editor, null);
    });

    // Step 2: Replace the document content with the restored HTML.
    // The update listener syncs the Lexical changes back to the Y.Doc.
    // This only touches the 'root' XmlText shared type; the 'comments'
    // YArray is a separate shared type and remains untouched.
    updateEditorAndSyncToYjs(editor, binding, mockProvider, () => {
      $importHtmlIntoLexical(editor, html);
    });

    // Read the Lexical content after replacement (for diagnostics)
    let htmlAfterReplace = '';
    editor.getEditorState().read(() => {
      htmlAfterReplace = $generateHtmlFromNodes(editor, null);
    });

    const fullState = Y.encodeStateAsUpdate(ydoc);
    // Delta: only the operations generated by the replacement (new to the Y.Doc
    // relative to the state before step 2). If this is tiny (~10 bytes), the
    // replacement produced no meaningful Yjs operations.
    const delta = Y.encodeStateAsUpdate(ydoc, svBeforeReplace);

    // eslint-disable-next-line no-console
    console.log('[replaceYjsDocumentContent] diagnostics:', {
      existingStateSize: existingState.length,
      fullStateSize: fullState.length,
      deltaSize: delta.length,
      htmlInputLength: html.length,
      htmlInputPreview: html.slice(0, 200),
      htmlBeforeReplaceLength: htmlBeforeReplace.length,
      htmlBeforeReplacePreview: htmlBeforeReplace.slice(0, 200),
      htmlAfterReplaceLength: htmlAfterReplace.length,
      htmlAfterReplacePreview: htmlAfterReplace.slice(0, 200),
      contentChanged: htmlBeforeReplace !== htmlAfterReplace,
    });

    // Safety check: if the HTML after replacement is empty or unchanged,
    // the conversion failed (e.g. $importHtmlIntoLexical threw inside
    // editor.update, which catches errors via onError). Return null so
    // the caller can abort rather than writing bad state.
    if (htmlAfterReplace.length === 0 || htmlAfterReplace === htmlBeforeReplace) {
      // eslint-disable-next-line no-console
      console.error('[replaceYjsDocumentContent] Replacement produced no change; aborting');
      return null;
    }

    return fullState;
  });
}
