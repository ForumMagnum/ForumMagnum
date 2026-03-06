import { $getRoot, $isElementNode, type LexicalEditor } from "lexical";
import { $isSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { $insertMarkdownBlockInEditor } from "../../../app/api/agent/insertBlock/route";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";
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
  const texts: string[] = [];
  editor.getEditorState().read(() => {
    const root = $getRoot();
    for (const child of root.getChildren()) {
      if ($isElementNode(child)) {
        for (const descendant of child.getChildren()) {
          if ($isSuggestionNode(descendant)) {
            texts.push(descendant.getTextContent());
          }
        }
      }
    }
  });
  return texts;
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
    expect(suggestionTexts.length).toBeGreaterThan(0);

    const fullSuggestionText = suggestionTexts.join("");
    expect(fullSuggestionText).toContain("This paragraph was inserted at the");
    expect(fullSuggestionText).toContain("end");
    expect(fullSuggestionText).toContain("by TestAgent.");
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
    expect(suggestionTexts.length).toBeGreaterThan(0);

    const fullSuggestionText = suggestionTexts.join("");
    expect(fullSuggestionText).toContain("Inserted paragraph with some content.");
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
    expect(suggestionTexts.length).toBeGreaterThan(0);

    const fullSuggestionText = suggestionTexts.join("");
    expect(fullSuggestionText).toContain("New first paragraph.");
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
    expect(suggestionTexts.length).toBeGreaterThan(0);

    const fullSuggestionText = suggestionTexts.join(" ");
    expect(fullSuggestionText).toContain("First inserted.");
    expect(fullSuggestionText).toContain("Second inserted.");
  });
});
