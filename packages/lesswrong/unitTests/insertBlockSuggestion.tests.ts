import { $getRoot, $isElementNode, type LexicalEditor } from "lexical";
import { $isSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { $insertMarkdownBlockInEditor } from "../../../app/api/agent/insertBlock/route";
import { getAllSuggestions, runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";
import type { InsertLocation } from "../../../app/api/agent/toolSchemas";

async function insertBlock(
  editor: LexicalEditor,
  markdown: string,
  location: InsertLocation,
  mode: "edit" | "suggest" = "suggest",
): Promise<void> {
  await runEditorUpdate(editor, () => {
    $insertMarkdownBlockInEditor({ editor, mode, location, markdown });
  });
}

function getAllSuggestionTexts(editor: LexicalEditor): string[] {
  return getAllSuggestions(editor).map(s => s.textContent);
}

function countInsertedNodesWithSuggestions(editor: LexicalEditor): { total: number, withSuggestions: number } {
  let total = 0;
  let withSuggestions = 0;
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    // Original doc always has nodes at the start and end; inserted nodes are in between.
    for (let i = 1; i < children.length - 1; i++) {
      total++;
      const child = children[i];
      if ($isSuggestionNode(child)) {
        withSuggestions++;
      } else if ($isElementNode(child)) {
        if (child.getChildren().some(c => $isSuggestionNode(c))) {
          withSuggestions++;
        }
      }
    }
  });
  return { total, withSuggestions };
}

describe("insertBlock suggest mode", () => {
  it("wraps the entire inserted paragraph in a suggestion node when inserting at end", async () => {
    const editor = await setupEditorWithContent(
      "Hello Claude! This is a test post.\n\nThis is a second paragraph."
    );

    await insertBlock(
      editor,
      "This paragraph was inserted at the **end** by TestAgent.",
      "end",
    );

    const suggestionTexts = getAllSuggestionTexts(editor);
    expect(suggestionTexts.length).toBe(1);
    expect(suggestionTexts[0]).toBe("This paragraph was inserted at the end by TestAgent.");
  });

  it("does not split the first word of inserted text when inserting after first paragraph", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    );

    await insertBlock(
      editor,
      "Inserted paragraph with some content.",
      { after: "First paragraph" },
    );

    const suggestionTexts = getAllSuggestionTexts(editor);
    expect(suggestionTexts.length).toBe(1);
    expect(suggestionTexts[0]).toBe("Inserted paragraph with some content.");
  });

  it("wraps correctly when inserting at the start", async () => {
    const editor = await setupEditorWithContent(
      "Existing paragraph."
    );

    await insertBlock(
      editor,
      "New first paragraph.",
      "start",
    );

    const suggestionTexts = getAllSuggestionTexts(editor);
    expect(suggestionTexts.length).toBe(1);
    expect(suggestionTexts[0]).toBe("New first paragraph.");
  });

  it("wraps a standalone horizontal rule in a suggestion node", async () => {
    const editor = await setupEditorWithContent(
      "Before.\n\nAfter."
    );

    await insertBlock(
      editor,
      "---",
      { before: "After" },
    );

    const { total, withSuggestions } = countInsertedNodesWithSuggestions(editor);
    expect(total).toBe(1);
    expect(withSuggestions).toBe(1);
  });

  it("wraps inserted content containing a horizontal rule in suggestion nodes", async () => {
    const editor = await setupEditorWithContent(
      "Before.\n\nAfter."
    );

    await insertBlock(
      editor,
      "Text above rule.\n\n---\n\nText below rule.",
      { before: "After" },
    );

    const { total, withSuggestions } = countInsertedNodesWithSuggestions(editor);
    expect(total).toBe(3);
    expect(withSuggestions).toBe(3);
  });

  it("wraps multiple inserted paragraphs correctly", async () => {
    const editor = await setupEditorWithContent(
      "Before.\n\nAfter."
    );

    await insertBlock(
      editor,
      "First inserted.\n\nSecond inserted.",
      { before: "After" },
    );

    const suggestionTexts = getAllSuggestionTexts(editor);
    expect(suggestionTexts.length).toBe(2);
    expect(suggestionTexts[0]).toBe("First inserted.");
    expect(suggestionTexts[1]).toBe("Second inserted.");
  });
});
