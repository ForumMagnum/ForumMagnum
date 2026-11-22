import { $getRoot, type LexicalEditor } from "lexical";
import { $isMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { dataToLexicalHtml } from "@/server/editor/conversionUtils";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

interface MathSummary {
  equation: string
  inline: boolean
}

function getMathSummaries(editor: LexicalEditor): MathSummary[] {
  const summaries: MathSummary[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if ($isMathNode(node)) {
        summaries.push({ equation: node.getEquation(), inline: node.isInline() });
      }
    });
  });
  return summaries;
}

async function convertMarkdownToLexical(markdown: string): Promise<LexicalEditor> {
  const html = await dataToLexicalHtml(markdown, "markdown", createAnonymousContext());
  return setupEditorWithHtml(html);
}

function getText(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => $getRoot().getTextContent());
}

describe("converting markdown with LaTeX to Lexical", () => {
  it.each([
    ["dollar inline", "Inline $x^2 + y_1$ here.", [{ equation: "x^2 + y_1", inline: true }]],
    ["dollar display", "Display $$\\sum_i a_i$$ here.", [{ equation: "\\sum_i a_i", inline: false }]],
    ["dollar display block", "$$\nE = mc^2\n$$", [{ equation: "E = mc^2", inline: false }]],
    ["escaped-paren inline", "Legacy \\\\(a+b\\\\) inline.", [{ equation: "a+b", inline: true }]],
    ["escaped-bracket display", "Legacy \\\\[a+b\\\\] display.", [{ equation: "a+b", inline: false }]],
    ["environment", "\\begin{align}a &= b \\\\ c &= d\\end{align}", [{ equation: "\\begin{align}a &= b \\\\ c &= d\\end{align}", inline: false }]],
    ["special characters", "Compare $a<b$ and $a \\& b$.", [{ equation: "a<b", inline: true }, { equation: "a \\& b", inline: true }]],
  ])("turns %s math into equations", async (_label, markdown, expected) => {
    const editor = await convertMarkdownToLexical(markdown);
    expect(getMathSummaries(editor)).toEqual(expected);
  });

  it("keeps the spaces around inline equations", async () => {
    const editor = await convertMarkdownToLexical("Compare $a$ and $b$ here.");
    expect(getText(editor)).toBe("Compare  and  here.");
  });

  it.each([
    ["dollar amounts", "Price $5 and $10.", "Price $5 and $10."],
    ["code spans", "Code `$x$` here.", "Code $x$ here."],
    ["math code blocks", "```math\nx^2\n```", "x^2\n"],
  ])("leaves %s as text", async (_label, markdown, expectedText) => {
    const editor = await convertMarkdownToLexical(markdown);
    expect(getMathSummaries(editor)).toEqual([]);
    expect(getText(editor)).toBe(expectedText);
  });
});
