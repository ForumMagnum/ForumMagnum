import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $isIframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { $insertMarkdownBlockInEditor, $postMarkdownToNodes } from "../../../app/api/agent/insertBlock/route";
import { $insertWidgetInEditor } from "../../../app/api/agent/insertWidget/route";
import { $tidyParentAfterBlockRemoval } from "../../../app/api/agent/deleteBlock/route";
import { $locateBlockByPrefix } from "../../../app/api/agent/textIndexQuoteLocator";
import type { InsertLocation } from "../../../app/api/agent/toolSchemas";
import { getAllSuggestions, runEditorUpdate, setupEditorWithHtml } from "./lexicalTestHelpers";

const sectionHtml = `<p>Intro</p>`
  + `<details class="detailsBlock"><summary class="detailsBlockTitle">My Section</summary>`
  + `<div class="detailsBlockContent"><p>Inside one</p><p>Inside two</p></div></details>`
  + `<p>Outro</p>`;

/** An indented outline of the tree: element types, with text for paragraphs and widget IDs. */
function describeTree(editor: LexicalEditor): string[] {
  const lines: string[] = [];
  const visit = (node: LexicalNode, depth: number): void => {
    const indent = "  ".repeat(depth);
    if ($isIframeWidgetNode(node)) {
      lines.push(`${indent}widget ${node.getWidgetId()}`);
    } else if (node.getType() === "paragraph" || node.getType() === "collapsible-section-title") {
      lines.push(`${indent}${node.getType()}: ${node.getTextContent()}`);
    } else if ($isElementNode(node)) {
      lines.push(`${indent}${node.getType()}`);
      node.getChildren().forEach((child) => visit(child, depth + 1));
    } else {
      lines.push(`${indent}${node.getType()}`);
    }
  };
  editor.getEditorState().read(() => {
    $getRoot().getChildren().forEach((child) => visit(child, 0));
  });
  return lines;
}

async function insertBlock(editor: LexicalEditor, markdown: string, location: InsertLocation, mode: "edit" | "suggest" = "edit"): Promise<string> {
  let note = "";
  await runEditorUpdate(editor, () => {
    note = $insertMarkdownBlockInEditor({ editor, mode, location, markdown, markdownToNodes: $postMarkdownToNodes }).note;
  });
  return note;
}

async function insertWidget(editor: LexicalEditor, location: InsertLocation): Promise<string | undefined> {
  let widgetId: string | undefined;
  await runEditorUpdate(editor, () => {
    widgetId = $insertWidgetInEditor({ content: "<div>widget</div>", location }).widgetId;
  });
  return widgetId;
}

describe("agent insertion inside collapsible sections", () => {
  it("inserts after a paragraph inside a collapsible section's body", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    await insertBlock(editor, "New paragraph", { after: "Inside one" });
    expect(describeTree(editor)).toEqual([
      "paragraph: Intro",
      "collapsible-section-container",
      "  collapsible-section-title: My Section",
      "  collapsible-section-content",
      "    paragraph: Inside one",
      "    paragraph: New paragraph",
      "    paragraph: Inside two",
      "paragraph: Outro",
    ]);
  });

  it("wraps an insertion inside a collapsible section's body as a suggestion", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    await insertBlock(editor, "Suggested paragraph", { after: "Inside one" }, "suggest");
    expect(getAllSuggestions(editor).map((suggestion) => suggestion.textContent)).toEqual(["Suggested paragraph"]);
    expect(describeTree(editor).slice(4, 7)).toEqual([
      "    paragraph: Inside one",
      "    paragraph: Suggested paragraph",
      "    paragraph: Inside two",
    ]);
  });

  it("inserts a widget before a paragraph inside a collapsible section's body", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    const widgetId = await insertWidget(editor, { before: "Inside two" });
    expect(describeTree(editor).slice(3, 7)).toEqual([
      "  collapsible-section-content",
      "    paragraph: Inside one",
      `    widget ${widgetId}`,
      "    paragraph: Inside two",
    ]);
  });

  it("inserts at the start and end of a section's body with the inside location", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    const firstId = await insertWidget(editor, { inside: "+++ My Section", position: "start" });
    const lastId = await insertWidget(editor, { inside: "+++ My Section", position: "end" });
    expect(describeTree(editor).slice(3, 8)).toEqual([
      "  collapsible-section-content",
      `    widget ${firstId}`,
      "    paragraph: Inside one",
      "    paragraph: Inside two",
      `    widget ${lastId}`,
    ]);
  });

  it("still inserts after the whole section when located by its title", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    await insertBlock(editor, "After section", { after: "+++ My Section" });
    expect(describeTree(editor).slice(-2)).toEqual([
      "paragraph: After section",
      "paragraph: Outro",
    ]);
  });

  it("rejects an inside location that doesn't match a collapsible section", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    const note = await insertBlock(editor, "Nope", { inside: "Intro", position: "end" });
    expect(note).toContain("collapsible section");
    expect(describeTree(editor)).toHaveLength(7);
  });
});

describe("widget fences in insertBlock markdown", () => {
  it("creates a widget node for a fence inside a collapsible section", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    await insertBlock(editor, "+++ Tweets\n\nBefore\n\n```widget[w1]\n<div>a</div>\n\n<p>b</p>\n```\n\nAfter\n\n+++", "end");
    expect(describeTree(editor)).toEqual([
      "paragraph: Intro",
      "collapsible-section-container",
      "  collapsible-section-title: Tweets",
      "  collapsible-section-content",
      "    paragraph: Before",
      "    widget w1",
      "    paragraph: After",
    ]);
    editor.getEditorState().read(() => {
      const widget = $locateBlockByPrefix("```widget[w1]").node;
      expect(widget?.getTextContent()).toBe("<div>a</div>\n\n<p>b</p>");
    });
  });

  it("creates a widget node for a fence mixed with other top-level markdown", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    await insertBlock(editor, "Before\n\n```widget[w2]\n<div>a</div>\n```\n\nAfter", "end");
    expect(describeTree(editor)).toEqual([
      "paragraph: Intro",
      "paragraph: Before",
      "widget w2",
      "paragraph: After",
    ]);
  });
});

describe("block location by widget fence", () => {
  it("locates a widget nested in a collapsible section by its ID, and inserts after it", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    const widgetId = await insertWidget(editor, { after: "Inside one" });
    await insertBlock(editor, "Below the widget", { after: "```widget[" + widgetId + "]" });
    expect(describeTree(editor).slice(4, 8)).toEqual([
      "    paragraph: Inside one",
      `    widget ${widgetId}`,
      "    paragraph: Below the widget",
      "    paragraph: Inside two",
    ]);
  });

  it("reports an unknown widget ID", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    editor.getEditorState().read(() => {
      expect($locateBlockByPrefix("```widget[missing]").reason).toContain("No widget with ID");
    });
  });

  it("keeps a collapsible section's body editable after deleting its only block", async () => {
    const editor = await setupEditorWithHtml(
      `<details class="detailsBlock"><summary class="detailsBlockTitle">Solo</summary>`
      + `<div class="detailsBlockContent"><p>Only child</p></div></details>`
    );
    await runEditorUpdate(editor, () => {
      const block = $locateBlockByPrefix("Only child").node;
      const parent = block?.getParent();
      if (!block || !parent) throw new Error("Expected to locate the section's only block");
      block.remove();
      $tidyParentAfterBlockRemoval(parent);
    });
    expect(describeTree(editor)).toEqual([
      "collapsible-section-container",
      "  collapsible-section-title: Solo",
      "  collapsible-section-content",
      "    paragraph: ",
    ]);
  });
});
