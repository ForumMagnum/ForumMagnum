import { $createTextNode, $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $createIframeWidgetNode, $isIframeWidgetNode } from "@/components/lexical/embeds/IframeWidgetEmbed/IframeWidgetNode";
import { $acceptSuggestion } from "@/components/editor/lexicalPlugins/suggestedEdits/acceptSuggestion";
import { $rejectSuggestion } from "@/components/editor/lexicalPlugins/suggestedEdits/rejectSuggestion";
import { randomId } from "@/lib/random";
import { $insertMarkdownBlockInEditor, $postMarkdownToNodes } from "../../../app/api/agent/insertBlock/route";
import { $insertWidgetInEditor } from "../../../app/api/agent/insertWidget/route";
import { $replaceWidgetInEditor } from "../../../app/api/agent/replaceWidget/route";
import { $removeBlock, $wrapBlockAsDeletionSuggestion } from "../../../app/api/agent/deleteBlock/route";
import { $collectWidgetNodes, $locateBlockByPrefix } from "../../../app/api/agent/textIndexQuoteLocator";
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

/** Each widget in the document, as "id: content", in document order. */
function describeWidgets(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() =>
    $collectWidgetNodes($getRoot()).map((widgetNode) => `${widgetNode.getWidgetId()}: ${widgetNode.getTextContent()}`)
  );
}

/** Wrap the block matching `prefix` as a deletion suggestion, returning its ID (null if it couldn't be wrapped). */
async function suggestBlockDeletion(editor: LexicalEditor, prefix: string): Promise<string | null> {
  const suggestionId = randomId();
  let wrapped = false;
  await runEditorUpdate(editor, () => {
    const block = $locateBlockByPrefix(prefix).node;
    if (!block) throw new Error(`No block matched prefix: ${prefix}`);
    wrapped = $wrapBlockAsDeletionSuggestion(block, suggestionId);
  });
  return wrapped ? suggestionId : null;
}

async function resolveSuggestion(editor: LexicalEditor, suggestionId: string, resolution: "accept" | "reject"): Promise<void> {
  await runEditorUpdate(editor, () => {
    if (resolution === "accept") {
      $acceptSuggestion(suggestionId);
    } else {
      $rejectSuggestion(suggestionId);
    }
  });
}

async function removeBlock(editor: LexicalEditor, prefix: string): Promise<void> {
  await runEditorUpdate(editor, () => {
    const block = $locateBlockByPrefix(prefix).node;
    if (!block) throw new Error(`No block matched prefix: ${prefix}`);
    $removeBlock(block);
  });
}

