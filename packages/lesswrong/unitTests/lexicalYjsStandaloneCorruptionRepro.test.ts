/** @jest-environment jsdom */

import {
  createBinding,
  createUndoManager,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
} from "@lexical/yjs";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  ElementNode,
  ParagraphNode,
  TextNode,
  type EditorConfig,
  type SerializedElementNode,
  type SerializedLexicalNode,
  type LexicalNode,
  createEditor,
} from "lexical";
import { MarkNode, $createMarkNode } from "@lexical/mark";
import { Doc, type UndoManager, XmlText } from "yjs";
import * as Y from "yjs";

// Tiny inline wrapper nodes (like <span>) to simulate "deletion wrapper" + "insertion wrapper"
// as *different node types*, without importing any app code.
type SerializedDeletionWrapperNode = {
  type: "wrap-del";
  version: 1;
  kind: "del";
  suggestionId: string;
  authorUserId: string;
  authorName: string;
  createdAtMs: number;
} & SerializedElementNode<SerializedLexicalNode>;
type SerializedInsertionWrapperNode = {
  type: "wrap-ins";
  version: 1;
  kind: "ins";
  suggestionId: string;
  authorUserId: string;
  authorName: string;
  createdAtMs: number;
} & SerializedElementNode<SerializedLexicalNode>;

class DeletionWrapperNode extends ElementNode {
  __suggestionId: string;
  __authorUserId: string;
  __authorName: string;
  __createdAtMs: number;

