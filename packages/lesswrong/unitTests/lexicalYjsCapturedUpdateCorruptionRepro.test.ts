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
  $getRoot,
  ElementNode,
  ParagraphNode,
  TextNode,
  type EditorConfig,
  type LexicalNode,
  type SerializedElementNode,
  type SerializedLexicalNode,
  createEditor,
} from "lexical";
import { MarkNode } from "@lexical/mark";
import * as Y from "yjs";

// Captured from Playwright E2E instrumentation:
// yjs.doc.snapshot (stateUpdateBase64) for main doc with originType === "UndoManager" (stateUpdateLen 4117)
// at the moment Lexical applies the corresponding historic update and becomes corrupted.
const CAPTURED_UNDO_STATE_UPDATE_BASE64 =
  "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X19pZHMBdQF3EW1rNTVrd2xiLXA2MXZybGY5BwDNi5WUDVQGKADNi5WUDV0GX190eXBlAXcbc3VnZ2VzdGlvbi1pbnNlcnRpb24taW5saW5lKADNi5WUDV0IX19mb3JtYXQBfQAoAM2LlZQNXQdfX3N0eWxlAXcAKADNi5WUDV0IX19pbmRlbnQBfQAoAM2LlZQNXQVfX2RpcgF+KADNi5WUDV0MX190ZXh0Rm9ybWF0AX0AKADNi5WUDV0LX190ZXh0U3R5bGUBdwAoAM2LlZQNXQ5fX3N1Z2dlc3Rpb25JZAF3EW1rNTVrd2xiLXA2MXZybGY5KADNi5WUDV0OX19hdXRob3JVc2VySWQBdx9wbGF5d3JpZ2h0LWNsaWVudC0xNzY3ODU4OTM0MjgyKADNi5WUDV0MX19hdXRob3JOYW1lAXcJQW5vbnltb3VzKADNi5WUDV0NX19jcmVhdGVkQXRNcwF7Qnm5ya+v8AAHAM2LlZQNXQEoAM2LlZQNaQZfX3R5cGUBdwR0ZXh0KADNi5WUDWkIX19mb3JtYXQBfQAoAM2LlZQNaQdfX3N0eWxlAXcAKADNi5WUDWkGX19tb2RlAX0AKADNi5WUDWkIX19kZXRhaWwBfQCEzYuVlA1pAVjHzYuVlA1UzYuVlA07BigAzYuVlA1wBl9fdHlwZQF3BG1hcmsoAM2LlZQNcAhfX2Zvcm1hdAF9ACgAzYuVlA1wB19fc3R5bGUBdwAoAM2LlZQNcAhfX2luZGVudAF9ACgAzYuVlA1wBV9fZGlyAX4oAM2LlZQNcAxfX3RleHRGb3JtYXQBfQAoAM2LlZQNcAtfX3RleHRTdHlsZQF3ACgAzYuVlA1wBV9faWRzAXUBdxFtazU1a3dsYi1wNjF2cmxmOQcAzYuVlA1wASgAzYuVlA15Bl9fdHlwZQF3BHRleHQoAM2LlZQNeQhfX2Zvcm1hdAF9ACgAzYuVlA15B19fc3R5bGUBdwAoAM2LlZQNeQZfX21vZGUBfQAoAM2LlZQNeQhfX2RldGFpbAF9AITNi5WUDXkDZWxsxM2LlZQNVM2LlZQNcARlbGxvx82LlZQNEs2LlZQNEwYoAM2LlZQNhgEGX190eXBlAXcac3VnZ2VzdGlvbi1kZWxldGlvbi1pbmxpbmUoAM2LlZQNhgEIX19mb3JtYXQBfQAoAM2LlZQNhgEHX19zdHlsZQF3ACgAzYuVlA2GAQhfX2luZGVudAF9ACgAzYuVlA2GAQVfX2RpcgF+KADNi5WUDYYBDF9fdGV4dEZvcm1hdAF9ACgAzYuVlA2GAQtfX3RleHRTdHlsZQF3ACgAzYuVlA2GAQ5fX3N1Z2dlc3Rpb25JZAF3EW1rNTVrd2xiLXA2MXZybGY5KADNi5WUDYYBDl9fYXV0aG9yVXNlcklkAXcfcGxheXdyaWdodC1jbGllbnQtMTc2Nzg1ODkzNDI4MigAzYuVlA2GAQxfX2F1dGhvck5hbWUBdwlBbm9ueW1vdXMoAM2LlZQNhgENX19jcmVhdGVkQXRNcwF7Qnm5ya+v8ADHzYuVlA1wzYuVlA07ASgAzYuVlA2SAQZfX3R5cGUBdwR0ZXh0KADNi5WUDZIBCF9fZm9ybWF0AX0AKADNi5WUDZIBB19fc3R5bGUBdwAoAM2LlZQNkgEGX19tb2RlAX0AKADNi5WUDZIBCF9fZGV0YWlsAX0AxM2LlZQNO82LlZQNQQFvBwDNi5WUDYYBBigAzYuVlA2ZAQZfX3R5cGUBdwRtYXJrKADNi5WUDZkBCF9fZm9ybWF0AX0AKADNi5WUDZkBB19fc3R5bGUBdwAoAM2LlZQNmQEIX19pbmRlbnQBfQAoAM2LlZQNmQEFX19kaXIBfigAzYuVlA2ZAQxfX3RleHRGb3JtYXQBfQAoAM2LlZQNmQELX190ZXh0U3R5bGUBdwAoAM2LlZQNmQEFX19pZHMBdQF3EW1rNTVrd2xiLXA2MXZybGY5BwDNi5WUDZkBASgAzYuVlA2iAQZfX3R5cGUBdwR0ZXh0KADNi5WUDaIBCF9fZm9ybWF0AX0AKADNi5WUDaIBB19fc3R5bGUBdwAoAM2LlZQNogEGX19tb2RlAX0AKADNi5WUDaIBCF9fZGV0YWlsAX0AhM2LlZQNogEDZWxsx82LlZQNKM2LlZQNVAYoAM2LlZQNqwEGX190eXBlAXcEbWFyaygAzYuVlA2rAQhfX2Zvcm1hdAF9ACgAzYuVlA2rAQdfX3N0eWxlAXcAKADNi5WUDasBCF9faW5kZW50AX0AKADNi5WUDasBBV9fZGlyAX4oAM2LlZQNqwEMX190ZXh0Rm9ybWF0AX0AKADNi5WUDasBC19fdGV4dFN0eWxlAXcAKADNi5WUDasBBV9faWRzAXUBdxFtazU1a3dsYi1wNjF2cmxmOQcAzYuVlA2rAQYoAM2LlZQNtAEGX190eXBlAXcbc3VnZ2VzdGlvbi1pbnNlcnRpb24taW5saW5lKADNi5WUDbQBCF9fZm9ybWF0AX0AKADNi5WUDbQBB19fc3R5bGUBdwAoAM2LlZQNtAEIX19pbmRlbnQBfQAoAM2LlZQNtAEFX19kaXIBfigAzYuVlA20AQxfX3RleHRGb3JtYXQBfQAoAM2LlZQNtAELX190ZXh0U3R5bGUBdwAoAM2LlZQNtAEOX19zdWdnZXN0aW9uSWQBdxFtazU1a3dsYi1wNjF2cmxmOSgAzYuVlA20AQ5fX2F1dGhvclVzZXJJZAF3H3BsYXl3cmlnaHQtY2xpZW50LTE3Njc4NTg5MzQyODIoAM2LlZQNtAEMX19hdXRob3JOYW1lAXcJQW5vbnltb3VzKADNi5WUDbQBDV9fY3JlYXRlZEF0TXMBe0J5ucmvr/AABwDNi5WUDbQBASgAzYuVlA3AAQZfX3R5cGUBdwR0ZXh0KADNi5WUDcABCF9fZm9ybWF0AX0AKADNi5WUDcABB19fc3R5bGUBdwAoAM2LlZQNwAEGX19tb2RlAX0AKADNi5WUDcABCF9fZGV0YWlsAX0AhM2LlZQNwAEBWAHNi5WUDQEPdw==";