async function appendWidget(editor: LexicalEditor, widgetId: string, content: string): Promise<void> {
  await runEditorUpdate(editor, () => {
    const widgetNode = $createIframeWidgetNode(widgetId);
    widgetNode.append($createTextNode(content));
    $getRoot().append(widgetNode);
  });
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

describe("collapsible section title locators", () => {
  // The body's first block starts with the section's title text.
  const echoedTitleHtml = `<details class="detailsBlock"><summary class="detailsBlockTitle">Notes</summary>`
    + `<div class="detailsBlockContent"><p>Notes on the method</p></div></details>`
    + `<p>Outro</p>`;

  it("inserts inside a section whose body starts with its title's text", async () => {
    const editor = await setupEditorWithHtml(echoedTitleHtml);
    await insertBlock(editor, "Appended", { inside: "+++ Notes", position: "end" });
    await insertBlock(editor, "Prepended", { inside: "Notes", position: "start" });
    expect(describeTree(editor).slice(2, 6)).toEqual([
      "  collapsible-section-content",
      "    paragraph: Prepended",
      "    paragraph: Notes on the method",
      "    paragraph: Appended",
    ]);
  });

  it("inserts after the whole section when its title line is matched", async () => {
    const editor = await setupEditorWithHtml(echoedTitleHtml);
    await insertBlock(editor, "After section", { after: "+++ Notes" });
    expect(describeTree(editor).slice(-2)).toEqual([
      "paragraph: After section",
      "paragraph: Outro",
    ]);
  });
});

describe("suggested block deletions", () => {
  it("covers all of a later block's text inside a section", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    const suggestionId = await suggestBlockDeletion(editor, "Inside two");
    if (!suggestionId) throw new Error("Expected the block to be wrapped");
    expect(getAllSuggestions(editor)).toEqual([{ type: "delete", textContent: "Inside two" }]);

    await resolveSuggestion(editor, suggestionId, "accept");
    // Accepting removes the block's text; its now-empty paragraph remains.
    expect(describeTree(editor).slice(4, 6)).toEqual([
      "    paragraph: Inside one",
      "    paragraph: ",
    ]);
  });

  it("restores a later top-level block when rejected", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    const suggestionId = await suggestBlockDeletion(editor, "Outro");
    if (!suggestionId) throw new Error("Expected the block to be wrapped");
    expect(getAllSuggestions(editor)).toEqual([{ type: "delete", textContent: "Outro" }]);

    await resolveSuggestion(editor, suggestionId, "reject");
    expect(getAllSuggestions(editor)).toEqual([]);
    expect(describeTree(editor).slice(-1)).toEqual(["paragraph: Outro"]);
  });

  it("refuses to suggest deleting a widget", async () => {
    const editor = await setupEditorWithHtml(sectionHtml);
    const widgetId = await insertWidget(editor, { after: "Inside one" });
    expect(await suggestBlockDeletion(editor, "```widget[" + widgetId + "]")).toBeNull();
    expect(getAllSuggestions(editor)).toEqual([]);
    expect(describeWidgets(editor)).toEqual([`${widgetId}: <div>widget</div>`]);
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

  it("keeps each fence's content to itself when markdown starts and ends with fences", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    await insertBlock(editor, "```widget[a]\n<div>A</div>\n```\n\n```widget[b]\n<div>B</div>\n```\n\nSome text\n\n```js\nx\n```", "end");
    expect(describeWidgets(editor)).toEqual(["a: <div>A</div>", "b: <div>B</div>"]);
    expect(describeTree(editor).slice(0, 4)).toEqual([
      "paragraph: Intro",
      "widget a",
      "widget b",
      "paragraph: Some text",
    ]);
  });

  it("creates a widget node for a fence inside a blockquote", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    await insertBlock(editor, "> quoted\n>\n> ```widget[q]\n> <div/>\n> ```", "end");
    expect(describeTree(editor)).toEqual([
      "paragraph: Intro",
      "quote",
      "  paragraph: quoted",
      "  widget q",
    ]);
    expect(describeWidgets(editor)).toEqual(["q: <div/>"]);
  });

  it("creates a widget node for a fence with CRLF line endings", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    await insertBlock(editor, "```widget[c]\r\n<div>A</div>\r\n```", "end");
    expect(describeWidgets(editor)).toEqual(["c: <div>A</div>"]);
  });

  it("refuses a fence inside a list item", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    const note = await insertBlock(editor, "1. step one\n2. ```widget[x]\n   <div>A</div>\n   ```", "end");
    expect(note).toContain("list item");
    expect(describeTree(editor)).toEqual(["paragraph: Intro"]);
  });

  it("refuses to insert a widget as a suggestion", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    const note = await insertBlock(editor, "Before\n\n```widget[w]\n<div>A</div>\n```", "end", "suggest");
    expect(note).toContain("mode \"edit\"");
    expect(describeTree(editor)).toEqual(["paragraph: Intro"]);
    expect(getAllSuggestions(editor)).toEqual([]);
  });

  it("refuses a widget ID that's already in the document", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    await insertBlock(editor, "```widget[w1]\n<div>first</div>\n```", "end");
    const note = await insertBlock(editor, "```widget[w1]\n<div>second</div>\n```", "end");
    expect(note).toContain("already in use");
    expect(describeWidgets(editor)).toEqual(["w1: <div>first</div>"]);
  });

  it("refuses the same widget ID twice in one insertion", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    const note = await insertBlock(editor, "```widget[w1]\n<div>A</div>\n```\n\n```widget[w1]\n<div>B</div>\n```", "end");
    expect(note).toContain("already in use");
    expect(describeWidgets(editor)).toEqual([]);
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

  it("refuses to pick between widgets that share an ID", async () => {
    const editor = await setupEditorWithHtml("<p>Intro</p>");
    await appendWidget(editor, "dup", "<div>first</div>");
    await appendWidget(editor, "dup", "<div>second</div>");
    editor.getEditorState().read(() => {
      expect($locateBlockByPrefix("```widget[dup]").reason).toContain("Ambiguous widget ID");
    });
    let note = "";
    await runEditorUpdate(editor, () => {
      note = $replaceWidgetInEditor({ widgetId: "dup", replacement: "<div>new</div>", mode: "edit" }).note;
    });
    expect(note).toContain("Ambiguous widget id");
    expect(describeWidgets(editor)).toEqual(["dup: <div>first</div>", "dup: <div>second</div>"]);
  });
});

describe("removing a collapsible section's last block", () => {
  it("keeps the section's body editable after deleting its only block", async () => {
    const editor = await setupEditorWithHtml(
      `<details class="detailsBlock"><summary class="detailsBlockTitle">Solo</summary>`
      + `<div class="detailsBlockContent"><p>Only child</p></div></details>`
    );
    await removeBlock(editor, "Only child");
    expect(describeTree(editor)).toEqual([
      "collapsible-section-container",
      "  collapsible-section-title: Solo",
      "  collapsible-section-content",
      "    paragraph: ",
    ]);
  });

  it("keeps the section's body editable after deleting the only item of its only list", async () => {
    const editor = await setupEditorWithHtml(
      `<details class="detailsBlock"><summary class="detailsBlockTitle">Solo</summary>`
      + `<div class="detailsBlockContent"><ul><li>only item</li></ul></div></details>`
    );
    await removeBlock(editor, "only item");
    expect(describeTree(editor)).toEqual([
      "collapsible-section-container",
      "  collapsible-section-title: Solo",
      "  collapsible-section-content",
      "    paragraph: ",
    ]);
  });
});