  static getType(): string {
    return "wrap-del";
  }
  static clone(node: DeletionWrapperNode): DeletionWrapperNode {
    const clone = new DeletionWrapperNode(
      {
        suggestionId: node.__suggestionId,
        authorUserId: node.__authorUserId,
        authorName: node.__authorName,
        createdAtMs: node.__createdAtMs,
      },
      node.__key,
    );
    return clone;
  }
  constructor(
    meta?: { suggestionId: string; authorUserId: string; authorName: string; createdAtMs: number } | null,
    key?: string,
  ) {
    super(key);
    const safe = meta ?? { suggestionId: "unknown", authorUserId: "unknown", authorName: "Unknown", createdAtMs: 0 };
    this.__suggestionId = safe.suggestionId;
    this.__authorUserId = safe.authorUserId;
    this.__authorName = safe.authorName;
    this.__createdAtMs = safe.createdAtMs;
  }
  isInline(): boolean {
    return true;
  }
  createDOM(_config: EditorConfig): HTMLElement {
    const doc = (globalThis as unknown as { document?: Document }).document;
    return (doc?.createElement("span") ?? ({} as unknown as HTMLElement));
  }
  updateDOM(): boolean {
    return false;
  }
  static importJSON(serializedNode: SerializedDeletionWrapperNode): DeletionWrapperNode {
    const node = new DeletionWrapperNode({
      suggestionId: serializedNode.suggestionId,
      authorUserId: serializedNode.authorUserId,
      authorName: serializedNode.authorName,
      createdAtMs: serializedNode.createdAtMs,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
  exportJSON(): SerializedDeletionWrapperNode {
    return {
      ...(super.exportJSON() as SerializedElementNode<SerializedLexicalNode>),
      type: "wrap-del",
      version: 1,
      kind: "del",
      suggestionId: this.__suggestionId,
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
    } as SerializedDeletionWrapperNode;
  }
}

class InsertionWrapperNode extends ElementNode {
  __suggestionId: string;
  __authorUserId: string;
  __authorName: string;
  __createdAtMs: number;

  static getType(): string {
    return "wrap-ins";
  }
  static clone(node: InsertionWrapperNode): InsertionWrapperNode {
    const clone = new InsertionWrapperNode(
      {
        suggestionId: node.__suggestionId,
        authorUserId: node.__authorUserId,
        authorName: node.__authorName,
        createdAtMs: node.__createdAtMs,
      },
      node.__key,
    );
    return clone;
  }
  constructor(
    meta?: { suggestionId: string; authorUserId: string; authorName: string; createdAtMs: number } | null,
    key?: string,
  ) {
    super(key);
    const safe = meta ?? { suggestionId: "unknown", authorUserId: "unknown", authorName: "Unknown", createdAtMs: 0 };
    this.__suggestionId = safe.suggestionId;
    this.__authorUserId = safe.authorUserId;
    this.__authorName = safe.authorName;
    this.__createdAtMs = safe.createdAtMs;
  }
  isInline(): boolean {
    return true;
  }
  createDOM(_config: EditorConfig): HTMLElement {
    const doc = (globalThis as unknown as { document?: Document }).document;
    return (doc?.createElement("span") ?? ({} as unknown as HTMLElement));
  }
  updateDOM(): boolean {
    return false;
  }
  static importJSON(serializedNode: SerializedInsertionWrapperNode): InsertionWrapperNode {
    const node = new InsertionWrapperNode({
      suggestionId: serializedNode.suggestionId,
      authorUserId: serializedNode.authorUserId,
      authorName: serializedNode.authorName,
      createdAtMs: serializedNode.createdAtMs,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
  exportJSON(): SerializedInsertionWrapperNode {
    return {
      ...(super.exportJSON() as SerializedElementNode<SerializedLexicalNode>),
      type: "wrap-ins",
      version: 1,
      kind: "ins",
      suggestionId: this.__suggestionId,
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
    } as SerializedInsertionWrapperNode;
  }
}

function $createDeletionWrapperNode(meta: { suggestionId: string; authorUserId: string; authorName: string; createdAtMs: number }): DeletionWrapperNode {
  return new DeletionWrapperNode(meta);
}
function $createInsertionWrapperNode(meta: { suggestionId: string; authorUserId: string; authorName: string; createdAtMs: number }): InsertionWrapperNode {
  return new InsertionWrapperNode(meta);
}

function getEditorText(editorState: { read: <T>(fn: () => T) => T }): string {
  return editorState.read(() => $getRoot().getTextContent());
}

async function flushLexical(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

function getBindingRootXmlText(binding: unknown): XmlText {
  const root = (binding as { root: { getSharedType: () => unknown } }).root;
  return root.getSharedType() as XmlText;
}

function setSingleParagraphChildren(children: LexicalNode[]) {
  const root = $getRoot();
  root.clear();
  const p = $createParagraphNode();
  for (const c of children) p.append(c);
  root.append(p);
}

function unwrapElementNode(node: ElementNode): void {
  let child = node.getFirstChild();
  while (child) {
    const next = child.getNextSibling();
    node.insertBefore(child);
    child = next;
  }
  node.remove();
}

function findWrappersInOrder(): Array<DeletionWrapperNode | InsertionWrapperNode> {
  const out: Array<DeletionWrapperNode | InsertionWrapperNode> = [];
  const root = $getRoot();
  const stack: LexicalNode[] = [root];
  while (stack.length) {
    const n = stack.pop();
    if (!n) break;
    if (n instanceof DeletionWrapperNode || n instanceof InsertionWrapperNode) out.push(n);
    if ($isElementNode(n)) {
      const children = n.getChildren();
      for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
    }
  }
  return out;
}

describe("@lexical/yjs standalone repro: UndoManager redo can corrupt text around inline element nodes", () => {
  it.skip("TODO: reproduce hellXoello corruption in a standalone lexical+yjs test (currently only reproduces in full app)", async () => {
    const provider = {
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

    const doc = new Doc();
    // Pre-create the types that @lexical/yjs touches to avoid "premature access" warnings.
    doc.get("root", XmlText);
    doc.getXmlFragment("lexical");
    doc.getXmlFragment("content");
    doc.getXmlFragment("default");
    const docMap = new Map<string, Doc>([["main", doc]]);

    // Simulate a second collaborating client receiving/sending updates (like HocuspocusProvider echoes).
    // This introduces remote (tx.local=false) updates, which *may* be part of the minimal trigger.
    const remoteDoc = new Doc();
    remoteDoc.get("root", XmlText);
    remoteDoc.getXmlFragment("lexical");
    remoteDoc.getXmlFragment("content");
    remoteDoc.getXmlFragment("default");
    const syncRoundTrip = () => {
      // local -> remote
      const svRemote = Y.encodeStateVector(remoteDoc);
      const updToRemote = Y.encodeStateAsUpdate(doc, svRemote);
      Y.applyUpdate(remoteDoc, updToRemote, "HocuspocusProvider");
      // remote -> local
      const svLocal = Y.encodeStateVector(doc);
      const updToLocal = Y.encodeStateAsUpdate(remoteDoc, svLocal);
      Y.applyUpdate(doc, updToLocal, "HocuspocusProvider");
    };

    const editor = createEditor({
      namespace: "lexical-yjs-standalone-repro",
      nodes: [ParagraphNode, TextNode, MarkNode, DeletionWrapperNode, InsertionWrapperNode],
      onError: (e) => {
        throw e;
      },
    });
    const rootEl = document.createElement("div");
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    const binding = createBinding(editor, provider as any, "main", doc, docMap);
    const rootXmlText = getBindingRootXmlText(binding);
    const undoManager: UndoManager = createUndoManager(binding, rootXmlText);

    editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
        syncLexicalUpdateToYjs(
          binding,
          provider as any,
          prevEditorState,
          editorState,
          dirtyElements,
          dirtyLeaves,
          normalizedNodes,
          tags,
        );
      },
    );

    // Sync Yjs -> Lexical for:
    // - UndoManager-origin transactions (historic)
    // - remote transactions (non-historic)
    // Avoid feeding local binding-origin transactions back into Lexical (prevents loops / extra paragraphs).
    rootXmlText.observeDeep((events) => {
      const tx = events[0].transaction;
      const origin = tx.origin;
      const isFromUndoManager = origin === undoManager || origin?.constructor?.name === "UndoManager";
      const shouldApply = isFromUndoManager || tx.local === false;
      if (!shouldApply) return;
      syncYjsChangesToLexical(binding, provider as any, events, isFromUndoManager, () => {});
    });

    // State A: plain "hello"
    editor.update(() => {
      setSingleParagraphChildren([$createTextNode("hello")]);
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hello");
    syncRoundTrip();
    await flushLexical();
    undoManager.stopCapturing();

    const tailKey = editor.getEditorState().read(() => {
      const p = $getRoot().getFirstChild() as ParagraphNode;
      const t = p.getFirstChild() as TextNode;
      return t.getKey();
    });

    const meta = {
      suggestionId: "s1",
      authorUserId: "u",
      authorName: "U",
      createdAtMs: 0,
    };

    // State B1: create wrappers first (no marks yet), similar to how suggestion wrappers are inserted.
    editor.update(() => {
      const root = $getRoot();
      const p = root.getFirstChild() as ParagraphNode;
      const tail = p.getFirstChild() as TextNode;
      // Critical setup: keep a single existing text node (key preserved) and mutate it from "hello" -> "o".
      // If the binding later tries to revert this node using a delta that doesn't delete the leftover "ello",
      // we'd see exactly the corruption "oello".
      tail.setTextContent("o");

      // Insert new leading nodes instead of splitting the existing text node.
      const h = $createTextNode("h");
      tail.insertBefore(h);

      const deletionWrap = $createDeletionWrapperNode(meta);
      const ell = $createTextNode("ell");
      deletionWrap.append(ell);
      h.insertAfter(deletionWrap);

      const insertionWrap = $createInsertionWrapperNode(meta);
      insertionWrap.append($createTextNode("X"));
      deletionWrap.insertAfter(insertionWrap);
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hellXo");
    syncRoundTrip();
    await flushLexical();
    // Keep capturing so "wrapper insert" and "mark wrap" can end up in the same UndoManager item if needed.

    // State B2: add marks in a separate Lexical update (derived UI), matching playw JSON structure.
    editor.update(() => {
      const wrappers = findWrappersInOrder();
      const deletionWrap = wrappers.find((w) => w instanceof DeletionWrapperNode) as DeletionWrapperNode | undefined;
      const insertionWrap = wrappers.find((w) => w instanceof InsertionWrapperNode) as InsertionWrapperNode | undefined;
      if (!deletionWrap || !insertionWrap) return;

      // Move deleted text under a mark inside the deletion wrapper.
      const deletionMark = $createMarkNode([meta.suggestionId]);
      const delChild = deletionWrap.getFirstChild();
      if (delChild) {
        delChild.replace(deletionMark);
        deletionMark.append(delChild);
      } else {
        deletionWrap.append(deletionMark);
      }

      // Wrap insertion wrapper in a sibling mark.
      const insertionMark = $createMarkNode([meta.suggestionId]);
      insertionWrap.replace(insertionMark);
      insertionMark.append(insertionWrap);
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hellXo");
    syncRoundTrip();
    await flushLexical();
    undoManager.stopCapturing();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const p = root.getFirstChild() as ParagraphNode;
      const tail = $getNodeByKey(tailKey);
      const childSummary = p
        .getChildren()
        .map((c) => `${c.getType()}:${c.getKey()}`)
        .join(",");
      if (!tail) {
        throw new Error(`Standalone repro: missing tail node after suggestion creation, children=${childSummary}`);
      }
      const parent = tail.getParent();
      if (parent !== p) {
        throw new Error(
          `Standalone repro: tail node parent is ${parent?.getType() ?? "null"}, expected paragraph; children=${childSummary}`,
        );
      }
    });

    // State C: "reject": remove insertion mark/wrapper and unwrap deletion wrapper/mark back into plain text,
    // letting Lexical's normalization merge adjacent text nodes back into "hello".
    editor.update(() => {
      const root = $getRoot();
      const p = root.getFirstChild() as ParagraphNode;
      // Remove insertion mark (which contains insertion wrapper).
      const wrappers = findWrappersInOrder();
      const insertionWrap = wrappers.find((w) => w instanceof InsertionWrapperNode) as InsertionWrapperNode | undefined;
      insertionWrap?.getParent()?.remove();

      // Unwrap deletion wrapper: move its children out before it, then remove wrapper.
      const deletionWrap = wrappers.find((w) => w instanceof DeletionWrapperNode) as DeletionWrapperNode | undefined;
      if (deletionWrap) {
        unwrapElementNode(deletionWrap);
      }

      // Unwrap any remaining mark nodes (derived UI cleanup).
      const stack: LexicalNode[] = [p];
      while (stack.length) {
        const n = stack.pop();
        if (!n) break;
        if (n instanceof MarkNode) {
          unwrapElementNode(n);
          continue;
        }
        if ($isElementNode(n)) {
          const children = n.getChildren();
          for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
        }
      }

      const after = root.getTextContent();
      if (after !== "hello") {
        const summary = p
          .getChildren()
          .map((c) => `${c.getType()}:${c.getKey()}`)
          .join(",");
        throw new Error(`Standalone repro: reject produced "${after}", children=${summary}`);
      }
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hello");
    syncRoundTrip();
    await flushLexical();
    undoManager.stopCapturing();

    // Undo should restore State B, but the binding can corrupt the tail TextNode by failing to delete the leftover "ello":
    // "hello" -> "oello"
    undoManager.undo();
    await flushLexical();
    const afterUndo = getEditorText(editor.getEditorState());
    // NOTE: In this standalone harness, we currently get the correct state.
    // In the full app (Playwright), the analogous historic update yields "hellXoello".
    expect(afterUndo).toBe("hellXo");
  });

  it("control: with a single wrapper node, redo does not corrupt (Proton-like shape)", async () => {
    const provider = {
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

    const doc = new Doc();
    doc.get("root", XmlText);
    doc.getXmlFragment("lexical");
    doc.getXmlFragment("content");
    doc.getXmlFragment("default");
    const docMap = new Map<string, Doc>([["main", doc]]);

    const editor = createEditor({
      namespace: "lexical-yjs-standalone-repro-control",
      nodes: [ParagraphNode, TextNode, DeletionWrapperNode],
      onError: (e) => {
        throw e;
      },
    });
    const rootEl = document.createElement("div");
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    const binding = createBinding(editor, provider as any, "main", doc, docMap);
    const rootXmlText = getBindingRootXmlText(binding);
    const undoManager: UndoManager = createUndoManager(binding, rootXmlText);

    editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
        syncLexicalUpdateToYjs(
          binding,
          provider as any,
          prevEditorState,
          editorState,
          dirtyElements,
          dirtyLeaves,
          normalizedNodes,
          tags,
        );
      },
    );

    rootXmlText.observeDeep((events) => {
      const tx = events[0].transaction;
      const origin = tx.origin;
      const isFromUndoManager = origin === undoManager || origin?.constructor?.name === "UndoManager";
      const shouldApply = isFromUndoManager || tx.local === false;
      if (!shouldApply) return;
      syncYjsChangesToLexical(binding, provider as any, events, isFromUndoManager, () => {});
    });

    editor.update(() => {
      setSingleParagraphChildren([$createTextNode("hello")]);
    });
    await flushLexical();
    undoManager.stopCapturing();

    editor.update(() => {
      const w = $createDeletionWrapperNode({
        suggestionId: "s1",
        authorUserId: "u",
        authorName: "U",
        createdAtMs: 0,
      });
      w.append($createTextNode("ellX"));
      setSingleParagraphChildren([$createTextNode("h"), w, $createTextNode("o")]);
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hellXo");
    undoManager.stopCapturing();

    editor.update(() => {
      setSingleParagraphChildren([$createTextNode("hello")]);
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hello");
    undoManager.stopCapturing();

    undoManager.undo();
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hellXo");

    undoManager.redo();
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hello");
  });
});