type SerializedSuggestionDeletionInlineNode = {
  type: "suggestion-deletion-inline";
  version: 1;
  suggestionId?: string;
  authorUserId?: string;
  authorName?: string;
  createdAtMs?: number;
} & SerializedElementNode<SerializedLexicalNode>;

class SuggestionDeletionInlineNode extends ElementNode {
  __suggestionId: string;
  __authorUserId: string;
  __authorName: string;
  __createdAtMs: number;

  static getType(): string {
    return "suggestion-deletion-inline";
  }

  static clone(node: SuggestionDeletionInlineNode): SuggestionDeletionInlineNode {
    return new SuggestionDeletionInlineNode(
      {
        suggestionId: node.__suggestionId,
        authorUserId: node.__authorUserId,
        authorName: node.__authorName,
        createdAtMs: node.__createdAtMs,
      },
      node.__key,
    );
  }

  constructor(
    meta?: { suggestionId?: string; authorUserId?: string; authorName?: string; createdAtMs?: number } | null,
    key?: string,
  ) {
    super(key);
    this.__suggestionId = meta?.suggestionId ?? "unknown";
    this.__authorUserId = meta?.authorUserId ?? "unknown";
    this.__authorName = meta?.authorName ?? "Unknown";
    this.__createdAtMs = meta?.createdAtMs ?? 0;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedSuggestionDeletionInlineNode): SuggestionDeletionInlineNode {
    const node = new SuggestionDeletionInlineNode({
      suggestionId: serializedNode.suggestionId,
      authorUserId: serializedNode.authorUserId,
      authorName: serializedNode.authorName,
      createdAtMs: serializedNode.createdAtMs,
    });
    return node.updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedSuggestionDeletionInlineNode {
    return {
      ...super.exportJSON(),
      type: "suggestion-deletion-inline",
      version: 1,
      suggestionId: this.__suggestionId,
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
    };
  }
}

type SerializedSuggestionInsertionInlineNode = {
  type: "suggestion-insertion-inline";
  version: 1;
  suggestionId?: string;
  authorUserId?: string;
  authorName?: string;
  createdAtMs?: number;
} & SerializedElementNode<SerializedLexicalNode>;

class SuggestionInsertionInlineNode extends ElementNode {
  __suggestionId: string;
  __authorUserId: string;
  __authorName: string;
  __createdAtMs: number;

