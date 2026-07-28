import { JSDOM } from "jsdom";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $createLinkNode, $isLinkNode } from "@lexical/link";
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $insertNodes,
  $isTextNode,
  $setSelection,
  createEditor,
  type LexicalEditor,
  type LexicalNode,
  type TextNode,
} from "lexical";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import {
  $isHoverPreviewNode,
  $setHoverPreviewOnSelection,
  hoverPreviewEditorNodes,
  type HoverPreviewNode,
} from "@/components/editor/lexicalPlugins/links/HoverPreviewNode";
import { HOVER_PREVIEW_ATTRIBUTE } from "@/lib/utils/hoverPreviewConstants";

import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate, setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

const PREVIEW_HTML = "<p>A note.</p>";
const ESCAPED_PREVIEW_HTML = "&lt;p&gt;A note.&lt;/p&gt;";
const LINK_URL = "https://example.com/x";

function exportHtml(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });
  return html;
}

function parseFragment(html: string): Document {
  return new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`).window.document;
}

function findHoverPreviewNodes(editor: LexicalEditor): HoverPreviewNode[] {
  const previews: HoverPreviewNode[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node: LexicalNode) => {
      if ($isHoverPreviewNode(node)) {
        previews.push(node);
      }
    });
  });
  return previews;
}

/** The first TextNode in the document, which every fixture here has exactly one of. */
function $firstTextNode(): TextNode {
  let found: TextNode | null = null;
  walkLexicalNodes($getRoot(), (node: LexicalNode) => {
    if (!found && $isTextNode(node)) {
      found = node;
    }
  });
  if (!found) {
    throw new Error("Fixture has no TextNode");
  }
  return found;
}

function $selectTextRange(node: TextNode, start: number, end: number): void {
  const selection = $createRangeSelection();
  selection.anchor.set(node.getKey(), start, "text");
  selection.focus.set(node.getKey(), end, "text");
  $setSelection(selection);
}

/** Select the whole of the document's first text node, then set (or clear) a preview on it. */
async function selectFirstTextAndSetPreview(editor: LexicalEditor, previewHtml: string): Promise<void> {
  await runEditorUpdate(editor, () => {
    const textNode = $firstTextNode();
    $selectTextRange(textNode, 0, textNode.getTextContentSize());
    $setHoverPreviewOnSelection(previewHtml);
  });
}

async function setupParagraphWithLink(): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("HoverPreviewNodeTest");
  await runEditorUpdate(editor, () => {
    const paragraph = $createParagraphNode();
    paragraph.append($createLinkNode(LINK_URL).append($createTextNode("text")));
    $getRoot().clear().append(paragraph);
  });
  return editor;
}

describe("HoverPreviewNode HTML import", () => {
  it("turns a span with data-hover-preview into a HoverPreviewNode carrying the unescaped html", async () => {
    const editor = await setupEditorWithHtml(
      `<p><span data-hover-preview="${ESCAPED_PREVIEW_HTML}">text</span></p>`
    );

    const previews = findHoverPreviewNodes(editor);
    expect(previews).toHaveLength(1);
    editor.getEditorState().read(() => {
      expect(previews[0].getPreviewHtml()).toBe(PREVIEW_HTML);
      expect(previews[0].getTextContent()).toBe("text");
    });
  });

  it("leaves a plain span alone", async () => {
    const editor = await setupEditorWithHtml(`<p><span>text</span></p>`);

    expect(findHoverPreviewNodes(editor)).toHaveLength(0);
    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toBe("text");
    });
  });
});

describe("HoverPreviewNode HTML round-trip", () => {
  it("re-exports the preview span on unlinked text", async () => {
    const editor = await setupEditorWithHtml(
      `<p><span data-hover-preview="${ESCAPED_PREVIEW_HTML}">text</span></p>`
    );

    const doc = parseFragment(exportHtml(editor));
    const span = doc.querySelector(`span[${HOVER_PREVIEW_ATTRIBUTE}]`);
    expect(span).not.toBeNull();
    expect(span?.getAttribute(HOVER_PREVIEW_ATTRIBUTE)).toBe(PREVIEW_HTML);
    expect(span?.textContent).toBe("text");
  });

  it("re-exports the preview span wrapping (not nested inside) a link", async () => {
    const editor = await setupEditorWithHtml(
      `<p><span data-hover-preview="${ESCAPED_PREVIEW_HTML}"><a href="${LINK_URL}">text</a></span></p>`
    );

    const doc = parseFragment(exportHtml(editor));
    const span = doc.querySelector(`span[${HOVER_PREVIEW_ATTRIBUTE}]`);
    expect(span).not.toBeNull();
    expect(span?.getAttribute(HOVER_PREVIEW_ATTRIBUTE)).toBe(PREVIEW_HTML);

    // Structural assertion: the anchor is a descendant of the preview span, and
    // no preview span sits inside an anchor.
    const anchorInsideSpan = span?.querySelector("a");
    expect(anchorInsideSpan).not.toBeNull();
    expect(anchorInsideSpan?.getAttribute("href")).toBe(LINK_URL);
    expect(anchorInsideSpan?.textContent).toBe("text");
    expect(doc.querySelector(`a span[${HOVER_PREVIEW_ATTRIBUTE}]`)).toBeNull();
  });
});

describe("$setHoverPreviewOnSelection", () => {
  it("wraps a plain-text selection in a HoverPreviewNode", async () => {
    const editor = await setupEditorWithHtml(`<p>hello world</p>`);

    await runEditorUpdate(editor, () => {
      $selectTextRange($firstTextNode(), 0, "hello".length);
      $setHoverPreviewOnSelection("<p>note</p>");
    });

    const previews = findHoverPreviewNodes(editor);
    expect(previews).toHaveLength(1);
    editor.getEditorState().read(() => {
      expect(previews[0].getPreviewHtml()).toBe("<p>note</p>");
      expect(previews[0].getTextContent()).toBe("hello");
      expect($getRoot().getTextContent()).toBe("hello world");
    });
  });

  it("wraps the whole link when the selection is inside one", async () => {
    const editor = await setupParagraphWithLink();

    await selectFirstTextAndSetPreview(editor, "<p>note</p>");

    const previews = findHoverPreviewNodes(editor);
    expect(previews).toHaveLength(1);
    editor.getEditorState().read(() => {
      const children = previews[0].getChildren();
      expect(children).toHaveLength(1);
      expect($isLinkNode(children[0])).toBe(true);
      // The preview must be the link's parent, not the other way around.
      const link = children[0];
      expect(link.getParent()).toBe(previews[0]);
      expect($isHoverPreviewNode(previews[0].getParent())).toBe(false);
      expect($isLinkNode(previews[0].getParent())).toBe(false);
      expect(previews[0].getTextContent()).toBe("text");
    });
  });

  it("unwraps the preview when called with an empty string", async () => {
    const editor = await setupEditorWithHtml(
      `<p><span data-hover-preview="${ESCAPED_PREVIEW_HTML}"><a href="${LINK_URL}">text</a></span></p>`
    );
    expect(findHoverPreviewNodes(editor)).toHaveLength(1);

    await selectFirstTextAndSetPreview(editor, "");

    expect(findHoverPreviewNodes(editor)).toHaveLength(0);
    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toBe("text");
      const links: LexicalNode[] = [];
      walkLexicalNodes($getRoot(), (node) => {
        if ($isLinkNode(node)) {
          links.push(node);
        }
      });
      expect(links).toHaveLength(1);
      expect(links[0].getTextContent()).toBe("text");
    });

    const doc = parseFragment(exportHtml(editor));
    expect(doc.querySelector(`span[${HOVER_PREVIEW_ATTRIBUTE}]`)).toBeNull();
    expect(doc.querySelector("a")?.getAttribute("href")).toBe(LINK_URL);
  });

  it("replaces the previewHtml in place rather than nesting a second preview", async () => {
    const editor = await setupEditorWithHtml(
      `<p><span data-hover-preview="${ESCAPED_PREVIEW_HTML}">text</span></p>`
    );

    await selectFirstTextAndSetPreview(editor, "<p>Updated note.</p>");

    const previews = findHoverPreviewNodes(editor);
    expect(previews).toHaveLength(1);
    editor.getEditorState().read(() => {
      expect(previews[0].getPreviewHtml()).toBe("<p>Updated note.</p>");
      expect(previews[0].getTextContent()).toBe("text");
    });
  });
});

describe("the node set used inside a preview body", () => {
  // A preview may contain previews. Registering HoverPreviewNode is what keeps a
  // nested one alive: without it the attribute is silently dropped on import.
  it("round-trips a nested preview", () => {
    const nested = `<p><span data-hover-preview="${ESCAPED_PREVIEW_HTML}">deep</span></p>`;
    const editor = createEditor({
      nodes: hoverPreviewEditorNodes,
      onError: (error) => { throw error; },
    });

    let html = "";
    withDomGlobals(() => {
      editor.update(() => {
        const doc = parseFragment(nested);
        $getRoot().clear();
        $insertNodes($generateNodesFromDOM(editor, doc));
      }, { discrete: true });
      editor.getEditorState().read(() => {
        html = $generateHtmlFromNodes(editor, null);
      });
    });

    const span = parseFragment(html).querySelector(`span[${HOVER_PREVIEW_ATTRIBUTE}]`);
    expect(span).not.toBeNull();
    expect(span?.getAttribute(HOVER_PREVIEW_ATTRIBUTE)).toBe(PREVIEW_HTML);
    expect(span?.textContent).toBe("deep");
  });
});
