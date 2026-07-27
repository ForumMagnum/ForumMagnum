import { $getRoot, type LexicalEditor } from "lexical";
import {
  $initializeEmptyMainDocRoot,
  createHeadlessEditor,
} from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate } from "./lexicalTestHelpers";

function getRootSnapshot(editor: LexicalEditor): {
  childTypes: string[]
  textContent: string
} {
  let childTypes: string[] = [];
  let textContent = "";
  editor.getEditorState().read(() => {
    const root = $getRoot();
    childTypes = root.getChildren().map((node) => node.getType());
    textContent = root.getTextContent();
  });
  return { childTypes, textContent };
}

describe("$initializeEmptyMainDocRoot", () => {
  it("creates an empty paragraph for a brand-new empty draft", async () => {
    const editor = createHeadlessEditor("EmptyDraftBootstrap");

    await runEditorUpdate(editor, () => {
      expect($initializeEmptyMainDocRoot(editor, "")).toBe(true);
    });

    expect(getRootSnapshot(editor)).toEqual({
      childTypes: ["paragraph"],
      textContent: "",
    });
  });

  it("restores the latest revision HTML into an empty live document", async () => {
    const editor = createHeadlessEditor("RevisionBootstrap");

    await runEditorUpdate(editor, () => {
      expect(
        $initializeEmptyMainDocRoot(
          editor,
          "<h2>Existing title</h2><p>Body <strong>bold</strong>.</p>",
        ),
      ).toBe(true);
    });

    expect(getRootSnapshot(editor)).toEqual({
      childTypes: ["heading", "paragraph"],
      textContent: "Existing title\n\nBody bold.",
    });
  });

  it("does not overwrite content populated by another client", async () => {
    const editor = createHeadlessEditor("ConcurrentBootstrap");

    await runEditorUpdate(editor, () => {
      $initializeEmptyMainDocRoot(editor, "<p>Existing live content</p>");
    });
    await runEditorUpdate(editor, () => {
      expect(
        $initializeEmptyMainDocRoot(editor, "<p>Stale revision content</p>"),
      ).toBe(false);
    });

    expect(getRootSnapshot(editor).textContent).toBe("Existing live content");
  });
});
