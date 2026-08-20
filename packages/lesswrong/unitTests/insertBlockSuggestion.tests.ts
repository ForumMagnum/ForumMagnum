import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $isSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { $isMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { $isFootnoteBackLinkNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteBackLinkNode";
import { $isFootnoteContentNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteContentNode";
import { $isFootnoteItemNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteItemNode";
import { $isFootnoteReferenceNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteReferenceNode";
import { $isFootnoteSectionNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $insertMarkdownBlockInEditor, $postMarkdownToNodes } from "../../../app/api/agent/insertBlock/route";
import { findMathEquations, firstDisplayMathParentType, getAllSuggestions, runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";
import type { InsertLocation } from "../../../app/api/agent/toolSchemas";

async function insertBlock(
  editor: LexicalEditor,
  markdown: string,
  location: InsertLocation,
  mode: "edit" | "suggest" = "suggest",
): Promise<void> {
  await runEditorUpdate(editor, () => {
    $insertMarkdownBlockInEditor({ editor, mode, location, markdown, markdownToNodes: $postMarkdownToNodes });
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

function findFootnoteReferenceId(node: LexicalNode): string | null {
  if ($isFootnoteReferenceNode(node)) {
    return node.getFootnoteId();
  }
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      const footnoteId = findFootnoteReferenceId(child);
      if (footnoteId) {
        return footnoteId;
      }
    }
  }
  return null;
}

function getMarkdownContent(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });
  return htmlToMarkdown(html).trim();
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

  it("matches heading locators that include markdown syntax", async () => {
    const editor = await setupEditorWithContent(
      "# Existing heading\n\nBody paragraph."
    );

    await insertBlock(
      editor,
      "Inserted after heading.",
      { after: "# Existing heading" },
    );

    const suggestionTexts = getAllSuggestionTexts(editor);
    expect(suggestionTexts.length).toBe(1);
    expect(suggestionTexts[0]).toBe("Inserted after heading.");
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

describe("insertBlock with LaTeX", () => {
  it("imports inline `$...$` math as a real MathNode", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");

    await insertBlock(
      editor,
      "A paragraph with inline math $x^2$ in it.",
      "end",
      "edit",
    );

    // The agent write path renders `$...$` through the `math-tex`-emitting
    // markdown-it instance, so it imports as a real MathNode rather than
    // landing as literal `\(...\)` text.
    expect(findMathEquations(editor)).toEqual(["x^2"]);
  });

  it("imports display `$$...$$` math as a real MathNode", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");

    await insertBlock(
      editor,
      "$$a^2 + b^2 = c^2$$",
      "end",
      "edit",
    );

    expect(findMathEquations(editor)).toEqual(["a^2 + b^2 = c^2"]);
  });
});

describe("insertBlock with LaTeX — alternate delimiter forms", () => {
  it("imports single-backslash \\(...\\) inline math as a real MathNode", async () => {
    // The matcher canonicalizes `\(...\)` to `$...$`, but the write renderer
    // (getMarkdownItForAgentPosts) only treats `$...$` / `$$...$$` as math;
    // single-backslash `\(...\)` renders as literal `(x^2)` text.
    const editor = await setupEditorWithContent("Existing paragraph.");

    await insertBlock(editor, "A paragraph with \\(x^2\\) math.", "end", "edit");

    expect(findMathEquations(editor)).toEqual(["x^2"]);
  });

  it("imports single-backslash \\[...\\] display math as a real MathNode", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");

    await insertBlock(editor, "\\[a^2 + b^2 = c^2\\]", "end", "edit");

    expect(findMathEquations(editor)).toEqual(["a^2 + b^2 = c^2"]);
  });

  it("inserts a standalone $$...$$ block as a top-level display MathNode", async () => {
    // A display equation is a block-level node; the editor's own MathPlugin
    // inserts it as a direct child of root. A standalone `$$...$$` block must
    // not end up nested inside a ParagraphNode (which exports as invalid
    // <div>-inside-<p>).
    const editor = await setupEditorWithContent("Existing paragraph.");

    await insertBlock(editor, "$$a^2 + b^2 = c^2$$", "end", "edit");

    let lastChildIsDisplayMath = false;
    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      const last = children[children.length - 1];
      lastChildIsDisplayMath = $isMathNode(last) && !last.isInline();
    });
    expect(lastChildIsDisplayMath).toBe(true);
  });
});

describe("LaTeX correctness regressions", () => {
  it("hoists a display equation embedded mid-paragraph to the top level", async () => {
    // markdown-it wraps `$$x^2$$` in a paragraph with surrounding text; a
    // display MathNode is block-level and must not stay nested in that
    // inline-content paragraph.
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertBlock(editor, "text before $$x^2$$ text after", "end", "edit");

    expect(firstDisplayMathParentType(editor)).toBe("root");
  });
});

describe("insertBlock with footnotes", () => {
  it("preserves footnote definition content in the editor node structure", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertBlock(
      editor,
      "Body with a footnote.[^note]\n\n[^note]: Definition **body** with a [link](https://example.com).",
      "end",
      "edit",
    );

    editor.getEditorState().read(() => {
      const rootChildren = $getRoot().getChildren();
      const section = rootChildren.find($isFootnoteSectionNode);
      expect(section).toBeDefined();
      if (!section) {
        throw new Error("Expected imported footnote section");
      }

      const item = section.getFirstChild();
      expect($isFootnoteItemNode(item)).toBe(true);
      if (!$isFootnoteItemNode(item)) {
        throw new Error("Expected imported footnote item");
      }

      const itemChildren = item.getChildren();
      expect(itemChildren).toHaveLength(2);
      expect($isFootnoteBackLinkNode(itemChildren[0])).toBe(true);
      expect($isFootnoteContentNode(itemChildren[1])).toBe(true);
      expect(itemChildren[1].getTextContent().replace(/\s+/g, " ").trim())
        .toBe("Definition body with a link.");

      const referenceId = rootChildren
        .map(findFootnoteReferenceId)
        .find((footnoteId) => footnoteId !== null);
      expect(referenceId).toBe(item.getFootnoteId());
    });

    expect(getMarkdownContent(editor)).toContain("Definition **body** with a [link](https://example.com).");
  });
});
