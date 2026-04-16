import {
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type ElementNode,
  type LexicalNode,
  type RangeSelection,
} from "lexical";
import { $isLinkNode } from "@lexical/link";
import { $createSuggestionNode, $isSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import {
  $insertInlineSuggestionNode,
  $wrapSelectionInSuggestionNode,
} from "@/components/editor/lexicalPlugins/suggestedEdits/Utils";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";

interface LinkStructure {
  linkCount: number;
  suggestionsInsideLinks: Array<{ type: string; textContent: string }>;
  suggestionsOutsideLinks: Array<{ type: string; textContent: string }>;
}

function dumpLinkStructure(editor: { getEditorState(): { read(cb: () => void): void } }): LinkStructure {
  const suggestionsInsideLinks: Array<{ type: string; textContent: string }> = [];
  const suggestionsOutsideLinks: Array<{ type: string; textContent: string }> = [];
  let linkCount = 0;
  editor.getEditorState().read(() => {
    function walk(node: LexicalNode, inLink: boolean) {
      if ($isLinkNode(node)) {
        linkCount += 1;
        for (const child of node.getChildren()) walk(child, true);
        return;
      }
      if ($isSuggestionNode(node)) {
        const info = { type: node.getSuggestionTypeOrThrow(), textContent: node.getTextContent() };
        if (inLink) suggestionsInsideLinks.push(info);
        else suggestionsOutsideLinks.push(info);
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) walk(child, inLink);
      }
    }
    walk($getRoot(), false);
  });
  return { linkCount, suggestionsInsideLinks, suggestionsOutsideLinks };
}

function findFirstLink(root: ElementNode): ElementNode | null {
  for (const child of root.getChildren()) {
    if ($isLinkNode(child)) return child;
    if ($isElementNode(child)) {
      const found = findFirstLink(child);
      if (found) return found;
    }
  }
  return null;
}

function $currentRangeSelectionOrThrow(): RangeSelection {
  const sel = $getSelection();
  if (!$isRangeSelection(sel)) throw new Error("expected RangeSelection");
  return sel;
}

describe("$insertInlineSuggestionNode preserves enclosing inline ancestors", () => {
  // Repro of Luc Brinkman's 2026-03-31 bug: performing a replace suggestion
  // (delete + insert) inside a hyperlink used to split the link in two, with
  // the new text landing between the halves instead of inside the link.
  it("keeps the link intact when a replace suggestion lands inside it", async () => {
    const editor = await setupEditorWithContent(
      "Visit [LessWrong](https://example.com) for details."
    );

    await runEditorUpdate(editor, () => {
      const link = findFirstLink($getRoot());
      if (!link) throw new Error("Expected a link node in the seeded content");
      const linkTextChild = link.getFirstChild();
      if (!linkTextChild || !$isTextNode(linkTextChild)) {
        throw new Error("Expected link to wrap a single text node");
      }

      // Select "LessWrong" entirely inside the link, then invoke the two
      // steps of the user-driven replace-suggestion flow: wrap the selection
      // in a delete suggestion, then insert a new insert suggestion at the
      // resulting collapsed cursor.
      const selection = $createRangeSelection();
      selection.anchor.set(linkTextChild.getKey(), 0, "text");
      selection.focus.set(linkTextChild.getKey(), linkTextChild.getTextContentSize(), "text");
      $setSelection(selection);

      const suggestionId = "test-replace-in-link";
      $wrapSelectionInSuggestionNode(selection, selection.isBackward(), suggestionId, "delete");

      const insertNode = $createSuggestionNode(suggestionId, "insert");
      insertNode.append($createTextNode("Rationality"));
      $insertInlineSuggestionNode($currentRangeSelectionOrThrow(), insertNode);
    });

    const dump = dumpLinkStructure(editor);

    // Both halves of the replace suggestion should live inside the link, and
    // the link itself should still be a single node (not split in two).
    expect(dump.linkCount).toBe(1);
    expect(dump.suggestionsInsideLinks.some((s) => s.type === "delete" && s.textContent === "LessWrong")).toBe(true);
    expect(dump.suggestionsInsideLinks.some((s) => s.type === "insert" && s.textContent === "Rationality")).toBe(true);
    expect(dump.suggestionsOutsideLinks).toEqual([]);
  });

  it("inserts at a mid-text caret without splitting the link", async () => {
    const editor = await setupEditorWithContent(
      "See [LessWrong](https://example.com) today."
    );

    await runEditorUpdate(editor, () => {
      const link = findFirstLink($getRoot());
      if (!link) throw new Error("Expected a link node in the seeded content");
      const linkTextChild = link.getFirstChild();
      if (!linkTextChild || !$isTextNode(linkTextChild)) {
        throw new Error("Expected link to wrap a single text node");
      }

      // Collapsed caret between "Less" and "Wrong".
      const selection = $createRangeSelection();
      selection.anchor.set(linkTextChild.getKey(), 4, "text");
      selection.focus.set(linkTextChild.getKey(), 4, "text");
      $setSelection(selection);

      const insertNode = $createSuggestionNode("mid-insert", "insert");
      insertNode.append($createTextNode("-er-"));
      $insertInlineSuggestionNode($currentRangeSelectionOrThrow(), insertNode);
    });

    const dump = dumpLinkStructure(editor);
    expect(dump.linkCount).toBe(1);
    expect(dump.suggestionsInsideLinks.some((s) => s.type === "insert" && s.textContent === "-er-")).toBe(true);
    expect(dump.suggestionsOutsideLinks).toEqual([]);
  });

  it("inserts at a mid-text caret in plain text (no inline ancestor) at the right offset", async () => {
    // The plain-text path goes through the block-element branch of the walk,
    // so the suggestion should still land at the cursor without duplicating
    // or losing surrounding content.
    const editor = await setupEditorWithContent("Hello world.");

    await runEditorUpdate(editor, () => {
      const paragraph = $getRoot().getFirstChild();
      if (!paragraph || !$isElementNode(paragraph)) throw new Error("expected paragraph");
      const text = paragraph.getFirstChild();
      if (!text || !$isTextNode(text)) throw new Error("expected text node");

      // Caret after "Hello" (before the space).
      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 5, "text");
      selection.focus.set(text.getKey(), 5, "text");
      $setSelection(selection);

      const insertNode = $createSuggestionNode("plain-insert", "insert");
      insertNode.append($createTextNode(" big"));
      $insertInlineSuggestionNode($currentRangeSelectionOrThrow(), insertNode);
    });

    let fullText = "";
    editor.getEditorState().read(() => {
      fullText = $getRoot().getTextContent();
    });
    expect(fullText).toBe("Hello big world.");
  });
});
