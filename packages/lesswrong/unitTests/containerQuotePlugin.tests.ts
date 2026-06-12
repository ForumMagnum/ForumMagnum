import { $getRoot, $isParagraphNode, type LexicalEditor, type ParagraphNode } from "lexical";
import { $isContainerQuoteNode } from "@/components/editor/lexicalPlugins/quote/ContainerQuoteNode";
import { $handleContainerQuoteEnter } from "@/components/editor/lexicalPlugins/quote/ContainerQuotePlugin";
import { runEditorUpdate, setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

interface QuoteStructure {
  outerChildTypes: string[];
  innerChildTypes: string[];
}

function findNestedEmptyQuoteParagraph(): ParagraphNode | null {
  let target: ParagraphNode | null = null;
  walkLexicalNodes($getRoot(), (node) => {
    if (target || !$isParagraphNode(node) || node.getTextContent().trim().length > 0) {
      return;
    }

    const parent = node.getParent();
    const grandparent = parent?.getParent();
    if ($isContainerQuoteNode(parent) && $isContainerQuoteNode(grandparent)) {
      target = node;
    }
  });
  return target;
}

async function handleEnterInNestedEmptyParagraph(editor: LexicalEditor): Promise<boolean> {
  let handled = false;
  await runEditorUpdate(editor, () => {
    const target = findNestedEmptyQuoteParagraph();
    expect(target).not.toBeNull();
    target?.selectStart();
    handled = $handleContainerQuoteEnter();
  });
  return handled;
}

function getQuoteStructure(editor: LexicalEditor): QuoteStructure {
  const structure: QuoteStructure = {
    outerChildTypes: [],
    innerChildTypes: [],
  };

  editor.getEditorState().read(() => {
    const outer = $getRoot().getFirstChild();
    if (!$isContainerQuoteNode(outer)) {
      return;
    }

    structure.outerChildTypes = outer.getChildren().map((child) => child.getType());
    const inner = outer.getChildren().find($isContainerQuoteNode);
    if ($isContainerQuoteNode(inner)) {
      structure.innerChildTypes = inner.getChildren().map((child) => child.getType());
    }
  });

  return structure;
}

describe("ContainerQuotePlugin", () => {
  it("exits a pasted nested quote from an empty trailing paragraph", async () => {
    const editor = await setupEditorWithHtml(
      "<blockquote><blockquote><p>Quoted text</p><p></p></blockquote></blockquote>",
    );

    await expect(handleEnterInNestedEmptyParagraph(editor)).resolves.toBe(true);

    expect(getQuoteStructure(editor)).toEqual({
      outerChildTypes: ["quote", "paragraph"],
      innerChildTypes: ["paragraph"],
    });
  });

  it("collapses an empty nested quote to a normal paragraph", async () => {
    const editor = await setupEditorWithHtml(
      "<blockquote><p>Outer quote text</p><blockquote><p></p></blockquote></blockquote>",
    );

    await expect(handleEnterInNestedEmptyParagraph(editor)).resolves.toBe(true);

    expect(getQuoteStructure(editor)).toEqual({
      outerChildTypes: ["paragraph", "paragraph"],
      innerChildTypes: [],
    });
  });
});