  static getType(): string {
    return "suggestion-insertion-inline";
  }

  static clone(node: SuggestionInsertionInlineNode): SuggestionInsertionInlineNode {
    return new SuggestionInsertionInlineNode(
      {
        suggestionId: node.__suggestionId,
        authorUserId: node.__authorUserId,
        authorName: node.__authorName,
        createdAtMs: node.__createdAtMs,
      },
      node.__key,
    );
  }

  constructor(
    meta?: { suggestionId?: string; authorUserId?: string; authorName?: string; createdAtMs?: number } | null,
    key?: string,
  ) {
    super(key);
    this.__suggestionId = meta?.suggestionId ?? "unknown";
    this.__authorUserId = meta?.authorUserId ?? "unknown";
    this.__authorName = meta?.authorName ?? "Unknown";
    this.__createdAtMs = meta?.createdAtMs ?? 0;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedSuggestionInsertionInlineNode): SuggestionInsertionInlineNode {
    const node = new SuggestionInsertionInlineNode({
      suggestionId: serializedNode.suggestionId,
      authorUserId: serializedNode.authorUserId,
      authorName: serializedNode.authorName,
      createdAtMs: serializedNode.createdAtMs,
    });
    return node.updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedSuggestionInsertionInlineNode {
    return {
      ...super.exportJSON(),
      type: "suggestion-insertion-inline",
      version: 1,
      suggestionId: this.__suggestionId,
      authorUserId: this.__authorUserId,
      authorName: this.__authorName,
      createdAtMs: this.__createdAtMs,
    };
  }
}

function base64ToUint8Array(b64: string): Uint8Array {
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function getEditorText(editorState: { read: <T>(fn: () => T) => T }): string {
  return editorState.read(() => $getRoot().getTextContent());
}

async function flushLexical(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

describe("@lexical/yjs captured-update repro: applying an UndoManager update corrupts Lexical historic state", () => {
  it.skip("TODO: apply captured pre-undo stateUpdate + UndoManager update to deterministically reproduce hellXoello", async () => {
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

    const doc = new Y.Doc();
    // Pre-create the types touched by @lexical/yjs binding.
    doc.get("root", Y.XmlText);
    doc.getXmlFragment("lexical");
    doc.getXmlFragment("content");
    doc.getXmlFragment("default");
    const docMap = new Map<string, Y.Doc>([["main", doc]]);

    const editor = createEditor({
      namespace: "lexical-yjs-captured-update-repro",
      nodes: [ParagraphNode, TextNode, MarkNode, SuggestionDeletionInlineNode, SuggestionInsertionInlineNode],
      onError: (e) => {
        throw e;
      },
    });
    const rootEl = document.createElement("div");
    document.body.appendChild(rootEl);
    editor.setRootElement(rootEl);

    const binding = createBinding(editor, provider as any, "main", doc, docMap);
    const rootXmlText = (binding as any).root.getSharedType() as Y.XmlText;
    const undoManager = createUndoManager(binding as any, rootXmlText);

    editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
        syncLexicalUpdateToYjs(
          binding as any,
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

    // Apply Yjs->Lexical for UndoManager transactions only (that is where corruption manifests as "historic").
    rootXmlText.observeDeep((events) => {
      const origin = events[0].transaction.origin;
      const isFromUndoManager = origin === undoManager || origin?.constructor?.name === "UndoManager";
      if (!isFromUndoManager) return;
      syncYjsChangesToLexical(binding as any, provider as any, events, true, () => {});
    });

    // Apply the captured *state update* with origin = undoManager so the binding treats it as historic.
    // This state update encodes the Yjs document (including tombstones) at the moment of corruption.
    const update = base64ToUint8Array(CAPTURED_UNDO_STATE_UPDATE_BASE64);
    Y.applyUpdate(doc, update, undoManager);
    await flushLexical();

    // Yjs state is correct (note: string includes [object Object] for embedded element nodes).
    const yjsRootPreview = String(doc.get("root", Y.XmlText).toString());
    expect(yjsRootPreview).toContain("h");
    expect(yjsRootPreview).toContain("ell");
    expect(yjsRootPreview).toContain("X");
    expect(yjsRootPreview).toContain("o");

    // TODO: once we also capture the pre-undo doc state (including tombstones),
    // this should reproduce the corrupted Lexical text "hellXoello" even though Yjs is correct.
    expect(getEditorText(editor.getEditorState())).toBe("hellXo");
  });
});


