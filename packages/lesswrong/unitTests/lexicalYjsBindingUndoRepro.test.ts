/** @jest-environment node */

import { createBinding, createUndoManager, syncLexicalUpdateToYjs, syncYjsChangesToLexical } from "@lexical/yjs";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  ParagraphNode,
  TextNode,
  createEditor,
} from "lexical";
import { Doc, type UndoManager, XmlText } from "yjs";

import {
  $createSuggestionDeletionInlineNode,
  SuggestionDeletionInlineNode,
} from "@/components/editor/lexicalPlugins/suggestedEdits/nodes/SuggestionDeletionInlineNode";
import {
  $createSuggestionInsertionInlineNode,
  SuggestionInsertionInlineNode,
} from "@/components/editor/lexicalPlugins/suggestedEdits/nodes/SuggestionInsertionInlineNode";

// Minimal Provider stub: enough for @lexical/yjs binding; cursor sync is disabled in this repro.
function createNoopProvider() {
  const awareness = {
    getLocalState: () => null,
    getStates: () => new Map(),
    off: () => {},
    on: () => {},
    setLocalState: () => {},
    setLocalStateField: () => {},
  };
  return {
    awareness,
    connect: () => {},
    disconnect: () => {},
    off: () => {},
    on: () => {},
  };
}

function getEditorText(editorState: { read: <T>(fn: () => T) => T }): string {
  return editorState.read(() => $getRoot().getTextContent());
}

async function flushLexical(): Promise<void> {
  // Lexical commits updates on a microtask. Yielding ensures `editor.getEditorState()` reflects
  // the last `editor.update()` call before we assert.
  await new Promise((r) => setTimeout(r, 0));
}

function getBindingRootXmlText(binding: unknown): XmlText {
  // The Binding type is internal, but in @lexical/yjs v1 the root is a CollabElementNode
  // whose shared type is a Y.XmlText.
  const root = (binding as { root: { getSharedType: () => unknown } }).root;
  return root.getSharedType() as XmlText;
}

describe("@lexical/yjs minimal repro: collab undo should not duplicate suffix text", () => {
  it("reproduces the 'hellXoello' corruption without Playwright/Next/Hocuspocus", async () => {
    const provider = createNoopProvider();
    const doc = new Doc();
    // Ensure the root type exists and is integrated with the doc before Lexical-Yjs tries to read/write attrs.
    doc.get("root", XmlText);
    const docMap = new Map<string, Doc>([["main", doc]]);

    const editor = createEditor({
      namespace: "lexical-yjs-repro",
      nodes: [
        ParagraphNode,
        TextNode,
        // Suggested-edits nodes (plain ElementNodes from Lexical's POV).
        SuggestionDeletionInlineNode,
        SuggestionInsertionInlineNode,
      ],
      onError: (e) => {
        throw e;
      },
    });

    const binding = createBinding(
      editor,
      provider,
      "main",
      doc,
      docMap,
    );

    const rootXmlText = getBindingRootXmlText(binding);
    const undoManager: UndoManager = createUndoManager(binding, rootXmlText);

    // Wire Lexical -> Yjs
    editor.registerUpdateListener(
      ({ editorState, prevEditorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
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
      },
    );

    // Wire Yjs -> Lexical ONLY for UndoManager transactions (disable cursor sync to keep this DOM-free).
    // This keeps the repro minimal and avoids feedback loops (local Lexical->Yjs writes).
    rootXmlText.observeDeep((events) => {
      const origin = events[0].transaction.origin;
      const isFromUndoManager = origin === undoManager || origin?.constructor?.name === "UndoManager";
      if (!isFromUndoManager) return;
      syncYjsChangesToLexical(
        binding,
        provider,
        events,
        isFromUndoManager,
        () => {},
      );
    });

    // Initial doc: "hello"
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode("hello"));
      root.append(p);
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hello");
    // Prevent Yjs UndoManager from coalescing unrelated operations into one undo item.
    undoManager.stopCapturing();

    // Create a replacement suggestion on "ell" -> "X":
    // Lexical textContent becomes "hellXo" while the suggestion is visible.
    editor.update(() => {
      const root = $getRoot();
      const p = root.getFirstChild() as ParagraphNode;
      p.clear();

      const suggestionId = "s1";
      const meta = {
        suggestionId,
        authorUserId: "u",
        authorName: "U",
        createdAtMs: 0,
      };

      p.append($createTextNode("h"));
      const deletion = $createSuggestionDeletionInlineNode({ ...meta, suggestionType: "deletion" as const });
      deletion.append($createTextNode("ell"));
      const insertion = $createSuggestionInsertionInlineNode({ ...meta, suggestionType: "insertion" as const });
      insertion.append($createTextNode("X"));
      p.append(deletion);
      p.append(insertion);
      p.append($createTextNode("o"));
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hellXo");
    undoManager.stopCapturing();

    // "Reject" the suggestion by returning to the original content.
    editor.update(() => {
      const root = $getRoot();
      const p = root.getFirstChild() as ParagraphNode;
      p.clear();
      p.append($createTextNode("hello"));
    });
    await flushLexical();
    expect(getEditorText(editor.getEditorState())).toBe("hello");
    undoManager.stopCapturing();

    // Undo should restore the suggestion state: expected "hellXo".
    undoManager.undo();
    await flushLexical();

    // If @lexical/yjs is buggy, this will become "hellXoello" (duplicated suffix) or otherwise corrupt.
    expect(getEditorText(editor.getEditorState())).toBe("hellXo");
  });
});


